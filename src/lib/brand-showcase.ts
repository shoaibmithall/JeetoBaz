import { supabase } from '@/lib/supabase';
import type { BrandShowcaseImage } from '@/types/database';

export async function getPublicBrandShowcaseImages() {
  return supabase
    .from('brand_showcase_images')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
}

export async function getAllBrandShowcaseImages() {
  return supabase
    .from('brand_showcase_images')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
}

export async function createBrandShowcaseImage(image: Pick<BrandShowcaseImage, 'image_url' | 'image_path'>) {
  return supabase.from('brand_showcase_images').insert(image).select().single();
}

export async function updateBrandShowcaseImageVisibility(id: string, is_visible: boolean) {
  return supabase.from('brand_showcase_images').update({ is_visible }).eq('id', id).select().single();
}

export async function deleteBrandShowcaseImage(id: string) {
  return supabase.from('brand_showcase_images').delete().eq('id', id);
}
