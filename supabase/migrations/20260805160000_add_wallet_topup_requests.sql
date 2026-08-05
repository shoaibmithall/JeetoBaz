-- Wallet feature, Phase 2: user-submitted top-up requests + admin approval.
--
-- Mirrors the existing `transactions` (payment-approval) flow exactly: a user submits a
-- request row (validated entirely by the INSERT policy, same field rules as
-- 20260802042214_wrap_auth_calls_in_rls_policies.sql's transactions policy, just without a
-- product_id), the admin reviews it in the admin panel, and approval calls the Phase 1
-- topup_wallet_atomic function to actually move money. Regular users get no UPDATE policy at
-- all -- the two RPCs below (admin-only, checked inside the function body) are the only way a
-- request's status can change.

create table if not exists public.wallet_topup_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  phone text not null,
  user_name text,
  amount integer not null,
  payment_method text,
  sender_name text,
  sender_phone text,
  reference text,
  receipt_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

create index if not exists wallet_topup_requests_phone_idx on public.wallet_topup_requests (phone, created_at desc);
create index if not exists wallet_topup_requests_status_idx on public.wallet_topup_requests (status);

alter table public.wallet_topup_requests enable row level security;

create policy "JeetoBaz validated public wallet topup submissions"
  on public.wallet_topup_requests
  for insert
  to anon, authenticated
  with check (
    (phone ~ '^\+92[0-9]{10}$'::text)
    and ((amount >= 1) and (amount <= 1000000))
    and (coalesce(status, 'pending'::text) = 'pending'::text)
    and (reference is not null)
    and ((length(trim(both from reference)) >= 4) and (length(trim(both from reference)) <= 120))
    and (receipt_path is not null)
    and ((receipt_path like 'data:image/%'::text) or ((length(trim(both from receipt_path)) >= 4) and (length(trim(both from receipt_path)) <= 512)))
    and ((payment_method is null) or (payment_method = any (array['JazzCash'::text, 'Easypaisa'::text, 'NayaPay'::text, 'UPaisa'::text, 'SadaPay'::text, 'JS Bank / Zindigi App'::text, 'My ABL Allied Bank / Bank Transfer'::text])))
    and ((user_name is null) or ((length(trim(both from user_name)) >= 2) and (length(trim(both from user_name)) <= 80)))
    and ((sender_name is null) or ((length(trim(both from sender_name)) >= 2) and (length(trim(both from sender_name)) <= 80)))
    and ((sender_phone is null) or (sender_phone ~ '^\+92[0-9]{10}$'::text) or (sender_phone ~ '^03[0-9]{9}$'::text))
    and ((user_id is null) or (user_id = (select auth.uid())))
    and (reviewed_at is null)
    and (reviewed_by is null)
  );

create policy "JeetoBaz admin manages wallet topup requests"
  on public.wallet_topup_requests
  for all
  to authenticated
  using ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  with check ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

-- Phone-scoped read for the submitting user (mirrors get_my_pending_transactions) -- regular
-- users have no SELECT policy on this table at all, so this RPC is the only way they can check
-- their own request's status.
create or replace function public.get_my_pending_wallet_topup_requests(p_phone text)
returns table (
  id uuid,
  amount integer,
  payment_method text,
  status text,
  created_at timestamptz
)
language sql
security definer
set search_path to 'public'
as $$
  select id, amount, payment_method, status, created_at
  from wallet_topup_requests
  where phone = p_phone and status = 'pending'
  order by created_at desc;
$$;

create or replace function public.check_pending_wallet_topup_exists(p_phone text)
returns boolean
language sql
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from wallet_topup_requests
    where phone = p_phone and status = 'pending'
  );
$$;

-- Admin-only: review a pending request and, on approval, credit the wallet via
-- topup_wallet_atomic in the same transaction as flipping the request to 'approved' (so a
-- crash between the two is impossible -- either both happen or neither does).
create or replace function public.approve_wallet_topup_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_request record;
  v_result jsonb;
begin
  if auth.uid() is distinct from '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid then
    raise exception 'Only the verified JeetoBaz admin can approve wallet top-up requests.';
  end if;

  select id, phone, amount, status into v_request
  from wallet_topup_requests where id = p_request_id for update;

  if v_request is null then
    return jsonb_build_object('ok', false, 'error', 'Top-up request not found.');
  end if;

  if v_request.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'This request has already been reviewed.');
  end if;

  v_result := topup_wallet_atomic(v_request.phone, v_request.amount, 'topup_request:' || v_request.id::text);

  if not coalesce((v_result ->> 'ok')::boolean, false) then
    return v_result;
  end if;

  update wallet_topup_requests
  set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
  where id = p_request_id;

  return v_result;
end;
$$;

create or replace function public.reject_wallet_topup_request(p_request_id uuid, p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_updated_id uuid;
begin
  if auth.uid() is distinct from '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid then
    raise exception 'Only the verified JeetoBaz admin can reject wallet top-up requests.';
  end if;

  update wallet_topup_requests
  set status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid()
  where id = p_request_id and status = 'pending'
  returning id into v_updated_id;

  if v_updated_id is null then
    return jsonb_build_object('ok', false, 'error', 'Request not found or already reviewed.');
  end if;

  return jsonb_build_object('ok', true, 'reason', p_reason);
end;
$$;

grant execute on function public.approve_wallet_topup_request(uuid) to authenticated;
grant execute on function public.reject_wallet_topup_request(uuid, text) to authenticated;
