-- JeetoBaz safe performance indexes.
-- Additive only: this file does not remove, replace, or change existing data,
-- RLS policies, auth, admin, payments, or app logic.
--
-- Run in Supabase SQL Editor after review.
-- These CREATE INDEX statements are intentionally not wrapped in BEGIN/COMMIT.
-- If a database is very busy, run them one by one during low-traffic time.

-- Home screen active draws query:
-- products where status = 'active', ordered by created_at desc.
create index if not exists products_status_created_at_idx
  on public.products (status, created_at desc);

-- Admin/product sorting and latest products views.
create index if not exists products_created_at_idx
  on public.products (created_at desc);

-- User entry history and duplicate-entry checks.
create index if not exists entries_user_id_created_at_idx
  on public.entries (user_id, created_at desc);

-- Draw participant lookup, draw winner selection, and product entry counts.
create index if not exists entries_product_id_created_at_idx
  on public.entries (product_id, created_at desc);

-- Existing payment-rate-limit setup already creates:
-- transactions_pending_lookup_idx on (product_id, phone, status)
-- This index supports user payment history/admin payment review by user phone.
create index if not exists transactions_phone_created_at_idx
  on public.transactions (phone, created_at desc);

-- Admin payment filtering by status and newest-first review.
create index if not exists transactions_status_created_at_idx
  on public.transactions (status, created_at desc);

-- Winner/result lookups.
-- The app uses draw_results for completed draw winners, not a separate winners table.
create index if not exists draw_results_product_id_idx
  on public.draw_results (product_id);

-- Admin/users newest-first list and growth stats.
create index if not exists users_created_at_idx
  on public.users (created_at desc);

-- Referral/account lookup helpers used by login/referral flows.
create index if not exists users_phone_idx
  on public.users (phone);

create index if not exists users_referral_code_idx
  on public.users (referral_code);

-- Quick verification: indexes should appear after running the statements above.
select
  schemaname,
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'products_status_created_at_idx',
    'products_created_at_idx',
    'entries_user_id_created_at_idx',
    'entries_product_id_created_at_idx',
    'transactions_phone_created_at_idx',
    'transactions_status_created_at_idx',
    'draw_results_product_id_idx',
    'users_created_at_idx',
    'users_phone_idx',
    'users_referral_code_idx'
  )
order by tablename, indexname;
