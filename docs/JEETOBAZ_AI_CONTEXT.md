# JeetoBaz AI Context

> **MOST IMPORTANT DOCUMENT** — Written specifically for future AI assistants.
> Last updated: 2026-07-15.

---

## Purpose

This document provides everything an AI assistant needs to know to work safely and effectively on the JeetoBaz codebase. Read this BEFORE making any changes.

---

## 1. How JeetoBaz Works

JeetoBaz is a Pakistan-based lucky draw platform:

1. **Admin creates a draw** — Sets product name, entry fee, max entries
2. **Users browse draws** — Home screen shows active draws
3. **Users pay entry fee** — Manual JazzCash receipt or JazzCash online
4. **Admin verifies payment** — Reviews receipt, approves/rejects
5. **On approval** — Entry is created, ticket number generated
6. **When all slots filled** — Admin runs draw at 10PM PKT
7. **Random winner selected** — Via `run_jeetobaz_draw` RPC
8. **Winner announced** — Public display with masked phone

**Key insight:** This is NOT a real-time lottery. It's a manual process with admin verification at every step.

---

## 2. Architecture

```
Frontend: Expo 56 + React Native 0.85.3 + TypeScript
Backend: Supabase (PostgreSQL + RLS + Edge Functions)
Payments: JazzCash (manual receipt + online)
Deploy: Netlify (primary) + GitHub Pages (fallback)
Domain: jeetobaz.pk
```

**Critical architectural facts:**
- User auth is phone-based (NO Supabase Auth for users)
- Admin auth uses Supabase Auth (email+password)
- All sensitive operations use SECURITY DEFINER RPCs
- Client-side logic is NOT trusted for security decisions
- AsyncStorage stores user session (plaintext)

---

## 3. Database

### Tables (9 user-facing + 1 system)
- `products` — Draw listings
- `users` — User accounts (phone-based)
- `entries` — Draw entries (one per user per draw)
- `transactions` — Payment records
- `draw_results` — Completed draw winners
- `notifications` — In-app notifications
- `app_settings` — Key-value config
- `referral_claims` — Referral code claims
- `referral_rewards` — Referral entry credits
- `pg_stat_statements` — System (performance monitoring)

### Critical Columns
- `users.phone` — De facto user identifier (UNIQUE, NOT NULL)
- `users.id` — UUID primary key
- `entries.product_id` + `entries.phone` — One entry per user per draw
- `transactions.status` — 'pending', 'approved', 'rejected', 'initiated', 'failed'
- `products.current_entries` — Must equal `max_entries` before draw
- `products.status` — 'active', 'completed', 'cancelled'

### RPC Functions (8)
- `run_jeetobaz_draw(uuid)` — Execute draw (admin only, 10PM PKT)
- `get_public_draw_result(uuid)` — Public winner display
- `update_profile_avatar(text, text)` — Update avatar URL
- `get_referral_dashboard(text, text)` — Referral stats
- `claim_referral_code(text, text, text)` — Claim referral code
- `get_referral_eligible_products()` — Rs.1 draws with referral slots
- `redeem_referral_reward(text, text, uuid, uuid)` — Redeem reward
- `get_available_referral_rewards(text, text)` — Available rewards

---

## 4. Business Rules

### Hard Rules (NEVER violate)
1. **Draws only at 10PM PKT** — `run_jeetobaz_draw` enforces this
2. **One entry per user per draw** — Checked before entry creation
3. **Entries must equal max_entries** — Before draw can run
4. **Admin must approve payments** — No auto-approval
5. **Referral rewards only for Rs.1 campaigns** — Checked in RPC
6. **10% cap on referral entries** — Per draw, enforced in RPC
7. **30-day reward expiry** — Checked in RPC
8. **No self-referral** — Checked in RPC
9. **Device-based anti-fraud** — One device per referral account

### Soft Rules (Can be adjusted)
1. 60-second payment cooldown (client-side only)
2. 120 products loaded on home screen
3. 50 notifications loaded
4. 5MB file size limit for uploads
5. 3MB limit for profile avatars

---

## 5. Security Rules

### Things AI Must NEVER Change

1. **Admin UUID** — `65d46154-c62b-415c-852c-c923b0b3cd1a` is hardcoded in 17 locations. Do NOT change without understanding all implications.

