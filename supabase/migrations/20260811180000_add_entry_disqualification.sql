-- Lets an admin exclude a specific entry from a draw's winner pool (e.g. a suspicious duplicate
-- or fraudulent entry spotted before the draw runs) without deleting the entry itself, so the
-- fee/payment/audit trail for it stays intact.
--
-- is_disqualified defaults to false for every existing and future row, so this is a no-op until
-- an admin explicitly disqualifies an entry from the draw lobby screen.
--
-- Only the winner-selection SELECT inside run_jeetobaz_draw changes (adds "and not is_disqualified"
-- to the WHERE clause). Every other line -- the admin check, draw-readiness count, draw-window
-- check, draw_results insert, products update -- is copied verbatim from the current live
-- function (pulled via pg_get_functiondef before writing this migration, diffed again after
-- applying it). Disqualified entries still count toward the max_entries "draw ready" threshold
-- and toward the total_entries figure shown on the result, since they represent real payments
-- that were made -- only their eligibility to be the *winner* changes.

alter table public.entries
  add column is_disqualified boolean not null default false,
  add column disqualified_reason text;

CREATE OR REPLACE FUNCTION public.run_jeetobaz_draw(requested_product_id uuid)
 RETURNS TABLE(result_id uuid, winner_entry_id uuid, winner_name text, winner_phone text, winner_ticket_number text, total_entries integer, drawn_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  selected_product public.products%rowtype;
  selected_entry public.entries%rowtype;
  approved_entry_count integer;
  saved_result public.draw_results%rowtype;
  draw_window_hour integer;
begin
  if auth.uid() is distinct from
    '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid
  then
    raise exception
      'Only the verified JeetoBaz admin can run a draw.';
  end if;

  select *
  into selected_product
  from public.products
  where id = requested_product_id
  for update;

  if not found then
    raise exception 'Draw product was not found.';
  end if;

  if selected_product.status <> 'active' then
    raise exception 'This draw is not active.';
  end if;

  if exists (
    select 1
    from public.draw_results
    where product_id = requested_product_id
  ) then
    raise exception 'This draw already has a locked result.';
  end if;

  select count(*)::integer
  into approved_entry_count
  from public.entries
  where product_id = requested_product_id;

  if approved_entry_count < selected_product.max_entries then
    raise exception
      'Participants are not complete yet (% of %).',
      approved_entry_count,
      selected_product.max_entries;
  end if;

  select coalesce((value #>> '{}')::integer, 22)
  into draw_window_hour
  from public.app_settings
  where key = 'draw_window_hour_pkt';

  if draw_window_hour is null then
    draw_window_hour := 22;
  end if;

  if extract(
    hour from timezone('Asia/Karachi', now())
  ) <> draw_window_hour then
    raise exception
      'JeetoBaz draws can only be run between %:00 and %:59 Pakistan time.',
      lpad(draw_window_hour::text, 2, '0'),
      lpad(draw_window_hour::text, 2, '0');
  end if;

  select *
  into selected_entry
  from public.entries
  where product_id = requested_product_id
    and not is_disqualified
  order by gen_random_uuid()
  limit 1;

  if not found then
    raise exception
      'No approved entries were found for this draw.';
  end if;

  insert into public.draw_results (
    product_id,
    winner_entry_id,
    winner_user_id,
    winner_name,
    winner_phone,
    winner_ticket_number,
    total_entries,
    drawn_by
  )
  values (
    requested_product_id,
    selected_entry.id,
    selected_entry.user_id,
    coalesce(
      nullif(trim(selected_entry.name), ''),
      'JeetoBaz Winner'
    ),
    selected_entry.phone,
    coalesce(
      nullif(trim(selected_entry.ticket_number), ''),
      'JB-' || upper(substr(selected_entry.id::text, 1, 8))
    ),
    approved_entry_count,
    auth.uid()
  )
  returning *
  into saved_result;

  update public.products
  set
    status = 'completed',
    winner_phone = left(saved_result.winner_phone, 7) || '****' || right(saved_result.winner_phone, 4)
  where id = requested_product_id;

  return query
  select
    saved_result.id,
    saved_result.winner_entry_id,
    saved_result.winner_name,
    saved_result.winner_phone,
    saved_result.winner_ticket_number,
    saved_result.total_entries,
    saved_result.drawn_at;
end;
$function$;
