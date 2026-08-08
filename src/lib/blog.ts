import type { ImageSourcePropType } from 'react-native';
import { BadgeCheck, Compass, ShieldCheck, Trophy, Wallet, type LucideIcon } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import type { BlogCategory, BlogPost } from '@/types/database';

export type BlogCategoryMeta = {
  key: BlogCategory;
  label: string;
  icon: LucideIcon;
};

export const BLOG_CATEGORIES: BlogCategoryMeta[] = [
  { key: 'getting-started', label: 'Getting Started', icon: Compass },
  { key: 'how-it-works', label: 'How It Works', icon: BadgeCheck },
  { key: 'trust-safety', label: 'Trust & Safety', icon: ShieldCheck },
  { key: 'payments', label: 'Payments', icon: Wallet },
  { key: 'winners-rewards', label: 'Winners & Rewards', icon: Trophy },
];

export function getBlogCategoryLabel(category: BlogCategory) {
  return BLOG_CATEGORIES.find((entry) => entry.key === category)?.label || category;
}

// Launch-set cover images bundled as app assets (see assets/images/blog/) -- resolved by filename
// key rather than a Storage URL, since these were prepared before the admin panel existed. Posts
// added later through the admin panel upload to the `blog-covers` Storage bucket instead, so
// `cover_image` there is already a full https:// URL and skips this map entirely.
const BLOG_COVERS: Record<string, ImageSourcePropType> = {
  '01-how-draws-work.jpg': require('@/assets/images/blog/01-how-draws-work.jpg'),
  '02-winner-verification.jpg': require('@/assets/images/blog/02-winner-verification.jpg'),
  '03-vs-traditional-raffles.jpg': require('@/assets/images/blog/03-vs-traditional-raffles.jpg'),
  '04-fbr-registered.jpg': require('@/assets/images/blog/04-fbr-registered.jpg'),
  '05-payment-methods.jpg': require('@/assets/images/blog/05-payment-methods.jpg'),
  '06-prize-delivery.jpg': require('@/assets/images/blog/06-prize-delivery.jpg'),
  '07-referral-program.jpg': require('@/assets/images/blog/07-referral-program.jpg'),
  '08-how-fair-are-draws.jpg': require('@/assets/images/blog/08-how-fair-are-draws.jpg'),
  '09-member-id-verified.jpg': require('@/assets/images/blog/09-member-id-verified.jpg'),
  '10-first-time-user-guide.jpg': require('@/assets/images/blog/10-first-time-user-guide.jpg'),
  '11-categories-explained.jpg': require('@/assets/images/blog/11-categories-explained.jpg'),
  '12-avoid-scams.jpg': require('@/assets/images/blog/12-avoid-scams.jpg'),
  '13-winner-proof.jpg': require('@/assets/images/blog/13-winner-proof.jpg'),
  '14-transparency-deep-dive.jpg': require('@/assets/images/blog/14-transparency-deep-dive.jpg'),
  '15-refund-policy.jpg': require('@/assets/images/blog/15-refund-policy.jpg'),
};

export function resolveBlogCover(coverImage: string): ImageSourcePropType {
  if (coverImage.startsWith('http')) return { uri: coverImage };
  return BLOG_COVERS[coverImage] || BLOG_COVERS['01-how-draws-work.jpg'];
}

export type BlogContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullet'; items: string[] };

// Deliberately not full markdown -- just enough structure (## headings, blank-line paragraphs,
// "- " bullet lines) for admin to author from one plain-text field without a rich block editor,
// matching the plain-array-of-sections pattern already used by WHY_FAIR_SECTIONS/REFUND_FAQS.
export function parseBlogContent(content: string): BlogContentBlock[] {
  const blocks: BlogContentBlock[] = [];
  const lines = content.split('\n');
  let paragraphLines: string[] = [];
  let bulletItems: string[] = [];

  function flushParagraph() {
    if (paragraphLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraphLines.join(' ').trim() });
      paragraphLines = [];
    }
  }

  function flushBullets() {
    if (bulletItems.length > 0) {
      blocks.push({ type: 'bullet', items: bulletItems });
      bulletItems = [];
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushBullets();
      continue;
    }
    if (line.startsWith('## ')) {
      flushParagraph();
      flushBullets();
      blocks.push({ type: 'heading', text: line.slice(3).trim() });
    } else if (line.startsWith('- ')) {
      flushParagraph();
      bulletItems.push(line.slice(2).trim());
    } else {
      flushBullets();
      paragraphLines.push(line);
    }
  }
  flushParagraph();
  flushBullets();
  return blocks;
}

export function estimateReadMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function getPublicBlogPosts() {
  return supabase
    .from('blog_posts')
    .select('*')
    .eq('is_visible', true)
    .order('published_at', { ascending: false });
}

export async function getPublicBlogPost(slug: string) {
  return supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_visible', true)
    .maybeSingle();
}

export async function getAllBlogPosts() {
  return supabase
    .from('blog_posts')
    .select('*')
    .order('published_at', { ascending: false });
}

export async function createBlogPost(
  post: Pick<BlogPost, 'slug' | 'title' | 'excerpt' | 'category' | 'content' | 'cover_image'> &
    Partial<Pick<BlogPost, 'read_minutes' | 'published_at' | 'is_visible' | 'sort_order'>>,
) {
  return supabase.from('blog_posts').insert(post).select().single();
}

export async function updateBlogPost(
  id: string,
  post: Partial<Pick<BlogPost, 'slug' | 'title' | 'excerpt' | 'category' | 'content' | 'cover_image' | 'read_minutes' | 'published_at' | 'is_visible' | 'sort_order'>>,
) {
  return supabase.from('blog_posts').update(post).eq('id', id).select().single();
}

export async function deleteBlogPost(id: string) {
  return supabase.from('blog_posts').delete().eq('id', id);
}
