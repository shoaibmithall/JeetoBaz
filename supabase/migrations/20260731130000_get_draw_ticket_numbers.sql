-- Public: ticket numbers only for a product's entries (no names/phones).
-- Foundation for the Participant Reveal phase of the future Live Draw Room —
-- ticket numbers alone reveal no identity, so this is not a privacy regression
-- versus what verify_ticket / the public ticket count already expose.
create function public.get_draw_ticket_numbers(p_product_id uuid)
 returns table(ticket_number text)
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select e.ticket_number
  from public.entries e
  where e.product_id = p_product_id
    and e.ticket_number is not null
  order by e.created_at asc;
$function$;
