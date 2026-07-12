-- JeetoBaz profile avatar storage setup.
-- Purpose:
-- 1) Add avatar_url to public.users if it does not already exist.
-- 2) Create a public profile-avatars storage bucket for profile photos.
-- 3) Allow app users to upload profile photos and save only the resulting avatar URL.
--
-- Review before running in Supabase SQL Editor.
-- This does not remove or modify existing payment, admin, auth, or draw features.

begin;

alter table public.users
  add column if not exists avatar_url text;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile_avatars_public_read" on storage.objects;
create policy "profile_avatars_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'profile-avatars');

drop policy if exists "profile_avatars_public_insert" on storage.objects;
create policy "profile_avatars_public_insert"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'profile-avatars');

create or replace function public.update_profile_avatar(
  requested_phone text,
  requested_avatar_url text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if requested_phone !~ '^\+92[0-9]{10}$' then
    raise exception 'Invalid phone number';
  end if;

  if requested_avatar_url !~ '^https://jqjrfnhqqfymwfsdkwmv\.supabase\.co/storage/v1/object/public/profile-avatars/' then
    raise exception 'Invalid avatar URL';
  end if;

  update public.users
  set avatar_url = requested_avatar_url
  where phone = requested_phone;

  return found;
end;
$$;

revoke all on function public.update_profile_avatar(text, text) from public;
grant execute on function public.update_profile_avatar(text, text) to anon, authenticated;

commit;

select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'users'
  and column_name = 'avatar_url';

select
  id,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'profile-avatars';
