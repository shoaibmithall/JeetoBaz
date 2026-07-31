-- Live Draw Room Phase 3: enables Supabase Realtime (postgres_changes) on
-- the two tables the Draw Lobby needs to broadcast — draw_sessions (state
-- transitions) and products (entries count). The supabase_realtime
-- publication had no tables in it before this. Both tables already carry
-- public SELECT RLS policies (qual: true), so this doesn't expose anything
-- that wasn't already readable via the existing REST queries — it just
-- pushes the same rows instead of waiting for the next poll.
alter publication supabase_realtime add table public.draw_sessions;
alter publication supabase_realtime add table public.products;
