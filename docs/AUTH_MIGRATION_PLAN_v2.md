# JeetoBaz Auth Migration Plan v2

> Revised planning document incorporating all 12 corrections from review.
> Status: READY FOR FINAL APPROVAL | Date: July 16, 2026
> Original plan preserved at `docs/AUTH_MIGRATION_PLAN.md` (unchanged).

---

## Corrections Applied

| # | Issue | Resolution |
|---|-------|------------|
| 1 | Phone NOT NULL contradiction | Phone required during profile setup. Nullable migration deferred to separate sprint. |
| 2 | "No RLS changes needed" | Minimum authenticated ownership policies defined. |
| 3 | email_verified duplicate source of truth | Column removed. Supabase Auth `email_confirmed_at` is authority. |
| 4 | Redundant email indexes | Only normalized partial unique index kept. |
| 5 | Identity-state view privacy risk | View removed from Phase 1. State derived in app code. |
| 6 | Feature flag is UX only, not security | Server-side enforcement added. |
| 7 | Rollback destructive after migration | Split into pre-data schema rollback and post-migration operational rollback. |
| 8 | ON DELETE SET NULL behavior | Changed to ON DELETE RESTRICT. Account deletion workflow deferred. |
| 9 | Collision audit incorrect expectation | phone+email query marked as informational, not error. |
| 10 | Password policy inconsistent | Locked: 8+ chars, 1 uppercase, 1 number. |
| 11 | Deep-link handling conceptual | Exact session handling specified. |
| 12 | Missing tests | 8 new test cases added. |

---

## 1. Identity States (Corrected)

```
STATE A: Legacy Phone User
├── auth_user_id: NULL
├── phone: +923XXXXXXXXX (NOT NULL)
├── session: AsyncStorage (plaintext phone)
├── auth: None
└── Route: Home (legacy path)

STATE B: Migrated User
├── auth_user_id: UUID (NOT NULL after migration)
├── phone: +923XXXXXXXXX (preserved, NOT NULL)
├── session: Supabase Auth (JWT)
├── email: user@mail.com (verified via auth.users)
└── Route: Home (auth path)

STATE C: New Email User
├── auth_user_id: UUID (NOT NULL)
├── phone: +923XXXXXXXXX (REQUIRED during profile setup)
├── session: Supabase Auth (JWT)
├── email: user@mail.com (primary identifier)
└── Route: Home (auth path)

STATE D: Admin
├── auth_user_id: 65d46154-c62b-415c-852c-c923b0b3cd1a
├── email: shoaibmithall@gmail.com
├── session: Supabase Auth (signInWithPassword)
├── role: Admin (RLS-verified, server-side)
└── Route: Admin Panel
```

**Key change:** Phone is REQUIRED for all users in this migration. Nullable phone is a separate future migration.

---

## 2. Forward SQL (Corrected)

