-- Wrap auth.uid()/auth.jwt() calls in RLS policies with (select ...) so Postgres
-- evaluates them once per query (InitPlan) instead of once per row.
-- Fixes Supabase Performance Advisor's "Auth RLS Initialization Plan" warnings.
-- Pure query-plan optimization: policy logic/semantics are unchanged.

alter policy "JeetoBaz admin manages audit log" on public.admin_audit_log
  using ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  with check ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

alter policy "JeetoBaz admin inserts app settings" on public.app_settings
  with check (((select auth.jwt()) ->> 'email'::text) = 'shoaibmithall@gmail.com'::text);

alter policy "JeetoBaz admin updates app settings" on public.app_settings
  using (((select auth.jwt()) ->> 'email'::text) = 'shoaibmithall@gmail.com'::text)
  with check (((select auth.jwt()) ->> 'email'::text) = 'shoaibmithall@gmail.com'::text);

alter policy "JeetoBaz admin manages status history" on public.draw_result_status_history
  using ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  with check ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

alter policy "JeetoBaz admin reads draw results" on public.draw_results
  using ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

alter policy "JeetoBaz admin manages draw session history" on public.draw_session_state_history
  using ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  with check ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

alter policy "JeetoBaz admin manages draw sessions" on public.draw_sessions
  using ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  with check ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

alter policy "JeetoBaz admin manages entries" on public.entries
  using ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  with check ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

alter policy "Users can view own entries" on public.entries
  using (phone = ((select auth.jwt()) ->> 'phone'::text));

alter policy "Users read own or global notifications" on public.notifications
  using (
    (target_phone is null)
    or (target_phone = (select users.phone from users where users.auth_user_id = (select auth.uid())))
  );

alter policy "JeetoBaz admin manages products" on public.products
  using ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  with check ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

alter policy "JeetoBaz admin reads referral claims" on public.referral_claims
  using ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

alter policy "JeetoBaz admin reads referral rewards" on public.referral_rewards
  using ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

alter policy "JeetoBaz admin manages transactions" on public.transactions
  using ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  with check ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

alter policy "JeetoBaz validated public payment submissions" on public.transactions
  with check (
    (product_id is not null)
    and (phone ~ '^\+92[0-9]{10}$'::text)
    and ((amount >= 1) and (amount <= 1000000))
    and (coalesce(status, 'pending'::text) = 'pending'::text)
    and (jazzcash_txn_id is not null)
    and ((length(trim(both from jazzcash_txn_id)) >= 4) and (length(trim(both from jazzcash_txn_id)) <= 120))
    and (receipt_path is not null)
    and ((receipt_path like 'data:image/%'::text) or ((length(trim(both from receipt_path)) >= 4) and (length(trim(both from receipt_path)) <= 512)))
    and ((payment_method is null) or (payment_method = any (array['JazzCash'::text, 'Easypaisa'::text, 'NayaPay'::text, 'UPaisa'::text, 'SadaPay'::text, 'JS Bank / Zindigi App'::text, 'My ABL Allied Bank / Bank Transfer'::text])))
    and ((user_name is null) or ((length(trim(both from user_name)) >= 2) and (length(trim(both from user_name)) <= 80)))
    and ((sender_name is null) or ((length(trim(both from sender_name)) >= 2) and (length(trim(both from sender_name)) <= 80)))
    and ((sender_phone is null) or (sender_phone ~ '^\+92[0-9]{10}$'::text) or (sender_phone ~ '^03[0-9]{9}$'::text))
    and ((user_id is null) or (user_id = (select auth.uid())))
  );

alter policy "insert own transactions" on public.transactions
  with check (user_id = (select auth.uid()));

alter policy "own transactions only" on public.transactions
  using (user_id = (select auth.uid()));

alter policy "JeetoBaz admin reads profile details" on public.user_profile_details
  using ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

alter policy "Authenticated user reads own profile" on public.users
  using (auth_user_id = (select auth.uid()));

alter policy "JeetoBaz admin manages users" on public.users
  using ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  with check ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);

alter policy "User can update own profile" on public.users
  using (id = (select auth.uid()));

alter policy "user can view own profile" on public.users
  using (id = (select auth.uid()));

alter policy "JeetoBaz admin manages winner certificates" on public.winner_certificates
  using ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid)
  with check ((select auth.uid()) = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);
