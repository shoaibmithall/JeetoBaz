-- The "products" storage bucket already existed (public) but had zero RLS policies, meaning
-- no one — not even the admin — could actually upload to it via the client. Add the same
-- admin-only write pattern already used for winner-media/home-ads so the new "Upload Product
-- Image" admin panel button can work.

create policy "JeetoBaz admin uploads product images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'products' and auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

create policy "JeetoBaz admin updates product images"
on storage.objects for update
to authenticated
using (bucket_id = 'products' and auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
with check (bucket_id = 'products' and auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

create policy "JeetoBaz admin deletes product images"
on storage.objects for delete
to authenticated
using (bucket_id = 'products' and auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);
