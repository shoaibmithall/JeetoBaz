import { Image, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/hooks/use-theme';
import { Check, ChevronLeft, Eye, EyeOff, LockKeyhole, Shield } from 'lucide-react-native';

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', color: '#ff4444' };
  if (score <= 2) return { level: 2, label: 'Fair', color: '#FFA500' };
  if (score <= 3) return { level: 3, label: 'Strong', color: '#FFD700' };
  return { level: 4, label: 'Very Strong', color: '#18a663' };
}

export default function ResetPasswordScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  async function handleReset() {
    const newErrors: Record<string, string> = {};

    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = 'Password must contain at least 1 uppercase letter';
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = 'Password must contain at least 1 lowercase letter';
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = 'Password must contain at least 1 number';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      alert('Failed to update password: ' + error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        supabase.auth.signOut();
        router.replace('/login');
      }, 2000);
    }

    setLoading(false);
  }

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <Image source={require('@/assets/images/icon.png')} style={styles.logoImage} />
              <Text style={styles.logo}>JeetoBaz</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.successIcon}>
              <Check color="#18a663" size={50} />
            </View>
            <Text style={styles.title}>Password Updated!</Text>
            <Text style={styles.subtitle}>
              Your password has been successfully updated. Redirecting to login...
            </Text>
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
            <Text style={styles.secureBadgeText}>Set New Password</Text>
          </View>

          <Text style={styles.title}>Create Password</Text>
          <Text style={styles.subtitle}>
            Enter your new password below.
          </Text>

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: errors.password ? '#ff4444' : theme.border }]}>
            <LockKeyhole color={theme.muted} size={18} />
            <TextInput
              style={[styles.inputField, { color: theme.text }]}
              placeholder="New Password"
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
              placeholder="Confirm New Password"
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

          <View style={styles.passwordRequirements}>
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
              <Text style={[styles.reqDot, { color: /[a-z]/.test(password) ? '#18a663' : '#5e7468' }]}>
                {/[a-z]/.test(password) ? '✓' : '○'}
              </Text>
              <Text style={[styles.reqText, { color: /[a-z]/.test(password) ? '#18a663' : '#5e7468' }]}>
                One lowercase letter
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
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Check color="#000" size={18} />
                <Text style={styles.primaryButtonText}>Update Password</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.trustStrip}>
          <View style={styles.trustItem}>
            <Shield color="#18a663" size={14} />
            <Text style={styles.trustText}>Secure Update</Text>
          </View>
          <View style={styles.trustItem}>
            <LockKeyhole color="#18a663" size={14} />
            <Text style={styles.trustText}>Encrypted</Text>
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

  title: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9aac9f', textAlign: 'center', marginBottom: 24, lineHeight: 20 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, marginBottom: 4, paddingHorizontal: 14, gap: 10 },
  inputField: { flex: 1, padding: 16, fontSize: 16 },
  errorText: { color: '#ff4444', fontSize: 12, marginBottom: 4, marginLeft: 4 },
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

  primaryButton: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 8 },
  buttonDisabled: { backgroundColor: '#555' },
  primaryButtonText: { fontSize: 17, fontWeight: 'bold', color: '#000' },

  successIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#0a2419', borderWidth: 2, borderColor: '#18a663', alignItems: 'center', justifyContent: 'center', marginBottom: 24, alignSelf: 'center' },

  trustStrip: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 24, paddingHorizontal: 20, flexWrap: 'wrap' },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { color: '#5e7468', fontSize: 11, fontWeight: '500' },
});
