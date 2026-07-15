# Checkpoint 4: Technical Debt Register

> JeetoBaz2 — Aggregated technical debt from all analysis dimensions.
> Status: COMPLETE

---

## Debt Inventory by Priority

### 🔴 CRITICAL (Fix Before Any Feature Work)

| ID | Debt | Source | Impact | Est. Effort |
|----|------|--------|--------|-------------|
| TD-001 | `admin.tsx` is 993 lines with 24+ useState, 5 tabs in one component | Code Quality O-001 | Every feature change risks breaking other tabs | 2-3 days to split |
| TD-002 | `index.tsx` is 1040 lines with 17 useState, 598-line function | Code Quality O-002 | Core screen is fragile and hard to modify | 2-3 days to split |
| TD-003 | `handleEnter`/`toggleFavorite` not wrapped in `useCallback` | Performance P-003 | Defeats memoization on 120+ product cards | 30 min |
| TD-004 | Hardcoded Supabase URL + anon key in `supabase.ts` | Code Quality HV-001 | Cannot configure per environment | 15 min |
| TD-005 | Firebase config + entire `firebase.ts` is dead code | Code Quality DC-004 | Dead dependency, confusion for developers | 15 min |

### 🟠 HIGH (Fix Within 2 Weeks)

| ID | Debt | Source | Impact | Est. Effort |
|----|------|--------|--------|-------------|
| TD-006 | No shared utility layer — 10 duplicated code patterns | Code Quality CC-001 | Every new file must re-implement utilities | 1 day to extract |
| TD-007 | `dataUrlToArrayBuffer` duplicated in 2 files | Code Quality D-001 | Bug fix required in 2 places | 15 min |
| TD-008 | MIME→extension mapping duplicated 4 times | Code Quality D-002 | Inconsistent behavior risk | 15 min |
| TD-009 | `extractErrorMessage` duplicated 8+ times | Code Quality D-003 | Inconsistent error handling | 30 min |
| TD-010 | `maskPhone` inconsistent (6 vs 7 chars) across 3 files | Code Quality D-004 | Inconsistent phone masking to users | 15 min |
| TD-011 | `firstValue` duplicated in 2 files | Code Quality D-005 | DRY violation | 10 min |
| TD-012 | `getTicketNumber` duplicated in 2 files | Code Quality D-006 | DRY violation | 10 min |
| TD-013 | Contact constants duplicated in 3 files | Code Quality D-007 | Stale constant risk | 10 min |
| TD-014 | ImagePicker + upload pattern duplicated 4 times | Code Quality D-008 | 4-way divergence risk | 1 hour |
| TD-015 | `RECEIPT_BUCKET` duplicated in 2 files | Code Quality D-009 | DRY violation | 5 min |
| TD-016 | Image upload workflow duplicated (winner photo + home ad) | Code Quality D-010 | DRY violation | 1 hour |
| TD-017 | No try/catch in `storage.ts` operations | Code Quality EH-001 | Silent crash on quota exceeded | 15 min |
| TD-018 | `fetchHomeAds`/`handleEnter`/`toggleFavorite` no try/catch | Code Quality EH-002/003/004 | Unhandled errors crash screen | 30 min |
| TD-019 | admin.tsx fetch functions silently swallow errors | Code Quality EH-005 | Broken state on fetch failure | 30 min |
| TD-020 | `toggleStatus`/`rejectPayment` no error handling | Code Quality EH-008/009 | Admin actions fail silently | 15 min |
| TD-021 | Unsafe type casts `(entryData || []) as unknown as EntryWithProduct[]` | Code Quality TS-001 | Runtime errors on schema change | 30 min |
| TD-022 | `favorites.includes()` O(n) inside map → O(n²) | Performance Q-002 | Slow rendering with many favorites | 15 min |
| TD-023 | N+1 query in `clearPendingPaymentsWithExistingEntries` | Performance Q-001 | Slow on many pending payments | 30 min |
| TD-024 | `StatCard` defined inside parent component | Performance P-005 | Defeats memoization | 5 min |
| TD-025 | admin.tsx loads ALL records without pagination | Performance N-002 | Slow as data grows | 1-2 days |
| TD-026 | `getReferralDeviceToken()` called 3 times | Performance Q-003 | Unnecessary AsyncStorage reads | 10 min |
| TD-027 | Repeated fetch triplets in 4 places in admin.tsx | Performance Q-004 | Code duplication | 15 min |
| TD-028 | Admin email misspelled as "mithall" in draw.tsx | Code Quality HV-003 | Potential auth bypass | 5 min |
| TD-029 | No business logic service layer | Maintainability BL-001 | Cannot test logic independently | 3-5 days |

### 🟡 MEDIUM (Fix Within 1 Month)

