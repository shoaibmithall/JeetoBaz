# Checkpoint 4: Maintainability Audit

> JeetoBaz2 — Code maintainability and structural analysis.
> Status: COMPLETE

---

## 1. File Organization

### MO-001: No Shared Utility Layer
- **Severity:** HIGH
- **Issue:** Common operations (error extraction, image utils, contact constants, phone masking) are duplicated across files instead of being in shared utilities
- **Missing files:**
  - `src/lib/image-utils.ts` — dataUrlToArrayBuffer, MIME→extension, ImagePicker wrapper
  - `src/lib/errors.ts` — extractErrorMessage
  - `src/lib/contact.ts` — SUPPORT_PHONE, SUPPORT_EMAIL, WEBSITE
- **Impact:** Every new feature must re-implement these utilities
- **Classification:** SAFE

### MO-002: No Service Layer
- **Severity:** HIGH
- **Issue:** All database queries are directly in screen components. No abstraction between UI and data layer.
- **Impact:** Changing a query requires modifying the screen component
- **Fix:** Create `src/services/` with `products.ts`, `entries.ts`, `transactions.ts`, etc.
- **Classification:** RISKY (significant refactor)

### MO-003: Component Naming Mismatches
- **Files:** `login.tsx` → `ProfileScreen`, `explore.tsx` → `WinnersScreen`
- **Severity:** MEDIUM
- **Impact:** Confusing for developers navigating the codebase
- **Fix:** Rename files or components to match
- **Classification:** RISKY (route changes)

---

## 2. Function Size Analysis

| File | Function | Lines | Verdict |
|------|----------|-------|---------|
| `admin.tsx` | AdminScreen | 875 | ❌ CRITICAL — must split |
| `index.tsx` | HomeScreen | 598 | ❌ CRITICAL — must split |
| `login.tsx` | ProfileScreen | 431 | ❌ HIGH — should split |
| `payment.tsx` | confirmPayment | 132 | ❌ HIGH — should decompose |
| `admin.tsx` | approvePayment | 106 | ❌ HIGH — should extract |
| `index.tsx` | HomeProductCard | 155 | ⚠️ MEDIUM — extract sub-components |
| `referral.tsx` | ReferralScreen | 299 | ⚠️ MEDIUM — acceptable |
| `admin.tsx` | uploadWinnerPhoto | 55 | ⚠️ MEDIUM — extract utility |
| `admin.tsx` | uploadHomeAdImage | 56 | ⚠️ MEDIUM — extract utility |

**Recommended maximum:** 200 lines per component, 50 lines per function

---

## 3. Business Logic Mixed with UI

### BL-001: Database Queries Inside Render Logic
- **Files:** `admin.tsx` (all CRUD), `payment.tsx` (all validation), `login.tsx` (user lookup)
- **Severity:** HIGH
- **Issue:** Screen components directly call `supabase.from()`. No service abstraction.
- **Impact:** Cannot test business logic independently. Cannot reuse queries.
- **Fix:** Extract to service layer
- **Classification:** RISKY (significant refactor)

### BL-002: Payment Validation in UI Component
- **File:** `payment.tsx:140-272` (confirmPayment)
- **Severity:** HIGH
- **Issue:** 6 sequential validation/business operations mixed with UI state management
- **Impact:** Business rules embedded in component — cannot test without rendering
- **Fix:** Extract to `src/services/payment.ts`
- **Classification:** RISKY

### BL-003: Image Upload Logic Duplicated Across Components
- **Files:** `admin.tsx:214-269`, `admin.tsx:364-420`, `login.tsx:174-230`, `payment.tsx:86-134`
- **Severity:** HIGH
- **Issue:** Same upload workflow implemented 4 times
- **Fix:** Extract to `src/lib/image-utils.ts`
- **Classification:** SAFE

---

## 4. Coupling Analysis

### C-001: Tight Coupling Between admin.tsx Tabs
- **Severity:** HIGH
- **Issue:** All 5 admin tabs (products, users, entries, transactions, settings) share state in a single 875-line component. Changing one tab's logic risks breaking another.
- **Fix:** Split into separate tab components with shared state via context
- **Classification:** RISKY

### C-002: Screen ↔ Database Direct Coupling
- **Severity:** MEDIUM
- **Issue:** Every screen has `supabase.from()` calls directly in component bodies
- **Impact:** Database schema changes require modifying screen files
- **Fix:** Service layer abstraction
- **Classification:** RISKY

