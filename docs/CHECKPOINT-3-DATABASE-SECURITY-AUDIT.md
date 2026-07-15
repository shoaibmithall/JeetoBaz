# Checkpoint 3: Database & Security Audit

> JeetoBaz2 — Read-only audit. Generated from 13 SQL files + 1 Edge Function.
> Status: IN PROGRESS (compilation in progress)

---

## 1. Complete Database Object Inventory

### 1.1 Tables (10 total)

| Table | Created in SQL file | RLS Enabled | Primary Key |
|-------|---------------------|-------------|-------------|
| `products` | (pre-existing) | ✅ Yes (`products-rls-setup.sql:48`) | `id uuid` |
| `users` | (pre-existing) | ✅ Yes (`security-advisor-safe-hardening.sql` via INSERT policy) | `id uuid` |
| `entries` | (pre-existing) | ✅ Yes (admin policy in `security-advisor-safe-hardening.sql:110`) | `id uuid` |
| `transactions` | (pre-existing) | ✅ Yes (admin policy in `security-advisor-safe-hardening.sql:94`) | `id uuid` |
| `notifications` | `notifications-setup.sql:1` | ❌ **UNVERIFIED** (no `ENABLE ROW LEVEL SECURITY` in repo) | `id uuid` |
| `draw_results` | `secure-draw-setup.sql:6` | ✅ Yes (`secure-draw-setup.sql:19`) | `id uuid` |
| `app_settings` | `home-ads-setup.sql:3` | ✅ Yes (`home-ads-setup.sql:9`) | `key text` |
| `referral_claims` | `referral-rewards-setup.sql:49` | ✅ Yes (`referral-rewards-setup.sql:88`) | `id uuid` |
| `referral_rewards` | `referral-rewards-setup.sql:59` | ✅ Yes (`referral-rewards-setup.sql:89`) | `id uuid` |
| `pg_stat_statements` | (system) | N/A | N/A |

### 1.2 Columns by Table

#### `products`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default gen_random_uuid() |
| `name` | text | NOT NULL |
| `description` | text | |
| `image_url` | text | |
| `entry_fee` | numeric | NOT NULL, default 1 |
| `max_entries` | integer | NOT NULL |
| `current_entries` | integer | default 0 |
| `status` | text | NOT NULL, default 'active' (CHECK: 'active', 'completed', 'cancelled') |
| `winner_phone` | text | |
| `created_at` | timestamptz | default now() |
| `updated_at` | timestamptz | |

#### `users`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `name` | text | NOT NULL |
| `phone` | text | UNIQUE, NOT NULL |
| `jazzcash_number` | text | |
| `cnic` | text | |
| `created_at` | timestamptz | default now() |
| `avatar_url` | text | (`profile-avatars-setup.sql:12`) |
| `referral_code` | text | unique index, default make_jeetobaz_referral_code() (`referral-rewards-setup.sql:9`) |
| `referral_device_token` | text | indexed (`referral-rewards-setup.sql:10`) |
| `referred_by` | uuid | FK → users(id) ON DELETE SET NULL (`referral-rewards-setup.sql:11`) |

#### `entries`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `product_id` | uuid | FK → products(id) |
| `phone` | text | NOT NULL |
| `name` | text | |
| `user_id` | uuid | FK → users(id) |
| `ticket_number` | text | |
| `transaction_id` | uuid | FK → transactions(id) |
| `created_at` | timestamptz | default now() |
| `entry_source` | text | NOT NULL, default 'payment' (`referral-rewards-setup.sql:14`) |
| `referral_reward_id` | uuid | FK → referral_rewards(id), unique index (`referral-rewards-setup.sql:15,79-86`) |

#### `transactions`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `product_id` | uuid | FK → products(id) |
| `phone` | text | NOT NULL |
| `user_id` | uuid | |
| `amount` | numeric | NOT NULL |
| `status` | text | NOT NULL, default 'pending' (CHECK: 'pending', 'approved', 'rejected', 'initiated', 'failed') |
| `jazzcash_txn_id` | text | |
| `created_at` | timestamptz | default now() |
| `payment_method` | text | (`payment-approval-setup.sql:4`) |
| `sender_name` | text | (`payment-approval-setup.sql:5`) |
| `sender_phone` | text | (`payment-approval-setup.sql:6`) |
| `user_name` | text | (`payment-approval-setup.sql:7`) |
| `receipt_path` | text | (`payment-approval-setup.sql:8`) |

#### `notifications`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default gen_random_uuid() |
| `title` | text | NOT NULL |
| `body` | text | NOT NULL |
| `target_phone` | text | NULL |
| `link` | text | NULL |
| `kind` | text | default 'general' |
| `created_at` | timestamptz | default now() |

