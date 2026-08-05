// Stage 3 of push notifications: sends a real Web Push to every subscribed device whenever a row
// is inserted into `public.notifications` (the same table that already powers the in-app bell --
// see src/lib/notifications.ts's createNotification). Wired up via a Supabase Database Webhook
// (Database -> Webhooks -> notifications -> INSERT -> this function), not a Postgres trigger, so
// no secrets need to live inside SQL.
//
// `verify_jwt = false` is set for this function in supabase/config.toml since Database Webhooks
// don't send a user JWT -- instead this checks a shared secret header set on the webhook config,
// so the endpoint can't be spammed by anyone who finds the URL.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.108.2';
import webpush from 'npm:web-push@3.6.7';

function getRequiredSecret(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function getSupabaseSecretKey() {
  const direct =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
    Deno.env.get('SUPABASE_SECRET_KEY');
  if (direct) return direct;

  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (secretKeys) {
    const parsed = JSON.parse(secretKeys) as Record<string, string>;
    const entries = Object.entries(parsed);
    const value =
      entries.find(([name]) => /service.?role|secret/i.test(name))?.[1] ||
      entries.find(([, candidate]) => candidate.startsWith('sb_secret_'))?.[1] ||
      entries[0]?.[1];
    if (value) return value;
  }

  throw new Error('Supabase server secret is unavailable');
}

type NotificationRecord = {
  target_phone: string | null;
  title: string;
  message: string;
  link: string | null;
};

type WebhookPayload = {
  type: string;
  table: string;
  record: NotificationRecord;
};

Deno.serve(async (request) => {
  try {
    const webhookSecret = getRequiredSecret('PUSH_WEBHOOK_SECRET');
    const receivedSecret = request.headers.get('x-webhook-secret');
    if (receivedSecret !== webhookSecret) {
      return new Response('Unauthorized', { status: 401 });
    }

    const payload = (await request.json()) as WebhookPayload;
    if (payload.table !== 'notifications' || payload.type !== 'INSERT') {
      return new Response(JSON.stringify({ ignored: true }), { status: 200 });
    }

    const record = payload.record;
    const supabaseUrl = getRequiredSecret('SUPABASE_URL');
    const supabase = createClient(supabaseUrl, getSupabaseSecretKey(), {
      auth: { persistSession: false },
    });

    webpush.setVapidDetails(
      'mailto:support@jeetobaz.pk',
      getRequiredSecret('VAPID_PUBLIC_KEY'),
      getRequiredSecret('VAPID_PRIVATE_KEY')
    );

    let query = supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth');
    if (record.target_phone) query = query.eq('phone', record.target_phone);
    const { data: subscriptions, error } = await query;
    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
    }

    const pushPayload = JSON.stringify({
      title: record.title,
      body: record.message,
      link: record.link || '/',
    });

    const staleIds: string[] = [];
    let sentCount = 0;

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            pushPayload
          );
          sentCount += 1;
        } catch (sendError) {
          const statusCode = (sendError as { statusCode?: number } | undefined)?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            staleIds.push(subscription.id);
          } else {
            console.error('Push send failed:', sendError);
          }
        }
      })
    );

    if (staleIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', staleIds);
    }

    return new Response(JSON.stringify({ sent: sentCount, stale_removed: staleIds.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('send-push-notification error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
