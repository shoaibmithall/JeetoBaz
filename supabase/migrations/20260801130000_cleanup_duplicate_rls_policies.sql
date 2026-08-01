-- Leftover duplicate/subset RLS policies from iterative past migrations.
-- Each one dropped here is either an exact duplicate of another policy
-- (same cmd, same qual, one role set a subset of the other's — {public}
-- already covers {authenticated}) or a strict subset of a wider policy
-- that must stay (e.g. status='active' is a subset of qual=true, which
-- the app depends on for reading non-active products by id). No
-- effective permission changes: whatever was allowed before is still
-- allowed via the remaining policy, nothing more, nothing less.
-- Applied directly to production first; this records it.

-- products: keep "Anyone can read products" (qual=true, public); it already
-- covers every case the other 5 policies attempted to express.
drop policy if exists "only active products" on public.products;
drop policy if exists "Public read active products" on public.products;
drop policy if exists "Read active products only" on public.products;
drop policy if exists "Allow authenticated read access on products" on public.products;
drop policy if exists "Public read" on public.products;

-- transactions: keep "insert own transactions" (INSERT, user_id=auth.uid(), public)
-- and "own transactions only" (SELECT, user_id=auth.uid(), public).
drop policy if exists "Insert own transactions only" on public.transactions;
drop policy if exists "Users can view own transactions" on public.transactions;
drop policy if exists "View own transactions only" on public.transactions;

-- users: keep "user can view own profile" (public); the authenticated-role
-- copy is a strict subset of it.
drop policy if exists "User can view own profile" on public.users;
