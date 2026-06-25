create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  target_phone text null,
  link text null,
  kind text default 'general',
  created_at timestamptz not null default now()
);

create index if not exists notifications_created_at_idx
  on public.notifications (created_at desc);

create index if not exists notifications_target_phone_idx
  on public.notifications (target_phone);
