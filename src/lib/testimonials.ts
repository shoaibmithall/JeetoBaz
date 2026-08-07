import { supabase } from '@/lib/supabase';
import type { Testimonial } from '@/types/database';

export async function getPublicTestimonials() {
  return supabase
    .from('testimonials')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
}

export async function getAllTestimonials() {
  return supabase
    .from('testimonials')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
}

export async function createTestimonial(
  testimonial: Pick<Testimonial, 'reviewer_name' | 'review_text' | 'rating'> &
    Partial<Pick<Testimonial, 'draw_result_id' | 'source' | 'source_url'>>
) {
  return supabase.from('testimonials').insert(testimonial).select().single();
}

export async function updateTestimonialVisibility(id: string, is_visible: boolean) {
  return supabase.from('testimonials').update({ is_visible }).eq('id', id).select().single();
}

export async function deleteTestimonial(id: string) {
  return supabase.from('testimonials').delete().eq('id', id);
}
