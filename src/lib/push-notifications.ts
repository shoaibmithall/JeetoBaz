import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// Public key only -- safe to ship in client code. The matching private key lives server-side as a
// Supabase Edge Function secret (Stage 3, the actual send function) and is never exposed here.
const VAPID_PUBLIC_KEY = 'BN3rZA_KlAsncNihnbO0NpRwXetOwV_mqh3jSyMPpyXgiNYAMv0n4NAEPf5hpyR1LlvsFIkBs98NxNzyqstjG9U';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported() {
  return Platform.OS === 'web'
    && typeof navigator !== 'undefined'
    && 'serviceWorker' in navigator
    && typeof window !== 'undefined'
    && 'PushManager' in window;
}

export async function getActivePushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.register('/sw.js');
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush(phone: string): Promise<{ ok: boolean; message?: string }> {
  if (!isPushSupported()) {
    return { ok: false, message: 'Push notifications are not supported on this browser/device. On iPhone/iPad, add JeetoBaz to your Home Screen first.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { ok: false, message: 'Notification permission was not granted.' };
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, message: 'Subscription is missing required keys.' };
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        phone,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        user_agent: navigator.userAgent,
      },
      { onConflict: 'endpoint' }
    );

    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (error) {
    const message = error && typeof error === 'object' && 'message' in error
      ? String(error.message)
      : 'Could not enable push notifications.';
    return { ok: false, message };
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const subscription = await getActivePushSubscription();
    if (!subscription) return;
    await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
    await subscription.unsubscribe();
  } catch {
    // Best-effort -- if this fails, the row can be cleaned up next time the user toggles it.
  }
}
