-- handle_new_user() inserted into public.users with `on conflict (id) do nothing`, which only
-- guards against the id column. It never accounted for the unique constraint on phone, so a
-- signup with a phone number already linked to a different account crashed as a raw, unhandled
-- 23505 unique-violation deep in a trigger -- surfaced to the client as an opaque 500 ("Signup
-- failed: {}") instead of a clear "phone already registered" message, and rolled back the whole
-- signup transaction (including the already-created auth.users row) with no useful explanation.
-- Raising a clear exception before the insert converts that crash into a message the client can
-- recognize and show as a normal field-level error, the same way it already handles duplicate
-- emails.

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
    if exists (select 1 from public.users where phone = user_phone) then
      raise exception 'This phone number is already registered to another account.';
    end if;

    insert into public.users (id, name, phone, auth_user_id, email, auth_provider)
    values (new.id, user_name, user_phone, new.id, new.email, 'email')
    on conflict (id) do nothing;
  end if;

  return new;
end;
$function$;
