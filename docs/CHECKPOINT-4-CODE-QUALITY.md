# Checkpoint 4: Code Quality Audit

> JeetoBaz2 — Code quality analysis of all 41 TypeScript files.
> Status: COMPLETE

---

## 1. Duplicated Logic

### D-001: `dataUrlToArrayBuffer` — Byte-for-byte identical in 2 files
- **Files:** `login.tsx:21-30`, `payment.tsx:43-52`
- **Severity:** CRITICAL
- **Fix:** Extract to `src/lib/image-utils.ts`
- **Classification:** SAFE

### D-002: MIME → Extension Mapping — Duplicated 4 times across 3 files
- **Files:** `admin.tsx:239-243`, `admin.tsx:389-394`, `login.tsx:197-201`, `payment.tsx:123-127`
- **Code:** `mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'`
- **Severity:** CRITICAL
- **Fix:** Extract to `src/lib/image-utils.ts`
- **Classification:** SAFE

### D-003: Error Extraction Helper — Duplicated 8+ times across 3 files
- **Files:** `admin.tsx:262,362,413,483,540`, `login.tsx:233`, `payment.tsx:265`
- **Code:** `error && typeof error === 'object' && 'message' in error ? String(error.message) : 'fallback'`
- **Severity:** HIGH
- **Fix:** Extract to `src/lib/errors.ts` as `extractErrorMessage(error, fallback)`
- **Classification:** SAFE

### D-004: `maskPhone` — Inconsistent implementations across 3 files
- **Files:** `draw.tsx:130-133`, `winner.tsx:66-69`, `explore.tsx:60-63`
- **Issue:** `explore.tsx` masks first 6 chars, others mask first 7 chars
- **Severity:** HIGH
- **Fix:** Extract to `src/lib/validation.ts` with consistent behavior
- **Classification:** SAFE

### D-005: `firstValue` Helper — Duplicated in 2 files
- **Files:** `payment-response.tsx:16-18`, `jazzcash-redirect.tsx:15-17`
- **Severity:** HIGH
- **Fix:** Extract to shared utility
- **Classification:** SAFE

### D-006: `getTicketNumber` Logic — Duplicated in 2 files
- **Files:** `entries.tsx:96-98`, `explore.tsx:65-68`
- **Code:** `entry.ticket_number || \`JB-${entry.id.slice(0, 8).toUpperCase()}\``
- **Severity:** HIGH
- **Fix:** Extract to `src/lib/validation.ts`
- **Classification:** SAFE

### D-007: Contact Constants — Duplicated in 3 files
- **Files:** `about.tsx:51-54`, `help.tsx:8-10`, `privacy.tsx:7-9`
- **Constants:** SUPPORT_PHONE, SUPPORT_PHONE_DISPLAY, SUPPORT_EMAIL, WEBSITE
- **Severity:** HIGH
- **Fix:** Extract to `src/lib/contact.ts`
- **Classification:** SAFE

### D-008: ImagePicker Permission + Launch Pattern — Duplicated 4 times
- **Files:** `admin.tsx:220-233`, `admin.tsx:365-378`, `login.tsx:177-189`, `payment.tsx:92-103`
- **Severity:** MEDIUM
- **Fix:** Extract to `src/lib/image-utils.ts`
- **Classification:** SAFE

### D-009: `RECEIPT_BUCKET` Constant — Duplicated in 2 files
- **Files:** `admin.tsx:18`, `payment.tsx:12`
- **Severity:** MEDIUM
- **Fix:** Extract to constants file
- **Classification:** SAFE

### D-010: Image Upload Pattern — Duplicated between winner photo and home ad
- **Files:** `admin.tsx:214-269` (uploadWinnerPhoto), `admin.tsx:364-420` (uploadHomeAdImage)
- **Issue:** Same 8-step pattern: permission → picker → extension → fetch → upload → URL → setState → error
- **Severity:** HIGH
- **Fix:** Extract to `uploadToBucket(bucket, options)` utility
- **Classification:** SAFE

---

## 2. Oversized Files / Functions

### O-001: `admin.tsx` — 993 lines (875 in component)
- **Severity:** CRITICAL
- **Issue:** Single component contains auth, CRUD, payment approval, settings, image upload, notifications
- **Fix:** Split into `AdminAuth`, `ProductManager`, `PaymentApprover`, `AdminSettings` components
- **Classification:** RISKY (many cross-component state dependencies)

