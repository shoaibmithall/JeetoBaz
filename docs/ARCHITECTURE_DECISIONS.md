# JeetoBaz Architecture Decisions

> Why things are built the way they are. Last updated: 2026-07-15.
> Code tells you WHAT. This document tells you WHY.

---

## Decision 001: Why Supabase?

**Date:** 2025 (initial architecture)
**Decision:** Use Supabase as the sole backend.

**Reason:**
- PostgreSQL database with real-time capabilities
- Row Level Security (RLS) built-in — no custom middleware needed
- Storage buckets with policy-based access control
- Edge Functions for server-side logic (JazzCash IPN)
- Free tier generous for small projects (500MB database, 1GB storage, 500K Edge Function invocations)
- TypeScript SDK with excellent React Native support

**Alternatives considered:**
- Firebase: More popular in Pakistan, but Firestore pricing unpredictable at scale. Firebase Auth would solve our auth problem but adds vendor lock-in.
- Custom backend (Node.js/Express): Full control but requires server hosting, DevOps, SSL management.
- PocketBase: Lightweight but lacks edge functions and managed hosting.

**Tradeoffs:**
- ✅ No server management needed
- ✅ RLS eliminates most backend security code
- ✅ Single SDK for database + storage + auth + functions
- ❌ Vendor lock-in (Supabase-specific RLS, Edge Functions)
- ❌ Free tier limits may require upgrade at scale
- ❌ Less community support than Firebase in Pakistan

**Status:** Active. No migration planned.

---

## Decision 002: Why Not Firebase Auth?

**Date:** 2025 (initial architecture)
**Decision:** Do NOT use Firebase Authentication for users.

**Reason:**
- Firebase Auth costs money per MAU after free tier (10K monthly)
- Phone number verification via Firebase requires SMS OTP (costs money per SMS in Pakistan)
- Supabase Auth is free (unlimited MAU on free tier)
- Want to keep operating costs near zero for a small platform

**What we do instead:**
- Phone-based "authentication" via AsyncStorage (no real auth)
- Admin uses Supabase Auth (email+password, free)
- Users are identified by phone number in the database

**Tradeoffs:**
- ✅ Zero authentication costs
- ✅ No SMS OTP costs
- ✅ Simple implementation
- ❌ No real user authentication (security risk — See R-001)
- ❌ No session management
- ❌ Phone number is the only identity factor

**Status:** Known security risk. Phase 3A migration to Supabase Auth planned.

---

## Decision 003: Why Manual Payment Approval?

**Date:** 2025 (initial architecture)
**Decision:** Admin manually approves every payment receipt.

**Reason:**
- Pakistan's digital payment ecosystem is fragmented (JazzCash, Easypaisa, bank transfer)
- No unified payment verification API available
- JazzCash online integration exists but requires merchant account approval
- Manual approval builds trust — users see a human verified their payment
- Small scale (expected <100 transactions/day) makes manual review feasible

**How it works:**
1. User uploads payment screenshot
2. Admin views receipt in admin panel
3. Admin verifies amount, transaction ID, sender info
4. Admin approves → entry created
5. Admin rejects → user notified

**Future replacement:**
- JazzCash online payments (Phase 4) reduce manual work
- Potential: Easypaisa API integration (if available)
- Potential: Bank transfer verification API

**Tradeoffs:**
- ✅ Builds user trust (human verification)
- ✅ Handles all payment methods (JazzCash, Easypaisa, bank)
- ✅ No integration complexity for manual payments
- ❌ Slow (depends on admin availability)
- ❌ Scalability limit (admin is bottleneck)
- ❌ No duplicate payment protection at database level (R-002)

**Status:** Active. JazzCash online available as alternative. Manual flow remains primary.

---

## Decision 004: Why Expo (Not Native)?

**Date:** 2025 (initial architecture)
**Decision:** Use Expo 56 with React Native instead of native iOS/Android development.

**Reason:**
- Single codebase for iOS, Android, and Web
- Expo handles build pipeline, OTA updates, app store submission
- expo-router provides file-based routing (familiar to web developers)
- Web deployment via Netlify (jeetobaz.pk works on mobile browsers)
- Lower development cost (one developer, one codebase)
- Faster iteration (Expo Go for development)

