import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { updatePassword } from '@/lib/auth';
import { validatePassword } from '@/lib/auth-validation';
import { useAppTheme } from '@/hooks/use-theme';
import { Check, ChevronLeft, Eye, EyeOff, LockKeyhole, Shield } from 'lucide-react-native';

export default function ResetPasswordScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  async function handleReset() {
    const validationError = validatePassword(password);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setLoading(true);
    setPasswordError('');
    const { error } = await updatePassword(password);

    if (error) {
      alert('Failed to update password: ' + error.message);
    } else {
      alert('Password updated successfully!');
      router.replace('/login');
    }
    setLoading(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/login')} style={styles.backBtn}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Password</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Shield color="#FFD700" size={50} />
        </View>
        <Text style={styles.title}>Set New Password</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Enter your new password below.
        </Text>

        <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: passwordError ? '#ff4444' : theme.border }]}>
          <LockKeyhole color={theme.muted} size={18} />
          <TextInput
            style={[styles.inputField, { color: theme.text }]}
            placeholder="New Password (8+ chars, 1 uppercase, 1 number)"
            placeholderTextColor="#666"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(v) => { setPassword(v); setPasswordError(''); }}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff color={theme.muted} size={18} /> : <Eye color={theme.muted} size={18} />}
          </TouchableOpacity>
        </View>

        <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: passwordError ? '#ff4444' : theme.border }]}>
          <LockKeyhole color={theme.muted} size={18} />
          <TextInput
            style={[styles.inputField, { color: theme.text }]}
            placeholder="Confirm New Password"
            placeholderTextColor="#666"
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); setPasswordError(''); }}
          />
        </View>
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          {!loading && <Check color="#000" size={18} />}
          <Text style={styles.buttonText}>{loading ? 'Updating...' : 'Update Password'}</Text>
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
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#071b13', borderRadius: 10, borderWidth: 1, marginBottom: 12, paddingHorizontal: 14, gap: 10, width: '100%' },
  inputField: { flex: 1, padding: 15, fontSize: 16 },
  errorText: { color: '#ff4444', fontSize: 12, marginBottom: 10, marginLeft: 4, alignSelf: 'flex-start' },
  button: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20, flexDirection: 'row', gap: 8, width: '100%' },
  buttonDisabled: { backgroundColor: '#555' },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
});
