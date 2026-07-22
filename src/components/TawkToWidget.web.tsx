import { useEffect } from 'react';
import { Platform } from 'react-native';

const TAWK_SITE_ID = '6a5cbc301c52dc1d4c7edfcb';
const TAWK_WIDGET_ID = '1jtt3u7ge';
const SCRIPT_ID = 'tawkto-script';

function positionTawkLauncher() {
  const isMobile = window.innerWidth <= 768;
  const launcherBottom = isMobile ? 116 : 92;

  document.querySelectorAll<HTMLIFrameElement>('iframe').forEach((frame) => {
    const siblingFrames = frame.parentElement?.querySelectorAll(':scope > iframe').length ?? 0;
    if (siblingFrames < 3) return;

    const minHeight = frame.style.minHeight;
    const zIndex = frame.style.zIndex;
    const desiredBottom =
      minHeight === '60px' && zIndex === '1000003'
        ? launcherBottom
        : minHeight === '95px' && zIndex === '1000004'
          ? launcherBottom + 10
          : null;

    if (desiredBottom === null || frame.style.bottom === `${desiredBottom}px`) return;
    frame.style.setProperty('bottom', `${desiredBottom}px`, 'important');
  });
}

export function TawkToWidget() {
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

  return null;
}
