# Checkpoint 3: Risk Register

> JeetoBaz2 — Database & Security Risk Assessment
> All risks rated: CRITICAL / HIGH / MEDIUM / LOW / INFO

---

## Risk Summary

| Severity | Count | IDs |
|----------|-------|-----|
| CRITICAL | 2 | R-001, R-002 |
| HIGH | 4 | R-003, R-004, R-005, R-006 |
| MEDIUM | 6 | R-007, R-008, R-009, R-010, R-011, R-012 |
| LOW | 4 | R-013, R-014, R-015, R-016 |
| INFO | 3 | R-017, R-018, R-019 |
| **Total** | **19** | |

---

## CRITICAL Risks

### R-001: User Identity Stored in Plaintext AsyncStorage
- **Severity:** CRITICAL
- **Component:** AsyncStorage `userPhone`, `userName`, `userAvatarUrl`
- **Evidence:** `login.tsx:117` — `setStoredValue('userPhone', fullPhone)`. No encryption, no secure enclave.
- **Impact:** Any app with storage access (device backup, rooted device, malware) can extract user phone numbers. On Android, adb backup or root access exposes all user data.
- **Affected Files:** `login.tsx` (lines 55-57, 89, 117-120, 150-151, 166, 230)
- **Exploitation:** Trivial on rooted/jailbroken devices. Moderate on standard devices via backup extraction.
- **Fix Required Before Launch:** Migrate to Supabase Auth (JWT session) + `expo-secure-store` for any remaining local data.
- **Dependencies:** Blocks Phase 3A auth migration.
- **Status:** KNOWN — documented in Checkpoint 1 (Phase 1 Audit).

### R-002: No Server-Side Duplicate Payment Protection for Manual Receipts
- **Severity:** CRITICAL
- **Component:** `transactions` table, manual payment flow
- **Evidence:** `payment-rate-limit-setup.sql:6-8` — unique partial index is COMMENTED OUT. Client-only check at `payment.tsx:224-230` (bypassable with direct API call). `security-advisor-safe-hardening.sql:48` — INSERT policy validates shape but NOT uniqueness.
- **Impact:** User can submit unlimited manual payment receipts for the same draw. Each could be approved by admin, creating duplicate entries and financial loss.
- **Affected Files:** `payment.tsx:224-230` (client check), `payment-rate-limit-setup.sql:6-8` (commented SQL)
- **Exploitation:** Direct Supabase REST API call with same product_id + phone + amount. No rate limit, no unique constraint.
- **Fix Required Before Launch:** Enable unique partial index (uncomment `payment-rate-limit-setup.sql:6-8`) OR add server-side check in RPC.
- **Dependencies:** Must run after confirming no existing duplicate pending rows.
- **Status:** KNOWN — documented in Checkpoint 2 Additional Verifications.

---

## HIGH Risks

### R-003: Non-Atomic Entry Count Increment
- **Severity:** HIGH
- **Component:** `admin.tsx:532` — `products.update({ current_entries: (current_entries || 0) + 1 })`
- **Evidence:** Client reads `current_entries`, increments locally, writes back. Two concurrent approvals for the same product could overwrite each other.
- **Impact:** `current_entries` could be lower than actual entries, allowing overfilling of draws.
- **Affected Files:** `admin.tsx:504-535`
- **Exploitation:** Two admin tabs approving simultaneously, or race condition between admin approval and referral RPC (`referral-rewards-setup.sql:360` uses atomic SQL).
- **Fix Required Before Launch:** Replace with atomic SQL: `current_entries = coalesce(current_entries, 0) + 1` via RPC or inline SQL update.
- **Dependencies:** None — can be fixed independently.
- **Status:** KNOWN — documented in Checkpoint 2 Additional Verifications.

### R-004: Admin Authorization Divergence (UUID vs Email)
- **Severity:** HIGH
- **Component:** Two different admin verification methods
- **Evidence:** Most policies use `auth.uid() = '65d46154...'` (UUID). `app_settings` policies and `home-ads` storage policies use `(auth.jwt() ->> 'email') = 'shoaibmithall@gmail.com'`.
- **Impact:** If admin email is ever changed in Supabase Auth, app_settings and home-ads policies break silently. Admin can still access products/entries/transactions but cannot manage ads or settings.
- **Affected Files:** `home-ads-setup.sql:23,30,53,63,77`, `products-rls-setup.sql:42`
- **Exploitation:** Not directly exploitable, but creates operational fragility.
- **Fix Required Before Launch:** Standardize all admin policies to use UUID. Change `home-ads-setup.sql` to use `auth.uid()` instead of email.
- **Dependencies:** None.
- **Status:** NEW — identified in Checkpoint 3 audit.