#### `draw_results`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default gen_random_uuid() |
| `product_id` | uuid | UNIQUE, FK → products(id) ON DELETE RESTRICT |
| `winner_entry_id` | uuid | FK → entries(id) ON DELETE RESTRICT |
| `winner_user_id` | uuid | NULL |
| `winner_name` | text | NOT NULL |
| `winner_phone` | text | NOT NULL |
| `winner_ticket_number` | text | NOT NULL |
| `total_entries` | integer | NOT NULL, CHECK > 0 |
| `drawn_at` | timestamptz | default now() |
| `drawn_by` | uuid | FK → auth.users(id) ON DELETE RESTRICT |

#### `app_settings`
| Column | Type | Constraints |
|--------|------|-------------|
| `key` | text | PK |
| `value` | jsonb | NOT NULL, default 'null' |
| `updated_at` | timestamptz | default now() |

#### `referral_claims`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default gen_random_uuid() |
| `referrer_user_id` | uuid | FK → users(id) ON DELETE RESTRICT |
| `referred_user_id` | uuid | UNIQUE, FK → users(id) ON DELETE RESTRICT |
| `status` | text | NOT NULL, default 'qualified' (CHECK: 'pending', 'qualified', 'rejected', 'reversed') |
| `created_at` | timestamptz | default now() |
| `qualified_at` | timestamptz | |

#### `referral_rewards`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default gen_random_uuid() |
| `user_id` | uuid | FK → users(id) ON DELETE RESTRICT |
| `referral_claim_id` | uuid | FK → referral_claims(id) ON DELETE RESTRICT |
| `reward_kind` | text | NOT NULL, default 'rs1_entry' (CHECK: 'rs1_entry') |
| `status` | text | NOT NULL, default 'available' (CHECK: 'available', 'redeemed', 'expired', 'revoked') |
| `expires_at` | timestamptz | default now() + 30 days |
| `redeemed_product_id` | uuid | FK → products(id) ON DELETE RESTRICT |
| `redeemed_entry_id` | uuid | FK → entries(id) ON DELETE RESTRICT |
| `created_at` | timestamptz | default now() |
| `redeemed_at` | timestamptz | |
| UNIQUE | (user_id, referral_claim_id) | |

### 1.3 Indexes (20 total)

| Index | Table | Columns | Source File |
|-------|-------|---------|-------------|
| `products_status_created_at_idx` | products | (status, created_at desc) | `performance-indexes-safe.sql:11` |
| `products_created_at_idx` | products | (created_at desc) | `performance-indexes-safe.sql:15` |
| `entries_user_id_created_at_idx` | entries | (user_id, created_at desc) | `performance-indexes-safe.sql:19` |
| `entries_product_id_created_at_idx` | entries | (product_id, created_at desc) | `performance-indexes-safe.sql:23` |
| `transactions_pending_lookup_idx` | transactions | (product_id, phone, status) | `payment-rate-limit-setup.sql:1` |
| `transactions_phone_created_at_idx` | transactions | (phone, created_at desc) | `performance-indexes-safe.sql:29` |
| `transactions_status_created_at_idx` | transactions | (status, created_at desc) | `performance-indexes-safe.sql:33` |
| `draw_results_product_id_idx` | draw_results | (product_id) | `performance-indexes-safe.sql:38` |
| `users_created_at_idx` | users | (created_at desc) | `performance-indexes-safe.sql:42` |
| `users_phone_idx` | users | (phone) | `performance-indexes-safe.sql:46` |
| `users_referral_code_idx` | users | (referral_code) | `performance-indexes-safe.sql:49` |
| `users_referral_code_unique` | users | (upper(referral_code)) | `referral-rewards-setup.sql:42` |
| `users_referral_device_token_idx` | users | (referral_device_token) WHERE NOT NULL | `referral-rewards-setup.sql:45` |
| `entries_referral_reward_unique` | entries | (referral_reward_id) WHERE NOT NULL | `referral-rewards-setup.sql:84` |
| `notifications_created_at_idx` | notifications | (created_at desc) | `notifications-setup.sql:11` |
| `notifications_target_phone_idx` | notifications | (target_phone) | `notifications-setup.sql:14` |

### 1.4 RPC Functions (8 total)

