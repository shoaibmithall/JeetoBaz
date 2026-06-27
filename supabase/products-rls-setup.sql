-- JeetoBaz products-only RLS migration.
-- Existing product read policies are preserved. No other table is changed.

begin;

do $$
begin
  if not exists (
    select 1
    from auth.users
    where id = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid
      and lower(email) = 'shoaibmithall@gmail.com'
  ) then
    raise exception 'JeetoBaz admin Auth user was not found. Products RLS was not enabled.';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and cmd in ('SELECT', 'ALL')
      and (
        'public' = any(roles)
        or 'anon' = any(roles)
      )
  ) then
    raise exception 'A public products read policy was not found. Products RLS was not enabled.';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'JeetoBaz admin manages products'
  ) then
    create policy "JeetoBaz admin manages products"
      on public.products
      for all
      to authenticated
      using (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
      with check (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);
  end if;
end
$$;

alter table public.products enable row level security;

commit;

-- Expected result: rls_enabled = true. Existing read policies remain listed.
select
  c.relrowsecurity as rls_enabled,
  p.policyname,
  p.roles,
  p.cmd
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p
  on p.schemaname = n.nspname
  and p.tablename = c.relname
where n.nspname = 'public'
  and c.relname = 'products'
order by p.policyname;
