# JeetoBaz Static Blog SEO Foundation Design

## Goal

Make JeetoBaz blog pages reliably crawlable in raw static HTML so search engines can discover article links, titles, excerpts, article content, canonical URLs, and structured data without waiting for client-side Supabase requests.

## Current Problem

The public `/blog` screen initializes with an empty `posts` array and fetches visible posts from Supabase after hydration. Individual `/blog/[slug]` pages do the same for article data. As a result, the exported raw HTML can show loading states instead of the real article list/content even though sitemap generation already knows public blog slugs.

## Chosen Approach

Reuse the proven product-page pattern already present in JeetoBaz:

1. Add a build-time public blog SEO manifest generated from visible `blog_posts`.
2. Import that manifest into `/blog` and `/blog/[slug]` so static rendering has synchronous public article data.
3. Add `generateStaticParams()` to `/blog/[slug]` using the manifest.
4. Render the blog index from manifest data on the first/static render, then refresh from Supabase after hydration for freshness.
5. Render article metadata and visible article content from the manifest on the first/static render, then prefer fresh Supabase data after hydration.
6. Keep existing UI and live Supabase behavior; this is an SEO/data-source fallback, not a redesign.

## Scope

### In scope

- Public blog index crawlability.
- Public blog article crawlability.
- Build-time blog manifest generation.
- Static article route generation.
- Raw-HTML verification for `/blog` and at least one article route.
- Sitemap reuse of the same manifest where practical, to avoid duplicate network logic.
- Existing Article, WebPage, breadcrumb, canonical, OG and Twitter metadata preserved or improved.
- Safe failure behavior if the blog manifest fetch is unavailable.

### Out of scope

- Payments, wallet, authentication, admin permissions, draw execution, winner selection, referrals, database schema, or Supabase mutations.
- Creating fake articles, fake winners, fake reviews, fake claims, or fabricated product information.
- New category landing pages in this sub-project.
- Backlink submissions in code.
- Large UI redesigns.

## Data Model

The manifest should contain only public fields needed for static SEO/rendering, for example:

- `id`
- `slug`
- `title`
- `excerpt`
- `category`
- `content`
- `cover_image`
- `read_minutes`
- `published_at`
- `updated_at`
- `is_visible`

Only `is_visible = true` rows with non-empty slugs are included.

## Build Flow

Recommended build order:

1. Generate product SEO manifest.
2. Generate blog SEO manifest.
3. Generate sitemap using product + blog manifests.
4. Expo static export.
5. Existing homepage static SEO injector.
6. SEO verification checks.

The build must never expose private Supabase credentials. Only the existing public anon key is used for public read access, matching the current architecture.

## Blog Index Behavior

`/blog` should initialize from the build-time manifest rather than `[]` on the static render. On the client, the existing Supabase request may still run and replace the manifest snapshot with fresher public data.

The initial HTML should contain:

- `JeetoBaz Blog` heading.
- At least one public article title when visible posts exist.
- Crawlable `/blog/<slug>` anchors.
- Excerpts and basic metadata already shown by the current UI.

If there are no visible posts, the page should render a genuine empty state rather than invent content.

## Blog Article Behavior

`/blog/[slug]` should use the manifest entry as a static fallback. `generateStaticParams()` should emit every visible public blog slug from the manifest.

The static HTML for a known article should contain:

- Real article title/H1.
- Real excerpt/meta description.
- Canonical URL.
- Article structured data based on real stored data.
- Visible article body content.
- Existing CTA and related-content behavior where possible.

After hydration, the existing Supabase fetch may replace the snapshot with fresher data. If an article is later removed/hidden, the client must not fabricate content; follow the current not-found/noindex behavior once the live fetch confirms absence.

## Error Handling

- Manifest generation should clearly log network/schema failures.
- For production builds, a missing or malformed manifest must not silently generate incorrect article pages.
- Prefer a safe build failure when the manifest file itself cannot be produced/read.
- If the public blog table returns zero visible rows successfully, an empty manifest is valid.
- Static route generation must not include blank/invalid slugs.

## SEO Integrity Rules

- No cloaking or bot-only content.
- Static content must be the same public content users can see.
- No keyword stuffing or mass-generated doorway pages.
- No fake FAQ/review/rating/winner structured data.
- Keep paid prize campaigns described accurately; do not label paid entry as a free giveaway.
- Preserve one canonical URL per article.

## Testing and Verification

Add automated checks that fail if:

- `/blog` raw export contains only a loading state while manifest posts exist.
- `/blog` lacks crawlable article links when manifest posts exist.
- A generated article page lacks its expected title or visible content.
- A generated article page lacks canonical metadata.
- Duplicate or malformed static blog routes are generated.

Run a full `npm run build` in CI with the normal repository environment. Confirm no files related to payments, auth, admin, draw/winner logic, wallet, or database migrations changed.

## Rollout

Work only on `seo/blog-static-foundation-safe`. Create a PR after tests/build pass. Do not merge to `main` or deploy until reviewed and explicitly approved.

## Success Criteria

This sub-project is successful when Google-compatible raw HTML for `/blog` and `/blog/<slug>` contains real public article links/content without needing client JavaScript, while the live user experience and business logic remain unchanged.