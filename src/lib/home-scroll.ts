const scrollListeners = new Map<string, Set<() => void>>();

export function requestScrollToTop(key: string) {
  scrollListeners.get(key)?.forEach((listener) => listener());
}

export function subscribeScrollToTop(key: string, listener: () => void) {
  if (!scrollListeners.has(key)) scrollListeners.set(key, new Set());
  const listeners = scrollListeners.get(key)!;
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Kept as thin wrappers around the 'home' channel -- index.tsx already imports these by name.
export function requestHomeScrollToTop() {
  requestScrollToTop('home');
}

export function subscribeHomeScrollToTop(listener: () => void) {
  return subscribeScrollToTop('home', listener);
}
