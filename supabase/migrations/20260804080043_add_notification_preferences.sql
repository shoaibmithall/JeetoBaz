-- Adds per-user notification category preferences for the Settings panel (Phase 4).
-- Default is everything ON so existing users see no behavior change until they opt out.
alter table public.users
add column notification_preferences jsonb not null default '{"prize_updates": true, "winner_announcements": true, "payment_notifications": true, "promotional": true}'::jsonb;

-- Dedicated RPC (rather than reusing update_my_profile) so this can't accidentally regress the
-- existing profile-save flow. Matches the same auth.uid()-derived-ownership pattern already used
-- by update_my_profile/create_user_profile — the existing "User can update own profile" RLS
-- policy on users compares id = auth.uid(), which does NOT match auth_user_id for most accounts,
-- so a direct client-side table update would silently fail for most users. SECURITY DEFINER +
-- auth_user_id = auth.uid() is the pattern proven to actually work.
create or replace function public.update_notification_preferences(p_preferences jsonb)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update users
  set notification_preferences = p_preferences,
      updated_at = now()
  where auth_user_id = auth.uid();

  if not found then
    raise exception 'Profile not found';
  end if;
end;
$function$;
