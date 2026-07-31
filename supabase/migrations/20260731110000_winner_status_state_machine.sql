-- Winner Status: separate state machine from Prize Status (delivery logistics).
-- Kept manual/admin-only for disqualified/re_draw_required per agreed design
-- (draw_results.product_id is UNIQUE — no automated re-draw, ever).
alter table public.draw_results
  add column winner_status text not null default 'selected'
    check (winner_status in ('selected', 'under_verification', 'verified', 'disqualified', 're_draw_required')),
  add column winner_status_updated_at timestamptz not null default now();

-- Append-only timeline covering both winner_status and prize_status changes.
-- Rows are never updated or deleted — only ever inserted.
create table public.draw_result_status_history (
  id uuid primary key default gen_random_uuid(),
  draw_result_id uuid not null references public.draw_results(id) on delete cascade,
  status_type text not null check (status_type in ('winner_status', 'prize_status')),
  status_value text not null,
  note text,
  changed_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.draw_result_status_history enable row level security;

create policy "JeetoBaz admin manages status history"
  on public.draw_result_status_history
  for all
  using (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  with check (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

-- Backfill an initial history row for every already-drawn result, so the
-- timeline is never empty for past draws.
insert into public.draw_result_status_history (draw_result_id, status_type, status_value, note, changed_by, created_at)
select id, 'winner_status', 'selected', null, drawn_by, drawn_at
from public.draw_results;

insert into public.draw_result_status_history (draw_result_id, status_type, status_value, note, changed_by, created_at)
select id, 'prize_status', prize_status, prize_tracking_note, drawn_by, prize_status_updated_at
from public.draw_results;

-- Admin-only: advance/correct a winner's verification status. Every call
-- appends a history row; nothing is ever overwritten or deleted.
create function public.update_winner_status(p_draw_result_id uuid, p_status text, p_note text default null)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if auth.uid() is distinct from '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid then
    raise exception 'Only the verified JeetoBaz admin can update winner status.';
  end if;

  if p_status not in ('selected', 'under_verification', 'verified', 'disqualified', 're_draw_required') then
    raise exception 'Invalid winner status.';
  end if;

  update draw_results
  set winner_status = p_status,
      winner_status_updated_at = now()
  where id = p_draw_result_id;

  if not found then
    raise exception 'No draw result found with this id.';
  end if;

  insert into draw_result_status_history (draw_result_id, status_type, status_value, note, changed_by)
  values (p_draw_result_id, 'winner_status', p_status, nullif(trim(coalesce(p_note, '')), ''), auth.uid());
end;
$function$;

-- Extend update_prize_status to log into the same unified timeline.
create or replace function public.update_prize_status(p_product_id uuid, p_status text, p_tracking_note text DEFAULT NULL::text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_result_id uuid;
begin
  if auth.uid() is distinct from '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid then
    raise exception 'Only the verified JeetoBaz admin can update prize status.';
  end if;

  if p_status not in ('pending', 'processing', 'shipped', 'delivered') then
    raise exception 'Invalid prize status.';
  end if;

  update draw_results
  set prize_status = p_status,
      prize_status_updated_at = now(),
      prize_tracking_note = nullif(trim(coalesce(p_tracking_note, '')), '')
  where product_id = p_product_id
  returning id into v_result_id;

  if v_result_id is null then
    raise exception 'No draw result found for this product.';
  end if;

  insert into draw_result_status_history (draw_result_id, status_type, status_value, note, changed_by)
  values (v_result_id, 'prize_status', p_status, nullif(trim(coalesce(p_tracking_note, '')), ''), auth.uid());
end;
$function$;

-- Public: read-only, ordered timeline for a product's draw result (no admin identity exposed).
create function public.get_draw_status_history(requested_product_id uuid)
 returns table(status_type text, status_value text, note text, created_at timestamptz)
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select h.status_type, h.status_value, h.note, h.created_at
  from public.draw_result_status_history h
  join public.draw_results r on r.id = h.draw_result_id
  where r.product_id = requested_product_id
  order by h.created_at asc;
$function$;

-- Add winner_status to the public draw-result accessor.
drop function public.get_public_draw_result(uuid);
create function public.get_public_draw_result(requested_product_id uuid)
 returns table(winner_name text, masked_phone text, winner_ticket_number text, total_entries integer, drawn_at timestamp with time zone, prize_status text, prize_tracking_note text, winner_status text)
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select
    result.winner_name,
    left(result.winner_phone, 7)
      || '****'
      || right(result.winner_phone, 4),
    result.winner_ticket_number,
    result.total_entries,
    result.drawn_at,
    result.prize_status,
    result.prize_tracking_note,
    result.winner_status
  from public.draw_results result
  where result.product_id = requested_product_id;
$function$;
