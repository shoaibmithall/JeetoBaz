import { supabase } from '@/lib/supabase';

export const HOME_AD_IMAGES_KEY = 'home_ad_images';
export const ANNOUNCEMENT_KEY = 'announcement';
export const GOOGLE_REVIEW_LINK_KEY = 'google_review_link';
export const PAYMENT_ACCOUNTS_KEY = 'payment_accounts';

export type PaymentAccount = {
  method: string;
  number: string;
  accountTitle: string;
  qrImageUrl: string | null;
  active: boolean;
};

function normalizeImageUrls(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export async function getHomeAdImages() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', HOME_AD_IMAGES_KEY)
    .maybeSingle();

  if (error) return { images: [], error };
  return { images: normalizeImageUrls(data?.value), error: null };
}

export async function saveHomeAdImages(images: string[]) {
  const cleanImages = images
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 10);

  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: HOME_AD_IMAGES_KEY, value: cleanImages });

  return { images: cleanImages, error };
}

export async function getAnnouncement() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', ANNOUNCEMENT_KEY)
    .maybeSingle();

  if (error) return { announcement: '', error };
  return {
    announcement: typeof data?.value === 'string' ? data.value.trim() : '',
    error: null,
  };
}

export async function saveAnnouncement(value: string) {
  const announcement = value.trim();
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: ANNOUNCEMENT_KEY, value: announcement });

  return { announcement, error };
}

export async function getGoogleReviewLink() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', GOOGLE_REVIEW_LINK_KEY)
    .maybeSingle();

  if (error) return { link: '', error };
  return {
    link: typeof data?.value === 'string' ? data.value.trim() : '',
    error: null,
  };
}

export async function saveGoogleReviewLink(value: string) {
  const link = value.trim();
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: GOOGLE_REVIEW_LINK_KEY, value: link });

  return { link, error };
}

function normalizePaymentAccounts(value: unknown): PaymentAccount[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      method: typeof item.method === 'string' ? item.method.trim() : '',
      number: typeof item.number === 'string' ? item.number.trim() : '',
      accountTitle: typeof item.accountTitle === 'string' ? item.accountTitle.trim() : '',
      qrImageUrl: typeof item.qrImageUrl === 'string' && item.qrImageUrl.trim() ? item.qrImageUrl.trim() : null,
      active: item.active !== false,
    }))
    .filter((account) => account.method && account.number && account.accountTitle);
}

export async function getPaymentAccounts() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', PAYMENT_ACCOUNTS_KEY)
    .maybeSingle();

  if (error) return { accounts: [], error };
  return { accounts: normalizePaymentAccounts(data?.value), error: null };
}

export async function savePaymentAccounts(accounts: PaymentAccount[]) {
  const cleanAccounts = normalizePaymentAccounts(accounts);
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: PAYMENT_ACCOUNTS_KEY, value: cleanAccounts });

  return { accounts: cleanAccounts, error };
}
