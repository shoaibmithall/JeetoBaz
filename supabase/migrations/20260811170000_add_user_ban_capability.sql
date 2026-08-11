-- Adds the ability for the admin to ban/suspend a user. There was previously no way to stop an
-- abusive or fraudulent account from continuing to submit new payment claims or wallet top-up
-- requests short of manually deleting the account.
--
-- is_banned defaults to false for every existing and future row, so this is a no-op for every
-- user until an admin explicitly bans one from the new admin Users tab control.
--
-- The two INSERT policies below are the actual chokepoint for user-generated abuse: entries are
-- never inserted directly by a user (only created server-side once an admin approves a
-- transaction), so blocking new transactions and wallet top-up requests is sufficient to stop a
-- banned user from creating anything new, without needing to touch login/auth itself. Only a
-- single "AND NOT EXISTS (...)" clause is appended to each policy's existing with_check -- every
-- other condition is copied verbatim from the current live policy (verified via pg_policies
-- before writing this migration and diffed again after applying it).

alter table public.users
  add column is_banned boolean not null default false,
  add column ban_reason text,
  add column banned_at timestamptz;

alter policy "JeetoBaz validated public payment submissions" on public.transactions
  with check (
    (product_id IS NOT NULL)
    AND (phone ~ '^\+92[0-9]{10}$'::text)
    AND ((amount >= 1) AND (amount <= 1000000))
    AND (COALESCE(status, 'pending'::text) = 'pending'::text)
    AND (jazzcash_txn_id IS NOT NULL)
    AND ((length(TRIM(BOTH FROM jazzcash_txn_id)) >= 4) AND (length(TRIM(BOTH FROM jazzcash_txn_id)) <= 120))
    AND (receipt_path IS NOT NULL)
    AND ((receipt_path ~~ 'data:image/%'::text) OR ((length(TRIM(BOTH FROM receipt_path)) >= 4) AND (length(TRIM(BOTH FROM receipt_path)) <= 512)))
    AND ((payment_method IS NULL) OR (payment_method = ANY (ARRAY['JazzCash'::text, 'Easypaisa'::text, 'NayaPay'::text, 'UPaisa'::text, 'SadaPay'::text, 'JS Bank / Zindigi App'::text, 'My ABL Allied Bank / Bank Transfer'::text])))
    AND ((user_name IS NULL) OR ((length(TRIM(BOTH FROM user_name)) >= 2) AND (length(TRIM(BOTH FROM user_name)) <= 80)))
    AND ((sender_name IS NULL) OR ((length(TRIM(BOTH FROM sender_name)) >= 2) AND (length(TRIM(BOTH FROM sender_name)) <= 80)))
    AND ((sender_phone IS NULL) OR (sender_phone ~ '^\+92[0-9]{10}$'::text) OR (sender_phone ~ '^03[0-9]{9}$'::text))
    AND ((user_id IS NULL) OR (user_id = ( SELECT auth.uid() AS uid)))
    AND (NOT EXISTS (
      SELECT 1 FROM public.users u
      WHERE (u.auth_user_id = auth.uid() OR u.id = auth.uid()) AND u.is_banned
    ))
  );

alter policy "JeetoBaz validated public wallet topup submissions" on public.wallet_topup_requests
  with check (
    (phone ~ '^\+92[0-9]{10}$'::text)
    AND ((amount >= 1) AND (amount <= 1000000))
    AND (COALESCE(status, 'pending'::text) = 'pending'::text)
    AND (reference IS NOT NULL)
    AND ((length(TRIM(BOTH FROM reference)) >= 4) AND (length(TRIM(BOTH FROM reference)) <= 120))
    AND (receipt_path IS NOT NULL)
    AND ((receipt_path ~~ 'data:image/%'::text) OR ((length(TRIM(BOTH FROM receipt_path)) >= 4) AND (length(TRIM(BOTH FROM receipt_path)) <= 512)))
    AND ((payment_method IS NULL) OR (payment_method = ANY (ARRAY['JazzCash'::text, 'Easypaisa'::text, 'NayaPay'::text, 'UPaisa'::text, 'SadaPay'::text, 'JS Bank / Zindigi App'::text, 'My ABL Allied Bank / Bank Transfer'::text])))
    AND ((user_name IS NULL) OR ((length(TRIM(BOTH FROM user_name)) >= 2) AND (length(TRIM(BOTH FROM user_name)) <= 80)))
    AND ((sender_name IS NULL) OR ((length(TRIM(BOTH FROM sender_name)) >= 2) AND (length(TRIM(BOTH FROM sender_name)) <= 80)))
    AND ((sender_phone IS NULL) OR (sender_phone ~ '^\+92[0-9]{10}$'::text) OR (sender_phone ~ '^03[0-9]{9}$'::text))
    AND ((user_id IS NULL) OR (user_id = ( SELECT auth.uid() AS uid)))
    AND (reviewed_at IS NULL)
    AND (reviewed_by IS NULL)
    AND (NOT EXISTS (
      SELECT 1 FROM public.users u
      WHERE (u.auth_user_id = auth.uid() OR u.id = auth.uid()) AND u.is_banned
    ))
  );
