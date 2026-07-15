# JeetoBaz Database Guide

> Complete database reference. Last updated: 2026-07-15.
> Supabase Project: `jqjrfnhqqfymwfsdkwmv`

---

## 1. Tables

### 1.1 `products`
**Purpose:** Stores lucky draw products/prizes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default gen_random_uuid() | Product identifier |
| `name` | text | NOT NULL | Product name |
| `description` | text | — | Product description |
| `image_url` | text | — | Product image URL |
| `entry_fee` | numeric | NOT NULL, default 1 | Entry fee in PKR |
| `max_entries` | integer | NOT NULL | Maximum allowed entries |
| `current_entries` | integer | default 0 | Current entry count |
| `status` | text | NOT NULL, default 'active' | 'active', 'completed', or 'cancelled' |
| `winner_phone` | text | — | Winner phone (set after draw) |
| `created_at` | timestamptz | default now() | Creation timestamp |
| `updated_at` | timestamptz | — | Last update timestamp |

**RLS:** Enabled. Public read. Admin ALL (UUID check).

---

### 1.2 `users`
**Purpose:** Registered user accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | User identifier |
| `name` | text | NOT NULL | Display name |
| `phone` | text | UNIQUE, NOT NULL | Pakistani phone (+92XXXXXXXXXX) |
| `jazzcash_number` | text | — | JazzCash account number |
| `cnic` | text | — | National ID (13 digits) |
| `created_at` | timestamptz | default now() | Registration timestamp |
| `avatar_url` | text | — | Profile photo URL |
| `referral_code` | text | unique index, default auto-generated | JB-XXXXXXXX format |
| `referral_device_token` | text | indexed | Device identifier for anti-fraud |
| `referred_by` | uuid | FK → users(id) ON DELETE SET NULL | Who referred this user |

**RLS:** Enabled. INSERT only (validated phone/name format). No SELECT/UPDATE/DELETE policies in repo.

---

### 1.3 `entries`
**Purpose:** User entries into draws (one per user per draw).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Entry identifier |
| `product_id` | uuid | FK → products(id) | Which draw |
| `phone` | text | NOT NULL | User phone |
| `name` | text | — | User name |
| `user_id` | uuid | FK → users(id) | User reference |
| `ticket_number` | text | — | Generated ticket (JB-XXXXXXXX) |
| `transaction_id` | uuid | FK → transactions(id) | Linked payment |
| `created_at` | timestamptz | default now() | Entry timestamp |
| `entry_source` | text | NOT NULL, default 'payment' | 'payment', 'referral_referrer', 'referral_welcome' |
| `referral_reward_id` | uuid | FK → referral_rewards(id), unique index | Linked referral reward |

**RLS:** Enabled. Admin ALL (UUID check). Referral RPCs insert via SECURITY DEFINER.

---

### 1.4 `transactions`
**Purpose:** Payment transaction records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Transaction identifier |
| `product_id` | uuid | FK → products(id) | Which draw |
| `phone` | text | NOT NULL | Payer phone |
| `user_id` | uuid | — | Payer user ID |
| `amount` | numeric | NOT NULL | Amount in PKR |
| `status` | text | NOT NULL, default 'pending' | 'pending', 'approved', 'rejected', 'initiated', 'failed' |
| `jazzcash_txn_id` | text | — | JazzCash transaction reference |
| `created_at` | timestamptz | default now() | Creation timestamp |
| `payment_method` | text | — | 'JazzCash', 'Easypaisa', 'My ABL Allied Bank / Bank Transfer', 'JazzCash Online' |
| `sender_name` | text | — | Payment sender name |
| `sender_phone` | text | — | Sender phone |
| `user_name` | text | — | User display name |
| `receipt_path` | text | — | Storage path for receipt image |

**RLS:** Enabled. INSERT (validated shape). Admin ALL (UUID check).

---

### 1.5 `notifications`
**Purpose:** In-app notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default gen_random_uuid() | Notification identifier |
| `title` | text | NOT NULL | Notification title |
| `body` | text | NOT NULL | Notification body |
| `target_phone` | text | NULL | Target user phone (NULL = broadcast) |
| `link` | text | NULL | Deep link |
| `kind` | text | default 'general' | Notification category |
| `created_at` | timestamptz | default now() | Creation timestamp |

**RLS:** UNVERIFIED — no `ENABLE ROW LEVEL SECURITY` in repo SQL files.

---

### 1.6 `draw_results`
**Purpose:** Completed draw results with winner information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default gen_random_uuid() | Result identifier |
| `product_id` | uuid | UNIQUE, FK → products(id) ON DELETE RESTRICT | Which draw |
| `winner_entry_id` | uuid | FK → entries(id) ON DELETE RESTRICT | Winning entry |
| `winner_user_id` | uuid | NULL | Winner user ID |
| `winner_name` | text | NOT NULL | Winner display name |
| `winner_phone` | text | NOT NULL | Winner phone |
| `winner_ticket_number` | text | NOT NULL | Winning ticket |
| `total_entries` | integer | NOT NULL, CHECK > 0 | Total entries in draw |
| `drawn_at` | timestamptz | default now() | Draw timestamp |
| `drawn_by` | uuid | FK → auth.users(id) ON DELETE RESTRICT | Admin who ran draw |

