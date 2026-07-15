# JeetoBaz Auth Migration Plan

> Final planning document for Email + Password authentication migration.
> Status: READY FOR EXECUTION | Date: July 16, 2026
> Rule: DO NOT implement until this document is approved.

---

## 1. Identity-State Diagram

The system must handle three identity states simultaneously during migration:

```
┌─────────────────────────────────────────────────────────────┐
│                    IDENTITY STATES                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  STATE A: Legacy Phone User                                  │
│  ┌──────────────────────┐                                    │
│  │ auth_user_id: NULL   │                                    │
│  │ phone: +923XXXXXXXXX │ ← Primary identifier              │
│  │ session: AsyncStorage │ ← Plaintext phone                 │
│  │ auth: None            │                                    │
│  └──────────────────────┘                                    │
│                                                              │
│  STATE B: Migrated User (Transitional)                       │
│  ┌──────────────────────┐                                    │
│  │ auth_user_id: UUID   │ ← Links to auth.users             │
│  │ phone: +923XXXXXXXXX │ ← Preserved, not primary          │
│  │ session: Supabase Auth│ ← JWT token                      │
│  │ email: user@mail.com  │ ← Verified                       │
│  └──────────────────────┘                                    │
│                                                              │
│  STATE C: New Email User                                     │
│  ┌──────────────────────┐                                    │
│  │ auth_user_id: UUID   │ ← Links to auth.users             │
│  │ phone: NULL (optional)│ ← Added later in profile         │
│  │ session: Supabase Auth│ ← JWT token                      │
│  │ email: user@mail.com  │ ← Primary identifier             │
│  └──────────────────────┘                                    │
│                                                              │
│  STATE D: Admin                                               │
│  ┌──────────────────────┐                                    │
│  │ auth_user_id: UUID   │ ← 65d46154-c62b-415c-...         │
│  │ email: shoaibmithall  │ ← Hardcoded in RLS + RPCs       │
│  │ session: Supabase Auth│ ← signInWithPassword             │
│  │ role: Admin (RLS)     │ ← Server-side verified           │
│  └──────────────────────┘                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Route Guard Logic:
┌─────────────────────────────────────────────────────────────┐
│ if (supabase.auth.session exists)                           │
│   → STATE B or C or D                                       │
│   → Check admin: auth.uid() == admin_uuid (server-side)     │
│   → Route to admin panel OR home                            │
│                                                              │
│ else if (AsyncStorage 'userPhone' exists)                   │
│   → STATE A (Legacy)                                        │
│   → Show "Upgrade your account" prompt                      │
│   → Allow legacy login for now                              │
│   → Route to home                                           │
│                                                              │
│ else                                                        │
│   → Unauthenticated                                         │
│   → Route to login                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Forward SQL

```sql
-- JeetoBaz Auth Migration: Additive nullable schema changes
-- Date: 2026-07-16
-- Safety: Additive only. No columns removed. No constraints changed.
-- Prerequisite: Run collision audit first (see Section 6)

BEGIN;

-- ─────────────────────────────────────────────
-- 2.1 Add auth_user_id column
-- ─────────────────────────────────────────────
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS auth_user_id uuid
REFERENCES auth.users(id) ON DELETE SET NULL;

-- Partial unique index: only enforce uniqueness when value is not null
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_unique
ON public.users(auth_user_id)
WHERE auth_user_id IS NOT NULL;

-- ─────────────────────────────────────────────
-- 2.2 Add email column
-- ─────────────────────────────────────────────
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email text;

-- Case-insensitive unique index: prevent duplicate emails
-- Uses lower(trim()) for normalization
CREATE UNIQUE INDEX IF NOT EXISTS users_email_normalized_unique
ON public.users (lower(trim(email)))
WHERE email IS NOT NULL;

-- Performance index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email
ON public.users (lower(trim(email)))
WHERE email IS NOT NULL;

-- ─────────────────────────────────────────────
-- 2.3 Add email_verified column
-- ─────────────────────────────────────────────
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

-- ─────────────────────────────────────────────
-- 2.4 Add auth_provider column
-- ─────────────────────────────────────────────
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS auth_provider text NOT NULL DEFAULT 'phone';

-- Constraint: only allow known providers
ALTER TABLE public.users
ADD CONSTRAINT users_auth_provider_check
CHECK (auth_provider IN ('phone', 'email', 'google'));

