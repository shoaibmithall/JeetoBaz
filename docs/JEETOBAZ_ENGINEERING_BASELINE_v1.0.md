# JeetoBaz Engineering Baseline v1.0

> Official engineering baseline. This is the single source of truth for JeetoBaz's current state.
> Created: July 15, 2026 | Status: FINAL | Audit: PERMANENTLY CLOSED
> After this document, no full re-audit unless architecture fundamentally changes.

---

## 1. Executive Summary

### Current Maturity

JeetoBaz is a Pakistan-based lucky draw platform built with Expo 56 + Supabase. The web version is live at jeetobaz.pk. Native apps (Android/iOS) are configured but not yet deployed.

### Strengths

- Clean file-based routing with Expo Router
- Strong database design with 9 tables, 8 RPCs, RLS policies
- Dual web deployment (Netlify + GitHub Pages)
- Edge Function for JazzCash with proper HMAC-SHA256 verification
- Comprehensive documentation (10+ knowledge base files)
- TypeScript strict mode enabled
- Offline caching for products and ads

### Weaknesses

- Zero monitoring, crash reporting, or analytics
- No test framework
- Minimal CI/CD (deploy only, no lint/typecheck)
- Two oversized components (admin.tsx 993 lines, index.tsx 1040 lines)
- Phone-based auth with AsyncStorage (no real security)
- No Play Store / App Store deployment yet

### Overall Engineering Score

| Dimension | Score |
|-----------|-------|
| Architecture | 8/10 |
| Security | 6/10 |
| Database | 8/10 |
| Code Quality | 6.5/10 |
| Performance | 7/10 |
| Deployment | 4.5/10 |
| Documentation | 9/10 |
| Maintainability | 5.5/10 |
| Scalability | 6/10 |
| **Overall** | **6.7/10** |

---

## 2. Architecture Summary

### Current Architecture

```
Frontend:    Expo 56 + React Native 0.85.3 + TypeScript (strict)
Backend:     Supabase (PostgreSQL 15 + RLS + Edge Functions)
Payments:    JazzCash (manual receipt + online via Edge Function)
Storage:     Supabase Storage (4 buckets: profile-avatars, payment-receipts, winner-media, home-ads)
Deploy:      Netlify (primary) + GitHub Pages (fallback)
Domain:      jeetobaz.pk (PKNIC)
```

### Future Architecture (When Scaling)

- Native apps via EAS Build (Play Store + App Store)
- Push notifications via Expo Notifications
- Real-time updates via Supabase Realtime
- Admin dashboard as separate web app

### Major Design Decisions

1. **Supabase as sole backend** — No custom server, RLS handles security
2. **Phone-based user auth** — No Supabase Auth for users, AsyncStorage session
3. **Admin email hardcoded** — `shoaibmithall@gmail.com` compared against Supabase Auth
4. **Manual payment verification** — Admin reviews receipts, approves/rejects
5. **SECURITY DEFINER RPCs** — All sensitive operations go through database functions
6. **Edge Function for JazzCash** — Server-side HMAC verification, IPN handling
7. **Static web export** — Expo outputs static files for CDN deployment

### Architecture Stability

**STABLE.** No fundamental changes planned. Future work is additive (native apps, monitoring, tests) not architectural.

---

## 3. Business Rules Summary

### Products (Draws)
- Admin creates draws with name, entry fee, max entries, draw date
- Only `active` draws shown to users
- Each draw has a unique product ID (UUID)
- Winner photo and announcement text set after draw

### Entries
- User pays entry fee → admin approves → entry created
- One entry per user per draw (enforced by DB unique constraint)
- Ticket number: `JB-{first 8 chars of entry ID}`
- Entry fee ranges: Rs.1 to Rs.1,000

### Payments
- Two methods: JazzCash Online (Edge Function) or Manual Receipt (photo upload)
- Manual: User uploads receipt → admin reviews → approves/rejects
- Online: Edge Function creates JazzCash checkout → user pays → IPN callback → admin approval
- Duplicate payment protection: client-side check + pending transaction lookup

### Referral System
- Users share referral code (phone number)
- When referred user enters first draw, referrer gets reward
- Reward via `process_referral_reward` RPC (atomic)
- Device token tracking for referral attribution

### Winner Selection
- Admin triggers draw via `run_jeetobaz_draw` RPC
- Random selection from all entries for that product
- Winner announced with masked phone, winner photo, announcement text
- Draw status changes to `completed`

### Admin
- Single admin: `shoaibmithall@gmail.com`
- Auth via Supabase Auth (`signInWithPassword`)
- Tabs: Products, Users, Entries, Transactions, Settings
- Payment approval: review receipt → approve (creates entry + updates current_entries) or reject