### R-005: Notifications Table — Unverified RLS Status
- **Severity:** HIGH
- **Component:** `notifications` table
- **Evidence:** `notifications-setup.sql` — creates table + indexes but NO `ENABLE ROW LEVEL SECURITY`. No RLS policy defined in any SQL file.
- **Impact:** If RLS is disabled (default), ANY user can: (1) read all notifications including admin-targeted ones, (2) insert spam notifications, (3) delete notifications.
- **Affected Files:** `notifications-setup.sql`, `notifications.ts:13` (INSERT without auth), `index.tsx:397` (SELECT without auth filter)
- **Exploitation:** Supabase REST API: `POST /rest/v1/notifications` with any data. No auth required.
- **Fix Required Before Launch:** Run `ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;` + create appropriate policies. Verify via `SELECT relrowsecurity FROM pg_class WHERE relname = 'notifications';`
- **Dependencies:** Must verify actual Supabase dashboard state.
- **Status:** KNOWN — documented in Checkpoint 2 Additional Verifications as UNVERIFIED.

### R-006: SECURITY DEFINER RPCs Accept Phone as Identity
- **Severity:** HIGH
- **Component:** All referral RPCs
- **Evidence:** `claim_referral_code(text, text, text)` — first param is `requested_phone`. `redeem_referral_reward(text, text, uuid, uuid)` — first param is `requested_phone`. No `auth.uid()` verification.
- **Impact:** Attacker who knows victim's phone number can: claim referral codes on their behalf, redeem their rewards, potentially access referral dashboard data.
- **Affected Files:** `referral-rewards-setup.sql:143-229,252-372`
- **Exploitation:** Supabase REST API call with victim's phone number + attacker's device token. Device token check provides some protection but is stored in plaintext AsyncStorage.
- **Fix Required Before Launch:** Migrate referral RPCs to use `auth.uid()` instead of phone. This depends on auth migration (Phase 3A).
- **Dependencies:** Blocks on auth migration completion.
- **Status:** NEW — identified in Checkpoint 3 audit.

---

## MEDIUM Risks

### R-007: Storage Orphan Files — No Automated Cleanup
- **Severity:** MEDIUM
- **Component:** All 4 storage buckets
- **Evidence:** No cron jobs, no background tasks, no Edge Functions that clean up orphaned files.
  - `payment-receipts`: Files remain after approval (admin removes manually at `admin.tsx:451`)
  - `profile-avatars`: Old avatars not deleted when new one uploaded
  - `winner-media`: No orphan risk (admin-managed)
  - `home-ads`: No orphan risk (admin-managed)
- **Impact:** Storage costs grow unbounded. Payment receipts accumulate (one per failed attempt). Profile avatars create duplicates on re-upload.
- **Affected Files:** `login.tsx:207` (upsert: true but old file stays), `payment.tsx:129` (new receipt per attempt)
- **Fix Required Before Launch:** Add cleanup logic or scheduled Edge Function.
- **Dependencies:** None.
- **Status:** KNOWN — documented in Checkpoint 2 Verifications.

### R-008: Client-Side Rate Limiting — Bypassable
- **Severity:** MEDIUM
- **Component:** `rate-limit.ts` — `paymentSubmitAt:{productId}:{phone}`
- **Evidence:** AsyncStorage-only. Clears on app reinstall, device change, or direct API call.
- **Impact:** User can bypass 60-second cooldown to submit rapid duplicate payments. Combined with R-002, this amplifies duplicate payment risk.
- **Affected Files:** `rate-limit.ts:11,21`, `payment.tsx:166,247`
- **Fix Required Before Launch:** Add server-side rate limiting via RPC or Edge Function.
- **Dependencies:** Independent of auth migration.
- **Status:** KNOWN — documented in Checkpoint 2 Verifications.

