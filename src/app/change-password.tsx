import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Head from 'expo-router/head';
import { router } from 'expo-router';
import { ArrowLeft, Check, Eye, EyeOff, LockKeyhole, Save } from 'lucide-react-native';

import { useAppTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { validatePassword } from '@/lib/auth-validation';

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

export default function ChangePasswordScreen() {
  const { theme } = useAppTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const passwordStrength = getPasswordStrength(password);
  const reqChecks = [
    { label: 'Minimum 8 characters', passed: password.length >= 8 },
    { label: 'One uppercase letter', passed: /[A-Z]/.test(password) },
    { label: 'One number', passed: /[0-9]/.test(password) },
  ];

  const savePassword = async () => {
    if (saving) return;

    const passwordError = validatePassword(password);
    const confirmError = password !== confirmPassword ? 'Passwords do not match' : undefined;

    if (passwordError || confirmError) {
      setErrors({ password: passwordError || undefined, confirmPassword: confirmError });
      return;
    }

    setSaving(true);
    setErrors({});
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setErrors({ password: error.message });
      return;
    }

    setSuccess(true);
  };

  return (
    <>
      <Head>
        <title>Change Password | JeetoBaz</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back to profile"
            style={styles.backButton}
          >
            <ArrowLeft color={theme.primary} size={22} />
            <Text style={[styles.backText, { color: theme.primary }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.gold }]}>Change Password</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}>
            <LockKeyhole color={theme.primary} size={26} />
          </View>

          {success ? (
            <>
              <Text style={[styles.title, { color: theme.text }]}>Password Updated!</Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                Your password has been changed successfully.
              </Text>
              <TouchableOpacity
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Back to profile"
                style={styles.saveButton}
              >
                <Check color="#000" size={19} />
                <Text style={styles.saveButtonText}>Done</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: theme.text }]}>Set a new password</Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                Choose a strong password to keep your account secure.
              </Text>

              <Text style={[styles.label, { color: theme.text }]}>New Password</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.background, borderColor: errors.password ? '#ff4444' : theme.border }]}>
                <LockKeyhole color={theme.muted} size={18} />
                <TextInput
                  style={[styles.inputField, { color: theme.text }]}
                  placeholder="New Password"
                  placeholderTextColor={theme.subtle}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setErrors((e) => ({ ...e, password: undefined }));
                  }}
                  accessibilityLabel="New password"
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
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
                        style={[styles.strengthBar, { backgroundColor: i <= passwordStrength.level ? passwordStrength.color : theme.border }]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
                </View>
              )}

              <Text style={[styles.label, { color: theme.text }]}>Confirm New Password</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.background, borderColor: errors.confirmPassword ? '#ff4444' : theme.border }]}>
                <LockKeyhole color={theme.muted} size={18} />
                <TextInput
                  style={[styles.inputField, { color: theme.text }]}
                  placeholder="Confirm New Password"
                  placeholderTextColor={theme.subtle}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    setErrors((e) => ({ ...e, confirmPassword: undefined }));
                  }}
                  accessibilityLabel="Confirm new password"
                />
                {confirmPassword.length > 0 ? (
                  password === confirmPassword
                    ? <Check color={theme.primary} size={16} />
                    : <Text style={styles.invalidMarker}>✕</Text>
                ) : null}
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

              <View style={[styles.passwordRequirements, { backgroundColor: theme.primarySoft }]}>
                <Text style={[styles.reqTitle, { color: theme.muted }]}>Password Requirements</Text>
                {reqChecks.map((req) => (
                  <View key={req.label} style={styles.reqRow}>
                    <Text style={[styles.reqDot, { color: req.passed ? theme.primary : theme.subtle }]}>{req.passed ? '✓' : '○'}</Text>
                    <Text style={[styles.reqText, { color: req.passed ? theme.primary : theme.subtle }]}>{req.label}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={savePassword}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Save new password"
                style={[styles.saveButton, saving && styles.disabledButton]}
              >
                {saving ? <ActivityIndicator color="#000" accessibilityLabel="Saving" /> : <Save color="#000" size={19} />}
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Update Password'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingBottom: 100 },
  header: { width: '100%', minHeight: 72, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#C59A00' },
  backButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
  backText: { fontSize: 15, fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  headerSpacer: { flex: 1 },
  card: { width: '94%', maxWidth: 720, alignSelf: 'center', marginTop: 28, borderRadius: 18, borderWidth: 1, padding: 24 },
  iconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 14 },
  subtitle: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 7, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 7 },
  inputRow: { flexDirection: 'row', alignItems: 'center', minHeight: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, gap: 10, marginBottom: 4 },
  inputField: { flex: 1, fontSize: 16, minHeight: 50 },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600', marginBottom: 14, marginTop: 4 },
  invalidMarker: { color: '#ff4444', fontSize: 14, fontWeight: 'bold' },
  strengthContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  strengthBarRow: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { height: 4, flex: 1, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '600', minWidth: 70, textAlign: 'right' },
  passwordRequirements: { borderRadius: 8, padding: 12, marginBottom: 16, marginTop: 4 },
  reqTitle: { fontSize: 11, fontWeight: '600', marginBottom: 8 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  reqDot: { fontSize: 12, width: 16 },
  reqText: { fontSize: 12 },
  saveButton: { minHeight: 54, borderRadius: 12, backgroundColor: '#FFD700', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  disabledButton: { opacity: 0.6 },
  saveButtonText: { color: '#000', fontSize: 16, fontWeight: '800' },
});
