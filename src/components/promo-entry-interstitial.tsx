import { Image } from 'expo-image';
import { usePathname } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

const PROMO_SESSION_KEY = 'jeetobaz:entry-promo:2026-07-v1';
const PROMO_DURATION_SECONDS = 3;

const PROMO_ASSETS = {
  mobile: {
    source: require('@/assets/images/promo-entry/jeetobaz-entry-mobile.jpg'),
    width: 1024,
    height: 1536,
  },
  tablet: {
    source: require('@/assets/images/promo-entry/jeetobaz-entry-tablet.jpg'),
    width: 1448,
    height: 1086,
  },
  desktop: {
    source: require('@/assets/images/promo-entry/jeetobaz-entry-desktop.jpg'),
    width: 1402,
    height: 1122,
  },
} as const;

export function PromoEntryInterstitial() {
  const pathname = usePathname();
  const { width, height } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [assetReady, setAssetReady] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(PROMO_DURATION_SECONDS);

  const promo = useMemo(() => {
    if (width < 700) return PROMO_ASSETS.mobile;
    if (width < 1100) return PROMO_ASSETS.tablet;
    return PROMO_ASSETS.desktop;
  }, [width]);

  const fittedSize = useMemo(() => {
    const scale = Math.min(width / promo.width, height / promo.height);
    return {
      width: Math.round(promo.width * scale),
      height: Math.round(promo.height * scale),
    };
  }, [height, promo.height, promo.width, width]);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(PROMO_SESSION_KEY, 'shown');
    } catch {
      // Private browsing may block storage; closing the current view still works.
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || pathname !== '/') return;

    try {
      if (sessionStorage.getItem(PROMO_SESSION_KEY)) return;
    } catch {
      // Private browsing may block storage; the current render can still show safely.
    }

    setVisible(true);
  }, [pathname]);

  useEffect(() => {
    if (!visible || !assetReady) return;

    const interval = setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          clearInterval(interval);
          dismiss();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [assetReady, dismiss, visible]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    document.documentElement.classList.add('jeetobaz-promo-active');
    return () => {
      document.documentElement.classList.remove('jeetobaz-promo-active');
    };
  }, [visible]);

  if (Platform.OS !== 'web') return null;

  if (!visible) return null;

  return (
      <View style={styles.screen} accessibilityViewIsModal>
        <Pressable
          onPress={dismiss}
          style={[styles.promoFrame, fittedSize]}
          accessibilityRole="button"
          accessibilityLabel="Explore JeetoBaz draws"
          accessibilityHint="Closes this welcome promotion and opens the JeetoBaz home draws"
        >
          <Image
            source={promo.source}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={180}
            accessibilityLabel="JeetoBaz prizes welcome promotion"
            onLoad={() => setAssetReady(true)}
          />
        </Pressable>

        <Pressable
          onPress={dismiss}
          style={({ pressed }) => [styles.skipButton, pressed && styles.skipButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Skip welcome promotion. ${secondsRemaining} seconds remaining`}
        >
          <Text style={styles.skipText}>{secondsRemaining} Skip</Text>
        </Pressable>
      </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: 'fixed' as 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2147483647,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f1df',
    overflow: 'hidden',
  },
  promoFrame: {
    position: 'relative',
    overflow: 'hidden',
  },
  skipButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    minWidth: 82,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 55, 32, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.72)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  skipButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