**RLS:** Enabled. Admin SELECT only (UUID check).

---

### 1.7 `app_settings`
**Purpose:** Application configuration (key-value store).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | text | PK | Setting key |
| `value` | jsonb | NOT NULL, default 'null' | Setting value |
| `updated_at` | timestamptz | default now() | Last update |

**RLS:** Enabled. Public read. Admin INSERT/UPDATE (email check).

**Known keys:** `home_ad_images` (JSON array of image URLs)

---

### 1.8 `referral_claims`
**Purpose:** Records when a user claims another user's referral code.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Claim identifier |
| `referrer_user_id` | uuid | FK → users(id) ON DELETE RESTRICT | Who owns the referral code |
| `referred_user_id` | uuid | UNIQUE, FK → users(id) ON DELETE RESTRICT | Who claimed the code |
| `status` | text | NOT NULL, default 'qualified' | 'pending', 'qualified', 'rejected', 'reversed' |
| `created_at` | timestamptz | default now() | Creation timestamp |
| `qualified_at` | timestamptz | — | When qualified |

**RLS:** Enabled. All roles revoked. Only SECURITY DEFINER functions access.

---

### 1.9 `referral_rewards`
**Purpose:** Rewards earned from referral claims (Rs.1 entry credits).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Reward identifier |
| `user_id` | uuid | FK → users(id) ON DELETE RESTRICT | Reward owner |
| `referral_claim_id` | uuid | FK → referral_claims(id) ON DELETE RESTRICT | Linked claim |
| `reward_kind` | text | NOT NULL, default 'rs1_entry' | Only 'rs1_entry' currently |
| `status` | text | NOT NULL, default 'available' | 'available', 'redeemed', 'expired', 'revoked' |
| `expires_at` | timestamptz | default now() + 30 days | Expiry date |
| `redeemed_product_id` | uuid | FK → products(id) ON DELETE RESTRICT | Used on which product |
| `redeemed_entry_id` | uuid | FK → entries(id) ON DELETE RESTRICT | Created entry |
| `created_at` | timestamptz | default now() | Creation timestamp |
| `redeemed_at` | timestamptz | — | Redemption timestamp |
| UNIQUE | (user_id, referral_claim_id) | — | One reward per claim per user |

**RLS:** Enabled. All roles revoked. Only SECURITY DEFINER functions access.

---

## 2. Foreign Keys (15 total)

| From | Column | To | On Delete |
|------|--------|----|-----------|
| entries | product_id | products.id | CASCADE |
| entries | user_id | users.id | CASCADE |
| entries | transaction_id | transactions.id | CASCADE |
| entries | referral_reward_id | referral_rewards.id | RESTRICT |
| transactions | product_id | products.id | CASCADE |
| draw_results | product_id | products.id | RESTRICT |
| draw_results | winner_entry_id | entries.id | RESTRICT |
| draw_results | drawn_by | auth.users.id | RESTRICT |
| users | referred_by | users.id | SET NULL |
| referral_claims | referrer_user_id | users.id | RESTRICT |
| referral_claims | referred_user_id | users.id | RESTRICT |
| referral_rewards | user_id | users.id | RESTRICT |
| referral_rewards | referral_claim_id | referral_claims.id | RESTRICT |
| referral_rewards | redeemed_product_id | products.id | RESTRICT |
| referral_rewards | redeemed_entry_id | entries.id | RESTRICT |

---

## 3. Indexes (16 total)

| Index | Table | Columns |
|-------|-------|---------|
| products_status_created_at_idx | products | (status, created_at desc) |
| products_created_at_idx | products | (created_at desc) |
| entries_user_id_created_at_idx | entries | (user_id, created_at desc) |
| entries_product_id_created_at_idx | entries | (product_id, created_at desc) |
| entries_referral_reward_unique | entries | (referral_reward_id) WHERE NOT NULL |
| transactions_pending_lookup_idx | transactions | (product_id, phone, status) |
| transactions_phone_created_at_idx | transactions | (phone, created_at desc) |
| transactions_status_created_at_idx | transactions | (status, created_at desc) |
| draw_results_product_id_idx | draw_results | (product_id) |
| users_created_at_idx | users | (created_at desc) |
| users_phone_idx | users | (phone) |
| users_referral_code_idx | users | (referral_code) |
| users_referral_code_unique | users | (upper(referral_code)) |
| users_referral_device_token_idx | users | (referral_device_token) WHERE NOT NULL |
| notifications_created_at_idx | notifications | (created_at desc) |
| notifications_target_phone_idx | notifications | (target_phone) |

---

## 4. RPC Functions (8 total)

### 4.1 `run_jeetobaz_draw(uuid)`
- **Purpose:** Execute a draw — select random winner, create draw_result, update product status
- **Security:** SECURITY DEFINER, admin UUID check
- **Params:** `requested_product_id uuid`
- **Returns:** result_id, winner_entry_id, winner_name, winner_phone, winner_ticket_number, total_entries, drawn_at
- **Grants:** authenticated only
- **Business Rules:** Only at 10PM PKT, entries must equal max_entries, no existing result
- **Source:** `secure-draw-setup.sql:39`