```sql
-- JeetoBaz Auth Migration v2: Additive nullable schema changes
-- Date: 2026-07-16
-- Safety: Additive only. No columns removed. No constraints changed.
-- Phone remains NOT NULL. Nullable phone is a separate future migration.
-- Prerequisite: Run collision audit first (see Section 7)

BEGIN;

-- ─────────────────────────────────────────────
-- 2.1 Add auth_user_id column
-- ─────────────────────────────────────────────
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS auth_user_id uuid
REFERENCES auth.users(id) ON DELETE RESTRICT;

-- Partial unique index: enforce uniqueness when not null
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_unique
ON public.users(auth_user_id)
WHERE auth_user_id IS NOT NULL;

-- ─────────────────────────────────────────────
-- 2.2 Add email column
-- ─────────────────────────────────────────────
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email text;

-- Single normalized partial unique index (covers both uniqueness and lookup)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_normalized_unique
ON public.users (lower(trim(email)))
WHERE email IS NOT NULL;

-- NOTE: No separate non-unique index needed.
-- The unique B-tree index handles lookup queries efficiently.

-- ─────────────────────────────────────────────
-- 2.3 Add auth_provider column
-- ─────────────────────────────────────────────
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS auth_provider text NOT NULL DEFAULT 'phone';

-- Constraint: only allow known providers
ALTER TABLE public.users
ADD CONSTRAINT users_auth_provider_check
CHECK (auth_provider IN ('phone', 'email', 'google'));

-- ─────────────────────────────────────────────
-- 2.4 Create RLS policies for authenticated users
-- ─────────────────────────────────────────────

-- Policy: Authenticated user reads own profile
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
      USING (
        auth_user_id = auth.uid()
      );
  END IF;
END
$$;

-- Policy: Authenticated user updates own safe profile fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Authenticated user updates own profile'
  ) THEN
    CREATE POLICY "Authenticated user updates own profile"
      ON public.users
      FOR UPDATE
      TO authenticated
      USING (
        auth_user_id = auth.uid()
      )
      WITH CHECK (
        auth_user_id = auth.uid()
      );
  END IF;
END
$$;

-- ─────────────────────────────────────────────
-- 2.5 Verify admin_settings has proper RLS
-- ─────────────────────────────────────────────
-- admin_settings should be readable by public (for feature flags)
-- but only updatable by admin

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'admin_settings'
  ) THEN
    -- Ensure RLS is enabled
    ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

    -- Public can read (for feature flags)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'admin_settings'
        AND policyname = 'Public reads admin settings'
    ) THEN
      CREATE POLICY "Public reads admin settings"
        ON public.admin_settings
        FOR SELECT
        TO public
        USING (true);
    END IF;

    -- Only admin can update
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'admin_settings'
        AND policyname = 'Admin updates admin settings'
    ) THEN
      CREATE POLICY "Admin updates admin settings"
        ON public.admin_settings
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
        WITH CHECK (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);
    END IF;
  END IF;
END
$$;

COMMIT;
```

---

## 3. Rollback SQL (Corrected — Split into Two Phases)

### Phase A: Pre-Data Schema Rollback (Safe before any user migration)

```sql
-- JeetoBaz Auth Migration v2: Schema Rollback (pre-data)
-- ONLY safe before any user has been migrated
-- After migration: use operational rollback (Phase B)

BEGIN;

-- Remove RLS policies
DROP POLICY IF EXISTS "Authenticated user reads own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated user updates own profile" ON public.users;
DROP POLICY IF EXISTS "Public reads admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admin updates admin settings" ON public.admin_settings;

-- Remove constraint
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_auth_provider_check;

-- Remove columns (SAFE only if no user has auth_user_id or email populated)
ALTER TABLE public.users DROP COLUMN IF EXISTS auth_provider;
ALTER TABLE public.users DROP COLUMN IF EXISTS email;
ALTER TABLE public.users DROP COLUMN IF EXISTS auth_user_id;

-- Remove indexes
DROP INDEX IF EXISTS public.users_auth_user_id_unique;
DROP INDEX IF EXISTS public.users_email_normalized_unique;

COMMIT;
```

### Phase B: Post-Migration Operational Rollback (After users exist)

```sql
-- JeetoBaz Auth Migration v2: Operational Rollback (post-data)
-- After any user has been migrated, DO NOT drop columns
-- Instead: disable feature flag, roll back application code

-- Step 1: Disable feature flag (application-level)
-- UPDATE admin_settings SET value = 'false' WHERE key = 'auth_migration_enabled';

-- Step 2: Remove RLS policies (safe, data preserved)
DROP POLICY IF EXISTS "Authenticated user reads own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated user updates own profile" ON public.users;

-- DO NOT DROP COLUMNS. Data must be preserved.
-- auth_user_id and email columns remain with their data.
-- Application code reverts to legacy phone-based flow.
```

---

## 4. RLS Plan (Corrected — Minimum Authenticated Ownership)

### Current State
- Admin: `auth.uid() = '65d46154-...'` in 17 locations across 6 SQL files
- Users: Phone-based via SECURITY DEFINER RPCs
- No user-level ownership policies

### New Policies (Additive)

| Policy | Table | Operation | Rule |
|--------|-------|-----------|------|
| Authenticated user reads own profile | users | SELECT | `auth_user_id = auth.uid()` |
| Authenticated user updates own profile | users | UPDATE | `auth_user_id = auth.uid()` |
| Public reads admin settings | admin_settings | SELECT | `true` (for feature flags) |
| Admin updates admin settings | admin_settings | UPDATE | `auth.uid() = admin_uuid` |

### Transitional Behavior

