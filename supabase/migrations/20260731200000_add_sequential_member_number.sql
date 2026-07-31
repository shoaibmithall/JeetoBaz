-- Adds a sequential, human-friendly Member ID (formatted client-side as
-- JB-100001) to replace the UUID-slice-based one (JB-M-XXXXXXXX). Backfills
-- existing rows in signup order; future rows pick up the sequence
-- automatically via the column default, no app-code change needed on insert.
-- Applied directly to production first (13 pre-launch rows); this records it.
create sequence public.member_number_seq;

alter table public.users add column member_number integer;

with ordered as (
  select id, row_number() over (order by created_at asc, id asc) as rn
  from public.users
)
update public.users u
set member_number = 100000 + ordered.rn
from ordered
where ordered.id = u.id;

select setval('public.member_number_seq', coalesce((select max(member_number) from public.users), 100000));

alter table public.users
  alter column member_number set default nextval('public.member_number_seq'),
  alter column member_number set not null,
  add constraint users_member_number_key unique (member_number);

alter sequence public.member_number_seq owned by public.users.member_number;