### 4.2 `get_public_draw_result(uuid)`
- **Purpose:** Public winner display with masked phone
- **Security:** SECURITY DEFINER, returns masked phone (first 7 + **** + last 4)
- **Params:** `requested_product_id uuid`
- **Returns:** winner_name, masked_phone, winner_ticket_number, total_entries, drawn_at
- **Grants:** anon, authenticated
- **Source:** `secure-draw-setup.sql:159`

### 4.3 `update_profile_avatar(text, text)`
- **Purpose:** Update user's avatar URL
- **Security:** SECURITY DEFINER, phone format validation, URL regex validation
- **Params:** `requested_phone text`, `requested_avatar_url text`
- **Returns:** boolean
- **Grants:** anon, authenticated
- **Source:** `profile-avatars-setup.sql:49`

### 4.4 `get_referral_dashboard(text, text)`
- **Purpose:** Get referral stats (code, counts)
- **Security:** SECURITY DEFINER, device token verification
- **Params:** `requested_phone text`, `requested_device_token text`
- **Returns:** referral_code, successful_referrals, available_rewards, redeemed_rewards
- **Grants:** anon, authenticated
- **Source:** `referral-rewards-setup.sql:94`

### 4.5 `claim_referral_code(text, text, text)`
- **Purpose:** Claim a referral code (creates claim + 2 rewards)
- **Security:** SECURITY DEFINER, 7 validation checks
- **Params:** `requested_phone`, `requested_code`, `requested_device_token`
- **Returns:** text message
- **Grants:** anon, authenticated
- **Business Rules:** No self-referral, no duplicate claims, 7-day limit, device uniqueness
- **Source:** `referral-rewards-setup.sql:143`

### 4.6 `get_referral_eligible_products()`
- **Purpose:** List active Rs.1 draws with referral slots available
- **Security:** SECURITY DEFINER, read-only
- **Params:** none
- **Returns:** Set of products
- **Grants:** anon, authenticated
- **Business Rules:** 10% cap on referral entries per draw
- **Source:** `referral-rewards-setup.sql:232`

### 4.7 `redeem_referral_reward(text, text, uuid, uuid)`
- **Purpose:** Redeem a referral reward for a Rs.1 campaign entry
- **Security:** SECURITY DEFINER, 6 validation checks
- **Params:** `requested_phone`, `requested_device_token`, `requested_reward_id`, `requested_product_id`
- **Returns:** ticket number
- **Grants:** anon, authenticated
- **Business Rules:** Atomic entry creation + current_entries increment + reward status update
- **Source:** `referral-rewards-setup.sql:252`

### 4.8 `get_available_referral_rewards(text, text)`
- **Purpose:** List available (unexpired) referral rewards
- **Security:** SECURITY DEFINER
- **Params:** `requested_phone`, `requested_device_token`
- **Returns:** reward_id, expires_at
- **Grants:** anon, authenticated
- **Source:** `referral-rewards-setup.sql:374`

---

## 5. Storage Buckets (4 total)

| Bucket | Public | Size | MIME | Purpose |
|--------|--------|------|------|---------|
| payment-receipts | Private | 5MB | jpeg, png, webp | Manual payment receipts |
| profile-avatars | Public | 3MB | jpeg, png, webp | User profile photos |
| winner-media | Public | 5MB | jpeg, png, webp | Winner photos |
| home-ads | Public | 10MB | jpeg, png, webp | Home ad carousel images |

---

## 6. RLS Policies Summary

| Table | Policies | Notes |
|-------|----------|-------|
| products | 1 (admin ALL) + public read | Public can read, admin manages |
| users | 1 (INSERT validated) | No SELECT/UPDATE/DELETE in repo |
| entries | 1 (admin ALL) | Referral RPCs bypass via SECURITY DEFINER |
| transactions | 2 (INSERT validated + admin ALL) | Public can submit, admin approves |
| draw_results | 1 (admin SELECT) | Only admin can read |
| app_settings | 3 (public read + admin INSERT + admin UPDATE) | Email-based admin check |
| referral_claims | 0 user-accessible | All roles revoked, SECURITY DEFINER only |
| referral_rewards | 0 user-accessible | All roles revoked, SECURITY DEFINER only |
| notifications | UNVERIFIED | No ENABLE ROW LEVEL SECURITY in repo |

---

## 7. Edge Function

### `jazzcash-payment`
- **Runtime:** Deno
- **Endpoint:** `https://jqjrfnhqqfymwfsdkwmv.supabase.co/functions/v1/jazzcash-payment`
- **verify_jwt:** Must be `false` (for IPN callbacks)
- **Secrets Required:** JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, JAZZCASH_INTEGRITY_SALT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- **GET:** Initiates checkout (creates transaction, returns JazzCash form fields)
- **POST:** IPN callback (verifies HMAC-SHA256, updates transaction status)

---

*Database guide complete.*
