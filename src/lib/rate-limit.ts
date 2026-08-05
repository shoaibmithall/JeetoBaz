import { getStoredValue, setStoredValue } from '@/lib/storage';

const PAYMENT_COOLDOWN_MS = 60 * 1000;

export function getPaymentRateLimitKey(productId: string, phone: string) {
  return `paymentSubmitAt:${productId}:${phone}`;
}

export async function checkPaymentCooldown(productId: string, phone: string) {
  const key = getPaymentRateLimitKey(productId, phone);
  const lastSubmitAt = Number(await getStoredValue(key));
  if (!lastSubmitAt || Number.isNaN(lastSubmitAt)) return { allowed: true, waitSeconds: 0 };

  const remainingMs = PAYMENT_COOLDOWN_MS - (Date.now() - lastSubmitAt);
  if (remainingMs <= 0) return { allowed: true, waitSeconds: 0 };

  return { allowed: false, waitSeconds: Math.ceil(remainingMs / 1000) };
}

export async function markPaymentSubmitAttempt(productId: string, phone: string) {
  await setStoredValue(getPaymentRateLimitKey(productId, phone), String(Date.now()));
}

export function getWalletTopupRateLimitKey(phone: string) {
  return `walletTopupSubmitAt:${phone}`;
}

export async function checkWalletTopupCooldown(phone: string) {
  const key = getWalletTopupRateLimitKey(phone);
  const lastSubmitAt = Number(await getStoredValue(key));
  if (!lastSubmitAt || Number.isNaN(lastSubmitAt)) return { allowed: true, waitSeconds: 0 };

  const remainingMs = PAYMENT_COOLDOWN_MS - (Date.now() - lastSubmitAt);
  if (remainingMs <= 0) return { allowed: true, waitSeconds: 0 };

  return { allowed: false, waitSeconds: Math.ceil(remainingMs / 1000) };
}

export async function markWalletTopupSubmitAttempt(phone: string) {
  await setStoredValue(getWalletTopupRateLimitKey(phone), String(Date.now()));
}
