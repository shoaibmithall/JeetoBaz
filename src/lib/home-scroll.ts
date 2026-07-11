const homeScrollListeners = new Set<() => void>();

export function requestHomeScrollToTop() {
  homeScrollListeners.forEach((listener) => listener());
}

export function subscribeHomeScrollToTop(listener: () => void) {
  homeScrollListeners.add(listener);
  return () => {
    homeScrollListeners.delete(listener);
  };
}