### Notifications
- Admin creates notifications with title, body, optional target phone
- Optional media (image/video) uploaded to `winner-media` bucket
- Read/unread tracking via `readNotificationIds` in AsyncStorage

---

## 4. Security Summary

### Authentication
- **Users:** Phone-based only. No password, no OTP, no Supabase Auth. Session stored in AsyncStorage as plaintext `userPhone`.
- **Admin:** Supabase Auth email+password. Checked via `getSession()` + `onAuthStateChange()`. Email hardcoded in 2 TS files + 4 SQL files.

### Authorization
- Row Level Security (RLS) on all tables
- SECURITY DEFINER RPCs for sensitive operations (draw, payment approval, entry creation)
- Admin-only operations enforced at database level via `check_admin_access()` function
- Storage bucket policies with phone-based ownership checks

### RLS
- Products: Public read, admin write
- Entries: Users see own entries, admin sees all
- Transactions: Users see own, admin sees all
- Users: Public read, admin write
- Notifications: Public read, admin write
- Storage: Phone-based ownership for private buckets

### Storage
- `profile-avatars` (public, 3MB limit)
- `payment-receipts` (private, 5MB limit)
- `winner-media` (public, 5MB limit)
- `home-ads` (public, 10MB limit)

### Edge Functions
- `jazzcash-payment`: HMAC-SHA256 verification, timing-safe comparison
- `verify_jwt = false` (required for JazzCash IPN)
- Secrets managed via Supabase dashboard (not in code)

### Known Risks (Accepted)
- Phone-based auth has no real security (accepted tradeoff for zero-cost operation)
- AsyncStorage session can be cleared/modified (accepted — not an auth authority)
- No rate limiting on Edge Function (accepted at current scale)

### Resolved Risks
- R-001: AsyncStorage session (downgraded from CRITICAL — session cache, not auth authority)
- R-002: Duplicate payment (partial protection via client + DB checks)

---

## 5. Database Summary

### Tables (9)

| Table | Purpose | Rows (est.) |
|-------|---------|-------------|
| `products` | Draw definitions | <100 |
| `users` | User profiles (phone-based) | <1000 |
| `entries` | Draw entries | <10000 |
| `transactions` | Payment records | <10000 |
| `notifications` | Push/notification messages | <500 |
| `user_favorites` | Saved product favorites | <5000 |
| `referral_devices` | Referral device tracking | <1000 |
| `referral_rewards` | Referral reward records | <500 |
| `admin_settings` | App configuration | <20 |

### Key Relationships
- `entries.product_id` → `products.id`
- `entries.phone` → `users.phone` (no FK constraint)
- `transactions.product_id` → `products.id`
- `transactions.phone` → `users.phone` (no FK constraint)
- `user_favorites.product_id` → `products.id`

### RPCs (8)
1. `run_jeetobaz_draw` — Random winner selection (SECURITY DEFINER)
2. `process_referral_reward` — Atomic referral reward (SECURITY DEFINER)
3. `approve_payment_and_create_entry` — Payment approval + entry creation (SECURITY DEFINER)
4. `check_admin_access` — Admin authorization check
5. `clear_approved_payment` — Mark transaction as cleared
6. `check_phone_exists` — Check if phone is registered
7. `update_user_profile` — Update user name/avatar
8. `update_product_winner` — Set winner photo/announcement

### Triggers
- `update_products_updated_at` — Auto-update `updated_at` on products
- `update_users_updated_at` — Auto-update `updated_at` on users

### Storage Buckets (4)
1. `profile-avatars` — Public, 3MB, phone-based ownership
2. `payment-receipts` — Private, 5MB, phone-based ownership
3. `winner-media` — Public, 5MB, admin-write/user-read
4. `home-ads` — Public, 10MB, admin-only

### Indexes (16)
- Products: `idx_products_status_created_at`
- Entries: `idx_entries_product_id`, `idx_entries_phone`, `idx_entries_product_phone`
- Transactions: `idx_transactions_status`, `idx_transactions_phone`, `idx_transactions_product_id`, `idx_transactions_jazzcash_txn_id`, `idx_transactions_created_at`, `idx_transactions_product_phone_status`
- Notifications: `idx_notifications_created_at`, `idx_notifications_target_phone`
- Users: `idx_users_phone`
- Referral: `idx_referral_devices_identifier`, `idx_referral_devices_referred_phone`, `idx_referral_rewards_referrer_phone`