**Alternatives considered:**
- Native Swift/Kotlin: Better performance but 2x development cost
- Flutter: Good cross-platform but smaller ecosystem in Pakistan
- React Native (bare workflow): More control but requires Xcode/Android Studio setup

**Tradeoffs:**
- ✅ Single codebase, triple deployment (iOS, Android, Web)
- ✅ Fast development cycle
- ✅ Web version works on mobile browsers (no app install needed)
- ❌ Performance limitations vs native
- ❌ Expo SDK version locks (must upgrade with Expo releases)
- ❌ Some native features require ejecting or custom dev clients

**Status:** Active. Expo 56 provides everything needed.

---

## Decision 005: Why UUID Primary Keys?

**Date:** 2025 (initial architecture)
**Decision:** Use UUID v4 for all primary keys instead of auto-incrementing integers.

**Reason:**
- UUIDs are globally unique — no collision risk across tables
- UUIDs don't leak information (auto-increment reveals record count)
- UUIDs work well with Supabase's client-side generation
- No need for database sequences or auto-increment configuration
- Offline-first friendly (client can generate IDs without server)

**Implementation:**
- PostgreSQL default: `gen_random_uuid()` (cryptographically random)
- No sequential pattern (prevents enumeration attacks)

**Tradeoffs:**
- ✅ No ID collision risk
- ✅ No information leakage
- ✅ Client-side generation possible
- ❌ Larger storage (36 bytes vs 4-8 bytes for integer)
- ❌ Less readable in debugging (can't just "increment by 1")
- ❌ Index fragmentation over time (mitigated by PostgreSQL UUID v4 indexing)

**Status:** Active. No migration planned.

---

## Decision 006: Why Edge Functions for JazzCash?

**Date:** 2025 (JazzCash integration)
**Decision:** Use Supabase Edge Functions for JazzCash IPN verification.

**Reason:**
- IPN (Instant Payment Notification) callback must be server-side
- JazzCash sends POST request to a public URL — needs a server endpoint
- Edge Functions are serverless (no server management)
- HMAC-SHA256 verification requires secret keys (can't be in client code)
- Edge Functions can access Supabase service role key (for database updates)

**Why not client-side:**
- JazzCash IPN is a server-to-server callback
- HMAC secret must never be exposed to client
- Transaction status update must be authoritative (server-trusted)

**Why not a separate server:**
- Edge Functions scale automatically
- No hosting costs on free tier
- Integrated with Supabase (can query database directly)

**Tradeoffs:**
- ✅ No server management
- ✅ Automatic scaling
- ✅ Integrated with Supabase
- ❌ Cold start latency (first request may be slow)
- ❌ Vendor lock-in (Deno runtime, Supabase-specific)
- ❌ Limited execution time (default 60 seconds)

**Status:** Active. Handles JazzCash online payment verification.

---

## Decision 007: Why Phone-Based User Identity?

**Date:** 2025 (initial architecture)
**Decision:** Use phone number as the primary user identifier.

**Reason:**
- Pakistan's digital ecosystem is phone-centric
- Everyone has a phone number (not everyone has email)
- JazzCash/Easypaisa accounts are linked to phone numbers
- Phone number is required for payment verification
- Simpler onboarding (no email/password to remember)

**How it works:**
- User enters phone number (+92XXXXXXXXXX)
- Phone stored in AsyncStorage as session
- All queries filter by phone number
- No OTP verification (phone is trusted as-is)

**Tradeoffs:**
- ✅ Simple onboarding (phone number only)
- ✅ Aligns with Pakistan's payment ecosystem
- ✅ No password management needed
- ❌ No real authentication (anyone can use any phone number)
- ❌ Phone number changes break all references
- ❌ No multi-device support (session is local)

**Status:** Known security risk. Phase 3A migration to Supabase Auth planned.

---

## Decision 008: Why current_entries Is Non-Atomic?

**Date:** 2025 (initial architecture)
**Decision:** `current_entries` is incremented client-side (non-atomic).

**Reason (at time of decision):**
- Admin is the only person approving payments
- Single admin = no concurrency (one person can't approve two payments simultaneously)
- Simple implementation: read value, increment, write back
- Referral RPC uses atomic SQL (`coalesce(current_entries, 0) + 1`)

**Why this is now a problem:**
- If admin opens multiple browser tabs, race condition possible
- If referral system creates entries while admin approves, count can be wrong
- `current_entries` could be lower than actual entries → overfilling draws

**Future fix (R-003):**
- Replace client-side increment with atomic SQL: `current_entries = coalesce(current_entries, 0) + 1`
- Or create an RPC function for entry creation that handles counting atomically

**Tradeoffs:**
- ✅ Simple to implement
- ✅ Works for single-admin scenario
- ❌ Race condition under concurrent operations
- ❌ Not consistent with referral system (which is atomic)

**Status:** Known issue (R-003). Fix planned before production.

---

## Decision 009: Known Technical Debt

**Date:** 2026-07-15 (identified during audit)

### T-001: AsyncStorage as Auth Authority
- **Impact:** HIGH — user identity in plaintext, no real authentication
- **Fix:** Phase 3A (Supabase Auth migration)
- **Effort:** Large (2-3 weeks)

### T-002: No Server-Side Duplicate Payment Protection
- **Impact:** HIGH — duplicate entries possible via direct API calls
- **Fix:** Enable unique partial index + deduplication query
- **Effort:** Small (1 SQL statement + data cleanup)

### T-003: Non-Atomic current_entries Increment
- **Impact:** HIGH — race condition under concurrent operations
- **Fix:** Atomic SQL update
- **Effort:** Small (1 RPC or SQL change)

### T-004: Admin Auth Divergence
- **Impact:** MEDIUM — email-based policies break if email changes
- **Fix:** Standardize to UUID in all policies
- **Effort:** Small (1 SQL migration)

### T-005: Notifications Table RLS Unverified
- **Impact:** MEDIUM — potential data exposure
- **Fix:** Verify + enable RLS + create policies
- **Effort:** Small (1 SQL statement + policies)

### T-006: Dead Firebase Code
- **Impact:** LOW — bundle size waste
- **Fix:** Remove firebase.ts + dependencies
- **Effort:** Small (1 file delete + package.json cleanup)

### T-007: Language Not Persisted
- **Impact:** LOW — language resets on restart
- **Fix:** Persist to AsyncStorage
- **Effort:** Small (1 line change)

### T-008: No User Profile Update
- **Impact:** MEDIUM — users can't correct signup errors
- **Fix:** Add UPDATE policy + UI
- **Effort:** Medium (SQL + screen update)

### T-009: No Account Deletion
- **Impact:** MEDIUM — no right to be forgotten
- **Fix:** Add DELETE policy + UI
- **Effort:** Medium (SQL + screen update)

---

## Decision 010: Future Migration Strategy

**Date:** 2026-07-15 (planned)

### Principle: Never Big-Bang Migrations

All migrations follow this pattern:
1. **Add new column/feature** alongside existing one
2. **Run both** for a transition period
3. **Verify** new system works correctly
4. **Switch** via feature flag
5. **Monitor** for issues
6. **Remove** old system after stability period

### Auth Migration Strategy (Phase 3A)

```
Step 1: Add auth_uid column to users table
Step 2: Create Supabase Auth users for existing users (batch)
Step 3: Link auth_uid to existing users.id
Step 4: Update RPCs to accept auth_uid (with phone fallback)
Step 5: Update client code to use Supabase Auth
Step 6: Feature flag: authMigrationEnabled
Step 7: Monitor for 30 days
Step 8: Remove phone-based auth code
Step 9: Remove AsyncStorage phone storage
```

### Rollback Plan
- Every migration has a rollback script
- Feature flags allow instant revert
- Database changes are additive (never destructive)
- Old code paths remain functional during transition

### Documentation Requirement
- Every migration must update:
  - `JEETOBAZ_DATABASE_GUIDE.md`
  - `JEETOBAZ_SECURITY_GUIDE.md`
  - `JEETOBAZ_AI_CONTEXT.md`
  - `CHECKPOINT-3-DATABASE-SECURITY-AUDIT.md` (if security-relevant)

---

*Architecture decisions document complete.*
