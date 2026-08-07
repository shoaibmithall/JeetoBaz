import { supabase } from '@/lib/supabase';
import type { AppNotification, NotificationPreferences } from '@/types/database';

export type { NotificationPreferences } from '@/types/database';

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
    message: input.body.trim(),
    target_phone: input.targetPhone || null,
    link: input.link || null,
    kind: input.kind || 'general',
  });
}

export async function createUserNotification(input: CreateNotificationInput) {
  try {
    const { error } = await createNotification(input);
    if (error) console.warn('Notification save failed:', error.message);
  } catch {
    // Notifications must never block payment approval or draw flows.
  }
}

export function isNotificationForUser(notification: AppNotification, phone: string) {
  return !notification.target_phone || notification.target_phone === phone;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  prize_updates: true,
  winner_announcements: true,
  payment_notifications: true,
  promotional: true,
};

const NOTIFICATION_KIND_TO_PREFERENCE_KEY: Record<string, keyof NotificationPreferences> = {
  'new-contest': 'prize_updates',
  'draw-reminder': 'prize_updates',
  'draw-ready': 'prize_updates',
  'winner-alert': 'winner_announcements',
  'winner-announced': 'winner_announcements',
  'payment-confirmed': 'payment_notifications',
  'promotional': 'promotional',
  'review-request': 'promotional',
};

// Kinds not present in the map (e.g. 'admin', 'general') are always shown — only categorized,
// non-essential kinds can be opted out of.
export function isNotificationKindAllowed(
  kind: string | null | undefined,
  preferences: NotificationPreferences | null | undefined,
) {
  if (!kind) return true;
  const preferenceKey = NOTIFICATION_KIND_TO_PREFERENCE_KEY[kind];
  if (!preferenceKey) return true;
  const resolved = preferences || DEFAULT_NOTIFICATION_PREFERENCES;
  return resolved[preferenceKey] !== false;
}
