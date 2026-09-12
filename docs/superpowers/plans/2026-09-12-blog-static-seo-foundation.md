# Static Blog SEO Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Render public blog index/article content in exported HTML without changing JeetoBaz business logic.

**Architecture:** Generate a build-time public blog manifest using the same pattern as the existing product SEO manifest. The blog index and article route will use that manifest for static rendering, then refresh from the existing public Supabase reads after hydration. Sitemap generation will read the same manifest.

**Tech Stack:** Expo Router 56, React 19, TypeScript 6, Node 22, existing public Supabase access.

**Spec:** `docs/superpowers/specs/2026-09-12-blog-static-seo-foundation-design.md`

## Global Constraints
- Feature branch only; no merge/deploy without explicit approval.
- Do not touch payments, wallet, auth, admin permissions, draw execution, winner selection, referrals, database schema, or mutations.
- Public visible posts only; no cloaking or fabricated content.

### Task 1: Add manifest generator and failing static-HTML check
**Files:** create `scripts/generate-blog-seo-manifest.mjs`, `src/generated/blog-seo-manifest.json`, `scripts/check-blog-static-seo.mjs`, branch-only CI workflow; modify `package.json`.
- [ ] Write a checker that requires `/blog` raw HTML to contain a real manifest article title/link and one article HTML file to contain title, canonical URL, and stored body content.
- [ ] Run before implementation and confirm it fails.
- [ ] Generate only public BlogPost fields for visible posts with non-empty slugs; zero rows is valid, malformed/missing production generation fails.
- [ ] Build order: product manifest -> blog manifest -> sitemap -> Expo export -> existing homepage injector -> blog checker.
- [ ] Re-run checker and commit.

### Task 2: Make `/blog` static-first
**Files:** modify `src/app/blog/index.tsx`.
- [ ] Import the generated manifest as `BlogPost[]` and initialize `posts` from it.
- [ ] Keep the existing live fetch after hydration; do not blank valid snapshot content while refreshing.
- [ ] Use Expo Router `Link` anchors for featured/grid article cards while preserving UI/search/filter behavior.
- [ ] Run lint/build/static checker and commit.

### Task 3: Make `/blog/[slug]` static-first
**Files:** modify `src/app/blog/[slug].tsx`.
- [ ] Build `staticPostBySlug` from the manifest and export `generateStaticParams()` for every visible slug.
- [ ] Initialize article state from the matching manifest entry.
- [ ] Live success replaces the snapshot; confirmed missing/hidden live data uses current not-found/noindex behavior; transient errors retain valid static content.
- [ ] Preserve existing title, description, canonical, Article/WebPage/Breadcrumb schema, OG/Twitter metadata and real stored dates.
- [ ] Verify raw article HTML contains real title/canonical/body content and commit.

### Task 4: Share snapshot with sitemap and prepare PR
**Files:** modify `scripts/generate-sitemap.mjs`.
- [ ] Replace the separate blog network fetch with the generated blog manifest.
- [ ] Use validated `updated_at || published_at` for blog lastmod, never build date.
- [ ] Run fresh CI/build/checks and inspect generated manifest for public article fields only.
- [ ] Compare with `main`; business-critical files must be untouched.
- [ ] Open a draft PR with verification evidence and stop before merge/deploy.
