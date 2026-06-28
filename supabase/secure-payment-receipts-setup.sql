-- Move new payment receipts to private Storage with admin-only read/delete.
-- Existing transaction, entry and approval records are preserved.

begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'payment-receipts',
  'payment-receipts',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "payment_receipts_insert" on storage.objects;
drop policy if exists "payment_receipts_select" on storage.objects;
drop policy if exists "payment_receipts_delete" on storage.objects;
drop policy if exists "JeetoBaz admin reads payment receipts" on storage.objects;
drop policy if exists "JeetoBaz admin deletes payment receipts" on storage.objects;

create policy "payment_receipts_insert"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'payment-receipts');

create policy "JeetoBaz admin reads payment receipts"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'payment-receipts'
    and auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid
  );

create policy "JeetoBaz admin deletes payment receipts"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'payment-receipts'
    and auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid
  );

commit;

select
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (
    policyname like '%payment_receipts%'
    or policyname like '%payment receipts%'
  )
order by policyname;
