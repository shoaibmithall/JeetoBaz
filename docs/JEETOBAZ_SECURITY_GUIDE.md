# JeetoBaz Security Guide

> Complete security reference. Last updated: 2026-07-15.

---

## 1. Authentication

### 1.1 User Authentication
- **Method:** Phone-based, NO Supabase Auth for users
- **Identity stored:** AsyncStorage `userPhone` (plaintext)
- **Signup:** INSERT into `users` table via RLS INSERT policy
- **Session:** None — client reads AsyncStorage on each screen load
- **No password, no OTP, no tokens for users**
- **Source:** `src/app/login.tsx`

### 1.2 Admin Authentication
- **Method:** Supabase Auth `signInWithPassword` (email+password)
- **Email:** shoaibmithall@gmail.com
- **Session:** Supabase SDK manages via `getSession()` + `onAuthStateChange()`
- **Verification:** UUID comparison in most RLS policies; email comparison in app_settings/home-ads policies
- **Source:** `src/app/admin.tsx:94`

### 1.3 Identity Sources
| Source | Used For | Trust Level |
|--------|----------|-------------|
| AsyncStorage `userPhone` | Client-side duplicate checks, UI display | LOW (client-controlled) |
| `users.phone` column | RLS policies, RPC parameters, server-side checks | HIGH (server-controlled) |
| `auth.uid()` | Admin authorization in RLS policies | HIGH (cryptographic) |
| `auth.jwt() ->> 'email'` | Admin authorization in app_settings/home-ads | HIGH (JWT claim) |

---

## 2. Authorization (RLS Policies)

### 2.1 Admin Authorization
Two methods are used:

**Method 1 — UUID Check (most policies):**
```sql
auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid
```
Used in: products, entries, transactions, draw_results, storage policies for payment-receipts and winner-media.

**Method 2 — Email Check (app_settings/home-ads):**
```sql
(auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com'
```
Used in: app_settings INSERT/UPDATE, home-ads storage policies.

**Risk:** If admin email changes, Method 2 policies break silently. Method 1 remains valid.

### 2.2 User Authorization
- **Signup:** Any user can INSERT into `users` (validated format)
- **Payment submission:** Any user can INSERT into `transactions` (validated shape)
- **Entries:** Created by admin approval or referral RPC (no direct user INSERT)
- **Profile update:** Only `avatar_url` via `update_profile_avatar` RPC

### 2.3 SECURITY DEFINER Functions
All 8 RPCs use SECURITY DEFINER (run with function owner privileges, bypass RLS):
- `run_jeetobaz_draw` — admin check via auth.uid()
- `get_public_draw_result` — returns masked data only
- `update_profile_avatar` — phone + URL validation
- `get_referral_dashboard` — phone + device token
- `claim_referral_code` — phone + device token + 7 validation checks
- `get_referral_eligible_products` — read-only
- `redeem_referral_reward` — phone + device token + 6 validation checks
- `get_available_referral_rewards` — phone + device token

---

## 3. Payments

### 3.1 Manual Receipt Flow
```
User → payment-receipts.upload (anon) → transactions.insert (validated)
      → Admin reviews → transactions.update (approved) → entries.insert
```
- **Client-side:** Duplicate check via `payment.tsx:224-230` (bypassable)
- **Server-side:** INSERT RLS validates shape but NOT uniqueness
- **Missing:** UNIQUE partial index (commented out in `payment-rate-limit-setup.sql:6-8`)

### 3.2 JazzCash Online Flow
```
User → jazzcash-redirect.tsx → Edge Function GET
      → Edge Function creates transaction (status: initiated)
      → JazzCash processes → Edge Function POST (IPN callback)
      → HMAC-SHA256 verification → status: pending or failed
      → Redirect to payment-response.tsx
```
- **Security:** HMAC-SHA256 with constant-time comparison
- **Server-side:** Transaction status verified via signed hash
- **Weakness:** `payment-response.tsx` displays client-trusted status (no server re-verification)

### 3.3 Payment Security Comparison
| Aspect | Manual Receipt | JazzCash Online |
|--------|---------------|-----------------|
| Server verification | ❌ None | ✅ HMAC-SHA256 |
| Duplicate protection | ⚠️ Client-only | ✅ Server checks |
| Status trust | Client-trusted | Server-verified |
| Admin approval required | ✅ Yes | ✅ Yes |

