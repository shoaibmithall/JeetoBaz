import { getStoredValue, removeStoredValues, setStoredValue } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

const DEVICE_TOKEN_KEY = 'referralDeviceToken';
const PENDING_REFERRAL_KEY = 'pendingReferralCode';

function createDeviceToken() {
  const randomPart = Math.random().toString(36).slice(2);
  return `device_${Date.now().toString(36)}_${randomPart}_${Math.random().toString(36).slice(2)}`;
}

export function normalizeReferralCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20);
}

export async function getReferralDeviceToken() {
  const saved = await getStoredValue(DEVICE_TOKEN_KEY);
  if (saved) return saved;

  const token = createDeviceToken();
  await setStoredValue(DEVICE_TOKEN_KEY, token);
  return token;
}

export async function savePendingReferralCode(code: string) {
  const normalized = normalizeReferralCode(code);
  if (normalized) await setStoredValue(PENDING_REFERRAL_KEY, normalized);
}

export async function claimPendingReferral(phone: string) {
  const code = await getStoredValue(PENDING_REFERRAL_KEY);
  if (!code) return;

  const deviceToken = await getReferralDeviceToken();
  const { error } = await supabase.rpc('claim_referral_code', {
    requested_phone: phone,
    requested_code: code,
    requested_device_token: deviceToken,
  });

  if (!error) await removeStoredValues([PENDING_REFERRAL_KEY]);
}