### C-003: AsyncStorage as Global State
- **Severity:** MEDIUM
- **Issue:** 13 different AsyncStorage keys accessed across 10+ files with no central registry
- **Fix:** Create `src/constants/storage-keys.ts`
- **Classification:** SAFE

---

## 5. Reusable Logic Opportunities

| Logic | Current Location | Times Used | Should Be |
|-------|-----------------|------------|-----------|
| dataUrlToArrayBuffer | login.tsx, payment.tsx | 2 | `@/lib/image-utils` |
| MIME→extension | admin.tsx, login.tsx, payment.tsx | 4 | `@/lib/image-utils` |
| extractErrorMessage | admin.tsx, login.tsx, payment.tsx | 8+ | `@/lib/errors` |
| maskPhone | draw.tsx, winner.tsx, explore.tsx | 3 | `@/lib/validation` |
| firstValue | payment-response.tsx, jazzcash-redirect.tsx | 2 | `@/lib/utils` |
| getTicketNumber | entries.tsx, explore.tsx | 2 | `@/lib/validation` |
| contact constants | about.tsx, help.tsx, privacy.tsx | 3 | `@/lib/contact` |
| ImagePicker wrapper | admin.tsx, login.tsx, payment.tsx | 4 | `@/lib/image-utils` |
| uploadToStorage | admin.tsx, login.tsx, payment.tsx | 4 | `@/lib/image-utils` |

---

## 6. Code Smell Summary

| Code Smell | Count | Severity |
|------------|-------|----------|
| Large Class/Component (>500 lines) | 2 | CRITICAL |
| Long Method (>100 lines) | 3 | HIGH |
| Duplicated Code | 10 patterns | HIGH |
| Feature Envy (UI calling DB directly) | 10+ files | HIGH |
| Primitive Obsession (strings as IDs) | 5+ files | MEDIUM |
| Dead Code | 5 instances | MEDIUM |
| Inconsistent Naming | 3 files | MEDIUM |
| Magic Numbers | 10+ instances | LOW |

---

## 7. Maintainability Score by File

| File | Lines | Complexity | Duplication | Error Handling | Score |
|------|-------|------------|-------------|----------------|-------|
| `referral.tsx` | 399 | LOW | LOW | MEDIUM | 8/10 |
| `winner.tsx` | ~100 | LOW | LOW | LOW | 8/10 |
| `explore.tsx` | ~100 | LOW | LOW | LOW | 8/10 |
| `favorites.tsx` | ~100 | LOW | LOW | LOW | 8/10 |
| `entries.tsx` | ~200 | LOW | LOW | MEDIUM | 7/10 |
| `draw.tsx` | ~100 | LOW | LOW | LOW | 7/10 |
| `login.tsx` | 515 | HIGH | HIGH | MEDIUM | 5/10 |
| `payment.tsx` | 444 | HIGH | HIGH | MEDIUM | 5/10 |
| `index.tsx` | 1040 | CRITICAL | HIGH | HIGH | 3/10 |
| `admin.tsx` | 993 | CRITICAL | CRITICAL | HIGH | 2/10 |

---

## 8. Recommended File Splits

### `index.tsx` (1040 → ~4 files)
```
src/app/index.tsx          → HomeScreen (orchestrator, ~200 lines)
src/components/home-product-card.tsx → HomeProductCard (~150 lines)
src/components/home-price-filter.tsx → PriceFilter (~80 lines)
src/components/home-ad-banner.tsx    → AdBanner (~60 lines)
```

### `admin.tsx` (993 → ~5 files)
```
src/app/admin.tsx          → AdminScreen (orchestrator, ~200 lines)
src/components/admin-product-manager.tsx → ProductManager (~200 lines)
src/components/admin-payment-approver.tsx → PaymentApprover (~150 lines)
src/components/admin-settings.tsx → Settings (~150 lines)
src/components/admin-user-list.tsx → UserList (~100 lines)
```

### `login.tsx` (515 → ~3 files)
```
src/app/login.tsx          → LoginScreen (router, ~100 lines)
src/components/login-form.tsx → LoginForm (~150 lines)
src/components/profile-view.tsx → ProfileView (~200 lines)
```

---

*Maintainability audit complete.*