| Function | Language | Security | Source File | Granted To |
|----------|----------|----------|-------------|------------|
| `run_jeetobaz_draw(uuid)` | plpgsql | SECURITY DEFINER | `secure-draw-setup.sql:39` | authenticated |
| `get_public_draw_result(uuid)` | sql | SECURITY DEFINER | `secure-draw-setup.sql:159` | anon, authenticated |
| `update_profile_avatar(text, text)` | plpgsql | SECURITY DEFINER | `profile-avatars-setup.sql:49` | anon, authenticated |
| `get_referral_dashboard(text, text)` | plpgsql | SECURITY DEFINER | `referral-rewards-setup.sql:94` | anon, authenticated |
| `claim_referral_code(text, text, text)` | plpgsql | SECURITY DEFINER | `referral-rewards-setup.sql:143` | anon, authenticated |
| `get_referral_eligible_products()` | sql | SECURITY DEFINER | `referral-rewards-setup.sql:232` | anon, authenticated |
| `redeem_referral_reward(text, text, uuid, uuid)` | plpgsql | SECURITY DEFINER | `referral-rewards-setup.sql:252` | anon, authenticated |
| `get_available_referral_rewards(text, text)` | sql | SECURITY DEFINER | `referral-rewards-setup.sql:374` | anon, authenticated |

**Internal functions (revoked from all roles):**
| Function | Source File |
|----------|-------------|
| `handle_new_user()` | `security-advisor-safe-hardening.sql:135` |
| `rls_auto_enable()` | `security-advisor-safe-hardening.sql:139` |

**Also present (non-RPC):**
| Function | Source File |
|----------|-------------|
| `make_jeetobaz_referral_code()` | `referral-rewards-setup.sql:17` (used as column default) |

### 1.5 Storage Buckets (4 total)

| Bucket | Public | Size Limit | MIME Types | Source File |
|--------|--------|------------|------------|-------------|
| `payment-receipts` | ❌ Private | 5MB | jpeg, png, webp | `secure-payment-receipts-setup.sql:6` |
| `profile-avatars` | ✅ Public | 3MB | jpeg, png, webp | `profile-avatars-setup.sql:15` |
| `winner-media` | ✅ Public | 5MB | jpeg, png, webp | `winner-media-setup.sql:5` |
| `home-ads` | ✅ Public | 10MB | jpeg, png, webp | `home-ads-setup.sql:33` |

### 1.6 RLS Policies by Table

#### `products` — 1 policy
| Policy | Operation | Role | Condition | Source |
|--------|-----------|------|-----------|--------|
| JeetoBaz admin manages products | ALL | authenticated | `auth.uid() = '65d46154...'` | `products-rls-setup.sql:38` |

**NOTE:** Also has pre-existing public read policies (confirmed by safety check in `products-rls-setup.sql:20-28`).

#### `users` — 1 policy
| Policy | Operation | Role | Condition | Source |
|--------|-----------|------|-----------|--------|
| JeetoBaz validated public user signup | INSERT | public | phone regex, name length, jazzcash_number regex, cnic regex, avatar_url regex | `security-advisor-safe-hardening.sql:20` |

#### `entries` — 1 policy
| Policy | Operation | Role | Condition | Source |
|--------|-----------|------|-----------|--------|
| JeetoBaz admin manages entries | ALL | authenticated | `auth.uid() = '65d46154...'` | `security-advisor-safe-hardening.sql:119` |

#### `transactions` — 2 policies
| Policy | Operation | Role | Condition | Source |
|--------|-----------|------|-----------|--------|
| JeetoBaz validated public payment submissions | INSERT | public | product_id, phone, amount, status, jazzcash_txn_id, receipt_path validated | `security-advisor-safe-hardening.sql:48` |
| JeetoBaz admin manages transactions | ALL | authenticated | `auth.uid() = '65d46154...'` | `security-advisor-safe-hardening.sql:94` |

#### `draw_results` — 1 policy
| Policy | Operation | Role | Condition | Source |
|--------|-----------|------|-----------|--------|
| JeetoBaz admin reads draw results | SELECT | authenticated | `auth.uid() = '65d46154...'` | `secure-draw-setup.sql:30` |

#### `app_settings` — 3 policies
| Policy | Operation | Role | Condition | Source |
|--------|-----------|------|-----------|--------|
| Public reads app settings | SELECT | anon, authenticated | `true` | `home-ads-setup.sql:12` |
| JeetoBaz admin inserts app settings | INSERT | authenticated | email = 'shoaibmithall@gmail.com' | `home-ads-setup.sql:18` |
| JeetoBaz admin updates app settings | UPDATE | authenticated | email = 'shoaibmithall@gmail.com' | `home-ads-setup.sql:25` |

#### `referral_claims` — 0 user-accessible policies
RLS enabled, all roles revoked (`referral-rewards-setup.sql:91`). Only SECURITY DEFINER functions access this table.

