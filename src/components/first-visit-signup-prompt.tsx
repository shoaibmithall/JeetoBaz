import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { UserPlus, X } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/hooks/use-theme';

// Shows on every fresh visit to Home while the visitor is signed out -- not just once ever --
// stopping only once they log in. attemptedRef just prevents re-showing on every in-session
// navigation back to Home (a fresh mount, e.g. a reload or a new visit later, resets it). Waits
// for the promo interstitial's "jeetobaz-promo-active" class to clear first so the two overlays
// never stack.
const INITIAL_DELAY_MS = 1500;
const PROMO_ACTIVE_POLL_MS = 500;

export function FirstVisitSignupPrompt() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useAppTheme();
  const { user, loading: authLoading } = useAuth();
  const [visible, setVisible] = useState(false);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || pathname !== '/' || authLoading || user || attemptedRef.current) return;
    attemptedRef.current = true;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    function tryShow() {
      if (cancelled) return;
      if (document.documentElement.classList.contains('jeetobaz-promo-active')) {
        timer = setTimeout(tryShow, PROMO_ACTIVE_POLL_MS);
        return;
      }
      setVisible(true);
    }
    timer = setTimeout(tryShow, INITIAL_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pathname, user, authLoading]);

  function dismiss() {
    setVisible(false);
  }

  function goTo(path: '/signup' | '/login') {
    dismiss();
    router.push(path);
  }

  if (Platform.OS !== 'web' || !visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={dismiss} accessibilityLabel="Skip and continue browsing" />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.gold }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={dismiss} accessibilityRole="button" accessibilityLabel="Skip and continue browsing">
            <X color={theme.muted} size={22} />
          </TouchableOpacity>
          <View style={[styles.iconCircle, { backgroundColor: theme.primarySoft }]}>
            <UserPlus color={theme.gold} size={32} />
          </View>
          <Text style={[styles.title, { color: theme.gold }]}>Welcome to JeetoBaz!</Text>
          <Text style={[styles.body, { color: theme.muted }]}>
            Sign up free to enter draws, track your tickets, and get notified the moment you win.
          </Text>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.gold }]} onPress={() => goTo('/signup')} accessibilityRole="button">
            <Text style={[styles.primaryBtnText, { color: theme.buttonText }]}>Sign Up Free</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => goTo('/login')} accessibilityRole="button">
            <Text style={[styles.secondaryBtnText, { color: theme.primary }]}>I already have an account</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={dismiss} accessibilityRole="button">
            <Text style={[styles.skipText, { color: theme.subtle }]}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 400, borderRadius: 18, borderWidth: 1, padding: 26, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 14, right: 14, padding: 4 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 21, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  primaryBtn: { width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { width: '100%', paddingVertical: 13, borderRadius: 12, alignItems: 'center', marginBottom: 6 },
  secondaryBtnText: { fontSize: 14, fontWeight: '600' },
  skipText: { fontSize: 13, marginTop: 4, textDecorationLine: 'underline' },
});
