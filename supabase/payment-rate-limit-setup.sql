create index if not exists transactions_pending_lookup_idx
  on public.transactions (product_id, phone, status);

-- Optional stronger protection:
-- Run this only after confirming there are no duplicate pending rows for the same product + phone.
-- create unique index if not exists transactions_one_pending_per_draw_user_idx
--   on public.transactions (product_id, phone)
--   where status = 'pending';
