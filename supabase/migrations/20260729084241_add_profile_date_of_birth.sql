alter table public.user_profile_details
  add column date_of_birth date null;

alter table public.user_profile_details
  add constraint user_profile_details_date_of_birth_valid
  check (date_of_birth is null or date_of_birth >= date '1900-01-01');

comment on column public.user_profile_details.date_of_birth is
  'User-provided date of birth. Access is restricted by the table owner-only RLS policies.';
