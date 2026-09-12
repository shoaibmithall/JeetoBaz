// Fetches public, visible blog fields from Supabase and writes them to a JSON file that can be
// imported synchronously by Expo Router during static rendering. Production builds are strict;
// dev mode may keep an existing manifest if the network is temporarily unavailable.
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'generated', 'blog-seo-manifest.json');
const DEV_MODE = process.argv.includes('--dev');

function sanitizeEnvValue(value) {
  if (!value) return value;
  let cleaned = value.trim();
  if (
    cleaned.length >= 2 &&
    ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'")))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

function fail(message) {
  console.error(`[generate-blog-seo-manifest] ${message}`);

  if (DEV_MODE && existsSync(OUTPUT_PATH)) {
    console.warn(
      '[generate-blog-seo-manifest] Keeping the existing manifest and continuing in dev mode. ' +
        'Blog SEO data may be stale until the next successful generation.'
    );
    process.exit(0);
  }

  if (DEV_MODE) {
    console.error(
      `[generate-blog-seo-manifest] No fallback manifest exists at ${path.relative(process.cwd(), OUTPUT_PATH)}.`
    );
  }

  process.exit(1);
}

const SUPABASE_URL = sanitizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_URL)?.replace(/\/+$/, '');
const SUPABASE_ANON_KEY = sanitizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  fail('Missing public Supabase configuration. Cannot generate the blog SEO manifest.');
}

try {
  new URL(SUPABASE_URL);
} catch {
  fail('The public Supabase URL is invalid after sanitization.');
}

async function main() {
  const endpoint =
    `${SUPABASE_URL}/rest/v1/blog_posts` +
    '?select=id,slug,title,excerpt,category,content,cover_image,read_minutes,published_at,is_visible,sort_order,created_at,updated_at' +
    '&is_visible=eq.true&slug=not.is.null&order=published_at.desc';

  let response;
  try {
    response = await fetch(endpoint, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
  } catch (error) {
    fail(`Network error reaching Supabase: ${error}`);
    return;
  }

  if (!response.ok) {
    fail(`Supabase REST request failed: HTTP ${response.status} ${response.statusText}`);
    return;
  }

  const rows = await response.json();
  if (!Array.isArray(rows)) {
    fail('Unexpected response shape (expected an array).');
    return;
  }

  const manifest = rows
    .filter(
      (row) =>
        row?.is_visible === true &&
        Boolean(row?.slug && String(row.slug).trim()) &&
        Boolean(row?.title && String(row.title).trim())
    )
    .map((row) => ({
      id: String(row.id),
      slug: String(row.slug).trim(),
      title: String(row.title).trim(),
      excerpt: String(row.excerpt || ''),
      category: row.category,
      content: String(row.content || ''),
      cover_image: String(row.cover_image || ''),
      read_minutes: Number.isFinite(row.read_minutes) ? row.read_minutes : 1,
      published_at: String(row.published_at || ''),
      is_visible: true,
      sort_order: Number.isFinite(row.sort_order) ? row.sort_order : 0,
      created_at: String(row.created_at || ''),
      updated_at: String(row.updated_at || row.published_at || ''),
    }));

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(
    `[generate-blog-seo-manifest] Wrote ${manifest.length} public blog post(s) to ` +
      path.relative(process.cwd(), OUTPUT_PATH)
  );
}

main();
