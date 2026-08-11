import { supabase } from '@/lib/supabase';

export const NOTIFICATION_TEMPLATES_KEY = 'notification_templates';

export type NotificationTemplateKey =
  | 'new_contest'
  | 'review_request_with_link'
  | 'review_request_no_link'
  | 'payment_confirmed_existing_entry'
  | 'payment_confirmed'
  | 'draw_ready'
  | 'payment_rejected'
  | 'wallet_topped_up'
  | 'wallet_topup_rejected'
  | 'refund_approved'
  | 'refund_rejected'
  | 'winner_alert'
  | 'winner_announced';

export type NotificationTemplate = { title: string; body: string };

type TemplateDefault = NotificationTemplate & { label: string; variables: string[] };

// The exact wording that was previously hardcoded at each call site -- used as both the
// fallback (so nothing changes for anyone until an admin edits one) and the placeholder shown
// in the admin editor. {{variable}} placeholders are substituted at send time.
export const NOTIFICATION_TEMPLATE_DEFAULTS: Record<NotificationTemplateKey, TemplateDefault> = {
  new_contest: {
    label: 'New draw added',
    title: 'New contest added',
    body: '{{productName}} is now live. Enter the draw today!',
    variables: ['productName'],
  },
  review_request_with_link: {
    label: 'Winner verified — ask for a review',
    title: 'Congratulations again! 🎉',
    body: 'Your win of {{prizeName}} is now verified. If you have a minute, a quick honest review would mean a lot to us.',
    variables: ['prizeName'],
  },
  review_request_no_link: {
    label: 'Winner verified — no review link set',
    title: 'Congratulations again! 🎉',
    body: 'Your win of {{prizeName}} is now verified. Thank you for being part of JeetoBaz!',
    variables: ['prizeName'],
  },
  payment_confirmed_existing_entry: {
    label: 'Payment approved (entry already existed)',
    title: 'Payment confirmed',
    body: 'Your payment for {{productName}} has been confirmed. Your entry is already active.',
    variables: ['productName'],
  },
  payment_confirmed: {
    label: 'Payment approved',
    title: 'Payment confirmed',
    body: 'Your entry for {{productName}} has been approved. Good luck!',
    variables: ['productName'],
  },
  draw_ready: {
    label: 'Draw filled up, ready to run',
    title: 'Draw ready',
    body: '{{productName}} has reached the required number of participants. JeetoBaz will announce the draw date and time.',
    variables: ['productName'],
  },
  payment_rejected: {
    label: 'Payment rejected',
    title: 'Payment could not be verified',
    body: 'Your payment of Rs. {{amount}} could not be confirmed. Please double-check your receipt and try again, or contact support if you believe this is a mistake.',
    variables: ['amount'],
  },
  wallet_topped_up: {
    label: 'Wallet top-up approved',
    title: 'Wallet topped up',
    body: 'Rs. {{amount}} has been added to your wallet.',
    variables: ['amount'],
  },
  wallet_topup_rejected: {
    label: 'Wallet top-up rejected',
    title: 'Wallet top-up could not be verified',
    body: 'Your wallet top-up of Rs. {{amount}} could not be confirmed. Please double-check your receipt and try again, or contact support if you believe this is a mistake.',
    variables: ['amount'],
  },
  refund_approved: {
    label: 'Refund approved',
    title: 'Refund approved',
    body: 'Rs. {{amount}} has been refunded to your JeetoBaz wallet.',
    variables: ['amount'],
  },
  refund_rejected: {
    label: 'Refund rejected',
    title: 'Refund request declined',
    body: 'Your refund request could not be approved. Please contact support if you have questions.',
    variables: [],
  },
  winner_alert: {
    label: 'Winner picked — direct alert',
    title: 'You won!',
    body: 'Congratulations! Aap {{productName}} ke lucky winner select hue hain. JeetoBaz support aap se contact karega.',
    variables: ['productName'],
  },
  winner_announced: {
    label: 'Winner picked — public announcement',
    title: 'Winner announced',
    body: '{{productName}} ka winner announce ho gaya hai. Past Winners page par result check karein.',
    variables: ['productName'],
  },
};

export const NOTIFICATION_TEMPLATE_KEYS = Object.keys(NOTIFICATION_TEMPLATE_DEFAULTS) as NotificationTemplateKey[];

function normalizeTemplateOverrides(value: unknown): Partial<Record<NotificationTemplateKey, NotificationTemplate>> {
  if (!value || typeof value !== 'object') return {};
  const result: Partial<Record<NotificationTemplateKey, NotificationTemplate>> = {};
  for (const key of NOTIFICATION_TEMPLATE_KEYS) {
    const entry = (value as Record<string, unknown>)[key];
    if (entry && typeof entry === 'object') {
      const title = (entry as Record<string, unknown>).title;
      const body = (entry as Record<string, unknown>).body;
      if (typeof title === 'string' && typeof body === 'string' && title.trim() && body.trim()) {
        result[key] = { title: title.trim(), body: body.trim() };
      }
    }
  }
  return result;
}

export async function getNotificationTemplateOverrides(): Promise<{
  overrides: Partial<Record<NotificationTemplateKey, NotificationTemplate>>;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', NOTIFICATION_TEMPLATES_KEY)
    .maybeSingle();

  if (error) return { overrides: {}, error };
  return { overrides: normalizeTemplateOverrides(data?.value), error: null };
}

export async function saveNotificationTemplateOverrides(overrides: Partial<Record<NotificationTemplateKey, NotificationTemplate>>) {
  const clean = normalizeTemplateOverrides(overrides);
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: NOTIFICATION_TEMPLATES_KEY, value: clean });

  return { overrides: clean, error };
}

/** Substitutes {{variable}} placeholders and falls back to the hardcoded default if no override exists. */
export function renderNotificationTemplate(
  key: NotificationTemplateKey,
  variables: Record<string, string | number>,
  overrides?: Partial<Record<NotificationTemplateKey, NotificationTemplate>>,
): NotificationTemplate {
  const base = overrides?.[key] || NOTIFICATION_TEMPLATE_DEFAULTS[key];
  let body = base.body;
  let title = base.title;
  for (const [name, value] of Object.entries(variables)) {
    const placeholder = `{{${name}}}`;
    body = body.split(placeholder).join(String(value));
    title = title.split(placeholder).join(String(value));
  }
  return { title, body };
}