---

## 4. Storage Security

| Bucket | Upload | Download | Delete | Risk |
|--------|--------|----------|--------|------|
| payment-receipts | anon | admin UUID | admin UUID | Anonymous upload, no MIME at policy level |
| profile-avatars | anon/auth | public | NONE | No delete policy, orphan risk |
| winner-media | admin UUID | public | admin UUID | Low risk |
| home-ads | admin email | public | admin email | Email-based auth |

---

## 5. Supabase

### 5.1 Project Configuration
- **Project ID:** jqjrfnhqqfymwfsdkwmv
- **URL:** https://jqjrfnhqqfymwfsdkwmv.supabase.co
- **Anon Key:** Hardcoded in `src/lib/supabase.ts`
- **Service Role Key:** Stored in Edge Function secrets (never in client code)

### 5.2 Security Features Used
- Row Level Security (RLS) on 8 tables
- SECURITY DEFINER functions for sensitive operations
- Storage bucket policies
- Edge Function for server-side JazzCash verification

### 5.3 Security Features NOT Used
- Supabase Auth for users (only for admin)
- Supabase Edge Functions for business logic (only for JazzCash IPN)
- Supabase Realtime
- Supabase Cron Jobs

---

## 6. JazzCash

### 6.1 Sandbox Configuration
- **URL:** `sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/`
- **Secrets:** JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, JAZZCASH_INTEGRITY_SALT
- **Response URL:** `https://jeetobaz.pk/payment-response`

### 6.2 Security Controls
- HMAC-SHA256 integrity hash
- Constant-time comparison (`safeEqual` function)
- Amount verification (server-computed vs. client-provided)
- Transaction status check (only 'initiated' transactions are updated)

### 6.3 Known Limitations
- Sandbox mode (not production)
- No webhook retry mechanism
- Edge Function error → transaction stuck in 'initiated' status

---

## 7. Firebase

- **Status:** Initialized in `src/firebase.ts` but NOT imported anywhere
- **Impact:** Dead code, no security implications
- **Action:** Can be safely removed

---

## 8. Known Risks (from Checkpoint 3 Audit)

| Risk ID | Severity | Description | Fix |
|---------|----------|-------------|-----|
| R-001 | HIGH | User identity in AsyncStorage | Phase 3A auth migration |
| R-002 | HIGH | No server-side duplicate payment protection | Enable unique partial index |
| R-003 | HIGH | Non-atomic current_entries increment | Atomic SQL update |
| R-004 | HIGH | Admin auth divergence (UUID vs email) | Standardize to UUID |
| R-005 | HIGH | Notifications RLS unverified | Verify + enable RLS |
| R-006 | HIGH | Referral RPCs use phone as identity | Migrate to auth.uid() |
| R-007 | MEDIUM | Storage orphan files | Cleanup mechanism |
| R-008 | MEDIUM | Client-side rate limiting bypassable | Server-side rate limiting |
| R-009 | MEDIUM | No CHECK constraint on transactions.status | Add CHECK constraint |
| R-010 | MEDIUM | Missing handle_new_user() trigger verification | Verify trigger |
| R-011 | MEDIUM | Phone numbers in RPC parameters | Migrate to auth.uid() |
| R-013 | LOW | profile-avatars public insert | Restrict to auth |
| R-014 | LOW | payment-receipts anonymous insert | Restrict to auth |

---

## 9. Security Roadmap

| Priority | Action | Depends On |
|----------|--------|------------|
| P0 | Migrate user auth to Supabase Auth | None |
| P0 | Enable unique partial index for payments | Dedup verification |
| P1 | Atomic current_entries increment | None |
| P1 | Standardize admin UUID in all policies | None |
| P1 | Enable RLS on notifications | Verify dashboard state |
| P1 | Add CHECK constraint on transactions.status | None |
| P2 | Migrate referral RPCs to auth.uid() | P0 complete |
| P2 | Server-side rate limiting | None |
| P3 | Storage cleanup mechanism | None |

---

*Security guide complete.*
