-- Refunds were entirely ad-hoc: the only tool was manually crediting a user's wallet from the
-- Users tab, with no link back to the original payment, no record of why, and no status
-- tracking -- even though the Refund Policy page promises a real process. This table gives
-- refunds a real queue: tied to the originating transaction, with a reason, a status
-- (pending/approved/rejected), and who resolved it. Approval still credits the wallet through
-- the existing adjust_wallet_balance_atomic RPC (type 'refund') so the wallet ledger stays the
-- single source of truth for balances -- this table is the request/audit trail around it, not
-- a second source of balance truth.

create table public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id),
  phone text not null,
  amount integer not null check (amount > 0),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index refund_requests_status_idx on public.refund_requests (status);
create index refund_requests_phone_idx on public.refund_requests (phone);

alter table public.refund_requests enable row level security;

create policy "JeetoBaz admin reads refund requests"
on public.refund_requests for select
using ((select auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com');

create policy "JeetoBaz admin inserts refund requests"
on public.refund_requests for insert
with check ((select auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com');

create policy "JeetoBaz admin updates refund requests"
on public.refund_requests for update
using ((select auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com')
with check ((select auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com');
