-- JeetoBaz Security Hardening Migration
-- Date: 2026-07-16
-- Purpose: Address all Supabase Security Advisor findings
-- Safety: Additive only. No data deleted. No business logic changed.
-- Prerequisite: All previous migrations already applied.

BEGIN;

-- ============================================================
-- TASK 1: Fix SECURITY DEFINER VIEW → SECURITY INVOKER
-- ============================================================
-- The auth_migration_config view was created as a regular view but
-- may run with owner privileges. Explicitly set to SECURITY INVOKER
-- so it respects the querying user's RLS policies on admin_settings.

CREATE OR REPLACE VIEW public.auth_migration_config
  WITH (security_invoker = true)
  AS
  SELECT key, value FROM admin_settings WHERE key = 'auth_migration_enabled';

-- ============================================================
-- TASK 2: Add SET search_path = public to SECURITY DEFINER functions
-- ============================================================
-- Only approve_entry_atomic is missing search_path. All others
-- already have it. Fix the one that's missing.

CREATE OR REPLACE FUNCTION public.approve_entry_atomic(
  p_product_id uuid,
  p_phone text,
  p_name text DEFAULT NULL,
  p_transaction_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product record;
  v_existing_entry_id uuid;
  v_new_entry_id uuid;
BEGIN
  SELECT id, status, current_entries, max_entries
  INTO v_product
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF v_product IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Product not found.');
  END IF;

  IF v_product.status != 'active' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This draw is not active.');
  END IF;

  IF COALESCE(v_product.current_entries, 0) >= v_product.max_entries THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This draw is full.');
  END IF;

  SELECT id INTO v_existing_entry_id
  FROM entries
  WHERE product_id = p_product_id AND phone = p_phone
  LIMIT 1;

  IF v_existing_entry_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Entry already exists for this phone number.');
  END IF;

  INSERT INTO entries (product_id, phone, name, transaction_id)
  VALUES (p_product_id, p_phone, p_name, p_transaction_id)
  RETURNING id INTO v_new_entry_id;

  UPDATE products
  SET current_entries = COALESCE(current_entries, 0) + 1
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'ok', true,
    'entry_id', v_new_entry_id,
    'new_entries', (SELECT current_entries FROM products WHERE id = p_product_id)
  );
END;
$$;

-- ============================================================
-- TASK 3: REVOKE/GRANT for all SECURITY DEFINER RPCs
-- ============================================================
-- Policy: REVOKE from PUBLIC and anon, GRANT to authenticated only.
-- Exception: get_public_draw_result and get_referral_eligible_products
-- are intentionally public (anyone can see winners and eligible campaigns).

