import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile('src/generated/product-seo-manifest.json', 'utf8'));
const html = await readFile('dist/index.html', 'utf8');
const active = manifest.filter(
  (row) => row.status === 'active' && row.indexable !== false && !row.isDeleted && row.slug
);

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
