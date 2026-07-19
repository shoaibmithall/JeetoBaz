import { useEffect } from 'react';
import { Platform } from 'react-native';

const TAWK_SITE_ID = '6a5cbc301c52dc1d4c7edfcb';
const TAWK_WIDGET_ID = '1jtt3u7ge';
const SCRIPT_ID = 'tawkto-script';

export function TawkToWidget() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;
    if (document.getElementById(SCRIPT_ID)) return;

    const s1 = document.createElement('script');
    s1.id = SCRIPT_ID;
    s1.async = true;
    s1.src = `https://embed.tawk.to/${TAWK_SITE_ID}/${TAWK_WIDGET_ID}`;
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    document.body.appendChild(s1);

    return () => {
      const script = document.getElementById(SCRIPT_ID);
      if (script) script.remove();
    };
  }, []);

  return null;
}
