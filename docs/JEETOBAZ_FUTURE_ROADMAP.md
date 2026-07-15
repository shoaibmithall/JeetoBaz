# JeetoBaz Future Roadmap

> Phased development plan with priorities and dependencies. Last updated: 2026-07-15.

---

## Roadmap Overview

```
Phase 3A: Auth Migration (P0) ───→ Phase 3B: Referral Auth (P1)
         │                                  │
         ▼                                  ▼
Phase 4: JazzCash Live (P1) ←──── Phase 5: Firebase Push (P2)
         │
         ▼
Phase 6: Apple Sign-In (P3) ──→ Phase 7: Performance (P2)
```

---

## Phase 3A: Auth Migration (P0 — CRITICAL)

**Goal:** Replace AsyncStorage phone-based auth with Supabase Auth JWT sessions.

**Why:** Current system stores user identity in plaintext AsyncStorage. This is the #1 security risk.

### Changes Required

| Area | Current | Future |
|------|---------|--------|
| Identity storage | AsyncStorage `userPhone` | Supabase Auth JWT session |
| Login method | Phone INSERT into users table | Supabase Auth signUp + users table link |
| Session management | None (AsyncStorage read) | Supabase SDK `getSession()` |
| Profile updates | RPC with phone parameter | RPC with `auth.uid()` |
| All 47+ phone queries | `.eq('phone', userPhone)` | `.eq('user_id', user.id)` |

### Files Affected
- `src/app/login.tsx` — Complete rewrite
- `src/app/admin.tsx` — Minor changes (already uses Supabase Auth)
- `src/app/payment.tsx` — Phone → auth.uid()
- `src/app/index.tsx` — Phone → auth.uid()
- `src/app/entries.tsx` — Phone → auth.uid()
- `src/app/referral.tsx` — Phone → auth.uid()
- `src/app/notifications.tsx` — Phone filtering
- `src/lib/referrals.ts` — Phone → auth.uid()
- `src/lib/storage.ts` — May add expo-secure-store
- All 8 RPC functions — Parameter changes
- All SQL RLS policies — Update to use auth.uid()

### Migration Strategy
1. Create Supabase Auth users for existing users (batch migration)
2. Link Supabase Auth UUID to users.id
3. Update all queries to use auth.uid()
4. Update all RPCs to accept auth.uid() instead of phone
5. Remove AsyncStorage phone storage
6. Add expo-secure-store for any remaining local data

### Rollback Plan
- Keep phone-based fallback for 30 days
- Feature flag: `authMigrationEnabled`
- If issues: revert to AsyncStorage flow

### Estimated Effort: Large (2-3 weeks)

---

## Phase 3B: Referral Auth Migration (P1)

**Goal:** Update all referral RPCs to use `auth.uid()` instead of phone.

**Depends on:** Phase 3A complete

### Changes Required
- `get_referral_dashboard` — phone → auth.uid()
- `claim_referral_code` — phone → auth.uid()
- `redeem_referral_reward` — phone → auth.uid()
- `get_available_referral_rewards` — phone → auth.uid()
- `update_profile_avatar` — phone → auth.uid()
- Remove `referral_device_token` parameter (auth.uid() replaces it)
- Remove device token checks (no longer needed)

### Estimated Effort: Medium (1 week)

---

## Phase 4: JazzCash Live (P1)

**Goal:** Switch from JazzCash sandbox to production.

### Changes Required
| Area | Current | Future |
|------|---------|--------|
| Edge Function URL | `sandbox.jazzcash.com.pk/...` | `production.jazzcash.com.pk/...` |
| Merchant ID | Sandbox credentials | Production credentials |
| Password | Sandbox password | Production password |
| Integrity Salt | Sandbox salt | Production salt |
| Response URL | `jeetobaz.pk/payment-response` | Same (already correct) |

### Prerequisites
- JazzCash merchant account approved
- Production credentials obtained
- Edge Function secrets updated in Supabase dashboard

