-- Admin action audit log. Purely additive: a new table the admin's own
-- authenticated session can write to directly (same pattern already used
-- for admin writes to products/transactions/users), plus a matching
-- read policy so the admin can review their own action history. No
-- existing table, policy, or function is touched — run_jeetobaz_draw,
-- approve_entry_atomic, and every other admin RPC stay exactly as they
-- are; the frontend calls this table as a fire-and-forget side effect
-- after those calls already succeed.

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  action_type text not null,
  target_id uuid,
  details jsonb,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

create policy "JeetoBaz admin manages audit log" on public.admin_audit_log
  for all to authenticated
  using (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  with check (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);
