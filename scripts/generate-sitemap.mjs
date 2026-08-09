// Regenerates public/sitemap.xml so it includes every indexable product page, not just the
// static marketing pages. Reads the manifest already written by
// generate-product-seo-manifest.mjs (must run first in the build chain) instead of querying
// Supabase again, so product entries have no network dependency of their own. Blog post entries
// are the one exception: blog/[slug].tsx has no generateStaticParams manifest to piggyback on
// (unlike products), so this script fetches published blog slugs directly. That fetch is treated
// as best-effort -- a Supabase hiccup here should not block sitemap generation (and therefore the
// whole build) the way a missing product manifest does; it just means blog URLs are temporarily
// absent from the sitemap until the next successful build.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = path.join(__dirname, '..', 'src', 'generated', 'product-seo-manifest.json');
const SITEMAP_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');

const BASE_URL = 'https://jeetobaz.pk';

// Same sanitization as generate-product-seo-manifest.mjs -- hand-pasted CI secrets can carry a
// trailing space, wrapping quotes, or a trailing slash that the WHATWG URL parser rejects outright.
function sanitizeEnvValue(value) {
  if (!value) return value;
  let cleaned = value.trim();
  if (
    cleaned.length >= 2 &&
    ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'")))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

function toValidIsoDateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

async function fetchBlogEntries() {
  const SUPABASE_URL = sanitizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_URL)?.replace(/\/+$/, '');
  const SUPABASE_ANON_KEY = sanitizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      '[generate-sitemap] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY -- ' +
        'skipping blog post URLs this run.'
    );
    return [];
  }

  const endpoint =
    `${SUPABASE_URL}/rest/v1/blog_posts` +
    '?select=slug,published_at&is_visible=eq.true&slug=not.is.null';

  try {
    const response = await fetch(endpoint, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!response.ok) {
      console.warn(`[generate-sitemap] Blog posts request failed: HTTP ${response.status} ${response.statusText} -- skipping blog post URLs this run.`);
      return [];
    }
    const rows = await response.json();
    if (!Array.isArray(rows)) {
      console.warn('[generate-sitemap] Unexpected blog_posts response shape -- skipping blog post URLs this run.');
      return [];
    }
    return rows
      .filter((row) => Boolean(row.slug && String(row.slug).trim()))
      .map((row) =>
        urlEntry({
          loc: `${BASE_URL}/blog/${row.slug}`,
          changefreq: 'monthly',
          priority: '0.6',
          lastmod: toValidIsoDateOrNull(row.published_at) || undefined,
        })
      );
  } catch (e) {
    console.warn(`[generate-sitemap] Network error reaching Supabase for blog posts: ${e} -- skipping blog post URLs this run.`);
    return [];
  }
}

// These are the static, non-product pages that were already in public/sitemap.xml before
// this script started managing it. Kept as a fixed list here rather than crawling src/app,
// since not every route belongs in a sitemap (auth flows, payment callbacks, admin, etc.).
const STATIC_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/explore', changefreq: 'daily', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.5' },
  { path: '/faq', changefreq: 'weekly', priority: '0.6' },
  { path: '/help', changefreq: 'weekly', priority: '0.6' },
  { path: '/privacy', changefreq: 'monthly', priority: '0.3' },
  { path: '/terms', changefreq: 'monthly', priority: '0.3' },
  { path: '/registered-verified', changefreq: 'monthly', priority: '0.4' },
  { path: '/refund-policy', changefreq: 'monthly', priority: '0.3' },
  { path: '/shipping-policy', changefreq: 'monthly', priority: '0.3' },
  { path: '/disclaimer', changefreq: 'monthly', priority: '0.3' },
  { path: '/why-fair', changefreq: 'monthly', priority: '0.4' },
  { path: '/transparency', changefreq: 'monthly', priority: '0.5' },
  { path: '/compare', changefreq: 'daily', priority: '0.6' },
  { path: '/blog', changefreq: 'weekly', priority: '0.6' },
];

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry({ loc, changefreq, priority, lastmod }) {
  return (
    '  <url>\n' +
    `    <loc>${escapeXml(loc)}</loc>\n` +
    (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : '') +
    `    <changefreq>${changefreq}</changefreq>\n` +
    `    <priority>${priority}</priority>\n` +
    '  </url>'
  );
}

async function main() {
  let manifestEntries = [];
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf-8');
    manifestEntries = JSON.parse(raw);
  } catch (e) {
    console.error(
      '[generate-sitemap] Could not read the product SEO manifest at ' +
        `${path.relative(process.cwd(), MANIFEST_PATH)}. Run generate-product-seo-manifest.mjs first. ` +
        `(${e instanceof Error ? e.message : e})`
    );
    process.exit(1);
  }

  const staticEntries = STATIC_PAGES.map((page) =>
    urlEntry({ loc: `${BASE_URL}${page.path}`, changefreq: page.changefreq, priority: page.priority })
  );

  // lastmod comes from the product's own updated_at/created_at (resolved in
  // generate-product-seo-manifest.mjs), never the build date — an unchanged product must keep
  // the same lastmod across every future build, no matter which day that build runs on.
  const productEntries = manifestEntries
    .filter((entry) => entry.indexable !== false && Boolean(entry.slug))
    .map((entry) =>
      urlEntry({
        loc: `${BASE_URL}/product/${entry.slug}`,
        changefreq: 'daily',
        priority: '0.8',
        lastmod: entry.lastModified || undefined,
      })
    );

  const blogEntries = await fetchBlogEntries();

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    [...staticEntries, ...productEntries, ...blogEntries].join('\n') +
    '\n</urlset>\n';

  await writeFile(SITEMAP_PATH, xml, 'utf-8');

  console.log(
    `[generate-sitemap] Wrote ${staticEntries.length} static page(s), ${productEntries.length} ` +
      `product page(s), and ${blogEntries.length} blog post(s) to ${path.relative(process.cwd(), SITEMAP_PATH)}`
  );
}

main();
