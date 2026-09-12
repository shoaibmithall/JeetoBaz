# Homepage Crawlability SEO Spec

## Problem

JeetoBaz is exported as a static Expo Router web app, but the homepage initializes `products` as an empty array and loads active products from Supabase only after the client hydrates. The raw exported homepage HTML can therefore contain a loading/empty state instead of the current active product cards and crawlable product links.

## Goal

Make active JeetoBaz product cards and `/product/<slug>` links available in the initial statically exported homepage HTML while preserving all existing live Supabase refresh behavior after hydration.

## Safety Constraints

- Do not change draw logic, payments, authentication, admin behavior, database writes, or winner selection.
- Do not deploy directly from the feature branch.
- Preserve the current Expo Router static-output architecture.
- Reuse the existing build-time Supabase product manifest pipeline rather than introducing a new backend or framework.
- Only public product fields already displayed on the public homepage may be embedded in the static manifest.
- After hydration, the existing Supabase query remains the source of fresh live data.
- No secrets may be committed.
- Production `main` must remain unchanged until a reviewed PR is deliberately merged.

## Required Behavior

1. The build-time product manifest must contain enough public fields to create valid homepage `Product` objects for active draws.
2. The homepage must seed its initial `products` state from active, non-deleted, indexable build-time manifest rows that have a slug.
3. The homepage must not present the initial product section as loading when static manifest products are available.
4. Existing `fetchProducts()` must still refresh from Supabase on focus and update offline cache.
5. Exported `dist/index.html` must contain at least one crawlable `/product/` link when active products exist in the manifest.
6. Exported `dist/index.html` must not report `Active Draws` as `0 found` when active manifest products exist.
7. Existing product detail static generation and sitemap generation must continue to work with the expanded manifest.

## Verification

- A test/check script must inspect the static homepage HTML and fail if active manifest products exist but the exported homepage has no product links or reports `0 found`.
- `npm run build` must complete successfully with the repository's normal build environment.
- Existing product route static generation must remain intact.