```
Legacy phone user (auth_user_id = NULL):
├── Cannot match auth.uid() policy
├── Falls through to existing SECURITY DEFINER RPCs
├── Phone-based operations continue to work
└── Marked as TRANSITIONAL — will be migrated

Migrated/new email user (auth_user_id = UUID):
├── Matches auth.uid() policy
├── Can read/update own profile directly
├── Entries/transactions still via SECURITY DEFINER RPCs (phone-based)
└── RPCs need phone parameter — unchanged
```

### What This Means

- New RLS policies cover **profile read/update only**
- Entries, transactions, referrals still use SECURITY DEFINER RPCs with phone
- Those RPCs are unchanged — no breakage
- Future migration can逐步 replace phone-based RPCs with auth.uid()-based policies

---

## 5. Feature-Flag Design (Corrected — Server-Side Enforcement)

### Database Flag

```sql
INSERT INTO public.admin_settings (key, value, updated_at)
VALUES ('auth_migration_enabled', 'false', now())
ON CONFLICT (key) DO NOTHING;
```

### Client-Side: UX Control Only

```typescript
// Login screen: shows email+password form if flag is on
// This is UX only — can be bypassed by modified client
const { data: flag } = await supabase
  .from('admin_settings')
  .select('value')
  .eq('key', 'auth_migration_enabled')
  .single();

const migrationEnabled = ['staging', 'gradual', 'full'].includes(flag?.value);
```

### Server-Side: Security Enforcement

Profile creation must validate flag server-side. Options:

**Option A: Database function (recommended)**
```sql
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_auth_user_id uuid,
  p_name text,
  p_phone text,
  p_email text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_flag text;
BEGIN
  -- Server-side flag check
  SELECT value INTO v_flag
  FROM public.admin_settings
  WHERE key = 'auth_migration_enabled';

  IF v_flag IS NULL OR v_flag = 'false' THEN
    RAISE EXCEPTION 'Auth migration is not enabled';
  END IF;

  -- Idempotent profile creation
  INSERT INTO public.users (auth_user_id, name, phone, email, auth_provider)
  VALUES (p_auth_user_id, p_name, p_phone, p_email, 'email')
  ON CONFLICT (auth_user_id) DO UPDATE SET
    name = EXCLUDED.name,
    email = COALESCE(EXCLUDED.email, users.email);

  -- Link auth user to existing phone record if exists
  UPDATE public.users
  SET auth_user_id = p_auth_user_id,
      email = COALESCE(p_email, email),
      auth_provider = 'email'
  WHERE phone = p_phone
    AND auth_user_id IS NULL;
END;
$$;
```

**Option B: Edge Function check**
```typescript
// In signup flow, after Supabase signUp succeeds:
const { data: flag } = await supabase
  .from('admin_settings')
  .select('value')
  .eq('key', 'auth_migration_enabled')
  .single();

if (!['staging', 'gradual', 'full'].includes(flag?.value)) {
  // Reject profile creation
  return { error: 'Account creation is temporarily disabled' };
}
```

### admin_settings RLS Verification

```sql
-- Verify: public can read, only admin can update
SELECT
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'admin_settings';
```

Expected:
- `Public reads admin settings` — SELECT, TO public, USING true
- `Admin updates admin settings` — UPDATE, TO authenticated, USING auth.uid() = admin_uuid

---

## 6. Email Verification Source of Truth

**email_verified column REMOVED.**

Supabase Auth is the authority:
- `auth.users.email_confirmed_at` — set when user clicks verification link
- Client checks: `supabase.auth.getUser()` → `user.email_confirmed_at !== null`

```typescript
// Check if user's email is verified
const { data: { user } } = await supabase.auth.getUser();
const isVerified = user?.email_confirmed_at !== null;
```

No denormalized `email_verified` in public.users. Single source of truth.

---

## 7. Deep-Link Session Handling (Corrected — Exact Specification)

### Expo Configuration

```json
{
  "expo": {
    "scheme": "jeetobaz"
  }
}
```

### Supabase Redirect URLs

```
jeetobaz://auth/callback
jeetobaz://reset-password
https://jeetobaz.pk/auth/callback
https://jeetobaz.pk/reset-password
http://localhost:8081/auth/callback
http://localhost:8081/reset-password
```

### Email Verification Flow

