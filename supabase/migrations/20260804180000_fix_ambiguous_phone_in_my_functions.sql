-- get_my_entries and get_my_pending_transactions both RETURNS TABLE(...) with a column named
-- "phone" -- in plpgsql that makes "phone" a variable name in scope for the whole function body.
-- Their "not exists (select 1 from users where auth_user_id = auth.uid() and phone = p_phone)"
-- check (added in 20260801080000_fix_phone_idor_on_my_functions.sql) references "phone"
-- unqualified, which Postgres can't resolve between that variable and the users.phone column,
-- raising "column reference \"phone\" is ambiguous" on every call. Qualifying it as users.phone
-- fixes it. count_my_entries/get_my_ticket_for_draw/check_entry_exists/
-- check_pending_transaction_exists don't have this problem (no "phone" output column / not
-- plpgsql), so they were unaffected.

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

  if not exists (select 1 from users where auth_user_id = auth.uid() and users.phone = p_phone) then
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

  if not exists (select 1 from users where auth_user_id = auth.uid() and users.phone = p_phone) then
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
