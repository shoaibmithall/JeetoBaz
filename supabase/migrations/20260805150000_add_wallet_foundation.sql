-- Wallet feature, Phase 1: database foundation only (no UI changes yet, nothing user-visible).
--
-- wallet_balance is intentionally its own table, NOT a column on `users`. The existing
-- "User can update own profile" policy on public.users (using (id = auth.uid()), no column
-- restriction) would let any signed-in user set their own balance to anything via a direct
-- client .update() call if it lived there. A dedicated table where the only policy granted to
-- regular users is SELECT (no INSERT/UPDATE/DELETE policy at all) closes that off completely --
-- only the SECURITY DEFINER functions below (which bypass RLS) can ever change a balance.

create table if not exists public.wallets (
  phone text primary key,
  balance integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.wallets enable row level security;

create policy "Users view their own wallet"
  on public.wallets
  for select
  to authenticated
  using (
    exists (select 1 from users where auth_user_id = (select auth.uid()) and phone = wallets.phone)
  );

create policy "JeetoBaz admin manages wallets"
  on public.wallets
  for all
  to authenticated
  using ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  with check ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

-- Ledger: every balance change, ever. This is the audit trail / "History" screen's real data
-- source, and balance_after lets history render without recomputing running totals.
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  type text not null check (type in ('topup', 'entry', 'refund', 'bonus', 'adjustment')),
  amount integer not null, -- positive = credit (topup, refund, bonus), negative = debit (entry)
  balance_after integer not null,
  reference text,
  created_at timestamptz not null default now()
);

create index if not exists wallet_transactions_phone_idx on public.wallet_transactions (phone, created_at desc);

alter table public.wallet_transactions enable row level security;

create policy "Users view their own wallet transactions"
  on public.wallet_transactions
  for select
  to authenticated
  using (
    exists (select 1 from users where auth_user_id = (select auth.uid()) and phone = wallet_transactions.phone)
  );

create policy "JeetoBaz admin manages wallet transactions"
  on public.wallet_transactions
  for all
  to authenticated
  using ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  with check ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

-- Admin-only: credit a wallet after the admin has manually verified a real deposit (same trust
-- model as the existing approve_entry_atomic -- admin identity is enforced inside the function,
-- not left to a client-side check).
create or replace function public.topup_wallet_atomic(p_phone text, p_amount integer, p_reference text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_new_balance integer;
begin
  if auth.uid() is distinct from '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid then
    raise exception 'Only the verified JeetoBaz admin can approve wallet top-ups.';
  end if;

  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'Top-up amount must be positive.');
  end if;

  insert into wallets (phone, balance)
  values (p_phone, p_amount)
  on conflict (phone) do update set balance = wallets.balance + excluded.balance, updated_at = now()
  returning balance into v_new_balance;

  insert into wallet_transactions (phone, type, amount, balance_after, reference)
  values (p_phone, 'topup', p_amount, v_new_balance, p_reference);

  return jsonb_build_object('ok', true, 'new_balance', v_new_balance);
end;
$$;

-- User-facing: spend from the caller's own wallet to instantly enter a draw, no admin approval
-- wait. Mirrors approve_entry_atomic's product locking/duplicate-entry/capacity checks, but
-- debits a wallet balance instead of requiring a separately-approved manual payment. Unlike
-- approve_entry_atomic (admin-only), this is called by the entering user themselves, so it must
-- verify the caller actually owns p_phone before touching anything.
create or replace function public.enter_draw_from_wallet_atomic(p_product_id uuid, p_phone text, p_name text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_product record;
  v_wallet record;
  v_existing_entry_id uuid;
  v_new_entry_id uuid;
  v_user_id uuid;
  v_entry_fee integer;
  v_new_balance integer;
begin
  if not exists (select 1 from users where auth_user_id = auth.uid() and phone = p_phone) then
    raise exception 'Not authorized.';
  end if;

  select id, status, current_entries, max_entries, entry_fee into v_product
  from products where id = p_product_id for update;
  if v_product is null then return jsonb_build_object('ok', false, 'error', 'Product not found.'); end if;
  if v_product.status != 'active' then return jsonb_build_object('ok', false, 'error', 'This draw is not active.'); end if;
  if coalesce(v_product.current_entries, 0) >= v_product.max_entries then
    return jsonb_build_object('ok', false, 'error', 'This draw is full.');
  end if;

  select id into v_existing_entry_id from entries where product_id = p_product_id and phone = p_phone limit 1;
  if v_existing_entry_id is not null then
    return jsonb_build_object('ok', false, 'error', 'Entry already exists for this phone number.');
  end if;

  v_entry_fee := coalesce(v_product.entry_fee, 1);

  select phone, balance into v_wallet from wallets where phone = p_phone for update;
  if v_wallet is null or v_wallet.balance < v_entry_fee then
    return jsonb_build_object('ok', false, 'error', 'Insufficient wallet balance.');
  end if;

  select id into v_user_id from users where phone = p_phone limit 1;

  v_new_entry_id := gen_random_uuid();
  insert into entries (id, product_id, phone, name, entry_source, user_id, ticket_number)
  values (v_new_entry_id, p_product_id, p_phone, p_name, 'wallet', v_user_id, 'JB-' || upper(left(v_new_entry_id::text, 8)));

  update products set current_entries = coalesce(current_entries, 0) + 1 where id = p_product_id;

  update wallets set balance = balance - v_entry_fee, updated_at = now()
  where phone = p_phone
  returning balance into v_new_balance;

  insert into wallet_transactions (phone, type, amount, balance_after, reference)
  values (p_phone, 'entry', -v_entry_fee, v_new_balance, p_product_id::text);

  return jsonb_build_object('ok', true, 'entry_id', v_new_entry_id, 'new_balance', v_new_balance);
end;
$$;

grant execute on function public.topup_wallet_atomic(text, integer, text) to authenticated;
grant execute on function public.enter_draw_from_wallet_atomic(uuid, text, text) to authenticated;
