-- JeetoBaz referral rewards foundation.
-- Run after reviewing in the Supabase SQL Editor.
-- Referral rewards are restricted to active Rs.1 campaigns and redeemed atomically.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

alter table public.users
  add column if not exists referral_code text,
  add column if not exists referral_device_token text,
  add column if not exists referred_by uuid references public.users(id) on delete set null;

alter table public.entries
  add column if not exists entry_source text not null default 'payment',
  add column if not exists referral_reward_id uuid;

create or replace function public.make_jeetobaz_referral_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := 'JB-' || upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8));
    exit when not exists (
      select 1 from public.users where referral_code = candidate
    );
  end loop;
  return candidate;
end;
$$;

update public.users
set referral_code = public.make_jeetobaz_referral_code()
where referral_code is null;

alter table public.users
  alter column referral_code set default public.make_jeetobaz_referral_code();

create unique index if not exists users_referral_code_unique
  on public.users (upper(referral_code));

create index if not exists users_referral_device_token_idx
  on public.users (referral_device_token)
  where referral_device_token is not null;

create table if not exists public.referral_claims (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.users(id) on delete restrict,
  referred_user_id uuid not null unique references public.users(id) on delete restrict,
  status text not null default 'qualified'
    check (status in ('pending', 'qualified', 'rejected', 'reversed')),
  created_at timestamptz not null default now(),
  qualified_at timestamptz
);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  referral_claim_id uuid not null references public.referral_claims(id) on delete restrict,
  reward_kind text not null default 'rs1_entry'
    check (reward_kind = 'rs1_entry'),
  status text not null default 'available'
    check (status in ('available', 'redeemed', 'expired', 'revoked')),
  expires_at timestamptz not null default (now() + interval '30 days'),
  redeemed_product_id uuid references public.products(id) on delete restrict,
  redeemed_entry_id uuid references public.entries(id) on delete restrict,
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  unique (user_id, referral_claim_id)
);

alter table public.entries
  drop constraint if exists entries_referral_reward_id_fkey;

alter table public.entries
  add constraint entries_referral_reward_id_fkey
  foreign key (referral_reward_id)
  references public.referral_rewards(id)
  on delete restrict;

create unique index if not exists entries_referral_reward_unique
  on public.entries (referral_reward_id)
  where referral_reward_id is not null;

alter table public.referral_claims enable row level security;
alter table public.referral_rewards enable row level security;

revoke all on public.referral_claims from anon, authenticated;
revoke all on public.referral_rewards from anon, authenticated;

