import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { signUpWithEmail } from '@/lib/auth';
import { validateEmail, validatePassword, validateName, validatePhone } from '@/lib/auth-validation';
import { normalizePakistaniMobile } from '@/lib/validation';
import { useAppTheme } from '@/hooks/use-theme';
import { Check, ChevronLeft, Eye, EyeOff, LockKeyhole, Mail, Phone, Rocket, User } from 'lucide-react-native';

export default function SignupScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setInputPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ageAccepted, setAgeAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSignup() {
    const newErrors: Record<string, string> = {};

    const nameError = validateName(name);
    if (nameError) newErrors.name = nameError;

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const normalizedPhone = '+92' + normalizePakistaniMobile(phone);
    const phoneError = validatePhone(normalizedPhone);
    if (phoneError) newErrors.phone = phoneError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!ageAccepted) {
      newErrors.age = 'You must confirm you are 18+ and accept Terms';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const { error } = await signUpWithEmail(email.trim().toLowerCase(), password);

    if (error) {
      if (error.message.includes('already registered')) {
        setErrors({ email: 'This email is already registered. Try logging in.' });
      } else {
        alert('Signup failed: ' + error.message);
      }
    } else {
      router.replace('/verify-email');
    }

    setLoading(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
      </View>

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={[styles.subtitle, { color: theme.muted }]}>Join JeetoBaz and start winning!</Text>

        <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: errors.name ? '#ff4444' : theme.border }]}>
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

        <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: errors.email ? '#ff4444' : theme.border }]}>
          <Mail color={theme.muted} size={18} />
          <TextInput
            style={[styles.inputField, { color: theme.text }]}
            placeholder="you@example.com"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: '' })); }}
          />
        </View>
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

        <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: errors.phone ? '#ff4444' : theme.border }]}>
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

        <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: errors.password ? '#ff4444' : theme.border }]}>
          <LockKeyhole color={theme.muted} size={18} />
          <TextInput
            style={[styles.inputField, { color: theme.text }]}
            placeholder="Password (8+ chars, 1 uppercase, 1 number)"
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

        <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: errors.confirmPassword ? '#ff4444' : theme.border }]}>
          <LockKeyhole color={theme.muted} size={18} />
          <TextInput
            style={[styles.inputField, { color: theme.text }]}
            placeholder="Confirm Password"
            placeholderTextColor="#666"
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirmPassword: '' })); }}
          />
        </View>
        {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

        <TouchableOpacity
          style={styles.consentRow}
          onPress={() => setAgeAccepted(!ageAccepted)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: ageAccepted }}
        >
          <View style={[styles.checkbox, ageAccepted && styles.checkboxChecked]}>
            {ageAccepted ? <Check color="white" size={15} strokeWidth={3} /> : null}
          </View>
          <Text style={[styles.consentText, { color: theme.text }]}>
            I confirm that I am 18 years or older and accept the Terms and Privacy Policy.
          </Text>
        </TouchableOpacity>
        {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}

        <TouchableOpacity
          style={[styles.button, (loading || !ageAccepted) && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading || !ageAccepted}
        >
          {!loading && <Rocket color="#000" size={19} />}
          <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/login')}>
          <Text style={styles.switchLink}>
            Already have an account?{' '}
            <Text style={styles.switchLinkHighlight}>Sign in</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/terms')}>
          <Text style={styles.termsLink}>
            By signing up you agree to our{' '}
            <Text style={styles.termsLinkHighlight}>Terms</Text>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/privacy')}>
          <Text style={styles.privacyLink}>Privacy Policy</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  header: { backgroundColor: '#04140e', borderBottomColor: '#FFD700', borderBottomWidth: 2, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  form: { padding: 25, marginTop: 10 },
  subtitle: { fontSize: 14, color: '#aaa', marginBottom: 25, textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#071b13', borderRadius: 10, borderWidth: 1, marginBottom: 6, paddingHorizontal: 14, gap: 10 },
  inputField: { flex: 1, padding: 15, fontSize: 16 },
  phoneCode: { paddingVertical: 15, paddingLeft: 10, paddingRight: 12, fontSize: 14, borderRightWidth: 1, borderRightColor: '#174a35' },
  errorText: { color: '#ff4444', fontSize: 12, marginBottom: 10, marginLeft: 4 },
  consentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 16 },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: '#666', borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxChecked: { backgroundColor: '#18a663', borderColor: '#18a663' },
  consentText: { flex: 1, fontSize: 14, lineHeight: 20 },
  button: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 15, flexDirection: 'row', gap: 7 },
  buttonDisabled: { backgroundColor: '#555' },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  switchLink: { color: '#666', fontSize: 14, textAlign: 'center', marginTop: 12 },
  switchLinkHighlight: { color: '#18a663', fontWeight: 'bold' },
  termsLink: { color: '#666', fontSize: 12, textAlign: 'center', marginTop: 16 },
  termsLinkHighlight: { color: '#18a663', fontWeight: 'bold' },
  privacyLink: { color: '#18a663', fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginTop: 8, marginBottom: 40 },
});
