-- These "my" functions trusted a client-supplied p_phone with no check that
-- it belongs to the caller, letting anyone (even anon) pass another user's
-- phone number and read their entries, ticket numbers, and pending
-- transaction details (amount, sender name/phone, payment method, status).
-- Every real call site in the app only ever sends the caller's own phone
-- (sourced from public.users via auth_user_id = auth.uid()), so requiring
-- that match here blocks the IDOR without changing legitimate behavior.
-- Applied directly to production first; this records it.

CREATE OR REPLACE FUNCTION public.check_entry_exists(p_product_id uuid, p_phone text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    exists(select 1 from users where auth_user_id = auth.uid() and phone = p_phone)
    and exists(select 1 from entries where product_id = p_product_id and phone = p_phone);
$function$;

CREATE OR REPLACE FUNCTION public.check_pending_transaction_exists(p_product_id uuid, p_phone text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    exists(select 1 from users where auth_user_id = auth.uid() and phone = p_phone)
    and exists(
      select 1 from transactions
      where product_id = p_product_id and phone = p_phone and status = 'pending'
    );
$function$;

CREATE OR REPLACE FUNCTION public.count_my_entries(p_phone text)
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when exists(select 1 from users where auth_user_id = auth.uid() and phone = p_phone)
    then (select count(*)::int from entries where phone = p_phone)
    else 0
  end;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_ticket_for_draw(p_product_id uuid, p_phone text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select ticket_number
  from entries
  where product_id = p_product_id and phone = p_phone
    and exists(select 1 from users where auth_user_id = auth.uid() and phone = p_phone)
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_entries(p_phone text)
 RETURNS TABLE(id uuid, product_id uuid, phone text, created_at timestamp without time zone, name text, user_id uuid, ticket_number text, transaction_id text, entry_source text, referral_reward_id uuid, products jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if p_phone !~ '^\+92[0-9]{10}$' then
    raise exception 'Invalid phone number format';
  end if;

  if not exists (select 1 from users where auth_user_id = auth.uid() and phone = p_phone) then
    raise exception 'Not authorized';
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
$function$;

CREATE OR REPLACE FUNCTION public.get_my_pending_transactions(p_phone text)
 RETURNS TABLE(id uuid, user_id uuid, product_id uuid, amount integer, jazzcash_txn_id text, status text, created_at timestamp without time zone, payment_method text, sender_name text, sender_phone text, user_name text, receipt_path text, phone text, products jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if p_phone !~ '^\+92[0-9]{10}$' then
    raise exception 'Invalid phone number format';
  end if;

  if not exists (select 1 from users where auth_user_id = auth.uid() and phone = p_phone) then
    raise exception 'Not authorized';
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
$function$;