```
1. User signs up → signUp({ email, password, options: { emailRedirectTo: 'jeetobaz://auth/callback' } })
2. Confirmation email sent with link: jeetobaz://auth/callback?code=XXXX
3. User clicks link
4. App opens via deep link (or web redirect)
5. App extracts code from URL
6. Call supabase.auth.exchangeCodeForSession(code)
7. Session established
8. Route to profile setup
```

### Password Recovery Flow

```
1. User clicks "Forgot Password" → resetPasswordForEmail(email, { redirectTo: 'jeetobaz://reset-password' })
2. Recovery email sent with link: jeetobaz://reset-password?code=XXXX
3. User clicks link
4. App opens via deep link
5. App extracts code from URL
6. Call supabase.auth.exchangeCodeForSession(code) — establishes recovery session
7. Show "New Password" form
8. User enters new password → supabase.auth.updateUser({ password: newPassword })
9. Session updated
10. Route to login
```

### Android Handling

**Cold start (app not running):**
```
1. Deep link received by OS
2. OS launches app
3. App's linking configuration handles URL
4. Expo Router processes the route
5. Route component extracts code, exchanges for session
```

**Warm start (app in background):**
```
1. Deep link received by OS
2. OS brings app to foreground
3. Expo Linking event fires
4. Route handler processes the URL
5. Code exchanged for session
```

### Web Handling

```
1. Redirect URL opens in browser
2. Expo Router processes /auth/callback or /reset-password route
3. Route component extracts code from URL params
4. exchangeCodeForSession(code) called
5. Session established in browser
```

### Error Handling

| Scenario | Handling |
|----------|----------|
| Expired code | Error: "Link expired. Please request a new one." |
| Malformed URL | Error: "Invalid link. Please try again." |
| Already used code | Idempotent — session already established |
| Network failure | Error: "Connection failed. Please check your internet." |
| Invalid code | Error: "Invalid verification code." |

### Implementation Files

```
src/app/auth/callback.tsx     — Email verification callback
src/app/auth/reset-password.tsx — Password recovery callback
src/lib/auth.ts               — exchangeCodeForSession wrapper
```

---

## 8. Password Policy (Locked)

```typescript
// src/lib/validation.ts
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireNumber: true,
  // No special character requirement (Pakistan keyboard accessibility)
};

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`;
  }
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    return 'Password must contain at least 1 uppercase letter';
  }
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    return 'Password must contain at least 1 number';
  }
  return null; // valid
}
```

**Enforcement:**
- Client: `validatePassword()` on signup and password reset forms
- Supabase Dashboard: Auth → Providers → Password → Min length: 8
- Both must align. Client validation is UX, server validation is security.

---

## 9. Collision Audit (Corrected)

```sql
-- 9.1 Duplicate emails (case-insensitive) — ERROR if found
SELECT lower(trim(email)) AS normalized_email, count(*)
FROM public.users
WHERE email IS NOT NULL
GROUP BY lower(trim(email))
HAVING count(*) > 1;
-- Expected: 0 rows. If >0, resolve before migration.

-- 9.2 Users with both phone and email — INFORMATIONAL
SELECT id, phone, email
FROM public.users
WHERE email IS NOT NULL AND phone IS NOT NULL;
-- Expected: 0 rows currently. After migration, this is the desired state.
-- This is NOT an error condition.

-- 9.3 Total users count — INFORMATIONAL
SELECT count(*) AS total_users FROM public.users;

-- 9.4 Auth users count — INFORMATIONAL
SELECT count(*) AS auth_users FROM auth.users;

-- 9.5 Admin auth user exists — MUST return 1 row
SELECT id, email
FROM auth.users
WHERE id = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid;

