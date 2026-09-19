import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { signUpWithEmail } from '@/lib/auth';
import { validateEmail, validatePassword, validateName, validatePhone } from '@/lib/auth-validation';
import { normalizePakistaniMobile } from '@/lib/validation';
import { useAppTheme } from '@/hooks/use-theme';
import { pageSchema } from '@/lib/structured-data';
import { TurnstileWidget, type TurnstileWidgetHandle } from '@/components/turnstile-widget';
import { AuthScreenShell } from '@/components/auth-screen-shell';
import { AUTH_BRAND } from '@/constants/auth-theme';
import { Check, Eye, EyeOff, LockKeyhole, Mail, Phone, User } from 'lucide-react-native';

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (password.length >= 12) score++;

  if (score <= 1) return { level: 1, label: 'Weak', color: '#ff4444' };
  if (score <= 2) return { level: 2, label: 'Fair', color: '#FFA500' };
  if (score <= 3) return { level: 3, label: 'Strong', color: '#FFD700' };
  return { level: 4, label: 'Very Strong', color: '#18a663' };
}

function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function SignupScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setInputPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ageAccepted, setAgeAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const passwordStrength = getPasswordStrength(password);
  const isEmailValid = email.length > 0 && isValidEmailFormat(email);

  async function handleSignup() {
    const newErrors: Record<string, string> = {};

    const nameError = validateName(name);
    if (nameError) newErrors.name = nameError;

    const normalizedPhone = '+92' + normalizePakistaniMobile(phone);
    const phoneError = validatePhone(normalizedPhone);
    if (phoneError) newErrors.phone = phoneError;

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!ageAccepted) {
      newErrors.age = 'You must accept Terms & Privacy Policy';
    }

    if (Platform.OS === 'web' && !turnstileToken) {
      newErrors.turnstile = 'Please complete the verification.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const normalizedPhoneFull = '+92' + normalizePakistaniMobile(phone);
    const { data, error } = await signUpWithEmail(
      email.trim().toLowerCase(),
      password,
      { data: { name: name.trim(), phone: normalizedPhoneFull }, captchaToken: turnstileToken }
    );

    turnstileRef.current?.reset();
    setTurnstileToken('');

    if (error) {
      const msg = error.message && error.message.trim() ? error.message : 'Something went wrong. Please try again.';
      if (msg.toLowerCase().includes('phone number is already registered')) {
        setErrors({ phone: 'This phone number is already registered. Try logging in or use a different number.' });
      } else if (msg.includes('already registered')) {
        setErrors({ email: 'This email is already registered. Try logging in.' });
      } else {
        setErrors({ form: msg });
      }
    } else if (data.user && data.user.identities && data.user.identities.length === 0) {
      setErrors({ email: 'This email is already registered. Try logging in.' });
    } else {
      router.replace('/verify-email' as never);
    }

    setLoading(false);
  }

  const signupSchema = pageSchema('WebPage', '/signup', 'Sign Up', 'Create a JeetoBaz account to explore prize campaigns, manage entries, save favorites, receive updates, and access account features securely.');
  return (
    <>
    <Head>
      <title>Sign Up | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="Create a JeetoBaz account to explore prize campaigns, manage entries, save favorites, receive updates, and access account features securely." />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Sign Up | JeetoBaz" />
      <meta property="og:description" content="Create a JeetoBaz account to explore prize campaigns, manage entries, save favorites, receive updates, and access account features securely." />
      <meta property="og:url" content="https://jeetobaz.pk/signup" />
      <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
      <meta property="og:image:alt" content="JeetoBaz — Pakistan's trusted prize draw platform" />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta property="og:locale" content="en_PK" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content="Sign Up | JeetoBaz" />
      <meta name="twitter:description" content="Create a JeetoBaz account to explore prize campaigns, manage entries, save favorites, receive updates, and access account features securely." />
      <meta name="twitter:image" content="https://jeetobaz.pk/twitter-image.png" />
      <link rel="canonical" href="https://jeetobaz.pk/signup" />
      <script type="application/ld+json">{JSON.stringify(signupSchema)}</script>
    </Head>
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <AuthScreenShell title="Create your account" subtitle="Join JeetoBaz and start exploring prizes">
          {errors.form ? (
            <View style={[styles.formError, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
              <Text accessibilityRole="alert" style={[styles.formErrorText, { color: theme.danger }]}>{errors.form}</Text>
            </View>
          ) : null}

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: errors.name ? '#ff4444' : theme.border }]}>
            <User color={theme.muted} size={18} />
            <TextInput
              style={[styles.inputField, { color: theme.text }]}
              placeholder="Full name"
              placeholderTextColor={theme.subtle}
              autoComplete="name"
              textContentType="name"
              accessibilityLabel="Full name"
              value={name}
              onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: '' })); }}
              maxLength={80}
            />
          </View>
          {errors.name ? <Text accessibilityRole="alert" style={[styles.errorText, { color: theme.danger }]}>{errors.name}</Text> : null}
          <Text style={[styles.fieldHint, { color: theme.subtle }]}>As per CNIC</Text>

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: errors.phone ? '#ff4444' : theme.border }]}>
            <Phone color={theme.muted} size={18} />
            <Text style={[styles.phoneCode, { color: theme.muted, borderRightColor: theme.border }]}>+92</Text>
            <TextInput
              style={[styles.inputField, { color: theme.text }]}
              placeholder="3001234567"
              placeholderTextColor={theme.subtle}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              accessibilityLabel="Mobile number"
              value={phone}
              onChangeText={(v) => { setInputPhone(normalizePakistaniMobile(v)); setErrors((e) => ({ ...e, phone: '' })); }}
              maxLength={10}
            />
          </View>
          {errors.phone ? <Text accessibilityRole="alert" style={[styles.errorText, { color: theme.danger }]}>{errors.phone}</Text> : null}
          <Text style={[styles.fieldHint, { color: theme.subtle }]}>Use a mobile number registered in your own name</Text>

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: errors.email ? '#ff4444' : theme.border }]}>
            <Mail color={theme.muted} size={18} />
            <TextInput
              style={[styles.inputField, { color: theme.text }]}
              placeholder="Email address"
              placeholderTextColor={theme.subtle}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              accessibilityLabel="Email address"
              value={email}
              onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: '' })); }}
            />
            {email.length > 0 && (
              isEmailValid ? (
                <Check color="#18a663" size={16} />
              ) : (
                <Text style={styles.invalidMarker}>✕</Text>
              )
            )}
          </View>
          {errors.email ? <Text accessibilityRole="alert" style={[styles.errorText, { color: theme.danger }]}>{errors.email}</Text> : null}
          {email.length > 0 && (
            <Text style={[styles.fieldHint, { color: isEmailValid ? '#18a663' : '#ff4444' }]}>
              {isEmailValid ? '✓ Valid email address' : '✕ Invalid email address'}
            </Text>
          )}

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: errors.password ? '#ff4444' : theme.border }]}>
            <LockKeyhole color={theme.muted} size={18} />
            <TextInput
              style={[styles.inputField, { color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.subtle}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              textContentType="newPassword"
              accessibilityLabel="Password"
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: '' })); }}
            />
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowPassword(!showPassword)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff color={theme.muted} size={18} /> : <Eye color={theme.muted} size={18} />}
            </TouchableOpacity>
          </View>
          {errors.password ? <Text accessibilityRole="alert" style={[styles.errorText, { color: theme.danger }]}>{errors.password}</Text> : null}

          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBarRow}>
                {[1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      { backgroundColor: i <= passwordStrength.level ? passwordStrength.color : '#174a35' }
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                {passwordStrength.label}
              </Text>
            </View>
          )}

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: errors.confirmPassword ? '#ff4444' : theme.border }]}>
            <LockKeyhole color={theme.muted} size={18} />
            <TextInput
              style={[styles.inputField, { color: theme.text }]}
              placeholder="Confirm Password"
              placeholderTextColor={theme.subtle}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              textContentType="newPassword"
              accessibilityLabel="Confirm password"
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirmPassword: '' })); }}
            />
            {confirmPassword.length > 0 && (
              password === confirmPassword ? (
                <Check color="#18a663" size={16} />
              ) : (
                <Text style={styles.invalidMarker}>✕</Text>
              )
            )}
          </View>
          {errors.confirmPassword ? <Text accessibilityRole="alert" style={[styles.errorText, { color: theme.danger }]}>{errors.confirmPassword}</Text> : null}

          <View style={[styles.passwordRequirements, { backgroundColor: theme.surfaceAlt }]}>
            <Text style={[styles.reqTitle, { color: theme.muted }]}>Password Requirements</Text>
            <View style={styles.reqRow}>
              <Text style={[styles.reqDot, { color: password.length >= 8 ? '#18a663' : '#5e7468' }]}>
                {password.length >= 8 ? '✓' : '○'}
              </Text>
              <Text style={[styles.reqText, { color: password.length >= 8 ? '#18a663' : '#5e7468' }]}>
                Minimum 8 characters
              </Text>
            </View>
            <View style={styles.reqRow}>
              <Text style={[styles.reqDot, { color: /[A-Z]/.test(password) ? '#18a663' : '#5e7468' }]}>
                {/[A-Z]/.test(password) ? '✓' : '○'}
              </Text>
              <Text style={[styles.reqText, { color: /[A-Z]/.test(password) ? '#18a663' : '#5e7468' }]}>
                One uppercase letter
              </Text>
            </View>
            <View style={styles.reqRow}>
              <Text style={[styles.reqDot, { color: /[0-9]/.test(password) ? '#18a663' : '#5e7468' }]}>
                {/[0-9]/.test(password) ? '✓' : '○'}
              </Text>
              <Text style={[styles.reqText, { color: /[0-9]/.test(password) ? '#18a663' : '#5e7468' }]}>
                One number
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => setAgeAccepted(!ageAccepted)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: ageAccepted }}
            accessibilityLabel="I agree to the Terms of Use and Privacy Policy"
          >
            <View style={[styles.checkbox, { borderColor: theme.subtle }, ageAccepted && styles.checkboxChecked]}>
              {ageAccepted ? <Check color="white" size={12} strokeWidth={3} /> : null}
            </View>
            <Text style={[styles.consentText, { color: theme.muted }]}>
              I agree to the{' '}
              <Text style={styles.consentLink} onPress={() => router.push('/terms')}>Terms of Use</Text>
              {' '}and{' '}
              <Text style={styles.consentLink} onPress={() => router.push('/privacy')}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>
          {errors.age ? <Text accessibilityRole="alert" style={[styles.errorText, { color: theme.danger }]}>{errors.age}</Text> : null}

          <TurnstileWidget
            ref={turnstileRef}
            onVerify={(token) => { setTurnstileToken(token); setErrors((e) => ({ ...e, turnstile: '' })); }}
            onExpire={() => setTurnstileToken('')}
          />
          {errors.turnstile ? <Text accessibilityRole="alert" style={[styles.errorText, { color: theme.danger }]}>{errors.turnstile}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: loading || !ageAccepted ? theme.border : AUTH_BRAND.gold }]}
            onPress={handleSignup}
            disabled={loading || !ageAccepted}
            accessibilityRole="button"
            accessibilityState={{ busy: loading, disabled: loading || !ageAccepted }}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" accessibilityLabel="Creating account" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Create Account</Text>
                <Text style={styles.primaryButtonText}>→</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => router.replace('/login')}
            accessibilityRole="link"
          >
            <Text style={[styles.switchText, { color: theme.muted }]}>
              Already have an account?{' '}
              <Text style={[styles.switchHighlight, { color: theme.primary }]}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </AuthScreenShell>
      </ScrollView>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  scrollContent: { flexGrow: 1 },
  formError: { borderWidth: 1, borderRadius: 12, borderCurve: 'continuous', padding: 12, marginBottom: 14 },
  formErrorText: { fontSize: 12.5, fontWeight: '600', lineHeight: 18 },
  inputContainer: { minHeight: 54, flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderCurve: 'continuous', borderWidth: 1, marginBottom: 4, paddingHorizontal: 14, gap: 10 },
  inputField: { flex: 1, minHeight: 52, paddingVertical: 14, fontSize: 16 },
  iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  phoneCode: { paddingVertical: 16, paddingLeft: 10, paddingRight: 12, fontSize: 14, borderRightWidth: 1, borderRightColor: '#174a35' },
  errorText: { color: '#ff4444', fontSize: 12, marginBottom: 4, marginLeft: 4 },
  fieldHint: { color: '#5e7468', fontSize: 11, marginBottom: 14, marginLeft: 4 },
  invalidMarker: { color: '#ff4444', fontSize: 14, fontWeight: 'bold' },

  strengthContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, marginLeft: 4 },
  strengthBarRow: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { height: 4, flex: 1, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '600', minWidth: 70, textAlign: 'right' },

  passwordRequirements: { backgroundColor: '#0a2419', borderRadius: 8, padding: 12, marginBottom: 16 },
  reqTitle: { fontSize: 11, fontWeight: '600', marginBottom: 8 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  reqDot: { fontSize: 12, width: 16 },
  reqText: { fontSize: 12 },

  consentRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4, gap: 10 },
  checkbox: { width: 18, height: 18, borderWidth: 1.5, borderColor: '#5e7468', borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: AUTH_BRAND.emerald, borderColor: AUTH_BRAND.emerald },
  consentText: { flex: 1, fontSize: 13, lineHeight: 19 },
  consentLink: { color: AUTH_BRAND.emerald, fontWeight: '700' },

  primaryButton: { minHeight: 54, paddingHorizontal: 18, borderRadius: 12, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 12 },
  primaryButtonText: { fontSize: 17, fontWeight: 'bold', color: '#000' },

  switchText: { color: '#9aac9f', fontSize: 14, textAlign: 'center' },
  switchHighlight: { fontWeight: '800' },
  switchButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
