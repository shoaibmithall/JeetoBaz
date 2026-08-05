import { getStoredStringArray, setStoredValue } from '@/lib/storage';

// Device-level, not per-account -- recently viewed works the same whether or not the visitor is
// logged in, unlike favorites (favoritesStorageKey(user.id) in favorites.tsx), since it's closer
// to browsing history than saved account data.
const RECENTLY_VIEWED_KEY = 'recentlyViewedProductIds';
const MAX_RECENTLY_VIEWED = 20;

export async function recordRecentlyViewedProduct(productId: string) {
  const current = await getStoredStringArray(RECENTLY_VIEWED_KEY);
  const next = [productId, ...current.filter((id) => id !== productId)].slice(0, MAX_RECENTLY_VIEWED);
  await setStoredValue(RECENTLY_VIEWED_KEY, JSON.stringify(next));
}

export async function getRecentlyViewedProductIds() {
  return getStoredStringArray(RECENTLY_VIEWED_KEY);
}

export async function pruneRecentlyViewedProductIds(validIds: string[]) {
  await setStoredValue(RECENTLY_VIEWED_KEY, JSON.stringify(validIds));
}