-- ─────────────────────────────────────────────
-- 2.5 Create identity state view (read-only)
-- ─────────────────────────────────────────────
CREATE OR REPLACE VIEW public.user_identity_state AS
SELECT
  id,
  phone,
  email,
  auth_user_id,
  auth_provider,
  email_verified,
  CASE
    WHEN auth_user_id IS NOT NULL AND email IS NOT NULL THEN 'migrated'
    WHEN auth_user_id IS NOT NULL AND email IS NULL THEN 'migrated_pending_email'
    WHEN auth_user_id IS NULL AND phone IS NOT NULL THEN 'legacy'
    ELSE 'unknown'
  END AS identity_state
FROM public.users;

COMMIT;
```

---

## 3. Rollback SQL

```sql
-- JeetoBaz Auth Migration: Rollback
-- Date: 2026-07-16
-- Safety: Removes only what was added in forward migration

BEGIN;

-- Remove view
DROP VIEW IF EXISTS public.user_identity_state;

-- Remove constraint
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_auth_provider_check;

-- Remove columns
ALTER TABLE public.users DROP COLUMN IF EXISTS auth_provider;
ALTER TABLE public.users DROP COLUMN IF EXISTS email_verified;
ALTER TABLE public.users DROP COLUMN IF EXISTS email;
ALTER TABLE public.users DROP COLUMN IF EXISTS auth_user_id;

-- Remove indexes (dropped with columns, but explicit for safety)
DROP INDEX IF EXISTS public.users_auth_user_id_unique;
DROP INDEX IF EXISTS public.users_email_normalized_unique;
DROP INDEX IF EXISTS public.idx_users_email;

COMMIT;
```

---

## 4. RLS Plan

### Current State
- Admin authorization: `auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid` (17 occurrences across 6 SQL files)
- User operations: Phone-based via SECURITY DEFINER RPCs
- No user-level RLS policies (users table has public read, admin write)

### What Changes
**Nothing.** The new `auth_user_id` and `email` columns are additive. Existing RLS policies remain unchanged because:
- Admin policies use `auth.uid()` — still works
- User operations use SECURITY DEFINER RPCs with phone parameter — still works
- No new user-level RLS policies needed yet

### Future RLS Enhancements (Not in this migration)
When ready to enforce user-level RLS:
```sql
-- Example: Users can only read their own profile
CREATE POLICY "Users read own profile"
ON public.users FOR SELECT
USING (
  auth_user_id = auth.uid()
  OR phone = current_setting('request.jwt.claims', true)::json->>'phone'
);
```

### Admin Authorization — UNCHANGED
- RLS policies: `auth.uid() = '65d46154-...'` — server-side, not client-side
- SECURITY DEFINER functions: Check `auth.uid()` inside function body
- Client-side email comparison in `admin.tsx` and `draw.tsx` — supplementary only, not authoritative
- **No changes to admin authorization in this migration**

---

## 5. Feature-Flag Design

### Mechanism
Use `admin_settings` table (already exists) to control auth migration rollout.

```sql
-- Add feature flag to admin_settings
INSERT INTO public.admin_settings (key, value, updated_at)
VALUES ('auth_migration_enabled', 'false', now())
ON CONFLICT (key) DO NOTHING;

-- Values: 'false' | 'staging' | 'gradual' | 'full'
```

### Rollout Stages

| Flag Value | Behavior |
|------------|----------|
| `false` | Legacy phone login only. New signup disabled. |
| `staging` | Both logins available. New users use email. Existing see upgrade prompt. |
| `gradual` | 50% of existing users see upgrade prompt. 50% don't. |
| `full` | All users must use email+password. Legacy removed. |

### Client-Side Flag Check
```typescript
// In login.tsx
const { data: flag } = await supabase
  .from('admin_settings')
  .select('value')
  .eq('key', 'auth_migration_enabled')
  .single();

const migrationEnabled = flag?.value === 'staging' 
  || flag?.value === 'gradual' 
  || flag?.value === 'full';

// Show email+password form if migration enabled
// Show legacy phone form as fallback
```

### Gradual Rollout Logic
```typescript
// For 'gradual' stage
if (flag?.value === 'gradual') {
  // Show upgrade prompt to 50% of users
  const hash = userPhone.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const showUpgrade = hash % 2 === 0;
  // ...
}
```

### Admin Toggle
Admin can change flag via admin panel Settings tab:
```
Auth Migration: [Off] [Staging] [Gradual] [Full]
```

---

## 6. Collision Audit (Pre-Migration)

Run BEFORE executing forward SQL:

```sql
-- 6.1 Check for duplicate emails (case-insensitive)
SELECT lower(trim(email)) AS normalized_email, count(*)
FROM public.users
WHERE email IS NOT NULL
GROUP BY lower(trim(email))
HAVING count(*) > 1;

