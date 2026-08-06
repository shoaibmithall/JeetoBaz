-- Security Advisor cleanup: Postgres grants EXECUTE on every new function to the PUBLIC
-- pseudo-role by default unless explicitly revoked, and every real role (including `anon`) is
-- implicitly a member of PUBLIC for privilege purposes -- so `revoke ... from anon` alone is not
-- enough while the PUBLIC grant still stands. Every function below already checks auth.uid()
-- internally (against the admin's fixed uuid, or requiring a matching logged-in account) and
-- correctly rejects an anon caller today -- auth.uid() is NULL for anon, and
-- `NULL is distinct from <uuid>` is true, so the check already fires. This migration doesn't
-- change any legitimate behavior; it closes the attack surface anon calls represent (repeated
-- probing, future-bug risk if a check is ever edited carelessly) and matches the pattern already
-- used elsewhere in this schema for admin-only functions (see secure-draw-setup.sql's
-- `revoke ... from anon` on run_jeetobaz_draw, and profile-avatars-setup.sql's `revoke all ...
-- from public` on update_profile_avatar).

-- Admin-only (auth.uid() = the fixed JeetoBaz admin uuid).
revoke execute on function public.adjust_wallet_balance_atomic(text, integer, text, text) from public;
revoke execute on function public.approve_wallet_topup_request(uuid) from public;
revoke execute on function public.reject_wallet_topup_request(uuid, text) from public;
revoke execute on function public.topup_wallet_atomic(text, integer, text) from public;
revoke execute on function public.advance_draw_state(uuid, text) from public;
revoke execute on function public.update_prize_status(uuid, text, text) from public;
revoke execute on function public.update_winner_status(uuid, text, text) from public;

-- Requires a real logged-in account (auth.uid() is not null, or an owned row lookup keyed off
-- it) -- anon has no legitimate reason to call these; they always fail for anon today anyway.
revoke execute on function public.enter_draw_from_wallet_atomic(uuid, text, text) from public;
revoke execute on function public.delete_my_account() from public;
revoke execute on function public.update_notification_preferences(jsonb) from public;
revoke execute on function public.claim_referral_code(text, text) from public;
revoke execute on function public.get_referral_dashboard(text) from public;
revoke execute on function public.redeem_referral_reward(text, uuid, uuid) from public;

-- Trigger functions -- never meant to be called directly via RPC at all (they read `NEW`, which
-- only exists inside trigger execution). Postgres fires triggers using the table's trigger
-- definition, not per-invocation EXECUTE checks on the triggering role, so revoking EXECUTE here
-- from every role has zero effect on the triggers themselves -- it only removes the ability for a
-- client to call them directly via .rpc() and get a confusing "record NEW is not assigned" error.
revoke execute on function public.ensure_draw_session_waiting() from public, anon, authenticated;
revoke execute on function public.mark_draw_session_completed() from public, anon, authenticated;
revoke execute on function public.mark_draw_session_winner_selected() from public, anon, authenticated;
