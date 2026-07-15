import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { resetPassword } from '@/lib/auth';
import { validateEmail } from '@/lib/auth-validation';
import { useAppTheme } from '@/hooks/use-theme';
import { ChevronLeft, Mail, Send } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  async function handleReset() {
    const validationError = validateEmail(email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }

    setLoading(true);
    setEmailError('');
    const { error } = await resetPassword(email.trim().toLowerCase());

    if (error) {
      alert('Failed to send reset email: ' + error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/login')} style={styles.backBtn}>
            <ChevronLeft color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reset Password</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Mail color="#FFD700" size={50} />
          </View>
          <Text style={styles.title}>Email Sent!</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            We sent a password reset link to:
          </Text>
          <Text style={styles.email}>{email.trim().toLowerCase()}</Text>
          <Text style={[styles.hint, { color: theme.muted }]}>
            Click the link in the email to set a new password. The link expires in 1 hour.
          </Text>

          <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')}>
            <Text style={styles.buttonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reset Password</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>

        <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: emailError ? '#ff4444' : theme.border }]}>
          <Mail color={theme.muted} size={18} />
          <TextInput
            style={[styles.inputField, { color: theme.text }]}
            placeholder="you@example.com"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(v) => { setEmail(v); setEmailError(''); }}
          />
        </View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          {!loading && <Send color="#000" size={18} />}
          <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send Reset Link'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  header: { backgroundColor: '#04140e', borderBottomColor: '#FFD700', borderBottomWidth: 2, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  content: { flex: 1, padding: 30, alignItems: 'center', marginTop: 30 },
  iconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#071b13', borderWidth: 2, borderColor: '#FFD700', alignItems: 'center', justifyContent: 'center', marginBottom: 25 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#aaa', marginBottom: 25, textAlign: 'center', lineHeight: 20 },
  email: { fontSize: 16, fontWeight: '700', color: '#FFD700', marginBottom: 16 },
  hint: { fontSize: 13, color: '#aaa', textAlign: 'center', lineHeight: 20, marginBottom: 30 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#071b13', borderRadius: 10, borderWidth: 1, marginBottom: 6, paddingHorizontal: 14, gap: 10, width: '100%' },
  inputField: { flex: 1, padding: 15, fontSize: 16 },
  errorText: { color: '#ff4444', fontSize: 12, marginBottom: 10, marginLeft: 4, alignSelf: 'flex-start' },
  button: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20, flexDirection: 'row', gap: 8, width: '100%' },
  buttonDisabled: { backgroundColor: '#555' },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  backLink: { color: '#18a663', fontSize: 14, fontWeight: '600' },
});