2. **Admin email** — `shoaibmithall@gmail.com` is used in 10 locations for email-based auth checks.

3. **RLS policies** — Never disable RLS. Never create permissive policies without understanding the security model.

4. **SECURITY DEFINER functions** — Never remove SECURITY DEFINER from RPCs. Never add `auth.uid()` checks that bypass the function owner's privileges.

5. **JazzCash HMAC verification** — Never remove or weaken the HMAC-SHA256 verification in the Edge Function.

6. **Payment status flow** — Never allow direct status changes without going through the proper approval workflow.

7. **Draw execution** — Never modify `run_jeetobaz_draw` to run outside 10PM PKT window.

8. **Referral validation checks** — Never remove any of the 7 validation checks in `claim_referral_code` or 6 in `redeem_referral_reward`.

---

## 6. Things Requiring Migration

These changes need careful planning and cannot be done as simple code edits:

| Change | Why Migration Needed | Risk |
|--------|---------------------|------|
| Auth migration (AsyncStorage → Supabase Auth) | 47+ queries use phone as identifier | HIGH — breaks all user flows |
| Referral RPC update (phone → auth.uid()) | 5 RPCs use phone parameter | MEDIUM — breaks referral system |
| Remove device token checks | Depends on auth migration | MEDIUM — breaks anti-fraud |
| Add CHECK constraint on transactions.status | May fail if bad data exists | LOW — needs data cleanup first |
| Enable notifications RLS | May block existing operations | LOW — needs testing |

---

## 7. Things Safe to Modify

These changes can be made without migration concerns:

| Area | Safe Changes |
|------|-------------|
| UI components | Add new components, modify styling, update layouts |
| i18n | Add new translation keys, fix typos |
| Product categories | Add/remove categories |
| Home screen | Adjust filters, sorting, display options |
| Admin panel | Add new tabs, improve UX |
| Social media links | Update URLs |
| Static pages | About, FAQ, Help, Terms, Privacy content |
| Performance indexes | Add new indexes (never remove existing ones) |
| Theme | Add new color palettes, adjust spacing |
| Error handling | Improve error messages, add loading states |

---

## 8. Common Mistakes

### Mistake 1: Using phone as user ID in new code
```typescript
// WRONG — phone is not a reliable user identifier
const { data } = await supabase.from('entries').select('*').eq('phone', userPhone);

// CORRECT — use user_id (after auth migration)
const { data } = await supabase.from('entries').select('*').eq('user_id', user.id);
```

### Mistake 2: Assuming AsyncStorage data is trustworthy
```typescript
// WRONG — AsyncStorage can be tampered
const phone = await getStoredValue('userPhone');
// Using phone for security decisions...

// CORRECT — verify via Supabase Auth
const { data: { user } } = await supabase.auth.getUser();
```

### Mistake 3: Modifying SECURITY DEFINER functions
```sql
-- WRONG — removing SECURITY DEFINER breaks security model
CREATE OR REPLACE FUNCTION public.my_function()
-- SECURITY DEFINER removed!

-- CORRECT — keep SECURITY DEFINER, add proper auth checks
CREATE OR REPLACE FUNCTION public.my_function()
SECURITY DEFINER
-- Add auth.uid() check inside function
```

### Mistake 4: Adding RLS policies without testing
```sql
-- WRONG — may block existing operations
CREATE POLICY "strict_policy" ON public.users FOR ALL USING (auth.uid() = id);

-- CORRECT — test with all user roles first
-- Verify anon, authenticated, and service_role all work as expected
```

### Mistake 5: Changing payment status flow
```typescript
// WRONG — skipping admin approval
await supabase.from('transactions').update({ status: 'approved' }).eq('id', id);

// CORRECT — use admin panel workflow
// Only admin.tsx should update transaction status
```

---

## 9. Critical Files