### Estimated Effort: Small (1-2 days)

---

## Phase 5: Firebase Push Notifications (P2)

**Goal:** Add push notifications for draw updates, winner announcements, payment status.

### Changes Required
- Remove dead Firebase code from `src/firebase.ts`
- Re-initialize Firebase with proper config
- Install `expo-notifications`
- Register device for push tokens
- Store push tokens in Supabase (new column or table)
- Create notification sending mechanism (Edge Function or admin panel)
- Handle notification taps (deep linking)

### Dependencies
- Firebase project setup
- Apple Push Notification service (APNs) certificate for iOS
- Google Services configuration for Android

### Estimated Effort: Medium (1-2 weeks)

---

## Phase 6: Apple Sign-In (P3)

**Goal:** Add Apple Sign-In for iOS users.

### Changes Required
- Install `expo-auth-session` + `expo-crypto`
- Configure Apple Developer account ($99/year)
- Add Apple Sign-In provider in Supabase Auth
- Update login screen with Apple button
- Handle Apple user linking

### Prerequisites
- Apple Developer Program membership ($99/year)
- App Store Connect app configured

### Estimated Effort: Small (3-5 days)

---

## Phase 7: Performance Optimization (P2)

**Goal:** Improve app performance and scalability.

### Changes Required
| Area | Current | Future |
|------|---------|--------|
| Admin data loading | Loads ALL records | Paginated loading |
| Home screen | Loads 120 products | Virtualized list |
| Image caching | None | expo-image caching |
| Bundle size | Firebase included | Remove dead code |

### Estimated Effort: Medium (1-2 weeks)

---

## Priority Matrix

| Phase | Priority | Effort | Risk | Revenue Impact |
|-------|----------|--------|------|----------------|
| 3A: Auth Migration | P0 | Large | High | Security critical |
| 3B: Referral Auth | P1 | Medium | Medium | Security improvement |
| 4: JazzCash Live | P1 | Small | Low | Revenue enablement |
| 5: Firebase Push | P2 | Medium | Medium | User engagement |
| 6: Apple Sign-In | P3 | Small | Low | User convenience |
| 7: Performance | P2 | Medium | Low | User experience |

---

## Dependency Graph

```
Phase 3A ──→ Phase 3B
    │
    └──→ Phase 4 (independent, can run in parallel)

Phase 5 (independent, can run anytime)

Phase 6 (independent, can run anytime)

Phase 7 (independent, can run anytime)
```

---

## Migration Requirements

### Phase 3A — Database Changes
```sql
-- Add auth_uid column to users table
ALTER TABLE public.users ADD COLUMN auth_uid uuid UNIQUE REFERENCES auth.users(id);

-- Create index
CREATE INDEX users_auth_uid_idx ON public.users (auth_uid);

-- Link existing users (batch migration)
-- This requires matching phone numbers to Supabase Auth users
```

### Phase 3A — RPC Changes
All 8 RPC functions need parameter updates:
- Replace `requested_phone text` with `auth.uid()` usage
- Remove device token parameters (for referral RPCs)
- Update internal queries to use `user_id` instead of `phone`

### Phase 3B — Referral Changes
- Remove `referral_device_token` column (after auth migration)
- Remove device-based anti-fraud (replaced by auth.uid())
- Simplify RPC signatures

---

## Success Criteria

| Phase | Success Metric |
|-------|---------------|
| 3A | All user queries use auth.uid(), zero AsyncStorage phone reads |
| 3B | All referral RPCs use auth.uid(), device token removed |
| 4 | JazzCash production credentials active, sandbox disabled |
| 5 | Push notifications delivered for draw updates and winner announcements |
| 6 | Apple Sign-In working on iOS, App Store review passed |
| 7 | Admin panel loads <2 seconds, home screen smooth scroll |

---

*Future roadmap complete.*
