import { supabase } from '@/lib/supabase';
import type { VerificationDocument } from '@/types/database';

export async function getPublicVerificationDocuments() {
  return supabase
    .from('verification_documents')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
}

export async function getAllVerificationDocuments() {
  return supabase
    .from('verification_documents')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
}

export async function createVerificationDocument(
  document: Pick<VerificationDocument, 'title' | 'description' | 'image_url' | 'image_path'>,
) {
  return supabase.from('verification_documents').insert(document).select().single();
}

export async function updateVerificationDocument(
  id: string,
  document: Partial<Pick<VerificationDocument, 'title' | 'description' | 'image_url' | 'image_path' | 'is_visible'>>,
) {
  return supabase.from('verification_documents').update(document).eq('id', id).select().single();
}

export async function deleteVerificationDocument(id: string) {
  return supabase.from('verification_documents').delete().eq('id', id);
}