#### `referral_rewards` — 0 user-accessible policies
RLS enabled, all roles revoked (`referral-rewards-setup.sql:92`). Only SECURITY DEFINER functions access this table.

#### `notifications` — ❌ UNVERIFIED
No `ENABLE ROW LEVEL SECURITY` found in any repo SQL file. If enabled via Supabase dashboard, default PostgreSQL behavior applies (all rows visible to all roles).

#### Storage Policies (by bucket)

**payment-receipts:**
| Policy | Operation | Role | Condition |
|--------|-----------|------|-----------|
| payment_receipts_insert | INSERT | anon | bucket_id = 'payment-receipts' |
| JeetoBaz admin reads payment receipts | SELECT | authenticated | bucket + UUID check |
| JeetoBaz admin deletes payment receipts | DELETE | authenticated | bucket + UUID check |

**profile-avatars:**
| Policy | Operation | Role | Condition |
|--------|-----------|------|-----------|
| profile_avatars_public_read | SELECT | anon, authenticated | bucket_id = 'profile-avatars' |
| profile_avatars_public_insert | INSERT | anon, authenticated | bucket_id = 'profile-avatars' |

**winner-media:**
| Policy | Operation | Role | Condition |
|--------|-----------|------|-----------|
| JeetoBaz admin uploads winner media | INSERT | authenticated | bucket + UUID check |
| JeetoBaz admin updates winner media | UPDATE | authenticated | bucket + UUID check |
| JeetoBaz admin deletes winner media | DELETE | authenticated | bucket + UUID check |

**home-ads:**
| Policy | Operation | Role | Condition |
|--------|-----------|------|-----------|
| JeetoBaz admin uploads home ads | INSERT | authenticated | bucket + email check |
| JeetoBaz admin updates home ads | UPDATE | authenticated | bucket + email check |
| JeetoBaz admin deletes home ads | DELETE | authenticated | bucket + email check |

### 1.7 Foreign Keys (11 total)

| From Table | From Column | To Table | To Column | On Delete | Source |
|------------|-------------|----------|-----------|-----------|--------|
| `entries` | `product_id` | `products` | `id` | CASCADE (default) | pre-existing |
| `entries` | `user_id` | `users` | `id` | CASCADE (default) | pre-existing |
| `entries` | `transaction_id` | `transactions` | `id` | CASCADE (default) | pre-existing |
| `entries` | `referral_reward_id` | `referral_rewards` | `id` | RESTRICT | `referral-rewards-setup.sql:79` |
| `transactions` | `product_id` | `products` | `id` | CASCADE (default) | pre-existing |
| `draw_results` | `product_id` | `products` | `id` | RESTRICT | `secure-draw-setup.sql:8` |
| `draw_results` | `winner_entry_id` | `entries` | `id` | RESTRICT | `secure-draw-setup.sql:9` |
| `draw_results` | `drawn_by` | `auth.users` | `id` | RESTRICT | `secure-draw-setup.sql:16` |
| `users` | `referred_by` | `users` | `id` | SET NULL | `referral-rewards-setup.sql:11` |
| `referral_claims` | `referrer_user_id` | `users` | `id` | RESTRICT | `referral-rewards-setup.sql:51` |
| `referral_claims` | `referred_user_id` | `users` | `id` | RESTRICT | `referral-rewards-setup.sql:52` |
| `referral_rewards` | `user_id` | `users` | `id` | RESTRICT | `referral-rewards-setup.sql:61` |
| `referral_rewards` | `referral_claim_id` | `referral_claims` | `id` | RESTRICT | `referral-rewards-setup.sql:62` |
| `referral_rewards` | `redeemed_product_id` | `products` | `id` | RESTRICT | `referral-rewards-setup.sql:68` |
| `referral_rewards` | `redeemed_entry_id` | `entries` | `id` | RESTRICT | `referral-rewards-setup.sql:69` |

---

## 2. Security Analysis

### 2.1 Admin Authorization — Two Different Methods

| Method | Used In | Verification | Risk |
|--------|---------|--------------|------|
| UUID check: `auth.uid() = '65d46154...'` | products-rls, entries admin, transactions admin, draw_results read, all storage policies, run_jeetobaz_draw | Server-side, cryptographic | LOW — hardcoded but cannot be bypassed |
| Email check: `(auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com'` | app_settings INSERT/UPDATE, home-ads storage policies | Server-side, JWT claim | LOW — but depends on email not being changed |

**NOTE:** These two methods diverge. If admin email is ever changed, app_settings and home-ads policies break. All other admin checks use UUID and remain valid.

### 2.2 SECURITY DEFINER Function Risks

