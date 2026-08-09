import { useLocalSearchParams, useRouter } from 'expo-router';

// Only accept same-app, path-only values -- guards against a `from` value ever being used to
// navigate off jeetobaz.pk (e.g. `from=//evil.com` or `from=https://evil.com`), even though today
// every caller of useSafeBack() only ever passes a hardcoded internal path.
function isSafeInternalPath(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.includes('://');
}

// The app's navigator is one flat Tabs tree (see _layout.tsx) -- every screen, including hidden
// ones like this, is registered as a sibling tab rather than nested in a per-tab Stack. That makes
// router.back() unreliable across tab boundaries: navigating here from a non-Home tab (Profile,
// Favorites, Past Winners) and then calling router.back() can land on Home instead of the screen
// the user actually came from.
//
// Fix: the caller passes a `from` query param naming the exact path to return to when it navigates
// here. useSafeBack() reads that param and does a router.replace() to it. When no `from` param is
// present (e.g. someone opened this page directly, or an entry point hasn't been updated yet),
// it falls back to `fallbackPath` if given, otherwise plain router.back() -- so this is always at
// least as safe as what every page already did before adopting this hook.
export function useSafeBack(fallbackPath?: string) {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();

  return () => {
    if (isSafeInternalPath(params.from)) {
      router.replace(params.from as never);
      return;
    }
    if (fallbackPath) {
      router.replace(fallbackPath as never);
      return;
    }
    router.back();
  };
}
