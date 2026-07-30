-- Referral functions previously trusted a client-supplied phone number
-- with no real ownership check — only a client-generated "device token"
-- that gets bound to a phone on first call, meaning an attacker who
-- calls first for any real user's phone can hijack that phone's referral
-- identity, force an unwanted referral link, grant themselves rewards,
-- and later pass the device-token check on redeem_referral_reward to
-- create a real draw entry under the victim's phone/name.
--
-- Fix: derive the caller's identity from auth.uid() (a real, verified
-- Supabase Auth session) instead of a client-supplied phone. The
-- requested_phone parameter is dropped entirely from all four
-- functions — it's structurally impossible to pass a fake one now.
-- Device-token stays as an additional anti-multi-account signal, layered
-- on top of the now-mandatory real-auth check rather than being the
-- sole identity check.

drop function if exists public.get_referral_dashboard(text, text);
drop function if exists public.claim_referral_code(text, text, text);
drop function if exists public.get_available_referral_rewards(text, text);
drop function if exists public.redeem_referral_reward(text, text, uuid, uuid);

create function public.get_referral_dashboard(requested_device_token text)
returns table(referral_code text, successful_referrals bigint, available_rewards bigint, redeemed_rewards bigint)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_auth_user_id uuid;
  selected_user public.users%rowtype;
begin
  v_auth_user_id := auth.uid();
  if v_auth_user_id is null then
    raise exception 'Please sign in to view your referral dashboard.';
  end if;

  select *
  into selected_user
  from public.users
  where auth_user_id = v_auth_user_id
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

create function public.claim_referral_code(requested_code text, requested_device_token text)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_auth_user_id uuid;
  referred_user public.users%rowtype;
  referrer_user public.users%rowtype;
  saved_claim public.referral_claims%rowtype;
begin
  v_auth_user_id := auth.uid();
  if v_auth_user_id is null then
    raise exception 'Please sign in before applying a referral code.';
  end if;

  select *
  into referred_user
  from public.users
  where auth_user_id = v_auth_user_id
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

create function public.get_available_referral_rewards(requested_device_token text)
returns table(reward_id uuid, expires_at timestamptz)
language sql
stable
security definer
set search_path to 'public'
as $$
  select r.id, r.expires_at
  from public.referral_rewards r
  join public.users u on u.id = r.user_id
  where u.auth_user_id = auth.uid()
    and u.referral_device_token = requested_device_token
    and r.status = 'available'
    and r.expires_at > now()
  order by r.created_at;
$$;

create function public.redeem_referral_reward(requested_device_token text, requested_reward_id uuid, requested_product_id uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_auth_user_id uuid;
  selected_user public.users%rowtype;
  selected_reward public.referral_rewards%rowtype;
  selected_product public.products%rowtype;
  selected_claim public.referral_claims%rowtype;
  saved_entry public.entries%rowtype;
  referral_entry_count integer;
  referral_entry_limit integer;
begin
  v_auth_user_id := auth.uid();
  if v_auth_user_id is null then
    raise exception 'Please sign in to redeem a referral reward.';
  end if;

  select *
  into selected_user
  from public.users
  where auth_user_id = v_auth_user_id
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
