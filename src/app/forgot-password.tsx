import { Image, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { validateEmail } from '@/lib/auth-validation';
import { useAppTheme } from '@/hooks/use-theme';
import { ChevronLeft, LockKeyhole, Mail, Shield, Send } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [rateLimitError, setRateLimitError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [countdown]);

  async function handleSendOTP() {
    const validationError = validateEmail(email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }

    setLoading(true);
    setEmailError('');
    setRateLimitError('');

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('rate') || msg.includes('limit') || msg.includes('Too many')) {
        setRateLimitError('Too many reset requests. Please wait a few minutes and try again.');
      } else if (msg.includes('not found') || msg.includes('invalid')) {
        setEmailError('No account found with this email.');
      } else {
        alert('Failed to send OTP: ' + msg);
      }
    } else {
      setSent(true);
      setCountdown(60);
    }

    setLoading(false);
  }

  async function handleResendOTP() {
    if (countdown > 0) return;
    setLoading(true);
    setRateLimitError('');

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('rate') || msg.includes('limit') || msg.includes('Too many')) {
        setRateLimitError('Too many requests. Please wait and try again.');
      }
    } else {
      setCountdown(60);
    }

    setLoading(false);
  }

  function handleContinue() {
    router.push({ pathname: '/verify-reset-otp' as never, params: { email: email.trim().toLowerCase() } });
  }

  if (sent) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.replace('/forgot-password')} style={styles.backBtn}>
              <ChevronLeft color="white" size={24} />
            </TouchableOpacity>
            <View style={styles.logoRow}>
              <Image source={require('@/assets/images/icon.png')} style={styles.logoImage} />
              <Text style={styles.logo}>JeetoBaz</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.secureBadge}>
              <Mail color="#FFD700" size={16} />
              <Text style={styles.secureBadgeText}>OTP Sent!</Text>
            </View>

            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit verification code to:
            </Text>
            <Text style={styles.email}>{email.trim().toLowerCase()}</Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleContinue}
            >
              <LockKeyhole color="#000" size={18} />
              <Text style={styles.primaryButtonText}>Enter OTP Code</Text>
            </TouchableOpacity>

            <View style={styles.resendRow}>
              {countdown > 0 ? (
                <Text style={[styles.countdownText, { color: theme.muted }]}>
                  Resend OTP in {countdown}s
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            {rateLimitError ? (
              <Text style={styles.rateLimitText}>{rateLimitError}</Text>
            ) : null}
          </View>

          <View style={styles.trustStrip}>
            <View style={styles.trustItem}>
              <Shield color="#18a663" size={14} />
              <Text style={styles.trustText}>Secure Reset</Text>
            </View>
            <View style={styles.trustItem}>
              <LockKeyhole color="#18a663" size={14} />
              <Text style={styles.trustText}>Code Expires Soon</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color="white" size={24} />
          </TouchableOpacity>
          <View style={styles.logoRow}>
            <Image source={require('@/assets/images/icon.png')} style={styles.logoImage} />
            <Text style={styles.logo}>JeetoBaz</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.secureBadge}>
            <LockKeyhole color="#18a663" size={16} />
            <Text style={styles.secureBadgeText}>Password Recovery</Text>
          </View>

          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a 6-digit verification code.
          </Text>

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: emailError ? '#ff4444' : theme.border }]}>
            <Mail color={theme.muted} size={18} />
            <TextInput
              style={[styles.inputField, { color: theme.text }]}
              placeholder="you@example.com"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(v) => { setEmail(v); setEmailError(''); setRateLimitError(''); }}
            />
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Send color="#000" size={18} />
                <Text style={styles.primaryButtonText}>Send Verification Code</Text>
              </>
            )}
          </TouchableOpacity>

          {rateLimitError ? (
            <Text style={styles.rateLimitText}>{rateLimitError}</Text>
          ) : null}

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Back to Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.trustStrip}>
          <View style={styles.trustItem}>
            <Shield color="#18a663" size={14} />
            <Text style={styles.trustText}>Secure Reset</Text>
          </View>
          <View style={styles.trustItem}>
            <LockKeyhole color="#18a663" size={14} />
            <Text style={styles.trustText}>Code Expires Soon</Text>
          </View>
        </View>

        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => router.push('/terms' as never)}>
            <Text style={styles.footerLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>•</Text>
          <TouchableOpacity onPress={() => router.push('/privacy' as never)}>
            <Text style={styles.footerLink}>Privacy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  scrollContent: { paddingBottom: 40 },
  header: { backgroundColor: '#04140e', borderBottomColor: '#FFD700', borderBottomWidth: 2, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  logoRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImage: { width: 40, height: 40, borderRadius: 8 },
  logo: { fontSize: 28, fontWeight: 'bold', color: 'white' },

  card: { backgroundColor: '#071b13', marginHorizontal: 20, marginTop: 24, borderRadius: 16, borderWidth: 1, borderColor: '#174a35', padding: 24 },

  secureBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20, paddingVertical: 8, backgroundColor: '#0a2419', borderRadius: 8 },
  secureBadgeText: { color: '#18a663', fontSize: 12, fontWeight: '600' },

  title: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9aac9f', textAlign: 'center', marginBottom: 24, lineHeight: 20 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, marginBottom: 6, paddingHorizontal: 14, gap: 10 },
  inputField: { flex: 1, padding: 16, fontSize: 16 },
  errorText: { color: '#ff4444', fontSize: 12, marginBottom: 10, marginLeft: 4 },

  primaryButton: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 16 },
  buttonDisabled: { backgroundColor: '#555' },
  primaryButtonText: { fontSize: 17, fontWeight: 'bold', color: '#000' },

  backLink: { color: '#18a663', fontSize: 14, fontWeight: '600', textAlign: 'center' },

  email: { fontSize: 16, fontWeight: '700', color: '#FFD700', marginBottom: 20, textAlign: 'center' },

  resendRow: { alignItems: 'center', marginTop: 8 },
  countdownText: { fontSize: 13 },
  resendLink: { color: '#18a663', fontSize: 14, fontWeight: '600' },

  rateLimitText: { color: '#ff4444', fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 18 },

  trustStrip: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 24, paddingHorizontal: 20, flexWrap: 'wrap' },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { color: '#5e7468', fontSize: 11, fontWeight: '500' },

  footerLinks: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16 },
  footerLink: { color: '#5e7468', fontSize: 12 },
  footerDot: { color: '#5e7468', fontSize: 12 },
});
