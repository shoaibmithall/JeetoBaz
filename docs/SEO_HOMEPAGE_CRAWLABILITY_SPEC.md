# Homepage Crawlability SEO Spec

## Problem

JeetoBaz is exported as a static Expo Router web app, but the homepage initializes its live `products` state empty and fetches active draws from Supabase after hydration. The raw exported homepage HTML therefore has no crawlable `/product/<slug>` links even though individual product pages are pre-generated and listed in the sitemap.

## Goal

Give search crawlers and users a small, accurate set of crawlable product-page links in the raw homepage HTML without changing the React homepage data flow, hydration state, draw logic, payment logic, or live Supabase behavior.

## Safety Constraints

- Do not change draw logic, payments, authentication, admin behavior, database writes, or winner selection.
- Do not change the live homepage `products` state or its Supabase refresh path.
- Do not rewrite React-rendered markup inside the root after export, because that could create hydration mismatches.
- Do not expand the product manifest with new database fields for this fix.
- Reuse the existing generated product SEO manifest, which already contains public `slug`, `name`, `description`, `entryFee`, `indexable`, and `lastModified` values.
- Preserve Expo Router static output and GitHub Pages deployment.
- No secrets may be committed.
- Production `main` must remain unchanged until a reviewed PR is deliberately merged.

## Required Behavior

1. After `expo export -p web`, a post-export script must read the existing generated product SEO manifest and `dist/index.html`.
2. It must select a small set of recent indexable product pages with valid slugs and names.
3. It must inject a user-visible, lightweight `Latest JeetoBaz prize pages` navigation section immediately before `</body>`, outside the React root, so hydration behavior is untouched.
4. Every injected link must be HTML-escaped and point to `/product/<encoded-slug>`.
5. The injected section must be idempotent: running the script twice must not duplicate it.
6. If there are no indexable products or `</body>` is missing, the script must fail the build rather than silently producing malformed output.
7. Existing product-page static generation, sitemap generation, live product fetching, and runtime UI must remain unchanged.

## Verification

- A check script must inspect `dist/index.html` after a full build and fail if the static SEO section or crawlable product links are missing.
- The check must verify at least one expected manifest slug is present in the homepage HTML.
- `npm run build` must complete successfully with the normal repository build environment.
- The final diff must contain no changes to draw, payment, auth, admin, Supabase mutation, or winner-selection code.