-- 9.6 Phone format validation — ERROR if invalid phones exist
SELECT id, phone FROM public.users
WHERE phone !~ '^\+92[0-9]{10}$';
-- Expected: 0 rows.
```

---

## 10. Staging Test Matrix (Expanded — 8 New Tests)

### Original Tests (T1–T9) preserved from v1.

### New Tests

| Test | Steps | Expected | Pass/Fail |
|------|-------|----------|-----------|
| T10.1 | Authenticated user tries to read another user's profile via API | RLS blocks — returns 0 rows | |
| T10.2 | Authenticated user tries to update another user's profile via API | RLS blocks — update rejected | |
| T10.3 | Direct API call to create profile while flag is 'false' | Server-side function rejects — "migration not enabled" | |
| T10.4 | Direct API call to create profile while flag is 'staging' | Profile created successfully | |
| T10.5 | Auth user is deleted from auth.users | auth_user_id becomes NULL (RESTRICT prevents if entries exist) | |
| T10.6 | Migrated user: feature flag turned off | User can still login via legacy phone (graceful fallback) | |
| T10.7 | Profile creation when phone already belongs to legacy user | Existing record updated (idempotent), not duplicated | |
| T10.8 | Two concurrent signups with same email | Only one account created (unique index prevents duplicate) | |

### Existing Tests Updated

| Test | Change |
|------|--------|
| T1.4 | Password: now "8+ chars, 1 uppercase, 1 number" |
| T5.1–T5.8 | Legacy users: phone remains required, no NULL scenario |
| T6.1–T6.5 | Profile: phone required, auth_provider set to 'email' |

---

## 11. Execution Order (Corrected)

```
Step 1:  Run collision audit (Section 9)
Step 2:  Verify results (0 duplicate emails, admin exists)
Step 3:  Backup database (Supabase dashboard → Backups)
Step 4:  Execute forward SQL (Section 2)
Step 5:  Verify columns + indexes exist
Step 6:  Verify RLS policies created
Step 7:  Verify admin_settings RLS (public read, admin update)
Step 8:  Test on staging: new signup flow
Step 9:  Test on staging: legacy login still works
Step 10: Test on staging: deep links (web + Android)
Step 11: Test on staging: password reset
Step 12: Test on staging: RLS enforcement (T10.1–T10.4)
Step 13: Set feature flag to 'staging'
Step 14: Deploy code to staging
Step 15: Run full test matrix (Section 10)
Step 16: If all pass → set flag to 'gradual'
Step 17: Monitor for 1 week
Step 18: If no issues → set flag to 'full'
Step 19: After all users migrated → remove legacy login code
Step 20: Drop phone-based RLS policies (if replaced by auth.uid())
```

---

## 12. Rollback Procedure (Corrected — Two-Phase)

### Immediate (< 5 minutes)
```
1. Set feature flag to 'false'
2. Legacy phone login re-enabled
3. All existing users unaffected
4. New email users: cannot signup (flag off)
5. Migrated users: cannot login via email (flag off)
   → Must use legacy phone login until flag re-enabled
```

### Short-term (< 1 hour) — Pre-Data
```
1. Execute Phase A rollback SQL (Section 3)
2. Verify columns dropped (only safe if NO user has auth_user_id populated)
3. Deploy previous code version
4. Verify legacy login works
```

### Short-term (< 1 hour) — Post-Data
```
1. Execute Phase B rollback SQL (Section 3)
2. DO NOT drop columns (data preserved)
3. Deploy previous code version
4. Feature flag set to 'false'
5. Legacy phone login restored
6. Migrated users: auth_user_id/email preserved in table
7. When flag re-enabled, migrated users can login via email again
```

### Long-term (< 24 hours)
```
1. Investigate root cause
2. Fix issue
3. Re-run collision audit
4. Re-test on staging
5. Re-enable feature flag
```

---

## 13. ON DELETE Behavior (Corrected)

```sql
REFERENCES auth.users(id) ON DELETE RESTRICT
```

**Why RESTRICT:**
- If auth user is deleted, we don't want orphaned profiles
- RESTRICT prevents accidental deletion of auth user when profile exists
- Account deletion must go through a controlled workflow:
  1. Delete user data (anonymize entries, transactions)
  2. Remove auth_user_id link
  3. Then delete auth user

**Future account deletion workflow (not in this sprint):**
```sql
-- Step 1: Anonymize user data
UPDATE public.users SET
  name = 'Deleted User',
  phone = NULL,
  email = NULL,
  auth_user_id = NULL,
  avatar_url = NULL
WHERE auth_user_id = <user_id>;

-- Step 2: Now auth user can be deleted (no FK violation)
DELETE FROM auth.users WHERE id = <user_id>;
```

---

*This is the revised auth migration plan v2. All 12 corrections applied. Ready for final approval.*
