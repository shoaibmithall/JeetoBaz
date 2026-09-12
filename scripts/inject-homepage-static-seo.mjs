import { readFile, writeFile } from 'node:fs/promises';

const MANIFEST_PATH = 'src/generated/product-seo-manifest.json';
const HOMEPAGE_PATH = 'dist/index.html';
const MARKER = 'data-jeetobaz-static-seo="true"';
const MAX_LINKS = 12;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
let html = await readFile(HOMEPAGE_PATH, 'utf8');

if (html.includes(MARKER)) {
  console.log('[inject-homepage-static-seo] Static SEO navigation already present; no changes needed.');
  process.exit(0);
}

const products = manifest
  .filter((row) => row.indexable !== false && row.slug && row.name)
  .sort((a, b) => String(b.lastModified || '').localeCompare(String(a.lastModified || '')))
  .slice(0, MAX_LINKS);

if (products.length === 0) {
  throw new Error('[inject-homepage-static-seo] No indexable product pages were available to link from the homepage.');
}

if (!html.includes('</body>')) {
  throw new Error('[inject-homepage-static-seo] dist/index.html has no </body> tag; refusing to modify malformed output.');
}

const links = products
  .map((product) => {
    const slug = encodeURIComponent(String(product.slug));
    const name = escapeHtml(product.name);
    return `<a href="/product/${slug}" style="display:inline-block;padding:8px 10px;border:1px solid #174a35;border-radius:10px;color:#d4af37;text-decoration:none;background:#071b13">${name}</a>`;
  })
  .join('');

const section = `
<section ${MARKER} aria-label="Latest JeetoBaz prize pages" style="max-width:1200px;margin:0 auto;padding:18px 16px 92px;background:#020d09;color:#f5f7f4;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <h2 style="margin:0 0 6px;font-size:18px;color:#d4af37">Latest JeetoBaz prize pages</h2>
  <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:#9aac9f">Quick links to recent JeetoBaz prize campaign pages. Current draw availability and live entry progress are shown on each page.</p>
  <nav aria-label="Recent prize campaign links" style="display:flex;flex-wrap:wrap;gap:8px">${links}</nav>
</section>
`;

html = html.replace('</body>', `${section}</body>`);
await writeFile(HOMEPAGE_PATH, html, 'utf8');

console.log(`[inject-homepage-static-seo] Added ${products.length} crawlable product link(s) to ${HOMEPAGE_PATH}.`);
