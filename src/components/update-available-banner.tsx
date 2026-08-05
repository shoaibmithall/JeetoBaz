import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';

// Deliberately reads a static asset's own HTTP caching headers (ETag / Last-Modified) rather
// than a custom version file written by a build script -- Netlify's actual build command isn't
// version-controlled here (README says `npx expo export -p web`, not `npm run build`), so a
// generated file could silently go stale on a host whose build step we don't fully control.
// Every static file host sets one of these headers automatically, with no build change needed.
async function fetchBuildMarker(): Promise<string | null> {
  try {
    const response = await fetch(`/?_freshness_check=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
    if (!response.ok) return null;
    return response.headers.get('etag') || response.headers.get('last-modified') || null;
  } catch {
    return null;
  }
}

// iOS Safari (especially JeetoBaz installed to the Home Screen -- manifest.json sets
// display: standalone) can freeze a tab's whole JS process for very long stretches and resume it
// without ever re-fetching, so a user can end up staring at a build from months ago until they
// force-quit and relaunch. A visibilitychange check on resume catches that without requiring the
// manual quit-and-reopen step.
export function UpdateAvailableBanner() {
  const { theme } = useAppTheme();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const initialMarkerRef = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let active = true;
    fetchBuildMarker().then((marker) => { if (active) initialMarkerRef.current = marker; });

    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible' || !initialMarkerRef.current) return;
      fetchBuildMarker().then((marker) => {
        if (active && marker && marker !== initialMarkerRef.current) setUpdateAvailable(true);
      });
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (Platform.OS !== 'web' || !updateAvailable) return null;

  return (
    <View style={[styles.bar, { backgroundColor: theme.gold }]}>
      <RefreshCw color={theme.buttonText} size={17} />
      <Text style={[styles.text, { color: theme.buttonText }]}>A new version of JeetoBaz is available.</Text>
      <TouchableOpacity style={styles.button} onPress={() => window.location.reload()} accessibilityRole="button">
        <Text style={[styles.buttonText, { color: theme.gold }]}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'fixed' as 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 10000,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  } as never,
  text: { fontSize: 13, fontWeight: 'bold' },
  button: { backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  buttonText: { fontSize: 13, fontWeight: 'bold' },
});
