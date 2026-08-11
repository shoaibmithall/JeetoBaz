-- Feedback and problem reports only ever opened the user's email app via a mailto: link --
-- nothing landed in Supabase, so if that email got lost or the owner was on a different device,
-- a complaint simply vanished with no record and no admin visibility. This table gives support
-- requests a real, trackable home; the client keeps the existing mailto flow as a fallback (so
-- there's still a copy in the user's own sent mail), but now also logs a row here.

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  phone text,
  name text,
  subject text not null,
  message text not null,
  kind text not null default 'feedback' check (kind in ('feedback', 'problem')),
  status text not null default 'open' check (status in ('open', 'resolved')),
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index support_tickets_status_idx on public.support_tickets (status);

alter table public.support_tickets enable row level security;

-- Any signed-in user can log their own feedback/problem report.
create policy "Authenticated users insert support tickets"
on public.support_tickets for insert
to authenticated
with check (true);

create policy "JeetoBaz admin reads support tickets"
on public.support_tickets for select
using ((select auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com');

create policy "JeetoBaz admin updates support tickets"
on public.support_tickets for update
using ((select auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com')
with check ((select auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com');