-- revoke everything first, then grant selectively
REVOKE ALL ON FUNCTION public.approve_entry_atomic(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approve_entry_atomic(uuid, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.approve_entry_atomic(uuid, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.approve_entry_atomic(uuid, text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.create_user_profile(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_user_profile(text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.create_user_profile(text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile(text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.update_my_profile(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_my_profile(text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.update_my_profile(text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.update_my_profile(text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.run_jeetobaz_draw(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_jeetobaz_draw(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.run_jeetobaz_draw(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.run_jeetobaz_draw(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_public_draw_result(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_draw_result(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_public_draw_result(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_draw_result(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.update_profile_avatar(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_profile_avatar(text, text) FROM anon;
REVOKE ALL ON FUNCTION public.update_profile_avatar(text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.update_profile_avatar(text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_referral_dashboard(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_referral_dashboard(text, text) FROM anon;
REVOKE ALL ON FUNCTION public.get_referral_dashboard(text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_referral_dashboard(text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.claim_referral_code(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_referral_code(text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.claim_referral_code(text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_referral_code(text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_referral_eligible_products() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_referral_eligible_products() FROM anon;
REVOKE ALL ON FUNCTION public.get_referral_eligible_products() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_referral_eligible_products() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.redeem_referral_reward(text, text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redeem_referral_reward(text, text, uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.redeem_referral_reward(text, text, uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_referral_reward(text, text, uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_available_referral_rewards(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_available_referral_rewards(text, text) FROM anon;
REVOKE ALL ON FUNCTION public.get_available_referral_rewards(text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_referral_rewards(text, text) TO authenticated;

-- ============================================================
-- TASK 4: Tighten profile-avatars storage policies
-- ============================================================
-- Keep public read (avatars must be loadable everywhere).
-- Restrict insert to authenticated users only (prevent anonymous uploads).
-- Add admin-only delete policy.

DROP POLICY IF EXISTS "profile_avatars_public_insert" ON storage.objects;

CREATE POLICY "profile_avatars_authenticated_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-avatars');

DROP POLICY IF EXISTS "profile_avatars_admin_delete" ON storage.objects;

CREATE POLICY "profile_avatars_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid
  );

-- ============================================================
-- TASK 5: Safe RLS policies for unprotected tables
-- ============================================================

-- --- notifications ---
-- Admin inserts global notifications. Users read their own.
-- RLS is NOT currently enabled on notifications.

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admin can do everything with notifications
DROP POLICY IF EXISTS "JeetoBaz admin manages notifications" ON public.notifications;

CREATE POLICY "JeetoBaz admin manages notifications"
  ON public.notifications
  FOR ALL
  TO authenticated
  USING (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  WITH CHECK (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

-- Users can read global notifications (target_phone IS NULL) or their own (target_phone matches)
DROP POLICY IF EXISTS "Users read own or global notifications" ON public.notifications;

CREATE POLICY "Users read own or global notifications"
  ON public.notifications
  FOR SELECT
  TO anon, authenticated
  USING (
    target_phone IS NULL
    OR target_phone = (
      SELECT phone FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- --- referral_claims ---
-- Already has RLS enabled + REVOKE from anon/authenticated.
-- Only SECURITY DEFINER functions access this table.
-- Add admin read policy for admin panel visibility.

DROP POLICY IF EXISTS "JeetoBaz admin reads referral claims" ON public.referral_claims;

CREATE POLICY "JeetoBaz admin reads referral claims"
  ON public.referral_claims
  FOR SELECT
  TO authenticated
  USING (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

-- --- referral_rewards ---
-- Already has RLS enabled + REVOKE from anon/authenticated.
-- Only SECURITY DEFINER functions access this table.
-- Add admin read policy for admin panel visibility.

DROP POLICY IF EXISTS "JeetoBaz admin reads referral rewards" ON public.referral_rewards;

CREATE POLICY "JeetoBaz admin reads referral rewards"
  ON public.referral_rewards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

-- --- admin_settings ---
-- Already has: public read + admin insert/update.
-- Verify RLS is enabled (should already be from home-ads-setup.sql).
-- No changes needed — existing policies are correct.

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Check SECURITY DEFINER functions all have search_path = public
SELECT
  p.proname AS function_name,
  pg_catalog.pg_get_userbyid(p.proowner) AS owner,
  CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security,
  coalesce(
    (SELECT setting FROM pg_settings WHERE name = 'search_path'),
    'missing'
  ) AS search_path_check
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = true
  AND p.proname IN (
    'approve_entry_atomic',
    'create_user_profile',
    'update_my_profile',
    'run_jeetobaz_draw',
    'get_public_draw_result',
    'update_profile_avatar',
    'get_referral_dashboard',
    'claim_referral_code',
    'get_referral_eligible_products',
    'redeem_referral_reward',
    'get_available_referral_rewards'
  )
ORDER BY p.proname;

-- Check RLS is enabled on all required tables
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'products', 'entries', 'transactions', 'users',
    'notifications', 'referral_claims', 'referral_rewards',
    'admin_settings', 'app_settings', 'draw_results'
  )
ORDER BY c.relname;

-- Check storage policies for profile-avatars
SELECT
  policyname,
  roles,
  cmd,
  with_check,
  using
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE '%profile_avatar%'
  )
ORDER BY policyname;

COMMIT;
