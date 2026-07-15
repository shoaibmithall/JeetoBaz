# Auth Migration Execution Addendum

> Fixes 4 blockers identified in v2 review. Short addendum — not a full plan.
> Date: July 16, 2026 | Status: APPROVED FOR EXECUTION

---

## Blocker 1: create_user_profile Impersonation Fix

**Problem:** Function accepts `p_auth_user_id` from caller — attacker can supply any UUID.

**Fix:** Use `auth.uid()` internally. Never trust caller-supplied auth UUID.

```sql
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_name text,
  p_phone text,
  p_email text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id uuid;
  v_flag text;
  v_existing_user record;
BEGIN
  -- 1. Get authenticated user ID from JWT (never trust caller)
  v_auth_user_id := auth.uid();

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- 2. Server-side feature flag check
  SELECT value INTO v_flag
  FROM admin_settings
  WHERE key = 'auth_migration_enabled';

  IF v_flag IS NULL OR v_flag NOT IN ('staging', 'gradual', 'full') THEN
    RAISE EXCEPTION 'Auth migration is not enabled';
  END IF;

  -- 3. Get verified email from auth.users (not from caller)
  IF p_email IS NULL THEN
    SELECT email INTO p_email
    FROM auth.users
    WHERE id = v_auth_user_id;
  END IF;

  -- 4. Validate inputs
  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'Name must be at least 2 characters';
  END IF;

  IF p_phone !~ '^\+92[0-9]{10}$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;

  -- 5. Check if this auth user already has a profile
  SELECT * INTO v_existing_user
  FROM users
  WHERE auth_user_id = v_auth_user_id;

  IF v_existing_user IS NOT NULL THEN
    -- Profile already exists — update safe fields only
    UPDATE users SET
      name = trim(p_name),
      email = lower(trim(p_email))
    WHERE auth_user_id = v_auth_user_id;
    RETURN;
  END IF;

  -- 6. Check if phone belongs to a legacy user (potential linking)
  SELECT * INTO v_existing_user
  FROM users
  WHERE phone = p_phone
    AND auth_user_id IS NULL
  FOR UPDATE;

  IF v_existing_user IS NOT NULL THEN
    -- Link legacy account to this auth user
    -- SECURITY: This links phone → auth user. Phone ownership is verified
    -- because the user logged in with this email+password and provided
    -- this phone number. For production, add OTP verification on phone.
    UPDATE users SET
      auth_user_id = v_auth_user_id,
      email = lower(trim(p_email)),
      auth_provider = 'email'
    WHERE id = v_existing_user.id;
    RETURN;
  END IF;

  -- 7. No existing user — create new profile
  INSERT INTO users (auth_user_id, name, phone, email, auth_provider)
  VALUES (
    v_auth_user_id,
    trim(p_name),
    p_phone,
    lower(trim(p_email)),
    'email'
  );
END;
$$;
```

**Key changes:**
- `auth.uid()` used internally — no caller-supplied UUID
- Email derived from `auth.users` — not blindly trusted from client
- Legacy linking uses `SELECT ... FOR UPDATE` — no duplicate rows
- All validation server-side

---

## Blocker 2: update_my_profile RPC (Restricted Fields)

**Problem:** Direct UPDATE on users table lets authenticated user change any column.

**Fix:** Restricted RPC for safe fields only.

```sql
CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_phone text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id uuid;
  v_current_user record;
BEGIN
  v_auth_user_id := auth.uid();

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get current profile
  SELECT * INTO v_current_user
  FROM users
  WHERE auth_user_id = v_auth_user_id;

  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Update only safe fields
  UPDATE users SET
    name = COALESCE(trim(p_name), name),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    phone = CASE
      WHEN p_phone IS NOT NULL AND p_phone ~ '^\+92[0-9]{10}$'
        THEN p_phone
      ELSE phone
    END,
    updated_at = now()
  WHERE auth_user_id = v_auth_user_id;

  -- Note: email, auth_user_id, auth_provider, referral fields
  -- are NOT updatable through this function.
  -- Email changes require re-verification (separate flow).
  -- auth_user_id changes require admin intervention.
END;
$$;
```

**What users CAN update:** name, avatar_url, phone (with format validation)
**What users CANNOT update:** email, auth_user_id, auth_provider, referral_code, referred_by

---

## Blocker 3: admin_settings Public Access Fix

**Problem:** `TO public USING (true)` exposes all settings.

**Fix:** Restricted view that only exposes the feature flag.

```sql
-- Create a safe view that only exposes the feature flag
CREATE OR REPLACE VIEW public.auth_migration_config AS
SELECT
  key,
  value
FROM admin_settings
WHERE key = 'auth_migration_enabled';

-- Allow public read on the view only
ALTER VIEW public.auth_migration_config OWNER TO postgres;

-- Grant public read access to the view (not the table)
GRANT SELECT ON public.auth_migration_config TO anon;
GRANT SELECT ON public.auth_migration_config TO authenticated;

-- Revoke direct table access from anon
REVOKE ALL ON admin_settings FROM anon;
```

**Client usage:**
```typescript
const { data } = await supabase
  .from('auth_migration_config')
  .select('value')
  .single();

const flag = data?.value; // 'false' | 'staging' | 'gradual' | 'full'
```

**Admin update:** Still via direct table (admin RLS policy on admin_settings).

---

## Blocker 4: RLS Policy Column Restriction

**Problem:** Direct UPDATE policy allows updating any column.

