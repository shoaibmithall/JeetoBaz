import { supabase } from '@/lib/supabase';

export const HOME_AD_IMAGES_KEY = 'home_ad_images';

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
