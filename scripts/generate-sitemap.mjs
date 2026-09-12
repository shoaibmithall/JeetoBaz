// Regenerates public/sitemap.xml from the same generated product/blog snapshots used by static
// route rendering. This keeps exported routes and sitemap URLs consistent within one build and
// avoids a second independent Supabase request during sitemap generation.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCT_MANIFEST_PATH = path.join(__dirname, '..', 'src', 'generated', 'product-seo-manifest.json');
const BLOG_MANIFEST_PATH = path.join(__dirname, '..', 'src', 'generated', 'blog-seo-manifest.json');
const SITEMAP_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');
const BASE_URL = 'https://jeetobaz.pk';

function toValidIsoDateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

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

async function readManifest(filePath, label) {
  try {
    const raw = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('expected an array');
    return parsed;
  } catch (error) {
    console.error(
      `[generate-sitemap] Could not read the ${label} SEO manifest at ` +
        `${path.relative(process.cwd(), filePath)}. Run its manifest generator first. ` +
        `(${error instanceof Error ? error.message : error})`
    );
    process.exit(1);
  }
}

async function main() {
  const productManifestEntries = await readManifest(PRODUCT_MANIFEST_PATH, 'product');
  const blogManifestEntries = await readManifest(BLOG_MANIFEST_PATH, 'blog');

  const staticEntries = STATIC_PAGES.map((page) =>
    urlEntry({ loc: `${BASE_URL}${page.path}`, changefreq: page.changefreq, priority: page.priority })
  );

  const productEntries = productManifestEntries
    .filter((entry) => entry.indexable !== false && Boolean(entry.slug))
    .map((entry) =>
      urlEntry({
        loc: `${BASE_URL}/product/${entry.slug}`,
        changefreq: 'daily',
        priority: '0.8',
        lastmod: entry.lastModified || undefined,
      })
    );

  const blogEntries = blogManifestEntries
    .filter((entry) => entry.is_visible !== false && Boolean(entry.slug))
    .map((entry) =>
      urlEntry({
        loc: `${BASE_URL}/blog/${entry.slug}`,
        changefreq: 'monthly',
        priority: '0.6',
        lastmod: toValidIsoDateOrNull(entry.updated_at || entry.published_at) || undefined,
      })
    );

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