### R-009: No CHECK Constraint on `transactions.status`
- **Severity:** MEDIUM
- **Component:** `transactions` table
- **Evidence:** `security-advisor-safe-hardening.sql:56` validates `coalesce(status, 'pending') = 'pending'` on INSERT, but no CHECK constraint on column itself. Edge Function sets `status: 'initiated'` or `status: 'failed'`.
- **Impact:** Direct API call could set status to arbitrary string (e.g., 'approved'), bypassing admin approval.
- **Affected Files:** `security-advisor-safe-hardening.sql:56`, `jazzcash-payment/index.ts:153`
- **Fix Required Before Launch:** Add CHECK constraint: `ALTER TABLE transactions ADD CONSTRAINT transactions_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'initiated', 'failed'));`
- **Dependencies:** None.
- **Status:** NEW — identified in Checkpoint 3 audit.

### R-010: Missing `handle_new_user()` Trigger Definition
- **Severity:** MEDIUM
- **Component:** `users` table trigger
- **Evidence:** `security-advisor-safe-hardening.sql:135` revokes public access from `handle_new_user()`, but NO `CREATE TRIGGER` statement in any repo SQL file. The function exists in the database (revoked) but trigger may or may not be attached.
- **Impact:** If trigger is missing, new user signup via RLS INSERT may not create associated records (entries, referral codes). If trigger exists but is not in repo, it's undocumented.
- **Affected Files:** `security-advisor-safe-hardening.sql:135-137`
- **Fix Required Before Launch:** Verify trigger existence: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';` Document or recreate as needed.
- **Dependencies:** None.
- **Status:** NEW — identified in Checkpoint 3 audit.

### R-011: Phone Number Passed as Plain Text in RPCs
- **Severity:** MEDIUM
- **Component:** All referral RPCs + `update_profile_avatar`
- **Evidence:** Phone numbers transmitted as plain text parameters over HTTPS. No additional encryption at application layer.
- **Impact:** Phone numbers visible in Supabase logs, Edge Function logs, and network monitoring (though HTTPS protects in transit).
- **Affected Files:** `referral-rewards-setup.sql` (all RPCs), `profile-avatars-setup.sql:49`
- **Fix Required Before Launch:** Low priority — HTTPS provides transit security. Consider masking in logs.
- **Dependencies:** None.
- **Status:** INFO — acceptable with HTTPS.

### R-012: Unique Partial Index for Duplicate Payments Commented Out
- **Severity:** MEDIUM
- **Component:** `payment-rate-limit-setup.sql:6-8`
- **Evidence:** The strongest duplicate protection (database-level unique constraint) is commented out with note "Run this only after confirming there are no duplicate pending rows."
- **Impact:** Without this constraint, duplicate pending transactions can exist. Admin must manually detect duplicates.
- **Affected Files:** `payment-rate-limit-setup.sql:6-8`
- **Fix Required Before Launch:** Audit for existing duplicates, then uncomment and run.
- **Dependencies:** Must run deduplication query first.
- **Status:** KNOWN — documented in Checkpoint 2 Additional Verifications.

---

## LOW Risks

### R-013: `profile-avatars` Public Insert — Any User Can Upload
- **Severity:** LOW
- **Component:** `profile-avatars` storage bucket
- **Evidence:** `profile-avatars-setup.sql:42-47` — INSERT policy allows `anon, authenticated` with only bucket check.
- **Impact:** Anyone can upload files to profile-avatars bucket. Storage abuse possible. No file name validation (could upload non-image files if MIME check is bypassable).
- **Affected Files:** `profile-avatars-setup.sql:42-47`
- **Fix Required Before Launch:** Restrict to authenticated users only. Add file name validation.
- **Dependencies:** Auth migration (Phase 3A) would naturally fix this.
- **Status:** NEW — identified in Checkpoint 3 audit.

### R-014: `payment-receipts` Public Insert — Anonymous Upload
- **Severity:** LOW
- **Component:** `payment-receipts` storage bucket
- **Evidence:** `secure-payment-receipts-setup.sql:32-36` — INSERT policy allows `anon` role.
- **Impact:** Unauthenticated users can upload files. Could be abused for storage consumption.
- **Affected Files:** `secure-payment-receipts-setup.sql:32-36`, `payment-approval-setup.sql:36-40`
- **Fix Required Before Launch:** Consider requiring authentication for receipt upload.
- **Dependencies:** Auth migration would fix this.
- **Status:** KNOWN — design choice for anonymous payment submission.

