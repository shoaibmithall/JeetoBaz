-- The "JeetoBaz validated public payment submissions" INSERT policy validated
-- every field except user_id, so a caller could set an arbitrary user_id
-- (attributing a fake pending transaction to someone else's account).
-- payment.tsx (the only place that inserts transactions) never sets
-- user_id — it's always left NULL — so requiring NULL-or-own here matches
-- current behavior exactly with no functional change.
-- Applied directly to production first; this records it.
ALTER POLICY "JeetoBaz validated public payment submissions" ON public.transactions
WITH CHECK (
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
  AND (user_id IS NULL OR user_id = auth.uid())
);
