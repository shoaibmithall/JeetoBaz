import { Image, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/hooks/use-theme';
import { ChevronLeft, KeyRound, LockKeyhole, Shield } from 'lucide-react-native';

const OTP_STORAGE_KEY = 'otp_verify_last_sent_at';
const MAX_RESENDS = 3;

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const masked = local.length > 2
    ? local[0] + '***' + local[local.length - 1]
    : local[0] + '***';
  return `${masked}@${domain}`;
}

export default function VerifyResetOtpScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const lastSent = localStorage.getItem(OTP_STORAGE_KEY);
    if (lastSent) {
      const elapsed = Math.floor((Date.now() - parseInt(lastSent, 10)) / 1000);
      if (elapsed < 60) {
        setCountdown(60 - elapsed);
      }
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  function handleOtpChange(text: string, index: number) {
    if (text.length > 1) text = text.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    setError('');

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otpString,
      type: 'recovery',
    });

    if (verifyError) {
      const msg = verifyError.message || '';
      if (msg.includes('expired') || msg.includes('invalid')) {
        setError('Invalid or expired code. Please try again.');
      } else {
        setError('Verification failed: ' + msg);
      }
      setLoading(false);
      return;
    }

    router.replace('/reset-password' as never);
    setLoading(false);
  }

  async function handleResend() {
    if (countdown > 0 || resendCount >= MAX_RESENDS) return;
    setResendLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase()
    );

    if (error) {
      const msg = error.message || '';
      if (msg.includes('rate') || msg.includes('limit')) {
        setError('Email sending limit reached. Please wait and try again later.');
      }
    } else {
      setCountdown(60);
      setResendCount(resendCount + 1);
      setOtp(['', '', '', '', '', '']);
      localStorage.setItem(OTP_STORAGE_KEY, Date.now().toString());
      inputRefs.current[0]?.focus();
    }

    setResendLoading(false);
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
            <KeyRound color="#18a663" size={16} />
            <Text style={styles.secureBadgeText}>Verify OTP</Text>
          </View>

          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to:
          </Text>
          <Text style={styles.email}>{maskEmail(email)}</Text>

          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[styles.otpBox, { borderColor: error ? '#ff4444' : digit ? '#18a663' : theme.border, backgroundColor: theme.surface, color: theme.text }]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <LockKeyhole color="#000" size={18} />
                <Text style={styles.primaryButtonText}>Verify Code</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.resendRow}>
            {countdown > 0 ? (
              <Text style={[styles.countdownText, { color: theme.muted }]}>
                Resend OTP in {countdown}s
              </Text>
            ) : resendCount >= MAX_RESENDS ? (
              <Text style={[styles.maxResendText, { color: theme.muted }]}>
                Maximum resend attempts reached
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
                <Text style={styles.resendLink}>
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.trustStrip}>
          <View style={styles.trustItem}>
            <Shield color="#18a663" size={14} />
            <Text style={styles.trustText}>Secure Verification</Text>
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

  title: { fontSize: 22, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9aac9f', textAlign: 'center', marginBottom: 8, lineHeight: 20 },
  email: { fontSize: 15, fontWeight: '700', color: '#FFD700', marginBottom: 24, textAlign: 'center' },

  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  otpBox: { width: 48, height: 56, borderWidth: 2, borderRadius: 10, textAlign: 'center', fontSize: 24, fontWeight: 'bold' },
  errorText: { color: '#ff4444', fontSize: 12, marginBottom: 10, marginLeft: 4, textAlign: 'center' },

  primaryButton: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 16 },
  buttonDisabled: { backgroundColor: '#555' },
  primaryButtonText: { fontSize: 17, fontWeight: 'bold', color: '#000' },

  resendRow: { alignItems: 'center', marginTop: 4 },
  countdownText: { fontSize: 13 },
  maxResendText: { fontSize: 13, fontStyle: 'italic' },
  resendLink: { color: '#18a663', fontSize: 14, fontWeight: '600' },

  trustStrip: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 24, paddingHorizontal: 20, flexWrap: 'wrap' },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { color: '#5e7468', fontSize: 11, fontWeight: '500' },
});
