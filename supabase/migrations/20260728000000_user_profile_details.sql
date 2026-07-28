create table public.user_profile_details (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  city text,
  province text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profile_details_city_valid
    check (city is null or (city = btrim(city) and char_length(city) between 1 and 80)),
  constraint user_profile_details_province_valid
    check (province is null or (province = btrim(province) and char_length(province) between 1 and 80)),
  constraint user_profile_details_country_valid
    check (country is null or (country = btrim(country) and char_length(country) between 1 and 80))
);

alter table public.user_profile_details enable row level security;

create policy "Users can read their own profile details"
  on public.user_profile_details
  for select
  to authenticated
  using ((select auth.uid()) = auth_user_id);

create policy "Users can insert their own profile details"
  on public.user_profile_details
  for insert
  to authenticated
  with check ((select auth.uid()) = auth_user_id);

create policy "Users can update their own profile details"
  on public.user_profile_details
  for update
  to authenticated
  using ((select auth.uid()) = auth_user_id)
  with check ((select auth.uid()) = auth_user_id);

revoke all on table public.user_profile_details from anon;
grant select, insert, update on table public.user_profile_details to authenticated;

comment on table public.user_profile_details is
  'Optional authenticated-user profile location details. Only city is displayed by the client.';
