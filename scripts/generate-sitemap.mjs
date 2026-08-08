// Regenerates public/sitemap.xml so it includes every indexable product page, not just the
// static marketing pages. Reads the manifest already written by
// generate-product-seo-manifest.mjs (must run first in the build chain) instead of querying
// Supabase again, so this script has no network dependency of its own.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = path.join(__dirname, '..', 'src', 'generated', 'product-seo-manifest.json');
const SITEMAP_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');

const BASE_URL = 'https://jeetobaz.pk';

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

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    [...staticEntries, ...productEntries].join('\n') +
    '\n</urlset>\n';

  await writeFile(SITEMAP_PATH, xml, 'utf-8');

  console.log(
    `[generate-sitemap] Wrote ${staticEntries.length} static page(s) and ${productEntries.length} ` +
      `product page(s) to ${path.relative(process.cwd(), SITEMAP_PATH)}`
  );
}

main();
