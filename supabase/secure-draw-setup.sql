-- JeetoBaz secure admin-run draw migration.
-- Additive only: existing products, entries and winner fields are preserved.

begin;

create table if not exists public.draw_results (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references public.products(id) on delete restrict,
  winner_entry_id uuid not null references public.entries(id) on delete restrict,
  winner_user_id uuid null,
  winner_name text not null,
  winner_phone text not null,
  winner_ticket_number text not null,
  total_entries integer not null check (total_entries > 0),
  drawn_at timestamptz not null default now(),
  drawn_by uuid not null references auth.users(id) on delete restrict
);

alter table public.draw_results enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'draw_results'
      and policyname = 'JeetoBaz admin reads draw results'
  ) then
    create policy "JeetoBaz admin reads draw results"
      on public.draw_results
      for select
      to authenticated
      using (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);
  end if;
end
$$;

create or replace function public.run_jeetobaz_draw(requested_product_id uuid)
returns table (
  result_id uuid,
  winner_entry_id uuid,
  winner_name text,
  winner_phone text,
  winner_ticket_number text,
  total_entries integer,
  drawn_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_product public.products%rowtype;
  selected_entry public.entries%rowtype;
  approved_entry_count integer;
  saved_result public.draw_results%rowtype;
begin
  if auth.uid() is distinct from '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid then
    raise exception 'Only the verified JeetoBaz admin can run a draw.';
  end if;

  select *
  into selected_product
  from public.products
  where id = requested_product_id
  for update;

  if not found then
    raise exception 'Draw product was not found.';
  end if;

  if selected_product.status <> 'active' then
    raise exception 'This draw is not active.';
  end if;

  if exists (
    select 1
    from public.draw_results
    where product_id = requested_product_id
  ) then
    raise exception 'This draw already has a locked result.';
  end if;

  select count(*)::integer
  into approved_entry_count
  from public.entries
  where product_id = requested_product_id;

  if approved_entry_count < selected_product.max_entries then
    raise exception 'Participants are not complete yet (% of %).',
      approved_entry_count,
      selected_product.max_entries;
  end if;

  if extract(hour from timezone('Asia/Karachi', now())) <> 22 then
    raise exception 'JeetoBaz draws can only be run between 10:00 PM and 10:59 PM Pakistan time.';
  end if;

  select *
  into selected_entry
  from public.entries
  where product_id = requested_product_id
  order by gen_random_uuid()
  limit 1;

  if not found then
    raise exception 'No approved entries were found for this draw.';
  end if;

  insert into public.draw_results (
    product_id,
    winner_entry_id,
    winner_user_id,
    winner_name,
    winner_phone,
    winner_ticket_number,
    total_entries,
    drawn_by
  )
  values (
    requested_product_id,
    selected_entry.id,
    selected_entry.user_id,
    coalesce(nullif(trim(selected_entry.name), ''), 'JeetoBaz Winner'),
    selected_entry.phone,
    coalesce(
      nullif(trim(selected_entry.ticket_number), ''),
      'JB-' || upper(substr(selected_entry.id::text, 1, 8))
    ),
    approved_entry_count,
    auth.uid()
  )
  returning *
  into saved_result;

  update public.products
  set
    status = 'completed',
    winner_phone = saved_result.winner_phone
  where id = requested_product_id;

  return query
  select
    saved_result.id,
    saved_result.winner_entry_id,
    saved_result.winner_name,
    saved_result.winner_phone,
    saved_result.winner_ticket_number,
    saved_result.total_entries,
    saved_result.drawn_at;
end;
$$;

revoke all on function public.run_jeetobaz_draw(uuid) from public;
revoke all on function public.run_jeetobaz_draw(uuid) from anon;
grant execute on function public.run_jeetobaz_draw(uuid) to authenticated;

create or replace function public.get_public_draw_result(requested_product_id uuid)
returns table (
  winner_name text,
  masked_phone text,
  winner_ticket_number text,
  total_entries integer,
  drawn_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    result.winner_name,
    left(result.winner_phone, 7) || '****' || right(result.winner_phone, 4),
    result.winner_ticket_number,
    result.total_entries,
    result.drawn_at
  from public.draw_results result
  where result.product_id = requested_product_id;
$$;

revoke all on function public.get_public_draw_result(uuid) from public;
grant execute on function public.get_public_draw_result(uuid) to anon, authenticated;

commit;

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
  and c.relname = 'draw_results'
order by p.policyname;
