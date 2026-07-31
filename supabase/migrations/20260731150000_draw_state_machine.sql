-- Draw State Machine (Phase 0 of Live Draw Room): tracks the lifecycle of
-- a draw BEFORE and DURING the run, separate from Winner Status (which
-- tracks winner verification AFTER selection). This state machine never
-- decides the winner — run_jeetobaz_draw is completely untouched by this
-- migration. Triggers only observe already-happening events (product going
-- active, a draw_results row appearing, prize marked delivered) and record
-- bookkeeping state, so reconnect/replay/dashboards have something to read.
create table public.draw_sessions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references public.products(id) on delete cascade,
  state text not null default 'created'
    check (state in ('created', 'waiting', 'locked', 'verifying', 'ready', 'running', 'winner_selected', 'result_published', 'completed')),
  state_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.draw_sessions enable row level security;

-- Safe to expose publicly: lifecycle state only, no PII. Powers the future
-- Draw Lobby page and Realtime subscriptions without needing an RPC.
create policy "Public reads draw session state"
  on public.draw_sessions
  for select
  using (true);

create policy "JeetoBaz admin manages draw sessions"
  on public.draw_sessions
  for all
  using (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  with check (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

-- Append-only timeline of state transitions (never updated/deleted).
create table public.draw_session_state_history (
  id uuid primary key default gen_random_uuid(),
  draw_session_id uuid not null references public.draw_sessions(id) on delete cascade,
  state text not null,
  changed_by uuid,
  created_at timestamptz not null default now()
);

alter table public.draw_session_state_history enable row level security;

create policy "JeetoBaz admin manages draw session history"
  on public.draw_session_state_history
  for all
  using (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  with check (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

-- Admin-only manual control, for states not yet auto-wired by triggers
-- (locked/verifying/ready/running/result_published) and for future phase UIs.
create function public.advance_draw_state(p_product_id uuid, p_new_state text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_session_id uuid;
begin
  if auth.uid() is distinct from '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid then
    raise exception 'Only the verified JeetoBaz admin can advance draw state.';
  end if;

  if p_new_state not in ('created', 'waiting', 'locked', 'verifying', 'ready', 'running', 'winner_selected', 'result_published', 'completed') then
    raise exception 'Invalid draw state.';
  end if;

  insert into draw_sessions (product_id, state)
  values (p_product_id, p_new_state)
  on conflict (product_id) do update set state = p_new_state, state_updated_at = now()
  returning id into v_session_id;

  insert into draw_session_state_history (draw_session_id, state, changed_by)
  values (v_session_id, p_new_state, auth.uid());
end;
$function$;

-- Trigger 1: a product going active means it's now accepting entries ("waiting").
-- on conflict do nothing — never downgrades a session already further along.
create function public.ensure_draw_session_waiting()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_session_id uuid;
begin
  insert into draw_sessions (product_id, state)
  values (new.id, 'waiting')
  on conflict (product_id) do nothing
  returning id into v_session_id;

  if v_session_id is not null then
    insert into draw_session_state_history (draw_session_id, state, changed_by)
    values (v_session_id, 'waiting', auth.uid());
  end if;

  return new;
end;
$function$;

create trigger trg_products_active_creates_session
  after insert or update of status on public.products
  for each row
  when (new.status = 'active')
  execute function public.ensure_draw_session_waiting();

-- Trigger 2: a draw_results row appearing means the winner was just selected
-- by run_jeetobaz_draw (unchanged). Purely observational bookkeeping.
create function public.mark_draw_session_winner_selected()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_session_id uuid;
begin
  update draw_sessions
  set state = 'winner_selected', state_updated_at = now()
  where product_id = new.product_id
  returning id into v_session_id;

  if v_session_id is null then
    insert into draw_sessions (product_id, state)
    values (new.product_id, 'winner_selected')
    returning id into v_session_id;
  end if;

  insert into draw_session_state_history (draw_session_id, state, changed_by)
  values (v_session_id, 'winner_selected', auth.uid());

  return new;
end;
$function$;

create trigger trg_draw_results_insert_sets_winner_selected
  after insert on public.draw_results
  for each row
  execute function public.mark_draw_session_winner_selected();

-- Trigger 3: prize marked delivered means the draw's full lifecycle is done.
create function public.mark_draw_session_completed()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_session_id uuid;
begin
  update draw_sessions
  set state = 'completed', state_updated_at = now()
  where product_id = new.product_id
  returning id into v_session_id;

  if v_session_id is not null then
    insert into draw_session_state_history (draw_session_id, state, changed_by)
    values (v_session_id, 'completed', auth.uid());
  end if;

  return new;
end;
$function$;

create trigger trg_draw_results_prize_delivered_sets_completed
  after update of prize_status on public.draw_results
  for each row
  when (new.prize_status = 'delivered' and old.prize_status is distinct from 'delivered')
  execute function public.mark_draw_session_completed();

-- Backfill: existing active products are already accepting entries.
with backfilled as (
  insert into public.draw_sessions (product_id, state)
  select id, 'waiting' from public.products where status = 'active'
  on conflict (product_id) do nothing
  returning id
)
insert into public.draw_session_state_history (draw_session_id, state, changed_by)
select id, 'waiting', null from backfilled;
