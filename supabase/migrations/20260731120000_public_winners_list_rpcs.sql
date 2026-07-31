-- Public Hall of Winners list: one efficient query instead of N parallel
-- get_public_draw_result calls. Includes winner avatar/city/province per
-- the agreed design (winner's own account avatar_url, not admin-uploaded
-- winner_photo; profile location fields already public-facing by design).
create function public.get_public_winners_list()
 returns table(
   product_id uuid,
   product_name text,
   product_slug text,
   product_image_url text,
   prize_value integer,
   winner_name text,
   masked_phone text,
   winner_ticket_number text,
   total_entries integer,
   drawn_at timestamptz,
   winner_status text,
   winner_avatar_url text,
   winner_city text,
   winner_province text
 )
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select
    r.product_id,
    p.name,
    p.slug,
    p.image_url,
    p.price,
    r.winner_name,
    left(r.winner_phone, 7) || '****' || right(r.winner_phone, 4),
    r.winner_ticket_number,
    r.total_entries,
    r.drawn_at,
    r.winner_status,
    u.avatar_url,
    upd.city,
    upd.province
  from public.draw_results r
  join public.products p on p.id = r.product_id
  left join public.users u on u.id = r.winner_user_id
  left join public.user_profile_details upd on upd.auth_user_id = u.auth_user_id
  order by r.drawn_at desc;
$function$;

-- Signed-in user's own wins only (for the "My Wins" tab). auth.uid() is
-- required to match, so an anonymous caller simply gets zero rows.
create function public.get_my_wins()
 returns table(
   product_id uuid,
   product_name text,
   product_slug text,
   product_image_url text,
   prize_value integer,
   winner_name text,
   masked_phone text,
   winner_ticket_number text,
   total_entries integer,
   drawn_at timestamptz,
   winner_status text,
   winner_avatar_url text,
   winner_city text,
   winner_province text
 )
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select
    r.product_id,
    p.name,
    p.slug,
    p.image_url,
    p.price,
    r.winner_name,
    left(r.winner_phone, 7) || '****' || right(r.winner_phone, 4),
    r.winner_ticket_number,
    r.total_entries,
    r.drawn_at,
    r.winner_status,
    u.avatar_url,
    upd.city,
    upd.province
  from public.draw_results r
  join public.products p on p.id = r.product_id
  join public.users u on u.id = r.winner_user_id
  left join public.user_profile_details upd on upd.auth_user_id = u.auth_user_id
  where u.auth_user_id = auth.uid()
  order by r.drawn_at desc;
$function$;