### O-002: `index.tsx` — 1040 lines (598 in HomeScreen component)
- **Severity:** CRITICAL
- **Issue:** 17 useState calls, 5 useMemo/useEffect, 7 inner functions, entire JSX tree
- **Fix:** Split into `HomeScreen`, `HomeProductCard`, `PriceFilter`, `AdBanner`, `CategoryFilter`
- **Classification:** RISKY (state lifting required)

### O-003: `login.tsx` — 515 lines (431 in ProfileScreen)
- **Severity:** HIGH
- **Issue:** Contains phone entry, name entry, and full profile views in one function
- **Fix:** Split into `LoginView`, `SignupView`, `ProfileView`
- **Classification:** SAFE

### O-004: `payment.tsx` — 444 lines (132 in confirmPayment)
- **Severity:** HIGH
- **Issue:** `confirmPayment` function has 6 sequential database operations
- **Fix:** Extract validation and submission into separate functions
- **Classification:** SAFE

### O-005: `approvePayment` in admin.tsx — 106 lines
- **Severity:** HIGH
- **Issue:** 4 sequential DB operations, complex branching, notification
- **Fix:** Extract into dedicated approval service
- **Classification:** SAFE

---

## 3. Dead Code

### DC-001: ~20 Unused StyleSheet Entries in `index.tsx`
- **Lines:** 858-869, 873, 878, 893, 895, 899-900, 904, 906, 917, 958-959, 967, 1001, 1011
- **Names:** loading, loadingText, header, headerCompact, brand, brandLogo, title, tagline, headerRight, etc.
- **Severity:** MEDIUM
- **Fix:** Remove unused styles
- **Classification:** SAFE

### DC-002: Unused StyleSheet Entries in `admin.tsx`
- **Lines:** `tabText` (915), `reminderButtonText` (970), `deleteButtonText` (972)
- **Severity:** LOW
- **Fix:** Remove
- **Classification:** SAFE

### DC-003: Dead Components
- **Files:** `hint-row.tsx` (template boilerplate), `web-badge.tsx` (Expo boilerplate), `app-tabs.tsx` (unused NativeTabs)
- **Severity:** MEDIUM
- **Fix:** Remove unused components
- **Classification:** SAFE

### DC-004: `firebase.ts` — Entire File is Dead Code
- **Severity:** HIGH (from R-017)
- **Fix:** Remove file + Firebase dependency from package.json
- **Classification:** SAFE

### DC-005: Duplicate Hydration Pattern
- **Files:** `category-browser.tsx:77-81` and `_layout.tsx:14-23` — identical `hasHydratedLayout` state
- **Severity:** LOW
- **Fix:** Extract `useHydratedLayout()` hook
- **Classification:** SAFE

---

## 4. Hardcoded Values

### HV-001: Supabase URL and Anon Key Hardcoded
- **File:** `supabase.ts:4-6`
- **Severity:** CRITICAL (security concern — anon key is public but should still be configurable)
- **Fix:** Move to `process.env.EXPO_PUBLIC_SUPABASE_URL` etc.
- **Classification:** SAFE

### HV-002: Firebase Config Hardcoded
- **File:** `firebase.ts:4-11`
- **Severity:** CRITICAL (dead code + hardcoded)
- **Fix:** Remove entire file
- **Classification:** SAFE

### HV-003: Admin Email Hardcoded
- **File:** `draw.tsx:10` — `const ADMIN_EMAIL = 'shoaibmithall@gmail.com'`
- **Severity:** HIGH
- **Issue:** Email is misspelled ("mithall" vs "mithal" used elsewhere)
- **Fix:** Centralize in constants or app_settings
- **Classification:** SAFE

### HV-004: Hardcoded Colors in 5+ Screens
- **Files:** `draw.tsx`, `help.tsx`, `language.tsx`, `winner.tsx`, `data-error-state.tsx`
- **Issue:** Colors like `#020d09`, `#FFD700`, `#18a663`, `#888` hardcoded instead of using theme
- **Severity:** MEDIUM
- **Fix:** Use `useAppTheme()` consistently
- **Classification:** SAFE

---

## 5. Missing Error Handling

### EH-001: `storage.ts` — No try/catch on Any Operation
- **File:** `storage.ts:11-17`
- **Issue:** `setStoredValue` and `removeStoredValues` have no try/catch. AsyncStorage can fail (quota exceeded, corruption).
- **Severity:** HIGH
- **Fix:** Add try/catch with silent fallback
- **Classification:** SAFE

