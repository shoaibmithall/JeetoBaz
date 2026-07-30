-- Prize delivery status lifecycle. Purely additive: new columns on draw_results
-- plus an admin-only RPC to update them. Does not touch run_jeetobaz_draw,
-- approve_entry_atomic, or any existing draw-selection/audit logic.

alter table public.draw_results
  add column if not exists prize_status text not null default 'pending'
    check (prize_status in ('pending', 'processing', 'shipped', 'delivered')),
  add column if not exists prize_status_updated_at timestamptz not null default now(),
  add column if not exists prize_tracking_note text;

create or replace function public.update_prize_status(
  p_product_id uuid,
  p_status text,
  p_tracking_note text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
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
  where product_id = p_product_id;

  if not found then
    raise exception 'No draw result found for this product.';
  end if;
end;
$$;

create or replace function public.get_public_draw_result(requested_product_id uuid)
returns table(
  winner_name text,
  masked_phone text,
  winner_ticket_number text,
  total_entries integer,
  drawn_at timestamptz,
  prize_status text,
  prize_tracking_note text
)
language sql
stable security definer
set search_path to 'public'
as $$
  select
    result.winner_name,
    left(result.winner_phone, 7)
      || '****'
      || right(result.winner_phone, 4),
    result.winner_ticket_number,
    result.total_entries,
    result.drawn_at,
    result.prize_status,
    result.prize_tracking_note
  from public.draw_results result
  where result.product_id = requested_product_id;
$$;
