import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Cookie } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { getStoredValue, setStoredValue } from '@/lib/storage';

// Key name matters: +html.tsx's inline GTM bootstrap script reads this same key directly via
// window.localStorage (AsyncStorage's web backend is a thin, unprefixed wrapper over
// localStorage -- see node_modules/@react-native-async-storage/async-storage's web
// implementation), so a "Reject" choice here actually stops Google Tag Manager from loading on
// future page loads, not just cosmetically hides this banner.
export const COOKIE_CONSENT_KEY = 'cookieConsent';

export function CookieConsentBanner() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let active = true;
    getStoredValue(COOKIE_CONSENT_KEY).then((value) => {
      if (active && !value) setVisible(true);
    });
    return () => { active = false; };
  }, []);

  function choose(value: 'accepted' | 'rejected') {
    setVisible(false);
    void setStoredValue(COOKIE_CONSENT_KEY, value);
  }

  if (Platform.OS !== 'web' || !visible) return null;

  return (
    <View style={[styles.bar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      <View style={styles.textRow}>
        <Cookie color={theme.gold} size={20} />
        <Text style={[styles.text, { color: theme.text }]}>
          JeetoBaz uses cookies to keep you signed in, remember your preferences, and understand how the site is used.{' '}
          <Text style={[styles.link, { color: theme.primary }]} onPress={() => router.push('/privacy')}>Learn more</Text>
        </Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.rejectButton, { borderColor: theme.border }]} onPress={() => choose('rejected')} accessibilityRole="button">
          <Text style={[styles.rejectButtonText, { color: theme.muted }]}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.acceptButton, { backgroundColor: theme.gold }]} onPress={() => choose('accepted')} accessibilityRole="button">
          <Text style={[styles.acceptButtonText, { color: theme.buttonText }]}>Accept All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'fixed' as 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    borderTopWidth: 1,
    padding: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
  } as never,
  textRow: { flex: 1, minWidth: 240, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  text: { flex: 1, fontSize: 13, lineHeight: 19 },
  link: { fontWeight: 'bold', textDecorationLine: 'underline' },
  buttonRow: { flexDirection: 'row', gap: 10 },
  rejectButton: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10, borderWidth: 1 },
  rejectButtonText: { fontSize: 13, fontWeight: 'bold' },
  acceptButton: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10 },
  acceptButtonText: { fontSize: 13, fontWeight: 'bold' },
});
