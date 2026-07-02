-- JeetoBaz home advertising carousel settings and media storage.

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "Public reads app settings" on public.app_settings;
create policy "Public reads app settings"
  on public.app_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "JeetoBaz admin inserts app settings" on public.app_settings;
create policy "JeetoBaz admin inserts app settings"
  on public.app_settings
  for insert
  to authenticated
  with check ((auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com');

drop policy if exists "JeetoBaz admin updates app settings" on public.app_settings;
create policy "JeetoBaz admin updates app settings"
  on public.app_settings
  for update
  to authenticated
  using ((auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'home-ads',
  'home-ads',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "JeetoBaz admin uploads home ads" on storage.objects;
create policy "JeetoBaz admin uploads home ads"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'home-ads'
    and (auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com'
  );

drop policy if exists "JeetoBaz admin updates home ads" on storage.objects;
create policy "JeetoBaz admin updates home ads"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'home-ads'
    and (auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com'
  )
  with check (
    bucket_id = 'home-ads'
    and (auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com'
  );

drop policy if exists "JeetoBaz admin deletes home ads" on storage.objects;
create policy "JeetoBaz admin deletes home ads"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'home-ads'
    and (auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com'
  );
