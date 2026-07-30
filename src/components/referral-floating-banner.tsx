import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Gift, X } from 'lucide-react-native';
import { getStoredValue, setStoredValue } from '@/lib/storage';

const STORAGE_KEY = 'referralBannerLastShownAt';
const SHOW_DELAY_MS = 1500;
const VISIBLE_DURATION_MS = 7000;
const REPEAT_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
const SWIPE_UP_DISMISS_THRESHOLD = -30;

const COLORS = {
  background: '#04140e',
  border: '#c9a000',
  gold: '#FFD700',
  text: '#ffffff',
  muted: '#c7d3cc',
};

export function ReferralFloatingBanner() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-160)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function dismiss() {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    Animated.timing(translateY, {
      toValue: -160,
      duration: 280,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderMove: (_evt, gesture) => {
        if (gesture.dy < 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dy <= SWIPE_UP_DISMISS_THRESHOLD) {
          dismiss();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    (async () => {
      const stored = await getStoredValue(STORAGE_KEY);
      const now = Date.now();
      const shouldShow = !stored || now - Number(stored) >= REPEAT_AFTER_MS;
      if (!shouldShow || cancelled) return;

      showTimer = setTimeout(() => {
        if (cancelled) return;
        setVisible(true);
        setStoredValue(STORAGE_KEY, String(Date.now()));
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
        hideTimer.current = setTimeout(dismiss, VISIBLE_DURATION_MS);
      }, SHOW_DELAY_MS);
    })();

    return () => {
      cancelled = true;
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
      <View pointerEvents="box-none" style={styles.overlay}>
        <Animated.View
          style={[styles.banner, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.accentBar} />
          <View style={styles.iconBox}>
            <Gift color={COLORS.gold} size={26} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>Refer &amp; Earn</Text>
            <Text style={styles.message} numberOfLines={2}>
              Invite friends to JeetoBaz and earn rewards after successful referrals.
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Share Now"
            style={styles.shareButton}
            onPress={() => {
              dismiss();
              router.push({ pathname: '/referral', params: { source: 'floating-banner' } });
            }}
          >
            <View style={styles.shareButtonInner}>
              <Text style={styles.shareButtonText}>Share Now</Text>
              <ArrowRight color="#07130c" size={14} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close referral notification"
            style={styles.closeButton}
            onPress={dismiss}
          >
            <X color={COLORS.muted} size={16} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 18,
  },
  banner: {
    width: '92%',
    maxWidth: 420,
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.gold,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: COLORS.gold,
    fontSize: 15,
    fontWeight: '800',
  },
  message: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 14,
  },
  shareButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  shareButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shareButtonText: {
    color: '#07130c',
    fontSize: 12,
    fontWeight: '800',
  },
  closeButton: {
    padding: 4,
  },
});
