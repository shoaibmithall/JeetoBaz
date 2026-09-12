import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile('src/generated/product-seo-manifest.json', 'utf8'));
const html = await readFile('dist/index.html', 'utf8');
const indexable = manifest.filter((row) => row.indexable !== false && row.slug && row.name);

if (indexable.length === 0) {
  throw new Error('Static SEO check requires at least one indexable product page.');
}

if (!html.includes('/product/')) {
  throw new Error('Homepage static HTML has no crawlable /product/ links.');
}

const textOnly = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
if (/Active Draws.{0,180}0 found/i.test(textOnly)) {
  throw new Error('Homepage static HTML incorrectly presents Active Draws as 0 found while client data is still loading.');
}

const sampleSlug = indexable[0].slug;
if (!html.includes(`/product/${sampleSlug}`)) {
  throw new Error(`Homepage static HTML is missing sample indexable product link: ${sampleSlug}`);
}

console.log(`Homepage static SEO check passed with ${indexable.length} indexable product page(s) available.`);
