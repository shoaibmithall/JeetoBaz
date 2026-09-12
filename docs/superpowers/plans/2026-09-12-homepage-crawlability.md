# Homepage Crawlability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add crawlable JeetoBaz product-page links to the raw static homepage HTML without changing React hydration, live Supabase product loading, payments, auth, admin, draw execution, or winner selection.

**Architecture:** Keep the current Expo Router app untouched at runtime. Reuse the existing build-time product SEO manifest and, after Expo finishes exporting, append a small visible green/gold navigation section outside the React root but inside `<body>`. A branch-only CI check verifies the final raw HTML contains the section and product links. This deliberately avoids seeding React state or expanding database queries.

**Tech Stack:** Expo Router 56 static web export, React 19, Node 22, existing build-time Supabase SEO manifest, GitHub Pages.

**Spec:** `docs/SEO_HOMEPAGE_CRAWLABILITY_SPEC.md`

## Global Constraints

- Do not modify live homepage React product state or `fetchProducts()`.
- Do not modify payments, authentication, draw execution, winner selection, admin mutations, database schema, or Supabase mutation code.
- Do not introduce a new backend/framework.
- Do not commit secrets.
- Work only on `seo/homepage-crawlability-safe`; do not deploy or merge to `main` without explicit user approval.
- The added content must be visible to users and crawlers; no hidden/cloaked SEO content.

---

### Task 1: Prove the raw-homepage crawlability bug

**Files:**
- Create: `scripts/check-homepage-static-seo.mjs`
- Create: `.github/workflows/seo-homepage-safe-check.yml`

**Interfaces:**
- Consumes: `src/generated/product-seo-manifest.json`, `dist/index.html`.
- Produces: non-zero exit when the exported homepage lacks the expected static SEO section/product links.

- [x] **Step 1: Add a branch-only CI workflow**

Use Node 22, `npm ci`, the repository's normal `npm run build` environment, then run the raw HTML check. The workflow has `contents: read` only and contains no deployment step.

- [x] **Step 2: Add a failing raw-HTML check**

The check reads the existing indexable product manifest entries and requires crawlable `/product/` links in `dist/index.html`.

- [x] **Step 3: Verify RED**

Branch CI build completed successfully, then the check failed with:

```text
Homepage static HTML has no crawlable /product/ links.
```

This proves the bug independently of client-side JavaScript.

---

### Task 2: Add the smallest non-hydrating static SEO injector

**Files:**
- Create: `scripts/inject-homepage-static-seo.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing manifest entries with `slug`, `name`, `indexable`, and `lastModified`.
- Produces: one visible `Latest JeetoBaz prize pages` section in `dist/index.html`, marked with `data-jeetobaz-static-seo="true"`.

- [x] **Step 1: Implement safe HTML escaping**

Escape `&`, `<`, `>`, double quotes, and single quotes before product names are written to HTML.

- [x] **Step 2: Select a bounded recent set**

Filter to indexable rows with non-empty slug/name, sort by `lastModified`, and limit to 12 links.

- [x] **Step 3: Make the injection idempotent and fail-safe**

If the marker already exists, exit successfully without duplication. If no indexable products exist or `</body>` is missing, fail rather than writing malformed output.

- [x] **Step 4: Keep content outside the React root**

Insert immediately before `</body>` so React hydration markup is unchanged. The section is user-visible and styled to match JeetoBaz green/gold branding.

- [x] **Step 5: Wire it after Expo export**

Append `node ./scripts/inject-homepage-static-seo.mjs` to the existing `npm run build` command after `expo export -p web`.

---

### Task 3: Verify green build and idempotency

**Files:**
- Modify if needed: `scripts/check-homepage-static-seo.mjs`
- Modify if needed: `.github/workflows/seo-homepage-safe-check.yml`

**Interfaces:**
- Consumes: final branch build output.
- Produces: objective evidence that the fix survives a clean CI build without touching runtime logic.

- [ ] **Step 1: Verify clean build**

Expected:

```text
npm run build -> exit 0
[inject-homepage-static-seo] Added 12 crawlable product link(s)
```

- [ ] **Step 2: Verify raw HTML behavior**

Expected:

```text
Homepage static SEO check passed with at least 6 crawlable product link(s).
```

The check also verifies the static marker, heading, and the most recent expected manifest slug.

- [ ] **Step 3: Verify idempotency**

Run the injector a second time against the already-injected output; it must report that the section is already present. Re-run the check and ensure exactly one marker remains.

---

### Task 4: Review scope and stop before production

**Files:**
- No production changes unless verification reveals a defect.

**Interfaces:**
- Consumes: final CI result and `main...seo/homepage-crawlability-safe` diff.
- Produces: a verified isolated branch ready for the user's integration decision.

- [ ] **Step 1: Compare against `main`**

Confirm there are no changes to `src/app/index.tsx`, payment/auth/admin/draw/winner files, database migrations, or the Supabase product query generator.

- [ ] **Step 2: Report verification evidence**

State clearly that the fix is only on the feature branch and is not live.

- [ ] **Step 3: Ask the user how to integrate**

Do not merge or deploy automatically. Present the integration options and wait for explicit user choice.
