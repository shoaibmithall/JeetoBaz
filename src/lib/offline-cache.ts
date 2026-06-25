import { getStoredValue, setStoredValue } from '@/lib/storage';

type CachePayload<T> = {
  savedAt: string;
  data: T;
};

export async function saveOfflineCache<T>(key: string, data: T) {
  await setStoredValue(key, JSON.stringify({ savedAt: new Date().toISOString(), data }));
}

export async function loadOfflineCache<T>(key: string) {
  const value = await getStoredValue(key);
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as CachePayload<T>;
    if (!parsed || !Array.isArray(parsed.data)) return null;
    return parsed;
  } catch {
    return null;
  }
}
