# Checkpoint 4: Performance Audit

> JeetoBaz2 — Performance analysis across all screens and libraries.
> Status: COMPLETE

---

## 1. React / Expo Performance

### P-001: `index.tsx` — 17 useState Calls, No Consolidation
- **File:** `index.tsx:259-290`
- **Severity:** HIGH
- **Impact:** Each state change triggers full component re-render
- **Consolidation opportunities:**
  - `loading`, `loadError`, `cacheInfo` → single `fetchState` object
  - `showPriceFilter`, `showFilters` → single `activeFilterPanel` state
  - `homeAdImages`, `activeAdIndex`, `adsLoading` → single `adsState` object
- **Fix:** Group related states into objects
- **Classification:** SAFE

### P-002: `admin.tsx` — 24+ useState Calls, No Consolidation
- **File:** `admin.tsx:23-52`
- **Severity:** HIGH
- **Impact:** 9 product form fields as separate states — each update triggers full re-render
- **Fix:** Consolidate product form into `useState<ProductFormData>`
- **Classification:** SAFE

### P-003: `handleEnter` and `toggleFavorite` Not Wrapped in useCallback
- **File:** `index.tsx:466-491`
- **Severity:** CRITICAL
- **Impact:** These functions are recreated every render and passed to memoized `HomeProductCard`, defeating memoization
- **Fix:** Wrap in `useCallback` with proper dependencies
- **Classification:** SAFE

### P-004: All Functions in admin.tsx Recreated Every Render
- **File:** `admin.tsx` — 12+ functions with no `useCallback`
- **Severity:** HIGH
- **Impact:** Every state change recreates all functions, causing child re-renders
- **Fix:** Wrap in `useCallback`
- **Classification:** SAFE

### P-005: `StatCard` Defined Inside `ReferralScreen`
- **File:** `referral.tsx:342`
- **Severity:** HIGH
- **Impact:** Component is recreated every render, defeating any potential memoization
- **Fix:** Extract outside parent component
- **Classification:** SAFE

### P-006: `time` State Triggers Full Re-render Every 60 Seconds
- **File:** `index.tsx:285`
- **Severity:** MEDIUM
- **Impact:** Forces all 120+ product cards to re-evaluate `getDrawScheduleStatus`
- **Fix:** Use `useRef` + `setInterval` instead of `useState` for time
- **Classification:** SAFE

### P-007: Revenue Stats Computed on Every Render in admin.tsx
- **File:** `admin.tsx:580-583`
- **Severity:** MEDIUM
- **Impact:** `reduce` and `filter` run on every render
- **Fix:** Wrap in `useMemo`
- **Classification:** SAFE

---

## 2. Database Query Performance

### Q-001: N+1 Query in admin.tsx `clearPendingPaymentsWithExistingEntries`
- **File:** `admin.tsx:147-171`
- **Severity:** HIGH
- **Impact:** Makes individual DB queries in a `for` loop for each pending transaction
- **Fix:** Batch into single query with `.in()` filter
- **Classification:** SAFE

### Q-002: `favorites.includes(p.id)` O(n) Inside Map
- **File:** `index.tsx:831`
- **Severity:** HIGH
- **Impact:** `includes()` is O(n), called inside `.map()` of 120 products → O(n²)
- **Fix:** Convert `favorites` to `Set` via `useMemo`, use `.has()`
- **Classification:** SAFE

### Q-003: `getReferralDeviceToken()` Called 3 Times
- **File:** `referral.tsx:88,152,172`
- **Severity:** MEDIUM
- **Impact:** AsyncStorage read 3 times per screen load
- **Fix:** Compute once, store in ref
- **Classification:** SAFE

### Q-004: Repeated Fetch After Mutations in admin.tsx
- **File:** `admin.tsx:498-500, 544-546, 569-571`
- **Severity:** MEDIUM
- **Impact:** `fetchProducts(); fetchEntries(); fetchTransactions()` called together in 4 places
- **Fix:** Extract to `refreshAllData()` function
- **Classification:** SAFE

### Q-005: `parseHomeAdImagesInput()` Called Twice Per Render
- **File:** `admin.tsx:842,844`
- **Severity:** LOW
- **Impact:** Parses same string twice
- **Fix:** Wrap in `useMemo`
- **Classification:** SAFE

---

## 3. Rendering Performance

### R-001: ~30 Inline Style Objects Per Card in index.tsx
- **File:** `index.tsx` — HomeProductCard
- **Severity:** MEDIUM
- **Impact:** With 120 cards, thousands of style allocations per render
- **Fix:** Memoize style objects or use StyleSheet for static styles
- **Classification:** SAFE

