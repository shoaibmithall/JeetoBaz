-- Persist real, permanent ticket numbers on entries instead of computing them
-- on-the-fly at display time. Uses the exact same formula every frontend
-- fallback already computes ('JB-' || first 8 chars of entry id uppercased),
-- so this changes zero user-visible behavior today — it just makes the value
-- real and queryable, which the rest of the winner-selection roadmap
-- (ticket verification, Member ID unification, draw certificates) needs.

-- Backfill existing entries (currently 3 rows, all ticket_number IS NULL).
update entries
set ticket_number = 'JB-' || upper(left(id::text, 8))
where ticket_number is null;

create or replace function public.approve_entry_atomic(
  p_product_id uuid,
  p_phone text,
  p_name text default null,
  p_transaction_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_product record;
  v_existing_entry_id uuid;
  v_new_entry_id uuid;
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

  v_new_entry_id := gen_random_uuid();
  insert into entries (id, product_id, phone, name, transaction_id, ticket_number)
  values (v_new_entry_id, p_product_id, p_phone, p_name, p_transaction_id, 'JB-' || upper(left(v_new_entry_id::text, 8)));

  update products set current_entries = coalesce(current_entries, 0) + 1 where id = p_product_id;

  return jsonb_build_object('ok', true, 'entry_id', v_new_entry_id, 'new_entries', (select current_entries from products where id = p_product_id));
end;
$function$;
