-- Public winner photos with admin-only upload management.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'winner-media',
  'winner-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'JeetoBaz admin uploads winner media'
  ) then
    create policy "JeetoBaz admin uploads winner media"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'winner-media'
        and auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'JeetoBaz admin updates winner media'
  ) then
    create policy "JeetoBaz admin updates winner media"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'winner-media'
        and auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid
      )
      with check (
        bucket_id = 'winner-media'
        and auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'JeetoBaz admin deletes winner media'
  ) then
    create policy "JeetoBaz admin deletes winner media"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'winner-media'
        and auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid
      );
  end if;
end
$$;

commit;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'winner-media';
