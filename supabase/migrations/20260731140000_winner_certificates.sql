-- Private bucket for winner certificates. Admin designs/signs/uploads the
-- file manually (no automatic PDF generation). Access is restricted to the
-- actual winner only, via storage RLS + a narrow auth.uid()-scoped RPC —
-- same access-control pattern as the phone-scoped "Your Ticket" feature,
-- adapted for files.
insert into storage.buckets (id, name, public)
values ('winner-certificates', 'winner-certificates', false);

create table public.winner_certificates (
  id uuid primary key default gen_random_uuid(),
  draw_result_id uuid not null references public.draw_results(id) on delete cascade,
  winner_user_id uuid not null references public.users(id),
  storage_path text not null unique,
  file_name text,
  uploaded_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.winner_certificates enable row level security;

create policy "JeetoBaz admin manages winner certificates"
  on public.winner_certificates
  for all
  using (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  with check (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

-- Storage: admin manages certificate files.
create policy "JeetoBaz admin uploads winner certificates"
  on storage.objects
  for insert
  with check (bucket_id = 'winner-certificates' and auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

create policy "JeetoBaz admin reads winner certificates"
  on storage.objects
  for select
  using (bucket_id = 'winner-certificates' and auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

create policy "JeetoBaz admin deletes winner certificates"
  on storage.objects
  for delete
  using (bucket_id = 'winner-certificates' and auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

-- Storage: the actual winner can read only their own certificate object,
-- resolved by matching the object path to a winner_certificates row whose
-- winner_user_id maps to the caller's auth.uid() via users.auth_user_id.
create policy "Winner reads own certificate object"
  on storage.objects
  for select
  using (
    bucket_id = 'winner-certificates'
    and exists (
      select 1
      from public.winner_certificates wc
      join public.users u on u.id = wc.winner_user_id
      where wc.storage_path = storage.objects.name
        and u.auth_user_id = auth.uid()
    )
  );

-- Public: the signed-in winner's own certificate list (metadata only —
-- storage_path is used client-side to request a signed URL, itself gated
-- by the storage policy above).
create function public.get_my_certificates()
 returns table(
   certificate_id uuid,
   product_name text,
   storage_path text,
   file_name text,
   created_at timestamptz
 )
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select wc.id, p.name, wc.storage_path, wc.file_name, wc.created_at
  from public.winner_certificates wc
  join public.draw_results r on r.id = wc.draw_result_id
  join public.products p on p.id = r.product_id
  join public.users u on u.id = wc.winner_user_id
  where u.auth_user_id = auth.uid()
  order by wc.created_at desc;
$function$;
