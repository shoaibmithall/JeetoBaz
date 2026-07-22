-- Isolated public verification-document publishing feature.
-- Existing authentication, payment and business tables are not modified.

begin;

create table public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 120),
  description text not null check (char_length(trim(description)) between 2 and 2000),
  image_url text not null check (image_url ~ '^https://'),
  image_path text not null check (char_length(trim(image_path)) between 3 and 500),
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.set_verification_document_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_verification_document_updated_at
before update on public.verification_documents
for each row execute function public.set_verification_document_updated_at();

alter table public.verification_documents enable row level security;

create policy "Public reads visible verification documents"
  on public.verification_documents
  for select
  to anon, authenticated
  using (is_visible = true or lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com');

create policy "JeetoBaz admin manages verification documents"
  on public.verification_documents
  for all
  to authenticated
  using (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com')
  with check (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verification-documents',
  'verification-documents',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
;

create policy "JeetoBaz admin uploads verification documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'verification-documents' and lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com');

create policy "JeetoBaz admin updates verification documents"
  on storage.objects for update to authenticated
  using (bucket_id = 'verification-documents' and lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com')
  with check (bucket_id = 'verification-documents' and lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com');

create policy "JeetoBaz admin deletes verification documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'verification-documents' and lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com');

commit;
