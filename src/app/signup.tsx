import { Image, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { signUpWithEmail } from '@/lib/auth';
import { validateEmail, validatePassword, validateName, validatePhone } from '@/lib/auth-validation';
import { normalizePakistaniMobile } from '@/lib/validation';
import { useAppTheme } from '@/hooks/use-theme';
import { Check, ChevronLeft, Eye, EyeOff, LockKeyhole, Mail, Phone, Rocket, Shield, User } from 'lucide-react-native';

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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const normalizedPhoneFull = '+92' + normalizePakistaniMobile(phone);
    const { error } = await signUpWithEmail(
      email.trim().toLowerCase(),
      password,
      { data: { name: name.trim(), phone: normalizedPhoneFull } }
    );

    if (error) {
      const msg = error.message || String(error) || 'Unknown error';
      if (msg.includes('already registered')) {
        setErrors({ email: 'This email is already registered. Try logging in.' });
      } else {
        alert('Signup failed: ' + msg);
      }
    } else {
      router.replace('/verify-email' as never);
    }

    setLoading(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color={theme.text} size={24} />
          </TouchableOpacity>
          <View style={styles.logoRow}>
            <Image source={require('@/assets/images/icon.png')} style={styles.logoImage} />
            <Text style={[styles.logo, { color: theme.gold }]}>JeetoBaz</Text>
          </View>
        </View>

        <View style={[styles.signupCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.secureBadge, { backgroundColor: theme.primarySoft }]}>
            <Shield color="#18a663" size={16} />
            <Text style={styles.secureBadgeText}>Create Your Account</Text>
          </View>

          <Text style={[styles.welcomeTitle, { color: theme.gold }]}>Join JeetoBaz</Text>
          <Text style={[styles.welcomeSubtitle, { color: theme.muted }]}>Start winning prizes today!</Text>

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: errors.name ? '#ff4444' : theme.border }]}>
            <User color={theme.muted} size={18} />
            <TextInput
              style={[styles.inputField, { color: theme.text }]}
              placeholder="Full Name"
              placeholderTextColor="#666"
              value={name}
              onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: '' })); }}
              maxLength={80}
            />
          </View>
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          <Text style={[styles.fieldHint, { color: theme.subtle }]}>As per CNIC</Text>

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: errors.phone ? '#ff4444' : theme.border }]}>
            <Phone color={theme.muted} size={18} />
            <Text style={[styles.phoneCode, { color: theme.muted, borderRightColor: theme.border }]}>+92</Text>
            <TextInput
              style={[styles.inputField, { color: theme.text }]}
              placeholder="3001234567"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(v) => { setInputPhone(normalizePakistaniMobile(v)); setErrors((e) => ({ ...e, phone: '' })); }}
              maxLength={10}
            />
          </View>
          {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
          <Text style={[styles.fieldHint, { color: theme.subtle }]}>Use a mobile number registered in your own name</Text>

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: errors.email ? '#ff4444' : theme.border }]}>
            <Mail color={theme.muted} size={18} />
            <TextInput
              style={[styles.inputField, { color: theme.text }]}
              placeholder="Email address"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
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
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
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
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: '' })); }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff color={theme.muted} size={18} /> : <Eye color={theme.muted} size={18} />}
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

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
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
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
          {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

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
          >
            <View style={[styles.checkbox, ageAccepted && styles.checkboxChecked]}>
              {ageAccepted ? <Check color="white" size={12} strokeWidth={3} /> : null}
            </View>
            <Text style={[styles.consentText, { color: theme.muted }]}>
              I agree to the{' '}
              <Text style={styles.consentLink} onPress={() => router.push('/terms')}>Terms of Use</Text>
              {' '}and{' '}
              <Text style={styles.consentLink} onPress={() => router.push('/privacy')}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>
          {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryButton, (loading || !ageAccepted) && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading || !ageAccepted}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Create Account</Text>
                <Text style={styles.primaryButtonText}>→</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={[styles.switchText, { color: theme.muted }]}>
              Already have an account?{' '}
              <Text style={styles.switchHighlight}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.trustStrip}>
          <View style={styles.trustItem}>
            <Shield color="#18a663" size={14} />
            <Text style={[styles.trustText, { color: theme.subtle }]}>Secure Sign Up</Text>
          </View>
          <View style={styles.trustItem}>
            <Check color="#18a663" size={14} />
            <Text style={[styles.trustText, { color: theme.subtle }]}>Email Verification</Text>
          </View>
          <View style={styles.trustItem}>
            <LockKeyhole color="#18a663" size={14} />
            <Text style={[styles.trustText, { color: theme.subtle }]}>Data Protected</Text>
          </View>
        </View>

        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => router.push('/terms')}>
            <Text style={[styles.footerLink, { color: theme.subtle }]}>Terms</Text>
          </TouchableOpacity>
          <Text style={[styles.footerDot, { color: theme.subtle }]}>•</Text>
          <TouchableOpacity onPress={() => router.push('/privacy')}>
            <Text style={[styles.footerLink, { color: theme.subtle }]}>Privacy</Text>
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
  logoRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  logoImage: { width: 40, height: 40, borderRadius: 8 },
  logo: { fontSize: 28, fontWeight: 'bold', color: 'white' },

  signupCard: { backgroundColor: '#071b13', marginHorizontal: 20, marginTop: 24, borderRadius: 16, borderWidth: 1, borderColor: '#174a35', padding: 24 },

  secureBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20, paddingVertical: 8, backgroundColor: '#0a2419', borderRadius: 8 },
  secureBadgeText: { color: '#18a663', fontSize: 12, fontWeight: '600' },

  welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 4 },
  welcomeSubtitle: { fontSize: 14, color: '#9aac9f', textAlign: 'center', marginBottom: 24 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, marginBottom: 4, paddingHorizontal: 14, gap: 10 },
  inputField: { flex: 1, padding: 16, fontSize: 16 },
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
  checkboxChecked: { backgroundColor: '#18a663', borderColor: '#18a663' },
  consentText: { flex: 1, fontSize: 13, lineHeight: 19 },
  consentLink: { color: '#18a663', fontWeight: '600' },

  primaryButton: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 16 },
  buttonDisabled: { backgroundColor: '#555' },
  primaryButtonText: { fontSize: 17, fontWeight: 'bold', color: '#000' },

  switchText: { color: '#9aac9f', fontSize: 14, textAlign: 'center' },
  switchHighlight: { color: '#18a663', fontWeight: 'bold' },

  trustStrip: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 24, paddingHorizontal: 20, flexWrap: 'wrap' },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { color: '#5e7468', fontSize: 11, fontWeight: '500' },

  footerLinks: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16 },
  footerLink: { color: '#5e7468', fontSize: 12 },
  footerDot: { color: '#5e7468', fontSize: 12 },
});
