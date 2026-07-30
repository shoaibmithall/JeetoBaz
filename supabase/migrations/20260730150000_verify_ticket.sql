-- Public ticket verification lookup. Deliberately does NOT return the
-- entrant's name or phone — only draw context and win/lose status —
-- so a guessed/shared ticket number can't be used to look up who someone
-- is. Purely additive read accessor; no existing table, policy, or
-- function touched.

create or replace function public.verify_ticket(p_ticket_number text)
returns table(
  product_name text,
  product_slug text,
  product_status text,
  entry_created_at timestamp,
  is_winner boolean,
  drawn_at timestamptz
)
language sql
stable security definer
set search_path to 'public'
as $$
  select
    p.name,
    p.slug,
    p.status,
    e.created_at,
    (dr.id is not null) as is_winner,
    dr.drawn_at
  from entries e
  join products p on p.id = e.product_id
  left join draw_results dr on dr.winner_entry_id = e.id
  where e.ticket_number = p_ticket_number;
$$;
