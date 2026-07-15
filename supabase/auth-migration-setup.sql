-- JeetoBaz Auth Migration: Email + Password Authentication
-- Date: 2026-07-16
-- Safety: Additive only. No columns removed. No constraints changed.
-- Phone remains NOT NULL. Nullable phone deferred to separate sprint.
-- Prerequisite: Run collision audit before executing.

BEGIN;

-- ─────────────────────────────────────────────
-- 1. Schema Changes
-- ─────────────────────────────────────────────

-- Add auth_user_id (links to Supabase Auth)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS auth_user_id uuid
REFERENCES auth.users(id) ON DELETE RESTRICT;

-- Add email
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email text;

-- Add auth provider
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS auth_provider text NOT NULL DEFAULT 'phone';

-- ─────────────────────────────────────────────
-- 2. Indexes
-- ─────────────────────────────────────────────

-- Partial unique index for auth_user_id
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_unique
ON public.users(auth_user_id)
WHERE auth_user_id IS NOT NULL;

-- Case-insensitive unique index for email
CREATE UNIQUE INDEX IF NOT EXISTS users_email_normalized_unique
ON public.users (lower(trim(email)))
WHERE email IS NOT NULL;

-- ─────────────────────────────────────────────
-- 3. Constraints
-- ─────────────────────────────────────────────

ALTER TABLE public.users
ADD CONSTRAINT users_auth_provider_check
CHECK (auth_provider IN ('phone', 'email', 'google'));

-- ─────────────────────────────────────────────
-- 4. RLS Policies
-- ─────────────────────────────────────────────

-- SELECT: Authenticated user reads own profile
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

-- NOTE: No direct UPDATE policy. All updates go through update_my_profile() RPC.

-- ─────────────────────────────────────────────
-- 5. RPC: create_user_profile
-- ─────────────────────────────────────────────

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
  -- Get authenticated user ID from JWT (never trust caller)
  v_auth_user_id := auth.uid();

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Server-side feature flag check
  SELECT value INTO v_flag
  FROM admin_settings
  WHERE key = 'auth_migration_enabled';

  IF v_flag IS NULL OR v_flag NOT IN ('staging', 'gradual', 'full') THEN
    RAISE EXCEPTION 'Auth migration is not enabled';
  END IF;

  -- Get verified email from auth.users (not from caller)
  IF p_email IS NULL THEN
    SELECT email INTO p_email
    FROM auth.users
    WHERE id = v_auth_user_id;
  END IF;

  -- Validate inputs
  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'Name must be at least 2 characters';
  END IF;

  IF p_phone !~ '^\+92[0-9]{10}$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;

  -- Check if this auth user already has a profile
  IF EXISTS (SELECT 1 FROM users WHERE auth_user_id = v_auth_user_id) THEN
    UPDATE users SET
      name = trim(p_name),
      email = lower(trim(p_email))
    WHERE auth_user_id = v_auth_user_id;
    RETURN;
  END IF;

  -- Check if phone belongs to a legacy user (safe linking with lock)
  SELECT * INTO v_existing_user
  FROM users
  WHERE phone = p_phone
    AND auth_user_id IS NULL
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
  VALUES (
    v_auth_user_id,
    trim(p_name),
    p_phone,
    lower(trim(p_email)),
    'email'
  );
END;
$$;

-- ─────────────────────────────────────────────
-- 6. RPC: update_my_profile (restricted fields)
-- ─────────────────────────────────────────────

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

-- ─────────────────────────────────────────────
-- 7. Safe view for feature flag
-- ─────────────────────────────────────────────

CREATE OR REPLACE VIEW public.auth_migration_config AS
SELECT key, value FROM admin_settings WHERE key = 'auth_migration_enabled';

GRANT SELECT ON public.auth_migration_config TO anon;
GRANT SELECT ON public.auth_migration_config TO authenticated;

-- ─────────────────────────────────────────────
-- 8. Feature flag row
-- ─────────────────────────────────────────────

INSERT INTO admin_settings (key, value, updated_at)
VALUES ('auth_migration_enabled', 'false', now())
ON CONFLICT (key) DO NOTHING;

COMMIT;
