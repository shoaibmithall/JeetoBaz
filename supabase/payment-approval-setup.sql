-- Run this once in Supabase SQL editor before using receipt uploads.

alter table public.transactions
  add column if not exists payment_method text,
  add column if not exists sender_name text,
  add column if not exists sender_phone text,
  add column if not exists user_name text,
  add column if not exists receipt_path text;

insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', false)
on conflict (id) do nothing;

create policy "payment_receipts_insert"
on storage.objects
for insert
to anon
with check (bucket_id = 'payment-receipts');

create policy "payment_receipts_select"
on storage.objects
for select
to anon
using (bucket_id = 'payment-receipts');

create policy "payment_receipts_delete"
on storage.objects
for delete
to anon
using (bucket_id = 'payment-receipts');
