-- handle_new_user() (fired by the on_auth_user_created trigger on every signup) created a
-- public.users row with id = new.id but never set auth_user_id, email, or auth_provider.
-- Since every app query for "my profile" filters on auth_user_id = auth.uid(), this left
-- every new signup with Member ID/referrals/etc showing "Unavailable" until they separately
-- completed /profile-setup, which re-linked the row via a phone match. Setting these fields
-- at creation time removes that broken intermediate state entirely.
-- Applied directly to production first (including a one-time backfill of the 5 real accounts
-- already stuck in this state); this records it.

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  user_name text;
  user_phone text;
begin
  user_name := nullif(
    trim(coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      ''
    )),
    ''
  );

  user_phone := nullif(
    trim(coalesce(
      new.phone,
      new.raw_user_meta_data ->> 'phone',
      ''
    )),
    ''
  );

  if user_name is not null and user_phone is not null then
    insert into public.users (id, name, phone, auth_user_id, email, auth_provider)
    values (new.id, user_name, user_phone, new.id, new.email, 'email')
    on conflict (id) do nothing;
  end if;

  return new;
end;
$function$;

-- One-time backfill: link every existing row this bug left orphaned (auth_user_id null,
-- id matches a real auth.users row), skipping any whose auth account already has a
-- different, properly-linked row (the unique constraint on auth_user_id would reject those;
-- those are dead leftovers from a changed phone number during signup, not stuck accounts).
update public.users u
set auth_user_id = u.id,
    email = lower(trim(a.email)),
    auth_provider = 'email'
from auth.users a
where a.id = u.id
  and u.auth_user_id is null
  and not exists (select 1 from public.users u2 where u2.auth_user_id = u.id);
