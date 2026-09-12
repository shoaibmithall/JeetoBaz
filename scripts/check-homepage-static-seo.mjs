import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile('src/generated/product-seo-manifest.json', 'utf8'));
const html = await readFile('dist/index.html', 'utf8');
const indexable = manifest
  .filter((row) => row.indexable !== false && row.slug && row.name)
  .sort((a, b) => String(b.lastModified || '').localeCompare(String(a.lastModified || '')));

if (indexable.length === 0) {
  throw new Error('Static SEO check requires at least one indexable product page.');
}

if (!html.includes('data-jeetobaz-static-seo="true"')) {
  throw new Error('Homepage static SEO navigation marker is missing.');
}

const productLinkMatches = html.match(/href="\/product\//g) || [];
if (productLinkMatches.length < Math.min(6, indexable.length)) {
  throw new Error(`Homepage static HTML has only ${productLinkMatches.length} crawlable product link(s).`);
}

const expectedSlug = encodeURIComponent(indexable[0].slug);
if (!html.includes(`/product/${expectedSlug}`)) {
  throw new Error(`Homepage static HTML is missing expected recent product link: ${indexable[0].slug}`);
}

if (!html.includes('Latest JeetoBaz prize pages')) {
  throw new Error('Homepage static SEO navigation heading is missing.');
}

console.log(`Homepage static SEO check passed with ${productLinkMatches.length} crawlable product link(s).`);
