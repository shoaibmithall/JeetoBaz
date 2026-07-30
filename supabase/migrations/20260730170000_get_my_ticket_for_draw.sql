-- Returns only the caller's own ticket number for a given draw (product),
-- keyed by phone — same phone-scoped model as check_entry_exists /
-- get_my_entries. Never returns anyone else's ticket, name, or phone.
-- Purely additive; no existing table, policy, or function touched.

create or replace function public.get_my_ticket_for_draw(p_product_id uuid, p_phone text)
returns text
language sql
stable security definer
set search_path to 'public'
as $$
  select ticket_number
  from entries
  where product_id = p_product_id and phone = p_phone
  limit 1;
$$;
