-- Close public bulk-read exposure on entries/users/transactions.
-- These tables each carry a redundant "qual = true" SELECT policy that
-- fully negates the narrower, correctly-scoped policies alongside them
-- (Postgres RLS OR's permissive policies together), letting anyone read
-- every row via the REST API regardless of the app's client-side masking.

drop policy if exists "Allow authenticated read access on entries" on public.entries;
drop policy if exists "Anyone can read entries" on public.entries;
drop policy if exists "Allow authenticated read access on transactions" on public.transactions;
drop policy if exists "Anyone can read transactions" on public.transactions;
drop policy if exists "Allow authenticated read access on users" on public.users;
drop policy if exists "Anyone can read users" on public.users;

-- users had no admin-scoped policy at all (admin reads relied entirely on
-- the broad policy just dropped above), unlike entries/transactions/products
-- which already had one. Add it so /admin's user list keeps working.
create policy "JeetoBaz admin manages users" on public.users
  for all to authenticated
  using (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  with check (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

-- Narrow, phone-scoped accessors replacing direct table reads from the
-- frontend. These do not (and cannot, since regular users have no
-- cryptographically-verified phone identity) prove the caller owns the
-- phone number they pass in, but they close the "scrape the whole table"
-- exposure: a caller must already know a specific phone number, one at a
-- time, matching the same accepted model already used by
-- get_referral_dashboard.

create or replace function public.check_entry_exists(p_product_id uuid, p_phone text)
returns boolean
language sql
security definer
set search_path to 'public'
as $$
  select exists(
    select 1 from entries where product_id = p_product_id and phone = p_phone
  );
$$;

create or replace function public.check_pending_transaction_exists(p_product_id uuid, p_phone text)
returns boolean
language sql
security definer
set search_path to 'public'
as $$
  select exists(
    select 1 from transactions
    where product_id = p_product_id and phone = p_phone and status = 'pending'
  );
$$;

create or replace function public.count_my_entries(p_phone text)
returns integer
language sql
security definer
set search_path to 'public'
as $$
  select count(*)::int from entries where phone = p_phone;
$$;

create or replace function public.get_my_entries(p_phone text)
returns table (
  id uuid,
  product_id uuid,
  phone text,
  created_at timestamp,
  name text,
  user_id uuid,
  ticket_number text,
  transaction_id text,
  entry_source text,
  referral_reward_id uuid,
  products jsonb
)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_phone !~ '^\+92[0-9]{10}$' then
    raise exception 'Invalid phone number format';
  end if;

  return query
  select e.id, e.product_id, e.phone, e.created_at, e.name, e.user_id,
         e.ticket_number, e.transaction_id, e.entry_source, e.referral_reward_id,
         to_jsonb(p.*) as products
  from entries e
  left join products p on p.id = e.product_id
  where e.phone = p_phone
  order by e.created_at desc;
end;
$$;

create or replace function public.get_my_pending_transactions(p_phone text)
returns table (
  id uuid,
  user_id uuid,
  product_id uuid,
  amount integer,
  jazzcash_txn_id text,
  status text,
  created_at timestamp,
  payment_method text,
  sender_name text,
  sender_phone text,
  user_name text,
  receipt_path text,
  phone text,
  products jsonb
)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_phone !~ '^\+92[0-9]{10}$' then
    raise exception 'Invalid phone number format';
  end if;

  return query
  select t.id, t.user_id, t.product_id, t.amount, t.jazzcash_txn_id, t.status,
         t.created_at, t.payment_method, t.sender_name, t.sender_phone,
         t.user_name, t.receipt_path, t.phone,
         to_jsonb(p.*) as products
  from transactions t
  left join products p on p.id = t.product_id
  where t.phone = p_phone and t.status = 'pending'
  order by t.created_at desc;
end;
$$;
