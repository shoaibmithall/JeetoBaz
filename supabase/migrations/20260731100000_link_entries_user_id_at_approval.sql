-- Add FK constraint on entries.user_id -> users.id (was unconstrained; already 0 orphaned rows)
alter table public.entries
  add constraint entries_user_id_fkey foreign key (user_id) references public.users(id) on delete set null;

-- Resolve and set entries.user_id at approval time by matching the paying phone number
-- to an existing users row, so future winner displays (avatar, name, location) can be
-- reliably joined. Purely additive metadata for display purposes; no new access granted.
create or replace function public.approve_entry_atomic(p_product_id uuid, p_phone text, p_name text DEFAULT NULL::text, p_transaction_id text DEFAULT NULL::text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_product record;
  v_existing_entry_id uuid;
  v_new_entry_id uuid;
  v_user_id uuid;
begin
  if auth.uid() is distinct from '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid then
    raise exception 'Only the verified JeetoBaz admin can approve entries.';
  end if;

  select id, status, current_entries, max_entries into v_product from products where id = p_product_id for update;
  if v_product is null then return jsonb_build_object('ok', false, 'error', 'Product not found.'); end if;
  if v_product.status != 'active' then return jsonb_build_object('ok', false, 'error', 'This draw is not active.'); end if;
  if coalesce(v_product.current_entries, 0) >= v_product.max_entries then return jsonb_build_object('ok', false, 'error', 'This draw is full.'); end if;

  select id into v_existing_entry_id from entries where product_id = p_product_id and phone = p_phone limit 1;
  if v_existing_entry_id is not null then return jsonb_build_object('ok', false, 'error', 'Entry already exists for this phone number.'); end if;

  select id into v_user_id from users where phone = p_phone limit 1;

  v_new_entry_id := gen_random_uuid();
  insert into entries (id, product_id, phone, name, transaction_id, ticket_number, user_id)
  values (v_new_entry_id, p_product_id, p_phone, p_name, p_transaction_id, 'JB-' || upper(left(v_new_entry_id::text, 8)), v_user_id);

  update products set current_entries = coalesce(current_entries, 0) + 1 where id = p_product_id;

  return jsonb_build_object('ok', true, 'entry_id', v_new_entry_id, 'new_entries', (select current_entries from products where id = p_product_id));
end;
$function$;
