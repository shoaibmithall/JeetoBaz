-- New public storage bucket for admin-uploaded replacement QR codes on the
-- now-editable payment_accounts app_settings entry. Mirrors the existing
-- 'home-ads' bucket exactly: public read (bucket is public, no SELECT RLS
-- needed), admin-only write via the same hardcoded-admin-email check already
-- used everywhere else in this codebase.

insert into storage.buckets (id, name, public)
values ('payment-qr-codes', 'payment-qr-codes', true)
on conflict (id) do nothing;

create policy "JeetoBaz admin uploads payment QR codes"
on storage.objects for insert
with check (
  bucket_id = 'payment-qr-codes'
  and (auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com'
);

create policy "JeetoBaz admin updates payment QR codes"
on storage.objects for update
using (
  bucket_id = 'payment-qr-codes'
  and (auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com'
)
with check (
  bucket_id = 'payment-qr-codes'
  and (auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com'
);

create policy "JeetoBaz admin deletes payment QR codes"
on storage.objects for delete
using (
  bucket_id = 'payment-qr-codes'
  and (auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com'
);