### EH-002: `fetchHomeAds` in index.tsx — No try/catch
- **File:** `index.tsx:444`
- **Severity:** HIGH
- **Fix:** Wrap in try/catch
- **Classification:** SAFE

### EH-003: `handleEnter` in index.tsx — No try/catch
- **File:** `index.tsx:466`
- **Severity:** HIGH
- **Fix:** Wrap in try/catch
- **Classification:** SAFE

### EH-004: `toggleFavorite` in index.tsx — No try/catch
- **File:** `index.tsx:485`
- **Severity:** MEDIUM
- **Fix:** Wrap in try/catch
- **Classification:** SAFE

### EH-005: All fetch functions in admin.tsx — Silent error swallowing
- **Files:** `admin.tsx:122-135`
- **Issue:** `{ data } = await supabase...` — error is completely ignored
- **Severity:** HIGH
- **Fix:** Check `error` and display error state
- **Classification:** SAFE

### EH-006: `fetchStats` in login.tsx — No error handling
- **File:** `login.tsx:76`
- **Severity:** MEDIUM
- **Fix:** Add try/catch
- **Classification:** SAFE

### EH-007: `notifications.ts:26-28` — Empty catch block
- **File:** `notifications.ts:26-28`
- **Code:** `catch {}` — completely silent
- **Severity:** MEDIUM
- **Fix:** At minimum, log in dev mode
- **Classification:** SAFE

### EH-008: `toggleStatus` in admin.tsx — No error handling
- **File:** `admin.tsx:318`
- **Severity:** HIGH
- **Fix:** Add try/catch
- **Classification:** SAFE

### EH-009: `rejectPayment` in admin.tsx — No error handling
- **File:** `admin.tsx:574`
- **Severity:** HIGH
- **Fix:** Add try/catch
- **Classification:** SAFE

---

## 6. Type Safety Issues

### TS-001: Unsafe Type Casts in entries.tsx
- **File:** `entries.tsx:76-77`
- **Code:** `(entryData || []) as unknown as EntryWithProduct[]`
- **Severity:** HIGH
- **Fix:** Use Supabase generic types or runtime validation
- **Classification:** SAFE

### TS-002: Loose Union Types in database.ts
- **File:** `database.ts:5` — `status: 'active' | 'completed' | string`
- **Issue:** `| string` defeats the purpose of the union
- **Severity:** MEDIUM
- **Fix:** Use proper string literal unions
- **Classification:** SAFE

### TS-003: `as never` Type Bypasses
- **Files:** `faq.tsx:207`, `home-header.tsx:118`
- **Severity:** MEDIUM
- **Fix:** Proper typing
- **Classification:** SAFE

### TS-004: Non-null Assertions Without Validation
- **Files:** `draw.tsx:79,91` — `productIdValue!`
- **Severity:** MEDIUM
- **Fix:** Add null check or use type guard
- **Classification:** SAFE

---

## 7. Naming Inconsistencies

### NI-001: Component Named `ProfileScreen` in `login.tsx`
- **Issue:** File is `login.tsx` but component is `ProfileScreen`. It handles both login AND profile.
- **Severity:** HIGH
- **Fix:** Rename file to `profile.tsx` or split into `login.tsx` + `profile.tsx`
- **Classification:** RISKY (route changes)

### NI-002: Component Named `WinnersScreen` in `explore.tsx`
- **Issue:** File is `explore.tsx` but component is `WinnersScreen`
- **Severity:** MEDIUM
- **Fix:** Rename consistently
- **Classification:** RISKY (route changes)

### NI-003: Inconsistent `maskPhone` — 6 vs 7 chars
- **Files:** `explore.tsx:60` masks 6, others mask 7
- **Severity:** HIGH
- **Fix:** Standardize to 7 chars
- **Classification:** SAFE

---

## 8. Cross-Cutting Concerns

### CC-001: No Shared Utility Layer
- **Issue:** Common operations (error extraction, image utils, contact constants, phone masking) are duplicated across files instead of being in shared utilities
- **Severity:** HIGH
- **Fix:** Create `src/lib/image-utils.ts`, `src/lib/errors.ts`, `src/lib/contact.ts`
- **Classification:** SAFE

### CC-002: Inconsistent Theme Usage
- **Issue:** 5+ screens use hardcoded colors instead of `useAppTheme()`
- **Severity:** MEDIUM
- **Fix:** Standardize theme usage
- **Classification:** SAFE

---

*Code quality audit complete.*