create or replace function public.get_referral_dashboard(
  requested_phone text,
  requested_device_token text
)
returns table (
  referral_code text,
  successful_referrals bigint,
  available_rewards bigint,
  redeemed_rewards bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_user public.users%rowtype;
begin
  select *
  into selected_user
  from public.users
  where phone = requested_phone
  for update;

  if selected_user.id is null then
    raise exception 'Account not found.';
  end if;

  if selected_user.referral_device_token is null then
    update public.users
    set referral_device_token = requested_device_token
    where id = selected_user.id;
  elsif selected_user.referral_device_token <> requested_device_token then
    raise exception 'This account is linked to another device.';
  end if;

  return query
  select
    selected_user.referral_code,
    (select count(*) from public.referral_claims c
      where c.referrer_user_id = selected_user.id and c.status = 'qualified'),
    (select count(*) from public.referral_rewards r
      where r.user_id = selected_user.id
        and r.status = 'available'
        and r.expires_at > now()),
    (select count(*) from public.referral_rewards r
      where r.user_id = selected_user.id and r.status = 'redeemed');
end;
$$;

create or replace function public.claim_referral_code(
  requested_phone text,
  requested_code text,
  requested_device_token text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  referred_user public.users%rowtype;
  referrer_user public.users%rowtype;
  saved_claim public.referral_claims%rowtype;
begin
  select *
  into referred_user
  from public.users
  where phone = requested_phone
  for update;

  if referred_user.id is null then
    raise exception 'Create your account before applying a referral code.';
  end if;

  select *
  into referrer_user
  from public.users
  where upper(referral_code) = upper(trim(requested_code))
  for update;

  if referrer_user.id is null then
    raise exception 'Referral code was not found.';
  end if;

  if referrer_user.id = referred_user.id then
    raise exception 'You cannot use your own referral code.';
  end if;

  if referred_user.referred_by is not null then
    raise exception 'A referral code has already been used for this account.';
  end if;

  if referred_user.created_at < now() - interval '7 days' then
    raise exception 'Referral codes can only be applied to new accounts.';
  end if;

  if referrer_user.referral_device_token is not null
    and referrer_user.referral_device_token = requested_device_token then
    raise exception 'Self-referral from the same device is not allowed.';
  end if;

  if exists (
    select 1
    from public.users
    where referral_device_token = requested_device_token
      and id <> referred_user.id
  ) then
    raise exception 'This device has already been used for another account.';
  end if;

  update public.users
  set referred_by = referrer_user.id,
      referral_device_token = coalesce(referral_device_token, requested_device_token)
  where id = referred_user.id;

  insert into public.referral_claims (
    referrer_user_id,
    referred_user_id,
    status,
    qualified_at
  )
  values (
    referrer_user.id,
    referred_user.id,
    'qualified',
    now()
  )
  returning * into saved_claim;

  insert into public.referral_rewards (user_id, referral_claim_id)
  values
    (referrer_user.id, saved_claim.id),
    (referred_user.id, saved_claim.id);

  return 'Referral verified. One Rs.1 campaign entry is now available.';
end;
$$;

create or replace function public.get_referral_eligible_products()
returns setof public.products
language sql
security definer
set search_path = public
as $$
  select p.*
  from public.products p
  where p.status = 'active'
    and p.entry_fee = 1
    and coalesce(p.current_entries, 0) < p.max_entries
    and (
      select count(*)
      from public.entries e
      where e.product_id = p.id
        and e.entry_source in ('referral_referrer', 'referral_welcome')
    ) < greatest(1, floor(p.max_entries * 0.10))
  order by p.created_at desc;
$$;

create or replace function public.redeem_referral_reward(
  requested_phone text,
  requested_device_token text,
  requested_reward_id uuid,
  requested_product_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_user public.users%rowtype;
  selected_reward public.referral_rewards%rowtype;
  selected_product public.products%rowtype;
  selected_claim public.referral_claims%rowtype;
  saved_entry public.entries%rowtype;
  referral_entry_count integer;
  referral_entry_limit integer;
begin
  select *
  into selected_user
  from public.users
  where phone = requested_phone
  for update;

  if selected_user.id is null
    or selected_user.referral_device_token is distinct from requested_device_token then
    raise exception 'Account or device verification failed.';
  end if;

  select *
  into selected_reward
  from public.referral_rewards
  where id = requested_reward_id
    and user_id = selected_user.id
  for update;

  if selected_reward.id is null
    or selected_reward.status <> 'available'
    or selected_reward.expires_at <= now() then
    raise exception 'This referral reward is not available.';
  end if;

  select *
  into selected_product
  from public.products
  where id = requested_product_id
  for update;

  if selected_product.id is null
    or selected_product.status <> 'active'
    or selected_product.entry_fee <> 1 then
    raise exception 'Referral entries can only be used for active Rs.1 campaigns.';
  end if;

  if coalesce(selected_product.current_entries, 0) >= selected_product.max_entries then
    raise exception 'This campaign is already full.';
  end if;

  select count(*)
  into referral_entry_count
  from public.entries
  where product_id = selected_product.id
    and entry_source in ('referral_referrer', 'referral_welcome');

  referral_entry_limit := greatest(1, floor(selected_product.max_entries * 0.10));
  if referral_entry_count >= referral_entry_limit then
    raise exception 'This campaign has reached its referral entry limit.';
  end if;

  if exists (
    select 1 from public.entries
    where product_id = selected_product.id
      and phone = selected_user.phone
  ) then
    raise exception 'You already have an entry in this campaign.';
  end if;

  select *
  into selected_claim
  from public.referral_claims
  where id = selected_reward.referral_claim_id;

  insert into public.entries (
    product_id,
    phone,
    name,
    user_id,
    ticket_number,
    entry_source,
    referral_reward_id
  )
  values (
    selected_product.id,
    selected_user.phone,
    selected_user.name,
    selected_user.id,
    'JB-R-' || upper(substr(encode(extensions.gen_random_bytes(7), 'hex'), 1, 10)),
    case
      when selected_claim.referrer_user_id = selected_user.id then 'referral_referrer'
      else 'referral_welcome'
    end,
    selected_reward.id
  )
  returning * into saved_entry;

  update public.products
  set current_entries = coalesce(current_entries, 0) + 1
  where id = selected_product.id;

  update public.referral_rewards
  set status = 'redeemed',
      redeemed_product_id = selected_product.id,
      redeemed_entry_id = saved_entry.id,
      redeemed_at = now()
  where id = selected_reward.id;

  return saved_entry.ticket_number;
end;
$$;

create or replace function public.get_available_referral_rewards(
  requested_phone text,
  requested_device_token text
)
returns table (
  reward_id uuid,
  expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select r.id, r.expires_at
  from public.referral_rewards r
  join public.users u on u.id = r.user_id
  where u.phone = requested_phone
    and u.referral_device_token = requested_device_token
    and r.status = 'available'
    and r.expires_at > now()
  order by r.created_at;
$$;

grant execute on function public.get_referral_dashboard(text, text) to anon, authenticated;
grant execute on function public.claim_referral_code(text, text, text) to anon, authenticated;
grant execute on function public.get_referral_eligible_products() to anon, authenticated;
grant execute on function public.redeem_referral_reward(text, text, uuid, uuid) to anon, authenticated;
grant execute on function public.get_available_referral_rewards(text, text) to anon, authenticated;
