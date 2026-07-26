// Fetches public, indexable-relevant product fields from Supabase and writes them to a JSON
// file that ships in the app's module graph. `src/app/product/[slug].tsx` imports this file
// directly, so both `generateStaticParams()` (Node, build time) and the page component itself
// (build-time static render, client hydration, native bundle) read the exact same synchronously
// available data — no reliance on shared in-memory state between build steps.
//
// Run before `expo export`. Only public anon-key REST access is used; no service-role key.
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'generated', 'product-seo-manifest.json');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '[generate-product-seo-manifest] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Cannot generate the product SEO manifest. Aborting build.'
  );
  process.exit(1);
}

async function main() {
  const endpoint =
    `${SUPABASE_URL}/rest/v1/products` +
    '?select=slug,name,seo_title,meta_description,meta_keywords,indexable,image_url,description' +
    '&slug=not.is.null';

  let response;
  try {
    response = await fetch(endpoint, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
  } catch (e) {
    console.error('[generate-product-seo-manifest] Network error reaching Supabase:', e);
    process.exit(1);
  }

  if (!response.ok) {
    console.error(
      `[generate-product-seo-manifest] Supabase REST request failed: HTTP ${response.status} ${response.statusText}`
    );
    process.exit(1);
  }

  const rows = await response.json();
  if (!Array.isArray(rows)) {
    console.error('[generate-product-seo-manifest] Unexpected response shape (expected an array).');
    process.exit(1);
  }

  const manifest = rows
    .filter((row) => Boolean(row.slug && String(row.slug).trim()))
    .map((row) => ({
      slug: row.slug,
      name: row.name,
      seoTitle: row.seo_title || '',
      metaDescription: row.meta_description || '',
      metaKeywords: row.meta_keywords || '',
      indexable: row.indexable !== false,
      imageUrl: row.image_url || '',
      description: row.description || '',
    }));

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

  console.log(
    `[generate-product-seo-manifest] Wrote ${manifest.length} product(s) to ` +
      path.relative(process.cwd(), OUTPUT_PATH)
  );
}

main();