### Current State
- Database is healthy
- All RLS policies active
- All RPCs deployed
- Edge Function deployed and handling JazzCash IPN

---

## 6. Code Quality Summary

### Current Score: 6.5/10

### Main Strengths
- TypeScript strict mode
- Consistent file-based routing
- Proper memoization in places (filteredProducts, colors)
- Clean component structure for smaller screens
- Good use of expo-image for performance

### Main Weaknesses
- Two oversized components (admin.tsx 993 lines, index.tsx 1040 lines)
- 10 duplicated code patterns across files
- 9 critical functions missing error handling
- No useCallback on key functions (defeats memoization)
- O(n²) favorites lookup

### Top 10 Technical Debt Items

| Priority | Item | Effort |
|----------|------|--------|
| P0 | Add try/catch to storage.ts | 15 min |
| P0 | Fix inconsistent maskPhone (6 vs 7 chars) | 15 min |
| P0 | Add error handling to admin fetch functions | 30 min |
| P1 | Extract shared utilities (errors, image utils) | 1 day |
| P1 | Fix admin email typo "mithall" | 5 min |
| P1 | Wrap useCallback on handleEnter/toggleFavorite | 30 min |
| P2 | Split admin.tsx into 5 components | 2-3 days |
| P2 | Split index.tsx into 4 components | 2-3 days |
| P2 | Remove dead Firebase dependency | 5 min |
| P3 | Add pagination to admin | 1-2 days |

---

## 7. Deployment Summary

### Web
- **Netlify:** Live at jeetobaz.pk. Auto-deploys on push. Minimal config (no security headers).
- **GitHub Pages:** Live at shoaibmithall.github.io/JeetoBaz/. GitHub Actions auto-deploy. CNAME configured.

### Mobile
- **EAS Build:** Configured (development, preview, production profiles). Never used. No Play Store/App Store submissions.
- **Android:** Package `com.jeetobaz.app`. Adaptive icon configured. No signing keystore.
- **iOS:** Bundle ID `com.jeetobaz.app`. No provisioning profile.

### Supabase
- **Database:** Active, all tables/RPCs/policies deployed
- **Edge Functions:** `jazzcash-payment` deployed, `verify_jwt = false`
- **Storage:** 4 buckets active with RLS policies
- **Secrets:** JazzCash credentials managed via Supabase dashboard

### GitHub
- Repository: `shoaibmithall/JeetoBaz`
- 164 commits, main branch
- GitHub Actions: GitHub Pages deployment only

### Netlify
- Auto-deploys from main branch
- Build command: `npx expo export -p web`
- SPA redirect configured

### Firebase
- **DEAD.** `firebase` npm package installed but never used. `src/firebase.ts` is dead code. Remove both.

### Play Store Readiness: NOT READY
- No signing keystore
- No Play Store listing
- No privacy policy
- No AAB build ever created

### App Store Readiness: NOT READY
- No provisioning profile
- No App Store listing
- No IPA build ever created

---

## 8. Known Technical Debt

### P0 — Fix Before Next Feature
1. `storage.ts` missing try/catch on setStoredValue/removeStoredValues
2. `maskPhone` inconsistent behavior (6 vs 7 chars) in explore.tsx vs draw.tsx/winner.tsx
3. Admin fetch functions silently swallow errors (admin.tsx:122-135)

### P1 — Fix Within 2 Weeks
4. Extract shared utilities: `image-utils.ts`, `errors.ts`, `contact.ts`, `validation.ts`
5. Admin email typo: "mithall" in draw.tsx:10
6. Wrap `handleEnter`/`toggleFavorite` in `useCallback`
7. `.env` committed to git — add to `.gitignore`, stop tracking
8. Remove dead Firebase dependency + `firebase.ts`
9. `dist.zip` committed to git — remove

### P2 — Fix Within 1 Month
10. Split `admin.tsx` (993 lines) into 5 components
11. Split `index.tsx` (1040 lines) into 4 components
12. Switch `supabase.ts` to use `process.env` instead of hardcoded values
13. Add error handling to `toggleStatus`/`rejectPayment`
14. Add CI lint + typecheck steps
15. Add Netlify security headers
16. Convert `favorites.includes()` to Set for O(1) lookup

### P3 — Fix When Convenient
17. Add Sentry or Expo Error Reporting
18. Add test framework
19. Remove dead StyleSheet entries (~25 in index.tsx)
20. Add pagination to admin panel
21. Remove unused components (hint-row.tsx, web-badge.tsx)
22. Document Edge Function deployment process
23. Create CHANGELOG.md

---

## 9. Production Readiness Checklist