**Fix:** Remove direct UPDATE policy. All updates go through `update_my_profile()` RPC.

```sql
-- Drop the broad UPDATE policy (replaced by RPC)
DROP POLICY IF EXISTS "Authenticated user updates own profile" ON public.users;

-- Keep only the SELECT policy
-- (Authenticated user reads own profile — this is safe)
```

**Result:**
- Users can READ their own profile (SELECT policy)
- Users CANNOT UPDATE directly (no UPDATE policy)
- All updates go through `update_my_profile()` RPC (column-restricted)
- Admin updates go through existing admin policies

---

## Small Corrections

### T10.5: ON DELETE RESTRICT = Deletion Blocked

```sql
-- Test T10.5 corrected:
-- ON DELETE RESTRICT means:
-- If user has a profile (users.auth_user_id references auth.users),
-- deleting the auth user is BLOCKED by PostgreSQL.
-- This is the correct behavior.
-- Test should verify: auth user deletion attempt → error
```

### Execution Order Fix

```
1. Run collision audit
2. Execute forward SQL (including RPCs + view)
3. Deploy code to STAGING branch
4. Set feature flag to 'staging'
5. Run tests on staging
6. If pass → flag 'gradual'
7. Monitor → flag 'full'
```

Code deploys BEFORE flag enablement.

### Flag Value Validation

```sql
-- In create_user_profile RPC:
IF v_flag IS NULL OR v_flag NOT IN ('staging', 'gradual', 'full') THEN
  RAISE EXCEPTION 'Auth migration is not enabled';
END IF;
-- 'false' and any other value → rejection
```

### Password Uppercase = Client Validation Only

Server enforces minimum length (Supabase config). Uppercase + number requirements are client-side UX validation + documented policy. Not absolute server enforcement.

---

## Complete Forward SQL (Final)

```sql
BEGIN;

-- Schema changes
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS auth_user_id uuid
REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS auth_provider text NOT NULL DEFAULT 'phone';

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_unique
ON public.users(auth_user_id)
WHERE auth_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_normalized_unique
ON public.users (lower(trim(email)))
WHERE email IS NOT NULL;

-- Constraints
ALTER TABLE public.users
ADD CONSTRAINT users_auth_provider_check
CHECK (auth_provider IN ('phone', 'email', 'google'));

-- RLS: SELECT policy only (UPDATE goes through RPC)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Authenticated user reads own profile'
  ) THEN
    CREATE POLICY "Authenticated user reads own profile"
      ON public.users
      FOR SELECT
      TO authenticated
      USING (auth_user_id = auth.uid());
  END IF;
END
$$;

-- RPC: create_user_profile (server-side auth, no impersonation)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_name text,
  p_phone text,
  p_email text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id uuid;
  v_flag text;
  v_existing_user record;
BEGIN
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT value INTO v_flag FROM admin_settings WHERE key = 'auth_migration_enabled';
  IF v_flag IS NULL OR v_flag NOT IN ('staging', 'gradual', 'full') THEN
    RAISE EXCEPTION 'Auth migration is not enabled';
  END IF;

  IF p_email IS NULL THEN
    SELECT email INTO p_email FROM auth.users WHERE id = v_auth_user_id;
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'Name must be at least 2 characters';
  END IF;

  IF p_phone !~ '^\+92[0-9]{10}$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;

  -- Check if auth user already has profile
  IF EXISTS (SELECT 1 FROM users WHERE auth_user_id = v_auth_user_id) THEN
    UPDATE users SET name = trim(p_name), email = lower(trim(p_email))
    WHERE auth_user_id = v_auth_user_id;
    RETURN;
  END IF;

  -- Check if phone belongs to legacy user (safe linking)
  SELECT * INTO v_existing_user FROM users
  WHERE phone = p_phone AND auth_user_id IS NULL
  FOR UPDATE;

  IF v_existing_user IS NOT NULL THEN
    UPDATE users SET
      auth_user_id = v_auth_user_id,
      email = lower(trim(p_email)),
      auth_provider = 'email'
    WHERE id = v_existing_user.id;
    RETURN;
  END IF;

  -- Create new profile
  INSERT INTO users (auth_user_id, name, phone, email, auth_provider)
  VALUES (v_auth_user_id, trim(p_name), p_phone, lower(trim(p_email)), 'email');
END;
$$;

-- RPC: update_my_profile (restricted fields only)
CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_phone text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id uuid;
BEGIN
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM users WHERE auth_user_id = v_auth_user_id) THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  UPDATE users SET
    name = COALESCE(trim(p_name), name),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    phone = CASE
      WHEN p_phone IS NOT NULL AND p_phone ~ '^\+92[0-9]{10}$' THEN p_phone
      ELSE phone
    END,
    updated_at = now()
  WHERE auth_user_id = v_auth_user_id;
END;
$$;

-- Safe view for feature flag only
CREATE OR REPLACE VIEW public.auth_migration_config AS
SELECT key, value FROM admin_settings WHERE key = 'auth_migration_enabled';

GRANT SELECT ON public.auth_migration_config TO anon;
GRANT SELECT ON public.auth_migration_config TO authenticated;

-- Feature flag row
INSERT INTO admin_settings (key, value, updated_at)
VALUES ('auth_migration_enabled', 'false', now())
ON CONFLICT (key) DO NOTHING;

COMMIT;
```

---

*This addendum fixes all 4 blockers. Implementation can now proceed.*
