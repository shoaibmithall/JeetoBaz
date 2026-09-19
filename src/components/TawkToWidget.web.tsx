import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { Platform } from 'react-native';

const TAWK_SITE_ID = '6a5cbc301c52dc1d4c7edfcb';
const TAWK_WIDGET_ID = '1jtt3u7ge';
const SCRIPT_ID = 'tawkto-script';
const AUTH_PATHS = ['/login', '/signup', '/forgot-password', '/verify-reset-otp', '/reset-password', '/verify-email'];

type TawkApi = {
  hideWidget?: () => void;
  showWidget?: () => void;
  onLoad?: () => void;
};

declare global {
  interface Window {
    Tawk_API?: TawkApi;
  }
}

function setTawkVisibility(hidden: boolean) {
  if (hidden) window.Tawk_API?.hideWidget?.();
  else window.Tawk_API?.showWidget?.();
}

function positionTawkLauncher() {
  const isMobile =
    window.matchMedia('(max-width: 768px)').matches ||
    window.matchMedia('(pointer: coarse)').matches;
  const launcherBottom = isMobile ? 132 : 108;

  document.querySelectorAll<HTMLIFrameElement>('iframe').forEach((frame) => {
    const siblingFrames = frame.parentElement?.querySelectorAll(':scope > iframe').length ?? 0;
    const title = frame.title.toLowerCase();
    const src = frame.src.toLowerCase();
    const isTawkFrame = title.includes('chat') || src.includes('tawk.to') || siblingFrames >= 3;
    if (!isTawkFrame) return;

    const computedStyle = window.getComputedStyle(frame);
    const measuredHeight = frame.getBoundingClientRect().height;
    const fallbackHeights = [frame.style.height, computedStyle.height, frame.style.minHeight, computedStyle.minHeight]
      .map((value) => Number.parseFloat(value));
    const renderedHeight = measuredHeight > 0
      ? measuredHeight
      : fallbackHeights.find((height) => Number.isFinite(height) && height > 0);

    // Tawk renders the launcher/close control in a small iframe and the open chat panel in a
    // much taller one. Only move the small controls so the full conversation window keeps its
    // intended size and the launcher cannot cover JeetoBaz's fixed Profile tab.
    const isLauncherFrame = Number.isFinite(renderedHeight) && renderedHeight! <= 140;
    if (!isLauncherFrame) return;

    const desiredBottom = renderedHeight! > 100 ? launcherBottom + 10 : launcherBottom;

    if (frame.style.bottom === `${desiredBottom}px`) return;
    frame.style.setProperty('bottom', `${desiredBottom}px`, 'important');
  });
}

export function TawkToWidget() {
  const pathname = usePathname();
  const isAuthRoute = AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;

    const observer = new MutationObserver(positionTawkLauncher);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
      childList: true,
      subtree: true,
    });
    window.addEventListener('resize', positionTawkLauncher);

    let addedScript = false;
    if (!document.getElementById(SCRIPT_ID)) {
      const s1 = document.createElement('script');
      s1.id = SCRIPT_ID;
      s1.async = true;
      s1.src = `https://embed.tawk.to/${TAWK_SITE_ID}/${TAWK_WIDGET_ID}`;
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin', '*');
      document.body.appendChild(s1);
      addedScript = true;
    }

    positionTawkLauncher();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', positionTawkLauncher);
      if (addedScript) document.getElementById(SCRIPT_ID)?.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const currentApi: TawkApi = window.Tawk_API ?? {};
    const previousOnLoad = currentApi.onLoad;
    const handleLoad = () => {
      previousOnLoad?.();
      setTawkVisibility(isAuthRoute);
    };
    currentApi.onLoad = handleLoad;
    window.Tawk_API = currentApi;
    setTawkVisibility(isAuthRoute);

    return () => {
      const activeApi = window.Tawk_API;
      if (activeApi?.onLoad === handleLoad) {
        activeApi.onLoad = previousOnLoad;
      }
    };
  }, [isAuthRoute]);

  return null;
}
