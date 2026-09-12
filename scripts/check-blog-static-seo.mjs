import { access, readFile } from 'node:fs/promises';

async function firstExisting(paths) {
  for (const candidate of paths) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next known Expo static export shape.
    }
  }
  return null;
}

const manifestPath = 'src/generated/blog-seo-manifest.json';
let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
} catch (error) {
  throw new Error(`[check-blog-static-seo] Missing or invalid ${manifestPath}: ${error instanceof Error ? error.message : error}`);
}

if (!Array.isArray(manifest)) {
  throw new Error('[check-blog-static-seo] Blog SEO manifest must be an array.');
}

const visible = manifest.filter(
  (post) => post?.is_visible !== false && post?.slug && post?.title,
);

const blogIndexPath = await firstExisting(['dist/blog.html', 'dist/blog/index.html']);
if (!blogIndexPath) {
  throw new Error('[check-blog-static-seo] Exported /blog HTML was not found.');
}

const indexHtml = await readFile(blogIndexPath, 'utf8');

if (visible.length > 0) {
  const first = visible[0];
  const encodedSlug = encodeURIComponent(String(first.slug));
  const expectedHref = `/blog/${encodedSlug}`;

  if (!indexHtml.includes(expectedHref)) {
    throw new Error(`[check-blog-static-seo] Static /blog HTML is missing article link: ${first.slug}`);
  }
  if (!indexHtml.includes(String(first.title))) {
    throw new Error(`[check-blog-static-seo] Static /blog HTML is missing article title: ${first.title}`);
  }

  const articlePath = await firstExisting([
    `dist/blog/${first.slug}.html`,
    `dist/blog/${first.slug}/index.html`,
  ]);
  if (!articlePath) {
    throw new Error(`[check-blog-static-seo] Exported article HTML is missing: ${first.slug}`);
  }

  const articleHtml = await readFile(articlePath, 'utf8');
  const canonical = `https://jeetobaz.pk/blog/${first.slug}`;
  if (!articleHtml.includes(String(first.title))) {
    throw new Error(`[check-blog-static-seo] Static article title is missing: ${first.title}`);
  }
  if (!articleHtml.includes(canonical)) {
    throw new Error(`[check-blog-static-seo] Static article canonical URL is missing: ${canonical}`);
  }

  const contentProbe = String(first.content || '')
    .replace(/^##\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 5)
    .join(' ');

  if (contentProbe && !articleHtml.includes(contentProbe)) {
    throw new Error('[check-blog-static-seo] Static article body content is missing.');
  }
}

console.log(`[check-blog-static-seo] Passed for ${visible.length} visible blog post(s).`);
