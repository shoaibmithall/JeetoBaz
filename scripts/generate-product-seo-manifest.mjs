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

// CI secret values are pasted by hand and can pick up stray formatting that a browser or shell
// would silently tolerate but the WHATWG URL parser (used by fetch) rejects outright — e.g. a
// trailing space, the value wrapped in quotes, or a trailing slash. Sanitize defensively so a
// same-length-looking secret value doesn't fail with an unhelpful native ERR_INVALID_URL.
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

const SUPABASE_URL = sanitizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_URL)?.replace(/\/+$/, '');
const SUPABASE_ANON_KEY = sanitizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '[generate-product-seo-manifest] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Cannot generate the product SEO manifest. Aborting build.'
  );
  process.exit(1);
}

try {
  new URL(SUPABASE_URL);
} catch {
  console.error(
    `[generate-product-seo-manifest] EXPO_PUBLIC_SUPABASE_URL is not a valid URL after trimming whitespace ` +
      `and surrounding quotes (length ${SUPABASE_URL.length}, starts with "${SUPABASE_URL.slice(0, 12)}"). ` +
      'Check the secret\'s value for stray characters, such as the "KEY=" prefix pasted in by mistake. ' +
      'Cannot generate the product SEO manifest. Aborting build.'
  );
  process.exit(1);
}

async function main() {
  const endpoint =
    `${SUPABASE_URL}/rest/v1/products` +
    '?select=slug,name,seo_title,meta_description,meta_keywords,indexable,image_url,description,entry_fee,created_at' +
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

  // Sitemap <lastmod> must reflect when the product actually changed, not when the build ran.
  // The `products` table has no `updated_at` column (verified against the live schema), only
  // `created_at` — so this is a "when the product was created" signal, not "last edited". Only
  // accept a genuinely parseable date; anything else is left out rather than silently
  // substituting today's date, which would be a fabricated signal to search engines.
  function toValidIsoDateOrNull(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
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
      entryFee: typeof row.entry_fee === 'number' ? row.entry_fee : 1,
      lastModified: toValidIsoDateOrNull(row.created_at),
    }));

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

  console.log(
    `[generate-product-seo-manifest] Wrote ${manifest.length} product(s) to ` +
      path.relative(process.cwd(), OUTPUT_PATH)
  );
}

main();
