import { supabase } from '@/lib/supabase';

export const CONTENT_PAGE_SLUGS = ['privacy', 'terms', 'refund_policy', 'shipping_policy'] as const;
export type ContentPageSlug = (typeof CONTENT_PAGE_SLUGS)[number];

export const CONTENT_PAGE_LABELS: Record<ContentPageSlug, string> = {
  privacy: 'Privacy Policy',
  terms: 'Terms & Conditions',
  refund_policy: 'Refund Policy',
  shipping_policy: 'Shipping Policy',
};

export type ContentSection = { category: string; question: string; answer: string };

function contentPageKey(slug: ContentPageSlug) {
  return `content_page_${slug}`;
}

// Returns null (not an empty array) when there's no valid override stored, so callers can tell
// "no override yet" apart from "admin saved an empty list" and fall back to the hardcoded default.
function normalizeContentSections(value: unknown): ContentSection[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const sections: ContentSection[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const category = (item as Record<string, unknown>).category;
    const question = (item as Record<string, unknown>).question;
    const answer = (item as Record<string, unknown>).answer;
    if (typeof category !== 'string' || typeof question !== 'string' || typeof answer !== 'string') return null;
    if (!question.trim() || !answer.trim()) return null;
    sections.push({ category: category.trim(), question: question.trim(), answer: answer.trim() });
  }
  return sections;
}

export async function getContentPageSections(slug: ContentPageSlug): Promise<{
  sections: ContentSection[] | null;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', contentPageKey(slug))
    .maybeSingle();

  if (error) return { sections: null, error };
  return { sections: normalizeContentSections(data?.value), error: null };
}

export async function saveContentPageSections(slug: ContentPageSlug, sections: ContentSection[]) {
  const clean = sections
    .map((s) => ({ category: s.category.trim(), question: s.question.trim(), answer: s.answer.trim() }))
    .filter((s) => s.question && s.answer);

  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: contentPageKey(slug), value: clean });

  return { sections: clean, error };
}