| ID | Debt | Source | Impact | Est. Effort |
|----|------|--------|--------|-------------|
| TD-030 | ~20 dead StyleSheet entries in index.tsx | Code Quality DC-001 | Code bloat | 15 min |
| TD-031 | Dead StyleSheet entries in admin.tsx | Code Quality DC-002 | Code bloat | 10 min |
| TD-032 | Dead components: hint-row.tsx, web-badge.tsx, app-tabs.tsx | Code Quality DC-003 | Confusion | 5 min |
| TD-033 | Duplicate hydration pattern in category-browser.tsx + _layout.tsx | Code Quality DC-005 | DRY violation | 10 min |
| TD-034 | Loose union types `status: 'active' | 'completed' | string` | Code Quality TS-002 | Weak typing | 30 min |
| TD-035 | `as never` type bypasses in faq.tsx, home-header.tsx | Code Quality TS-003 | Type safety bypass | 30 min |
| TD-036 | Non-null assertions without validation in draw.tsx | Code Quality TS-004 | Runtime crash risk | 15 min |
| TD-037 | 17 useState calls in index.tsx — no consolidation | Performance P-001 | Re-render overhead | 1 hour |
| TD-038 | 24+ useState in admin.tsx — no consolidation | Performance P-002 | Re-render overhead | 1 hour |
| TD-039 | `time` state triggers full re-render every 60s | Performance P-006 | Unnecessary re-renders | 15 min |
| TD-040 | Revenue stats computed on every render | Performance P-007 | Minor perf impact | 10 min |
| TD-041 | No useCallback on any admin.tsx functions | Performance P-004 | Child re-render overhead | 30 min |
| TD-042 | Hardcoded colors in 5+ screens instead of theme | Code Quality HV-004 | Inconsistent UI | 1 hour |
| TD-043 | `parseHomeAdImagesInput` called twice per render | Performance Q-005 | Minor redundancy | 10 min |
| TD-044 | No image caching strategy configured | Performance N-001 | Re-download on every visit | 30 min |
| TD-045 | ~30 inline style objects per card | Performance R-001 | Memory allocation overhead | 1 hour |
| TD-046 | `HomeProductCard` 155 lines, deeply nested | Performance R-002 | Readability | 1 hour |
| TD-047 | Keyframe created inside render in animated-icon.tsx | Performance R-003 | Minor perf impact | 5 min |
| TD-048 | Component naming mismatches (login→Profile, explore→Winners) | Maintainability MO-003 | Developer confusion | 30 min |
| TD-049 | 13 AsyncStorage keys with no central registry | Maintainability C-003 | Key collision risk | 15 min |
| TD-050 | `select('*')` used in many queries | Performance S-001 | Over-fetching data | 1 hour |

### 🟢 LOW (Fix When Convenient)

| ID | Debt | Source | Impact | Est. Effort |
|----|------|--------|--------|-------------|
| TD-051 | Empty catch block in notifications.ts | Code Quality EH-007 | Silent failure | 5 min |
| TD-052 | No debouncing on search input | Performance N-004 | Minor keystroke overhead | 15 min |
| TD-053 | No query result caching | Performance S-002 | Minor redundancy | RISKY |
| TD-054 | Missing `.single()` standardization | Performance S-003 | Inconsistent patterns | 30 min |
| TD-055 | functions defined inside render (category-browser.tsx) | Performance R-004 | Minor overhead | 5 min |

---

## Debt by Category

| Category | Count | CRITICAL | HIGH | MEDIUM | LOW |
|----------|-------|----------|------|--------|-----|
| Code Duplication | 10 | 0 | 10 | 0 | 0 |
| Missing Error Handling | 8 | 0 | 6 | 1 | 1 |
| Oversized Components | 4 | 2 | 2 | 0 | 0 |
| Performance | 15 | 1 | 5 | 8 | 1 |
| Dead Code | 5 | 1 | 0 | 3 | 1 |
| Type Safety | 4 | 0 | 1 | 3 | 0 |
| Naming | 3 | 0 | 1 | 2 | 0 |
| Hardcoded Values | 4 | 1 | 1 | 2 | 0 |
| Architecture | 3 | 1 | 1 | 1 | 0 |
| **TOTAL** | **55** | **5** | **26** | **20** | **4** |

---

## Estimated Total Effort

| Priority | Items | Estimated Effort |
|----------|-------|-----------------|
| CRITICAL | 5 | ~6-7 days |
| HIGH | 26 | ~8-10 days |
| MEDIUM | 20 | ~4-5 days |
| LOW | 4 | ~1 day |
| **Total** | **55** | **~19-23 days** |

---

## Recommended Fix Order

### Week 1: Quick Wins (CRITICAL + easy HIGH)
1. Remove dead Firebase code (TD-005) — 15 min
2. Wrap useCallback on handleEnter/toggleFavorite (TD-003) — 30 min
3. Fix inconsistent maskPhone (TD-010) — 15 min
4. Extract shared utilities (TD-006) — 1 day
5. Add error handling to storage.ts (TD-017) — 15 min
6. Fix favorites.includes() → Set.has() (TD-022) — 15 min

### Week 2: Core Refactors (CRITICAL architectural)
7. Split admin.tsx into 4-5 components (TD-001) — 2-3 days
8. Split index.tsx into 4 components (TD-002) — 2-3 days

### Week 3-4: HIGH items
9. Extract service layer (TD-029) — 3-5 days
10. Add pagination to admin (TD-025) — 1-2 days
11. Remaining HIGH items — 2-3 days

### Month 2+: MEDIUM + LOW items
12. Consolidate useState, add useMemo, theme consistency, etc.

---

*Technical debt register complete.*