-- Expected result: 0 rows (no duplicates)

-- 6.2 Check for users with both phone and email
SELECT id, phone, email
FROM public.users
WHERE email IS NOT NULL AND phone IS NOT NULL;

-- Expected result: 0 rows (no existing email+phone combos)

-- 6.3 Check total users count
SELECT count(*) AS total_users FROM public.users;

-- 6.4 Check auth.users count
SELECT count(*) AS auth_users FROM auth.users;

-- 6.5 Check admin auth user exists
SELECT id, email
FROM auth.users
WHERE id = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid;

-- Expected: 1 row with admin email
```

---

## 7. Staging Test Matrix

### Test Category 1: New User Signup

| Test | Steps | Expected | Pass/Fail |
|------|-------|----------|-----------|
| T1.1 | Sign up with valid email+password | Account created, confirmation email sent | |
| T1.2 | Sign up with existing email | Error: "Email already registered" | |
| T1.3 | Sign up with invalid email format | Error: "Invalid email address" | |
| T1.4 | Sign up with weak password | Error: "Password must be at least 6 characters" | |
| T1.5 | Sign up with different casing (User@Mail.COM) | Stored as user@mail.com | |
| T1.6 | Sign up with leading/trailing spaces | Trimmed before storage | |
| T1.7 | Double-click signup button | Only one account created (idempotent) | |
| T1.8 | Sign up → close app → reopen | Confirmation email screen shown | |

### Test Category 2: Email Verification

| Test | Steps | Expected | Pass/Fail |
|------|-------|----------|-----------|
| T2.1 | Click verification link in email | App opens, session established | |
| T2.2 | Click expired verification link | Error: "Link expired, resend?" | |
| T2.3 | Click already-used verification link | Redirects to app (idempotent) | |
| T2.4 | Resend verification email | New email received | |
| T2.5 | Open verification on web | Web app opens, session established | |
| T2.6 | Open verification on Android | App opens via deep link | |

### Test Category 3: Login

| Test | Steps | Expected | Pass/Fail |
|------|-------|----------|-----------|
| T3.1 | Login with correct credentials | Session established, home screen | |
| T3.2 | Login with wrong password | Error: "Invalid email or password" | |
| T3.3 | Login with unverified email | Error: "Please verify your email first" | |
| T3.4 | Login → close app → reopen | Session restored, home screen | |
| T3.5 | Login on multiple devices | Both devices have active sessions | |
| T3.6 | Logout → check session | Session cleared, login screen | |

### Test Category 4: Password Reset

| Test | Steps | Expected | Pass/Fail |
|------|-------|----------|-----------|
| T4.1 | Enter email → reset password | Reset email received | |
| T4.2 | Click reset link on web | Web opens, new password form | |
| T4.3 | Click reset link on Android | App opens via deep link | |
| T4.4 | Enter new password → submit | Password updated, redirect to login | |
| T4.5 | Use expired reset link | Error: "Link expired, try again" | |
| T4.6 | Reset password → login with old password | Error: "Invalid credentials" | |
| T4.7 | Reset password → login with new password | Session established | |

### Test Category 5: Legacy User Migration

| Test | Steps | Expected | Pass/Fail |
|------|-------|----------|-----------|
| T5.1 | Legacy user logs in (phone) | Home screen, entries visible | |
| T5.2 | Legacy user sees "Upgrade" prompt | Prompt displayed | |
| T5.3 | Legacy user adds email → verifies | auth_user_id linked, entries preserved | |
| T5.4 | Legacy user after migration → login with email | Session established, entries visible | |
| T5.5 | Legacy user entries still visible after migration | All entries present | |
| T5.6 | Legacy user referrals still work after migration | Referral count unchanged | |
| T5.7 | Legacy user transactions still visible | All transactions present | |
| T5.8 | Legacy user skips upgrade | Can still use phone login | |

### Test Category 6: Profile Creation (Idempotent)

| Test | Steps | Expected | Pass/Fail |
|------|-------|----------|-----------|
| T6.1 | New user completes profile setup | Profile created, linked to auth_user_id | |
| T6.2 | Refresh profile setup page | No duplicate profile | |
| T6.3 | Double-submit profile form | No duplicate profile | |
| T6.4 | Profile creation with phone | Phone saved, unique index not violated | |
| T6.5 | Profile creation without phone | Profile created successfully | |

### Test Category 7: Admin

| Test | Steps | Expected | Pass/Fail |
|------|-------|----------|-----------|
| T7.1 | Admin login with email+password | Admin panel accessible | |
| T7.2 | Normal user cannot access admin panel | Access denied | |
| T7.3 | Admin auth via RLS (server-side) | Works correctly | |
| T7.4 | Admin approve payment (email auth) | Entry created, transaction updated | |
| T7.5 | Admin run draw (email auth) | Winner selected correctly | |

### Test Category 8: Deep Links

| Test | Steps | Expected | Pass/Fail |
|------|-------|----------|-----------|
| T8.1 | `jeetobaz://auth/callback` on Android | App opens, auth handled | |
| T8.2 | `jeetobaz://reset-password` on Android | App opens, password form | |
| T8.3 | `https://jeetobaz.pk/auth/callback` on web | Web app handles auth | |
| T8.4 | `https://jeetobaz.pk/reset-password` on web | Web app shows password form | |
| T8.5 | `http://localhost:8081/auth/callback` | Dev environment handles auth | |