### R-015: `referral_claims` and `referral_rewards` — All Roles Revoked but RLS Enabled
- **Severity:** LOW
- **Component:** referral_claims, referral_rewards tables
- **Evidence:** `referral-rewards-setup.sql:91-92` — `REVOKE ALL` from anon, authenticated. RLS enabled. Only SECURITY DEFINER functions can access.
- **Impact:** If a SECURITY DEFINER function has a vulnerability, attacker could access these tables. However, the current functions are well-validated.
- **Affected Files:** `referral-rewards-setup.sql:88-92`
- **Fix Required Before Launch:** Acceptable. Monitor for function vulnerabilities.
- **Dependencies:** None.
- **Status:** INFO — by design.

### R-016: `get_public_draw_result` Returns Masked Phone
- **Severity:** LOW
- **Component:** `secure-draw-setup.sql:174`
- **Evidence:** Returns `left(phone, 7) || '****' || right(phone, 4)` — reveals first 7 and last 4 digits.
- **Impact:** Partial phone number exposure. For Pakistani numbers (+923XXXXXXXXX), this reveals the first 4 digits after country code (carrier + region).
- **Affected Files:** `secure-draw-setup.sql:174`
- **Fix Required Before Launch:** Acceptable for public winner display. Consider reducing to last 2 digits.
- **Dependencies:** None.
- **Status:** INFO — business requirement for winner verification.

---

## INFO Risks

### R-017: Dead Firebase Code
- **Severity:** INFO
- **Component:** `src/firebase.ts`
- **Evidence:** Firebase is initialized but no file imports it. Dead code.
- **Impact:** No runtime impact. Adds ~2KB to bundle.
- **Fix:** Remove file and Firebase dependencies from package.json.
- **Status:** KNOWN.

### R-018: Module-Level State in `i18n.ts`
- **Severity:** INFO
- **Component:** `src/lib/i18n.ts`
- **Evidence:** Language preference stored in module-level variables, not persisted to AsyncStorage.
- **Impact:** Language resets on app restart. Minor UX issue.
- **Fix:** Persist to AsyncStorage like theme does.
- **Status:** KNOWN.

### R-019: `app_settings` Upsert Without Authentication
- **Severity:** INFO
- **Component:** `src/lib/app-settings.ts:30`
- **Evidence:** `saveHomeAdImages()` uses `upsert()` which may bypass RLS INSERT policy if called from anon context.
- **Impact:** Low — only admin.tsx calls this function, and admin.tsx requires authentication.
- **Fix:** Verify RLS policies enforce auth for writes.
- **Status:** INFO — admin-only code path.

---

## Production-Safe Areas (No Changes Needed)

1. **`get_public_draw_result` RPC** — SECURITY DEFINER, returns masked data, granted to all roles
2. **`run_jeetobaz_draw` RPC** — SECURITY DEFINER, explicit admin check, atomic operations
3. **JazzCash Edge Function** — HMAC-SHA256 verification, constant-time comparison, server-side only
4. **`payment-receipts` storage** — Private bucket, admin-only read/delete
5. **`winner-media` storage** — Admin-only upload/update/delete
6. **Performance indexes** — Additive only, no data modification
7. **Referral system core logic** — Well-validated with 7 checks in claim_referral_code, 6 in redeem_referral_reward

---

## Required Fixes Before Launch (Priority Order)

| Priority | Risk ID | Fix | Effort |
|----------|---------|-----|--------|
| P0 | R-001 | Migrate user auth to Supabase Auth | Large (Phase 3A) |
| P0 | R-002 | Enable unique partial index for payments | Small (1 SQL statement) |
| P1 | R-003 | Atomic current_entries increment | Small (1 RPC or SQL change) |
| P1 | R-004 | Standardize admin UUID in all policies | Small (1 SQL migration) |
| P1 | R-005 | Enable RLS on notifications table | Small (1 SQL statement + policies) |
| P1 | R-009 | Add CHECK constraint on transactions.status | Small (1 SQL statement) |
| P2 | R-006 | Migrate referral RPCs to auth.uid() | Medium (depends on P0) |
| P2 | R-008 | Add server-side rate limiting | Medium |
| P2 | R-012 | Enable unique partial index (after dedup) | Small |
| P3 | R-007 | Storage cleanup mechanism | Medium |
| P3 | R-010 | Verify/create handle_new_user trigger | Small |
| P3 | R-013 | Restrict profile-avatars upload to auth | Small |

---

*Checkpoint 3 Risk Register complete.*
