-- Stage 1 of real push notifications (Web Push API). Stores each device's push subscription so a
-- server-side Supabase Edge Function (using the service role key, which bypasses RLS) can later
-- send notifications for events like payment approval, draw-ready, and winner announcements.
-- Users can only see/manage their own subscription rows (insert on opt-in, delete on
-- opt-out/unsubscribe) -- nothing here is readable by other users; the service role is the only
-- reader when actually sending a push.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_phone_idx on public.push_subscriptions (phone);

alter table public.push_subscriptions enable row level security;

create policy "Users manage their own push subscriptions"
  on public.push_subscriptions
  for all
  to authenticated
  using (
    exists (select 1 from users where auth_user_id = (select auth.uid()) and phone = push_subscriptions.phone)
  )
  with check (
    exists (select 1 from users where auth_user_id = (select auth.uid()) and phone = push_subscriptions.phone)
  );