All 8 RPC functions use `SECURITY DEFINER`, meaning they run with the function owner's privileges (typically the `postgres` superuser). This bypasses RLS entirely.

**Mitigations present:**
- `run_jeetobaz_draw`: Explicit `auth.uid()` check at line 59 — only admin can call
- `get_public_draw_result`: Returns masked phone only (safe data exposure)
- `get_referral_dashboard`: Uses phone+device_token lookup (no auth.uid but phone-based identity)
- `claim_referral_code`: Uses phone+device_token, has 7 validation checks
- `redeem_referral_reward`: Uses phone+device_token, has 6 validation checks
- `get_referral_eligible_products`: Read-only, returns product data
- `get_available_referral_rewards`: Read-only, returns reward_id + expiry
- `update_profile_avatar`: Uses phone, validates avatar URL regex

**Risk:** All referral RPCs use phone as identity parameter, not `auth.uid()`. An attacker who knows another user's phone number can potentially call these functions. The device token provides some protection but is stored in plaintext AsyncStorage.

### 2.3 Storage Security

| Bucket | Upload Auth | Download Auth | Delete Auth | Orphan Risk |
|--------|------------|---------------|-------------|-------------|
| payment-receipts | anon (anyone) | admin UUID | admin UUID | ✅ YES — if transaction deleted, receipt stays |
| profile-avatars | anon/authenticated | public | NONE | ✅ YES — if user deleted, avatar stays |
| winner-media | admin UUID | public | admin UUID | LOW — admin manages |
| home-ads | admin email | public | admin email | LOW — admin manages |

### 2.4 Missing Security Controls

1. **No triggers defined in repo** — `handle_new_user()` exists (revoked) but no `CREATE TRIGGER` in any SQL file. May exist in Supabase dashboard.
2. **No CHECK constraints on transactions.status** — status can be set to any text value. CHECK constraint may exist in dashboard.
3. **No UNIQUE constraint on transactions for duplicate prevention** — the unique partial index is commented out in `payment-rate-limit-setup.sql:6-8`.
4. **No RLS on notifications** — UNVERIFIED. If RLS is disabled, any user can read all notifications (including admin-targeted ones) and potentially insert spam notifications.
5. **No phone format validation on referral RPCs** — phone is passed as plain text parameter. SQL functions accept any text for `requested_phone`.

---

## 3. Storage Bucket Policies — Complete Reference

*(Detailed in Section 1.6 above)*

---

## 4. Auth System Summary

### 4.1 User Authentication
- **Method:** Phone-based, NO Supabase Auth
- **Identity stored:** AsyncStorage `userPhone` (plaintext)
- **Signup:** INSERT into `users` table via RLS policy (security-advisor-safe-hardening.sql:20)
- **Session:** None — client reads AsyncStorage on each screen load
- **No password, no OTP, no tokens**

### 4.2 Admin Authentication
- **Method:** Supabase Auth `signInWithPassword` (email+password)
- **Session:** Supabase SDK manages via `getSession()` + `onAuthStateChange()`
- **Verification:** UUID comparison in RLS policies; email comparison in app_settings/home-ads policies

---

## 5. Hardcoded Values Inventory

### 5.1 UUID Occurrences (17)

| File | Line | Context |
|------|------|---------|
| `products-rls-setup.sql` | 11, 42, 43 | admin UUID in SELECT + USING + WITH CHECK |
| `secure-draw-setup.sql` | 34 | admin UUID in USING |
| `secure-draw-setup.sql` | 59 | admin UUID in PL/pgSQL IF check |
| `secure-payment-receipts-setup.sql` | 44, 53 | admin UUID in SELECT + DELETE policies |
| `winner-media-setup.sql` | 34, 51, 71 | admin UUID in INSERT + UPDATE USING + DELETE |
| `security-advisor-safe-hardening.sql` | 98, 99, 124, 125 | admin UUID in transactions + entries policies |
| `payment-approval-setup.sql` | 48, 57 | admin UUID in SELECT + DELETE policies |

### 5.2 Email Occurrences (10)

| File | Line | Context |
|------|------|---------|
| `products-rls-setup.sql` | 12 | SELECT check for admin email |
| `home-ads-setup.sql` | 23, 30, 31, 53, 63, 77 | app_settings INSERT/UPDATE + storage INSERT/UPDATE/DELETE |
| `src/app/admin.tsx` | 94 | signInWithPassword call |
| `src/app/draw.tsx` | — | (not present — uses getSession) |
| `src/app/winner.tsx` | — | (not present) |

---

*Checkpoint 3 Section 1 complete. Sections 2-5 follow.*
