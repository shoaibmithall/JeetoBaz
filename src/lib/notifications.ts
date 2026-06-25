import { supabase } from '@/lib/supabase';
import type { AppNotification } from '@/types/database';

export type CreateNotificationInput = {
  title: string;
  body: string;
  targetPhone?: string | null;
  link?: string | null;
  kind?: string | null;
};

export async function createNotification(input: CreateNotificationInput) {
  return supabase.from('notifications').insert({
    title: input.title.trim(),
    body: input.body.trim(),
    target_phone: input.targetPhone || null,
    link: input.link || null,
    kind: input.kind || 'general',
  });
}

export async function createUserNotification(input: CreateNotificationInput) {
  try {
    await createNotification(input);
  } catch {
    // Notifications must never block payment approval or draw flows.
  }
}

export function isNotificationForUser(notification: AppNotification, phone: string) {
  return !notification.target_phone || notification.target_phone === phone;
}