| File | Why Critical | Lines |
|------|-------------|-------|
| `src/app/admin.tsx` | Admin panel — payment approval, product management, draw execution | ~993 |
| `src/app/login.tsx` | User auth — phone-based session, profile management | ~515 |
| `src/app/payment.tsx` | Payment submission — receipt upload, JazzCash redirect | ~444 |
| `src/app/index.tsx` | Home screen — product listing, search, favorites, ads | ~1040 |
| `src/app/referral.tsx` | Referral system — claim codes, redeem rewards | ~399 |
| `src/app/draw.tsx` | Draw execution — admin-only, time-restricted | ~100 |
| `src/lib/supabase.ts` | Supabase client singleton — hardcoded credentials | ~20 |
| `src/lib/storage.ts` | AsyncStorage wrapper — all local storage | ~25 |
| `supabase/functions/jazzcash-payment/index.ts` | JazzCash Edge Function — HMAC verification, IPN handling | ~299 |

---

## 10. Critical Tables

| Table | Why Critical | Modification Risk |
|-------|-------------|-------------------|
| `users` | User identity — phone is de facto PK | HIGH — 47+ queries depend on phone |
| `entries` | Draw entries — one per user per draw | HIGH — affects draw fairness |
| `transactions` | Payment records — approval workflow | HIGH — financial data |
| `draw_results` | Winner records — immutable once created | CRITICAL — never modify |
| `products` | Draw listings — current_entries must be accurate | HIGH — affects draw execution |

---

## 11. Critical Business Logic

### Draw Execution (`run_jeetobaz_draw`)
- Admin UUID check (line 59)
- Product FOR UPDATE lock (line 67)
- Status check (line 73)
- Duplicate result check (line 77)
- Entry count check (line 90)
- Time check — 10PM PKT only (line 96)
- Random winner selection (line 104)
- Atomic operations (insert result + update product)

### Referral Claim (`claim_referral_code`)
- User existence check
- Referrer existence check
- Self-referral check
- Previous referral check
- 7-day account age check
- Device token uniqueness check
- Atomic operations (update user + insert claim + insert 2 rewards)

### Payment Approval (`admin.tsx:455-535`)
- Transaction status update
- Duplicate entry check
- Product capacity check
- Entry creation
- current_entries increment (NON-ATOMIC — known issue)
- Receipt removal
- Notification creation

---

## 12. Current Limitations

1. **No user account deletion** — Users cannot delete their accounts
2. **No profile update** — Users cannot update name/phone after signup
3. **No pagination** — Admin loads all records at once
4. **No real-time updates** — No WebSocket subscriptions
5. **No push notifications** — Firebase initialized but unused
6. **No email notifications** — All notifications are in-app
7. **No payment webhooks** — Manual receipt verification only
8. **No draw scheduling** — Admin must manually run draw
9. **No entry transfer** — Entries cannot be transferred between users
10. **No refund mechanism** — No way to refund payments

---

## 13. Future Plans

See `JEETOBAZ_FUTURE_ROADMAP.md` for complete phased plan.

**Priority order:**
1. Phase 3A: Auth migration (P0 — security critical)
2. Phase 3B: Referral auth migration (P1)
3. Phase 4: JazzCash Live (P1 — revenue enablement)
4. Phase 5: Firebase Push Notifications (P2)
5. Phase 6: Apple Sign-In (P3)
6. Phase 7: Performance optimization (P2)

---

## 14. Documentation Index

| Document | Purpose |
|----------|---------|
| `JEETOBAZ_MASTER_DOCUMENTATION.md` | Project overview, architecture, features |
| `JEETOBAZ_DATABASE_GUIDE.md` | Complete database reference |
| `JEETOBAZ_DEVELOPER_GUIDE.md` | How to run, deploy, add features |
| `JEETOBAZ_SECURITY_GUIDE.md` | Authentication, authorization, risks |
| `JEETOBAZ_FEATURE_GUIDE.md` | Every feature explained |
| `JEETOBAZ_DATA_FLOW_GUIDE.md` | Every data flow documented |
| `JEETOBAZ_FUTURE_ROADMAP.md` | Phased development plan |
| `JEETOBAZ_AI_CONTEXT.md` | This document |
| `CHECKPOINT-3-DATABASE-SECURITY-AUDIT.md` | Database security audit |
| `CHECKPOINT-3-DATABASE-DEPENDENCY-GRAPH.md` | Dependency mapping |
| `CHECKPOINT-3-RISK-REGISTER.md` | Risk assessment |
| `CHECKPOINT-3-SELF-REVIEW.md` | Self-critique of audit |

---

*AI context document complete. This is the single source of truth for AI assistants working on JeetoBaz.*