### Test Category 9: Edge Cases

| Test | Steps | Expected | Pass/Fail |
|------|-------|----------|-----------|
| T9.1 | Network failure during signup | Error shown, no partial account | |
| T9.2 | Network failure during login | Error shown, retry possible | |
| T9.3 | Supabase service down | Graceful error, legacy fallback if enabled | |
| T9.4 | Concurrent signup same email | Only one account created | |
| T9.5 | Session expires | Redirect to login | |
| T9.6 | Invalid JWT token | Redirect to login | |

---

## 8. SMTP Testing Checklist

Before production, verify:

| Test | Status |
|------|--------|
| Signup confirmation email delivered to Gmail | |
| Signup confirmation email delivered to Yahoo | |
| Signup confirmation email delivered to Outlook | |
| Confirmation email not in spam (Gmail) | |
| Confirmation email not in spam (Yahoo) | |
| Resend confirmation works | |
| Password recovery email delivered | |
| Recovery link opens correctly on web | |
| Recovery link opens correctly on Android | |
| Expired recovery link shows appropriate error | |
| Sender: no-reply@jeetobaz.pk | |
| SPF record configured | |
| DKIM record configured | |
| DMARC record configured | |
| Custom SMTP provider configured | |
| Rate limit: >2 emails/hour (exceeds default) | |

---

## 9. Forward Migration Steps (Execution Order)

```
Step 1: Run collision audit (Section 6)
        ↓
Step 2: Verify collision audit results (0 duplicates)
        ↓
Step 3: Backup database (Supabase dashboard → Backups)
        ↓
Step 4: Execute forward SQL (Section 2)
        ↓
Step 5: Verify columns exist
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'users' AND column_name IN
        ('auth_user_id', 'email', 'email_verified', 'auth_provider');
        ↓
Step 6: Verify indexes exist
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'users' AND indexname LIKE 'users_%';
        ↓
Step 7: Verify view works
        SELECT * FROM public.user_identity_state LIMIT 5;
        ↓
Step 8: Set feature flag to 'staging'
        UPDATE admin_settings SET value = 'staging'
        WHERE key = 'auth_migration_enabled';
        ↓
Step 9: Deploy code changes (auth provider, login, signup, etc.)
        ↓
Step 10: Test staging environment
        ↓
Step 11: Run full test matrix (Section 7)
        ↓
Step 12: If all pass → set flag to 'gradual'
        ↓
Step 13: Monitor for 1 week
        ↓
Step 14: If no issues → set flag to 'full'
        ↓
Step 15: After all users migrated → remove legacy login code
```

---

## 10. Rollback Procedure

If anything goes wrong:

```
Immediate (< 5 minutes):
├── Set feature flag to 'false'
├── Legacy phone login re-enabled
└── All existing users unaffected

Short-term (< 1 hour):
├── Execute rollback SQL (Section 3)
├── Verify users table restored
├── Deploy previous code version
└── Verify legacy login works

Long-term (< 24 hours):
├── Investigate root cause
├── Fix issue
├── Re-run collision audit
├── Re-execute forward SQL
└── Re-test
```

---

*This document is the complete auth migration plan. Implementation begins only after approval.*
