import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { supabase } from '@/lib/supabase';
import { validateEmail } from '@/lib/auth-validation';
import { useAppTheme } from '@/hooks/use-theme';
import { AuthRecoveryLayout, Badge, PrimaryButton } from '@/components/auth-recovery-layout';
import { TurnstileWidget, type TurnstileWidgetHandle } from '@/components/turnstile-widget';
import { LockKeyhole, Mail, Send, Shield } from 'lucide-react-native';
import { useSafeBack } from '@/lib/safe-back';

const STORAGE_KEY = 'otp_last_sent_at';
const MAX_RESENDS = 3;

// Web-only: keeps the recovery email out of the URL (see verify-reset-otp.tsx for the
// read/expire/clear side of this). Native never puts it in the URL to begin with, so
// native keeps passing it via router params, unchanged.
const RESET_EMAIL_STORAGE_KEY = 'password_reset_email';

export default function ForgotPasswordScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const goBack = useSafeBack('/login');
  const params = useLocalSearchParams<{ sessionExpired?: string }>();
  const showExpiredNotice = params.sessionExpired === '1';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [rateLimitError, setRateLimitError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileError, setTurnstileError] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  useEffect(() => {
    const lastSent = localStorage.getItem(STORAGE_KEY);
    if (lastSent) {
      const elapsed = Math.floor((Date.now() - parseInt(lastSent, 10)) / 1000);
      if (elapsed < 60) {
        setCountdown(60 - elapsed);
        setSent(true);
      }
    }
  }, []);

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

    if (Platform.OS === 'web' && !turnstileToken) {
      setTurnstileError('Please complete the verification.');
      return;
    }

    setLoading(true);
    setEmailError('');
    setRateLimitError('');
    setTurnstileError('');

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: 'https://jeetobaz.pk/reset-password', captchaToken: turnstileToken || undefined }
    );

    turnstileRef.current?.reset();
    setTurnstileToken('');

    if (error) {
      const msg = error.message || '';
      if (msg.includes('rate') || msg.includes('limit') || msg.includes('Too many')) {
        setRateLimitError('Email sending limit reached. Please wait and try again later.');
      } else if (msg.includes('not found') || msg.includes('invalid')) {
        setEmailError('No account found with this email.');
      } else {
        alert('Failed to send OTP: ' + msg);
      }
    } else {
      setSent(true);
      setCountdown(60);
      setResendCount(1);
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }

    setLoading(false);
  }

  async function handleResendOTP() {
    if (countdown > 0 || resendCount >= MAX_RESENDS) return;

    if (Platform.OS === 'web' && !turnstileToken) {
      setTurnstileError('Please complete the verification.');
      return;
    }

    setLoading(true);
    setRateLimitError('');
    setTurnstileError('');

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: 'https://jeetobaz.pk/reset-password', captchaToken: turnstileToken || undefined }
    );

    turnstileRef.current?.reset();
    setTurnstileToken('');

    if (error) {
      const msg = error.message || '';
      if (msg.includes('rate') || msg.includes('limit') || msg.includes('Too many')) {
        setRateLimitError('Email sending limit reached. Please wait and try again later.');
      }
    } else {
      setCountdown(60);
      setResendCount(resendCount + 1);
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }

    setLoading(false);
  }

  function handleContinue() {
    const trimmedEmail = email.trim().toLowerCase();

    if (Platform.OS === 'web') {
      try {
        sessionStorage.setItem(
          RESET_EMAIL_STORAGE_KEY,
          JSON.stringify({ email: trimmedEmail, storedAt: Date.now() })
        );
      } catch {
        // sessionStorage unavailable (e.g. private browsing) — verify-reset-otp redirects
        // back here with a clear message if it can't find a stored email.
      }
      router.push('/verify-reset-otp' as never);
      return;
    }

    router.push({ pathname: '/verify-reset-otp' as never, params: { email: trimmedEmail } });
  }

  const trustItems = [
    { icon: <Shield color={theme.primary} size={14} />, text: 'Secure Reset' },
    { icon: <LockKeyhole color={theme.primary} size={14} />, text: 'Code Expires Soon' },
  ];

  if (sent) {
    return (
      <>
      <Head>
        <title>Forgot Password | JeetoBaz</title>
        <meta name="robots" content="noindex, follow" />
        <meta name="description" content="Reset your JeetoBaz account password using email verification." />
      </Head>
      <AuthRecoveryLayout
        showBack
        onBack={() => router.replace('/forgot-password')}
        trustItems={trustItems}
        showFooter={false}
      >
        <Badge icon={<Mail color={theme.gold} size={16} />} text="OTP Sent!" />

        <Text style={[styles.title, { color: theme.text }]}>Check Your Email</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          We sent a 6-digit verification code to:
        </Text>
        <Text style={[styles.emailDisplay, { color: theme.gold }]}>{email.trim().toLowerCase()}</Text>

        <PrimaryButton
          onPress={handleContinue}
          icon={<LockKeyhole color={theme.buttonText} size={18} />}
          text="Enter OTP Code"
        />

        <TurnstileWidget
          ref={turnstileRef}
          onVerify={(token) => { setTurnstileToken(token); setTurnstileError(''); }}
          onExpire={() => setTurnstileToken('')}
        />
        {turnstileError ? <Text style={styles.errorText}>{turnstileError}</Text> : null}

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
            <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
              <Text style={[styles.resendLink, { color: theme.primary }]}>
                {loading ? 'Sending...' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {rateLimitError ? (
          <Text style={styles.rateLimitText}>{rateLimitError}</Text>
        ) : null}
      </AuthRecoveryLayout>
      </>
    );
  }

  return (
    <>
    <Head>
      <title>Forgot Password | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="Reset your JeetoBaz account password using email verification." />
    </Head>
    <AuthRecoveryLayout trustItems={trustItems}>
      <Badge icon={<LockKeyhole color={theme.primary} size={16} />} text="Password Recovery" />

      <Text style={[styles.title, { color: theme.text }]}>Forgot Password?</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>
        Enter your email address and we'll send you a 6-digit verification code.
      </Text>
      {showExpiredNotice ? (
        <Text style={styles.rateLimitText}>
          Your verification session expired. Please request a new code.
        </Text>
      ) : null}

      <View style={[
        styles.inputContainer,
        { backgroundColor: theme.surface, borderColor: emailError ? theme.danger : theme.border }
      ]}>
        <Mail color={theme.muted} size={18} />
        <TextInput
          style={[styles.inputField, { color: theme.text }]}
          placeholder="you@example.com"
          placeholderTextColor={theme.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={(v) => { setEmail(v); setEmailError(''); setRateLimitError(''); }}
        />
      </View>
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      <TurnstileWidget
        ref={turnstileRef}
        onVerify={(token) => { setTurnstileToken(token); setTurnstileError(''); }}
        onExpire={() => setTurnstileToken('')}
      />
      {turnstileError ? <Text style={styles.errorText}>{turnstileError}</Text> : null}

      <PrimaryButton
        onPress={handleSendOTP}
        loading={loading}
        icon={<Send color={theme.buttonText} size={18} />}
        text="Send Verification Code"
      />

      {rateLimitError ? (
        <Text style={styles.rateLimitText}>{rateLimitError}</Text>
      ) : null}

      <TouchableOpacity onPress={goBack}>
        <Text style={[styles.backLink, { color: theme.primary }]}>← Back to Login</Text>
      </TouchableOpacity>
    </AuthRecoveryLayout>
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
    paddingHorizontal: 14,
    gap: 10,
  },
  inputField: { flex: 1, padding: 16, fontSize: 16 },
  errorText: { color: '#ff4444', fontSize: 12, marginBottom: 10, marginLeft: 4 },

  backLink: { fontSize: 14, fontWeight: '600', textAlign: 'center' },

  emailDisplay: { fontSize: 16, fontWeight: '700', marginBottom: 20, textAlign: 'center' },

  resendRow: { alignItems: 'center', marginTop: 8 },
  countdownText: { fontSize: 13 },
  maxResendText: { fontSize: 13, fontStyle: 'italic' },
  resendLink: { fontSize: 14, fontWeight: '600' },

  rateLimitText: { color: '#ff4444', fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 18 },
});
