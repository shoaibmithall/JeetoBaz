-- Brand showcase carousel: pure decorative branding photos (e.g. people wearing JeetoBaz
-- merchandise) shown in a Home-page carousel. Deliberately has NO name/caption/claim fields at
-- all -- this is not a testimonials or "winners" feature, just images, so there is no risk of it
-- being read as a fabricated endorsement. Mirrors verification_documents.sql's table/RLS/storage
-- pattern exactly, minus the required title/description (nothing here is ever edited in place;
-- an admin who wants to change a photo deletes it and uploads a new one).

begin;

create table public.brand_showcase_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null check (image_url ~ '^https://'),
  image_path text not null check (char_length(trim(image_path)) between 3 and 500),
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.brand_showcase_images enable row level security;

create policy "Public reads visible brand showcase images"
  on public.brand_showcase_images
  for select
  to anon, authenticated
  using (is_visible = true or lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com');

create policy "JeetoBaz admin manages brand showcase images"
  on public.brand_showcase_images
  for all
  to authenticated
  using (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com')
  with check (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand-showcase',
  'brand-showcase',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "JeetoBaz admin uploads brand showcase images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'brand-showcase' and lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com');

create policy "JeetoBaz admin updates brand showcase images"
  on storage.objects for update to authenticated
  using (bucket_id = 'brand-showcase' and lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com')
  with check (bucket_id = 'brand-showcase' and lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com');

create policy "JeetoBaz admin deletes brand showcase images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'brand-showcase' and lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com');

commit;