| Area | Status | Notes |
|------|--------|-------|
| **Authentication** | PARTIAL | Phone-based only, no real security, AsyncStorage session |
| **Payments** | READY | JazzCash online + manual, Edge Function with HMAC verification |
| **Security** | PARTIAL | RLS active, RPCs SECURITY DEFINER, but no rate limiting, no monitoring |
| **Monitoring** | NOT READY | Zero crash reporting, zero analytics, zero uptime monitoring |
| **Crash Reporting** | NOT READY | No Sentry, no Crashlytics, no error tracking |
| **Testing** | NOT READY | No test framework, no automated tests |
| **Deployment (Web)** | READY | Netlify + GitHub Pages, auto-deploy on push |
| **Deployment (Mobile)** | NOT READY | EAS configured but never used |
| **Backups** | NOT READY | No verified backup strategy for database or storage |
| **CI/CD** | PARTIAL | GitHub Pages auto-deploy exists, but no lint/typecheck/test |
| **Documentation** | READY | 10+ knowledge base files, AI context, architecture decisions |

---

## 10. Future Roadmap

### Phase 1: Foundation (Weeks 1-2)
- Fix P0 technical debt (3 items, ~1 hour)
- Fix P1 technical debt (6 items, ~2 days)
- Add Sentry for crash reporting
- Add `.env` to `.gitignore`
- Remove dead Firebase dependency
- **Effort:** ~3 days

### Phase 2: Quality (Weeks 3-4)
- Split oversized components (admin.tsx, index.tsx)
- Extract shared utilities
- Add CI lint + typecheck
- Add test framework + basic tests
- Switch to `process.env` for Supabase config
- **Effort:** ~5-7 days

### Phase 3: Native Apps (Month 2)
- Set up EAS Build for Android
- Create Play Store listing
- Add push notifications
- Add privacy policy
- Submit to Play Store
- **Effort:** ~5-7 days

### Phase 4: Scale (Month 3+)
- Add pagination to admin
- Add monitoring dashboard
- Add automated database backups verification
- iOS App Store submission
- Performance optimization with React Profiler
- **Effort:** ~5-10 days

### Dependencies
- Phase 2 depends on Phase 1 (debt must be reduced first)
- Phase 3 depends on Phase 2 (quality gates before native deployment)
- Phase 4 is independent

---

## 11. Engineering Principles

### Documentation First
Every feature is not complete until documentation is updated. AI_CONTEXT, ARCHITECTURE_DECISIONS, DATABASE_GUIDE, and FEATURE_GUIDE must reflect current state.

### Security First
Never trust client-side logic for security. All sensitive operations go through SECURITY DEFINER RPCs. RLS is the primary access control mechanism.

### Rollback First
Every database change must have a rollback script. Every deployment must be reversible. Never make irreversible changes without explicit approval.

### No Breaking Migrations
Never modify existing table structures without a migration plan. Never remove columns without confirming no code references them. Never change RPC signatures without updating all callers.

### Evidence-Based Decisions
Classify findings as VERIFIED, INFERRED, or UNVERIFIED. Never claim performance issues without measurements. Never claim security vulnerabilities without attack scenarios.

### AI Context Must Remain Updated
After every feature, update `docs/JEETOBAZ_AI_CONTEXT.md`. This is the most important document for future AI assistants.

### Architecture Decisions Must Be Documented
When making significant design choices, add an ADR to `docs/ARCHITECTURE_DECISIONS.md`. Explain WHY, not just WHAT.

---

## 12. Final Engineering Score

| Dimension | Score | Notes |
|-----------|-------|-------|
| Architecture | 8/10 | Clean, well-decided, Supabase+RLS is solid |
| Security | 6/10 | RLS + RPCs strong, but phone auth is weak, no monitoring |
| Database | 8/10 | Well-designed, proper indexes, RPCs for sensitive ops |
| Code Quality | 6.5/10 | Two oversized components, duplication, missing error handling |
| Performance | 7/10 | Good use of memoization, expo-image, but some O(n²) patterns |
| Deployment | 4.5/10 | Web live, mobile not deployed, no monitoring |
| Documentation | 9/10 | Comprehensive knowledge base, AI context, architecture decisions |
| Maintainability | 5.5/10 | Oversized files hurt, but structure is clean |
| Scalability | 6/10 | Fine for current scale, needs pagination at 10K+ entries |
| **Overall** | **6.7/10** | |

---

*This is the official engineering baseline. Audit permanently closed.*
*Future work follows the implementation workflow: Request → Architecture Check → Implementation Plan → Code → Testing → Documentation Update → Git Commit.*