### R-002: `HomeProductCard` — 155 Lines, Deeply Nested
- **File:** `index.tsx:98-253`
- **Severity:** MEDIUM
- **Impact:** Complex conditional rendering in each card
- **Fix:** Extract sub-components
- **Classification:** SAFE

### R-003: Keyframe Created Inside Render
- **File:** `animated-icon.tsx:15-32`
- **Severity:** LOW
- **Impact:** `new Keyframe({...})` created every render
- **Fix:** Move to module scope or `useMemo`
- **Classification:** SAFE

### R-004: `useWindowDimensions` Causes Full Re-render
- **File:** `category-browser.tsx:76`
- **Severity:** LOW
- **Impact:** Every window resize triggers full component re-render
- **Fix:** Acceptable for this component's complexity
- **Classification:** INFO

---

## 4. Network / Storage Performance

### N-001: No Image Caching Strategy
- **File:** All screens using `expo-image`
- **Severity:** MEDIUM
- **Impact:** Images re-downloaded on every screen visit
- **Fix:** Configure `expo-image` cache policy
- **Classification:** SAFE

### N-002: Admin Loads ALL Records Without Pagination
- **File:** `admin.tsx:122-145`
- **Severity:** HIGH
- **Impact:** `select('*')` loads all products, users, entries, transactions
- **Fix:** Add pagination or infinite scroll
- **Classification:** RISKY (requires UI changes)

### N-003: Home Screen Loads 120 Products at Once
- **File:** `index.tsx:423`
- **Severity:** MEDIUM
- **Impact:** Large initial payload
- **Fix:** Implement lazy loading or pagination
- **Classification:** RISKY (requires UI changes)

### N-004: No Debouncing on Search Input
- **File:** `index.tsx` — search state
- **Severity:** LOW
- **Impact:** Filtering runs on every keystroke
- **Fix:** Add 300ms debounce
- **Classification:** SAFE

---

## 5. Memoization Opportunities

### M-001: `filteredProducts` Already Memoized ✅
- **File:** `index.tsx:326-344`
- **Status:** Good — uses `useMemo`

### M-002: `useLanguage` Hook — Module-Level State ✅
- **File:** `i18n.ts:13`
- **Status:** Good — avoids unnecessary re-renders

### M-003: `useAppTheme` Hook — Module-Level State ✅
- **File:** `use-theme.ts:12`
- **Status:** Good — avoids unnecessary re-renders

### M-004: Missing Memoization: Revenue Stats in admin.tsx
- **File:** `admin.tsx:580-583`
- **Severity:** MEDIUM
- **Fix:** Wrap in `useMemo`
- **Classification:** SAFE

### M-005: Missing Memoization: `parseHomeAdImagesInput` in admin.tsx
- **File:** `admin.tsx:842,844`
- **Severity:** LOW
- **Fix:** Wrap in `useMemo`
- **Classification:** SAFE

---

## 6. Supabase Query Optimization

### S-001: `select('*')` Used Extensively
- **Files:** `admin.tsx:123,128,133,138`, `explore.tsx:24`, `winner.tsx:39,55`
- **Severity:** MEDIUM
- **Impact:** Fetches all columns when only some are needed
- **Fix:** Specify only needed columns (like `index.tsx:46` does correctly)
- **Classification:** SAFE

### S-002: No Query Result Caching
- **Issue:** Same data fetched multiple times across screens
- **Severity:** LOW
- **Impact:** Minor — Supabase queries are fast
- **Fix:** Consider React Query or SWR for caching
- **Classification:** RISKY (new dependency)

### S-003: Missing `.single()` on Single-Row Queries
- **Files:** Various — some use `.maybeSingle()`, others don't
- **Severity:** LOW
- **Fix:** Standardize query patterns
- **Classification:** SAFE

---

## Performance Summary

| Category | CRITICAL | HIGH | MEDIUM | LOW |
|----------|----------|------|--------|-----|
| React/Expo | 1 | 4 | 2 | 0 |
| Database | 0 | 2 | 2 | 1 |
| Rendering | 0 | 0 | 2 | 2 |
| Network/Storage | 0 | 1 | 2 | 1 |
| Memoization | 0 | 0 | 2 | 1 |
| Supabase | 0 | 0 | 1 | 2 |
| **Total** | **1** | **7** | **11** | **7** |

**Top 5 Performance Fixes:**
1. Wrap `handleEnter`/`toggleFavorite` in `useCallback` (P-003)
2. Convert `favorites` to Set for O(1) lookup (Q-002)
3. Batch admin fetch queries (Q-001)
4. Consolidate useState calls (P-001, P-002)
5. Add `useMemo` for revenue stats (P-007)

---

*Performance audit complete.*
