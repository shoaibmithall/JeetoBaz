# Homepage Crawlability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure JeetoBaz active draw cards and product links are present in the initial statically exported homepage HTML without changing live draw, payment, auth, admin, or winner logic.

**Architecture:** Reuse the existing build-time `product-seo-manifest.json` pipeline. Expand each manifest row with the public fields the homepage already renders, convert active manifest rows to `Product` objects synchronously, and seed the homepage state before hydration. The existing Supabase `fetchProducts()` path remains unchanged as the post-hydration live refresh source.

**Tech Stack:** Expo Router 56 static web export, React 19, React Native Web, TypeScript, Node 22, Supabase REST, GitHub Pages.

**Spec:** `docs/SEO_HOMEPAGE_CRAWLABILITY_SPEC.md`

## Global Constraints

- Do not modify payment, authentication, draw execution, winner selection, admin mutations, or database schema.
- Preserve `web.output = "static"` and the current GitHub Pages deployment architecture.
- Do not commit secrets or service-role credentials.
- Use only public product fields already visible on public pages.
- Keep Supabase as the live source after hydration.
- Work only on `seo/homepage-crawlability-safe`; do not modify `main`.

---

### Task 1: Add a static-export regression check

**Files:**
- Create: `scripts/check-homepage-static-seo.mjs`
- Create: `.github/workflows/seo-homepage-safe-check.yml`

**Interfaces:**
- Consumes: generated `src/generated/product-seo-manifest.json` and exported `dist/index.html`.
- Produces: a non-zero exit code when active manifest products exist but the homepage raw HTML lacks crawlable product links or falsely reports zero draws.

- [ ] **Step 1: Write the failing check**

Create `scripts/check-homepage-static-seo.mjs` that:

```js
import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile('src/generated/product-seo-manifest.json', 'utf8'));
const html = await readFile('dist/index.html', 'utf8');
const active = manifest.filter((row) => row.status === 'active' && row.indexable !== false && !row.isDeleted && row.slug);

if (active.length === 0) {
  throw new Error('Static SEO check requires at least one active manifest product.');
}

if (!html.includes('/product/')) {
  throw new Error('Homepage static HTML has no crawlable /product/ links.');
}

if (/Active Draws[^<]{0,120}0 found/i.test(html)) {
  throw new Error('Homepage static HTML incorrectly reports 0 active draws.');
}

const sampleSlug = active[0].slug;
if (!html.includes(`/product/${sampleSlug}`)) {
  throw new Error(`Homepage static HTML is missing sample active product link: ${sampleSlug}`);
}

console.log(`Homepage static SEO check passed with ${active.length} active manifest product(s).`);
```

Create a branch-only GitHub Actions workflow that runs on pushes to `seo/homepage-crawlability-safe`, uses Node 22, runs `npm ci`, runs `npm run build` with the existing three repository secrets, then runs `node scripts/check-homepage-static-seo.mjs`. It must not deploy anything.

- [ ] **Step 2: Run the branch check and verify RED**

Push the test/workflow only. Wait for the workflow. Expected result before production changes: build succeeds or reaches the check, and `check-homepage-static-seo.mjs` fails because raw `dist/index.html` does not contain active product links / still represents the empty initial state.

- [ ] **Step 3: Commit**

Commit message: `test: guard homepage static product SEO`

---

### Task 2: Expand the build-time product manifest with public homepage fields

**Files:**
- Modify: `scripts/generate-product-seo-manifest.mjs`
- Modify: `src/app/product/[slug].tsx` only if its local manifest type needs compatible optional fields (no product-page behavior changes).

**Interfaces:**
- Consumes: public Supabase `products` REST rows.
- Produces: manifest entries containing the existing SEO fields plus `id`, `price`, `status`, `currentEntries`, `maxEntries`, `drawDate`, `liveLink`, `category`, and `isDeleted` needed for safe homepage seeding.

- [ ] **Step 1: Extend the regression expectation**

The Task 1 check already requires `status` and `isDeleted`. Do not weaken the check.

- [ ] **Step 2: Update the manifest query and mapping minimally**

Change the REST `select` list to include:

```text
id,slug,name,price,status,current_entries,max_entries,entry_fee,image_url,description,draw_date,live_link,category,is_deleted,seo_title,meta_description,meta_keywords,indexable,created_at
```

Map the additional fields with safe defaults:

```js
id: row.id,
price: typeof row.price === 'number' ? row.price : 0,
status: row.status || '',
currentEntries: typeof row.current_entries === 'number' ? row.current_entries : 0,
maxEntries: typeof row.max_entries === 'number' ? row.max_entries : 1,
drawDate: row.draw_date || null,
liveLink: row.live_link || null,
category: row.category || null,
isDeleted: row.is_deleted === true,
```

Keep every pre-existing manifest property unchanged so product pages and sitemap generation remain compatible.

- [ ] **Step 3: Run branch CI**

Expected at this stage: build succeeds, but the homepage static SEO check remains RED because homepage state still starts empty.

- [ ] **Step 4: Commit**

Commit message: `build: include public homepage fields in product manifest`

---

### Task 3: Seed homepage products synchronously from the build manifest

**Files:**
- Modify: `src/app/index.tsx`

**Interfaces:**
- Consumes: expanded `productSeoManifest` entries.
- Produces: `INITIAL_STATIC_PRODUCTS: Product[]`, used only as initial homepage state and initial loading decision.

- [ ] **Step 1: Import the generated manifest**

Add:

```ts
import productSeoManifest from '@/generated/product-seo-manifest.json';
```

Define a local manifest type matching Task 2 and a pure mapper that returns `null` unless the row is active, not deleted, indexable, and has both `id` and `slug`.

- [ ] **Step 2: Build the initial public product list**

Map fields to the existing `Product` shape without fabricating private data:

```ts
{
  id: entry.id,
  name: entry.name,
  price: entry.price,
  status: entry.status,
  created_at: entry.createdAt || '',
  current_entries: entry.currentEntries,
  max_entries: entry.maxEntries,
  entry_fee: entry.entryFee,
  winner_phone: null,
  image_url: entry.imageUrl || null,
  description: entry.description || null,
  draw_date: entry.drawDate,
  live_link: entry.liveLink,
  winner_photo: null,
  seo_title: entry.seoTitle || null,
  meta_description: entry.metaDescription || null,
  meta_keywords: entry.metaKeywords || null,
  slug: entry.slug,
  indexable: entry.indexable,
  category: entry.category,
  is_deleted: false,
  deleted_at: null,
}
```

Include `createdAt` in Task 2 mapping if needed to preserve sorting.

- [ ] **Step 3: Seed state and avoid false initial loading**

Replace:

```ts
const [products, setProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState(true);
```

with lazy/synchronous initialization from `INITIAL_STATIC_PRODUCTS` and set initial loading to `INITIAL_STATIC_PRODUCTS.length === 0`.

Do not remove or bypass `fetchProducts()`. It must continue refreshing from cache/Supabase on focus.

- [ ] **Step 4: Run branch CI and verify GREEN**

Expected: `npm run build` exits 0 and `node scripts/check-homepage-static-seo.mjs` exits 0. The exported homepage contains `/product/<slug>` links and does not falsely report zero active draws.

- [ ] **Step 5: Commit**

Commit message: `fix: render active draws in static homepage HTML`

---

### Task 4: Verify no regression and prepare review only

**Files:**
- No production file changes unless verification exposes a defect.

**Interfaces:**
- Consumes: branch CI results and Git diff.
- Produces: a reviewable PR; no deployment and no merge.

- [ ] **Step 1: Verify full branch workflow**

Confirm the most recent branch workflow run completed successfully, including `npm run build` and the static SEO check.

- [ ] **Step 2: Inspect the diff**

Confirm only these areas changed:
- build-time public product manifest fields,
- homepage initial rendering,
- static SEO regression check/workflow,
- documentation.

Confirm there are no changes to Supabase mutations, payments, auth, admin, draw algorithm, winner logic, or database migrations.

- [ ] **Step 3: Create a draft PR**

Open a draft PR from `seo/homepage-crawlability-safe` to `main` describing the root cause, exact scope, verification evidence, and explicitly state that it has **not** been deployed or merged.

- [ ] **Step 4: Stop before production**

Do not merge. Ask the user for explicit approval after presenting the verification result and PR.
