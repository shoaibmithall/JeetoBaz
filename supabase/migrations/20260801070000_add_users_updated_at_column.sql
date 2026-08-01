-- update_my_profile() sets updated_at = now() on every profile save (name,
-- avatar, phone), but the column never existed on public.users, so any
-- profile update (including avatar upload) failed with:
--   column "updated_at" of relation "users" does not exist
-- Applied directly to production first; this records it.
alter table public.users add column updated_at timestamp without time zone default now();

update public.users set updated_at = created_at where updated_at is null;
