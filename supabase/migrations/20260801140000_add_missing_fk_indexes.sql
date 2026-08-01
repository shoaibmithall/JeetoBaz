-- Purely additive: covering indexes for foreign keys the performance
-- advisor flagged as unindexed. No behavior change, just faster joins/
-- lookups as these tables grow past the 100-row test scale.
-- Applied directly to production first; this records it.
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_draw_results_winner_entry_id on public.draw_results(winner_entry_id);
create index if not exists idx_draw_results_drawn_by on public.draw_results(drawn_by);
create index if not exists idx_users_referred_by on public.users(referred_by);
create index if not exists idx_referral_claims_referrer_user_id on public.referral_claims(referrer_user_id);
create index if not exists idx_referral_rewards_referral_claim_id on public.referral_rewards(referral_claim_id);
create index if not exists idx_referral_rewards_redeemed_product_id on public.referral_rewards(redeemed_product_id);
create index if not exists idx_referral_rewards_redeemed_entry_id on public.referral_rewards(redeemed_entry_id);
create index if not exists idx_draw_result_status_history_draw_result_id on public.draw_result_status_history(draw_result_id);
create index if not exists idx_winner_certificates_draw_result_id on public.winner_certificates(draw_result_id);
create index if not exists idx_winner_certificates_winner_user_id on public.winner_certificates(winner_user_id);
create index if not exists idx_draw_session_state_history_draw_session_id on public.draw_session_state_history(draw_session_id);
