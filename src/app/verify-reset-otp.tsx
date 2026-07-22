import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/hooks/use-theme';
import { AuthRecoveryLayout, Badge, PrimaryButton } from '@/components/auth-recovery-layout';
import { KeyRound, LockKeyhole, Shield } from 'lucide-react-native';

const OTP_STORAGE_KEY = 'otp_verify_last_sent_at';
const MAX_RESENDS = 3;
const OTP_LENGTH = 6;

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

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
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

    if (text && index < OTP_LENGTH - 1) {
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
    if (otpString.length !== OTP_LENGTH) {
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
      email.trim().toLowerCase(),
      { redirectTo: 'https://jeetobaz.pk/reset-password' }
    );

    if (error) {
      const msg = error.message || '';
      if (msg.includes('rate') || msg.includes('limit')) {
        setError('Email sending limit reached. Please wait and try again later.');
      }
    } else {
      setCountdown(60);
      setResendCount(resendCount + 1);
      setOtp(Array(OTP_LENGTH).fill(''));
      localStorage.setItem(OTP_STORAGE_KEY, Date.now().toString());
      inputRefs.current[0]?.focus();
    }

    setResendLoading(false);
  }

  function getOtpBorderColor(index: number) {
    const digit = otp[index];
    const isFocused = focusedIndex === index;

    if (error) return theme.danger;
    if (digit) return theme.primary;
    if (isFocused) return theme.gold;
    return theme.border;
  }

  return (
    <>
    <Head>
      <title>Verify OTP | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="Enter the verification code sent to your email to reset your JeetoBaz account password." />
    </Head>
    <AuthRecoveryLayout
      trustItems={[
        { icon: <Shield color={theme.primary} size={14} />, text: 'Secure Verification' },
        { icon: <LockKeyhole color={theme.primary} size={14} />, text: 'Code Expires Soon' },
      ]}
      showFooter={false}
    >
      <Badge icon={<KeyRound color={theme.primary} size={16} />} text="Verify OTP" />

      <Text style={[styles.title, { color: theme.text }]}>Enter Verification Code</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>
        We sent a 6-digit code to:
      </Text>
      <Text style={[styles.emailDisplay, { color: theme.gold }]}>{maskEmail(email)}</Text>

      <View style={styles.otpRow}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={[
              styles.otpBox,
              {
                backgroundColor: theme.surface,
                borderColor: getOtpBorderColor(index),
                color: theme.text,
              },
            ]}
            value={digit}
            onChangeText={(text) => handleOtpChange(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <PrimaryButton
        onPress={handleVerify}
        loading={loading}
        icon={<LockKeyhole color={theme.buttonText} size={18} />}
        text="Verify Code"
      />

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
            <Text style={[styles.resendLink, { color: theme.primary }]}>
              {resendLoading ? 'Sending...' : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </AuthRecoveryLayout>
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 8, lineHeight: 20 },
  emailDisplay: { fontSize: 15, fontWeight: '700', marginBottom: 24, textAlign: 'center' },

  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
  },
  errorText: { color: '#ff4444', fontSize: 12, marginBottom: 10, marginLeft: 4, textAlign: 'center' },

  resendRow: { alignItems: 'center', marginTop: 4 },
  countdownText: { fontSize: 13 },
  maxResendText: { fontSize: 13, fontStyle: 'italic' },
  resendLink: { fontSize: 14, fontWeight: '600' },
});
