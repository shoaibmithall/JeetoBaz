import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/hooks/use-theme';
import { AuthRecoveryLayout, Badge, PrimaryButton } from '@/components/auth-recovery-layout';
import { Check, Eye, EyeOff, LockKeyhole, Shield } from 'lucide-react-native';

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
      <>
      <Head>
        <title>Reset Password | JeetoBaz</title>
        <meta name="robots" content="noindex, follow" />
        <meta name="description" content="Set a new password for your JeetoBaz account." />
      </Head>
      <View style={[styles.successContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.gold }]}>
          <View style={styles.logoRow}>
            <Text style={[styles.logo, { color: theme.text }]}>JeetoBaz</Text>
          </View>
        </View>

        <View style={[styles.successCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.successIcon, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
            <Check color={theme.primary} size={50} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Password Updated!</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Your password has been successfully updated. Redirecting to login...
          </Text>
        </View>
      </View>
      </>
    );
  }

  const reqChecks = [
    { label: 'Minimum 8 characters', passed: password.length >= 8 },
    { label: 'One uppercase letter', passed: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', passed: /[a-z]/.test(password) },
    { label: 'One number', passed: /[0-9]/.test(password) },
  ];

  return (
    <>
    <Head>
      <title>Reset Password | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="Set a new password for your JeetoBaz account." />
    </Head>
    <AuthRecoveryLayout
      trustItems={[
        { icon: <Shield color={theme.primary} size={14} />, text: 'Secure Update' },
        { icon: <LockKeyhole color={theme.primary} size={14} />, text: 'Encrypted' },
      ]}
      showFooter={false}
    >
      <Badge icon={<LockKeyhole color={theme.primary} size={16} />} text="Set New Password" />

      <Text style={[styles.title, { color: theme.text }]}>Create Password</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>
        Enter your new password below.
      </Text>

      <View style={[
        styles.inputContainer,
        { backgroundColor: theme.surface, borderColor: errors.password ? theme.danger : theme.border }
      ]}>
        <LockKeyhole color={theme.muted} size={18} />
        <TextInput
          style={[styles.inputField, { color: theme.text }]}
          placeholder="New Password"
          placeholderTextColor={theme.muted}
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
                  { backgroundColor: i <= passwordStrength.level ? passwordStrength.color : theme.border }
                ]}
              />
            ))}
          </View>
          <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
            {passwordStrength.label}
          </Text>
        </View>
      )}

      <View style={[
        styles.inputContainer,
        { backgroundColor: theme.surface, borderColor: errors.confirmPassword ? theme.danger : theme.border }
      ]}>
        <LockKeyhole color={theme.muted} size={18} />
        <TextInput
          style={[styles.inputField, { color: theme.text }]}
          placeholder="Confirm New Password"
          placeholderTextColor={theme.muted}
          secureTextEntry={!showPassword}
          value={confirmPassword}
          onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirmPassword: '' })); }}
        />
        {confirmPassword.length > 0 && (
          password === confirmPassword ? (
            <Check color={theme.primary} size={16} />
          ) : (
            <Text style={styles.invalidMarker}>✕</Text>
          )
        )}
      </View>
      {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

      <View style={[styles.passwordRequirements, { backgroundColor: theme.primarySoft }]}>
        <Text style={[styles.reqTitle, { color: theme.muted }]}>Password Requirements</Text>
        {reqChecks.map((req, i) => (
          <View key={i} style={styles.reqRow}>
            <Text style={[styles.reqDot, { color: req.passed ? theme.primary : theme.subtle }]}>
              {req.passed ? '✓' : '○'}
            </Text>
            <Text style={[styles.reqText, { color: req.passed ? theme.primary : theme.subtle }]}>
              {req.label}
            </Text>
          </View>
        ))}
      </View>

      <PrimaryButton
        onPress={handleReset}
        loading={loading}
        icon={<Check color={theme.buttonText} size={18} />}
        text="Update Password"
      />
    </AuthRecoveryLayout>
    </>
  );
}

const styles = StyleSheet.create({
  successContainer: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 2,
  },
  logoRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { fontSize: 28, fontWeight: 'bold' },

  successCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    alignSelf: 'center',
  },

  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
    paddingHorizontal: 14,
    gap: 10,
  },
  inputField: { flex: 1, padding: 16, fontSize: 16 },
  errorText: { color: '#ff4444', fontSize: 12, marginBottom: 4, marginLeft: 4 },
  invalidMarker: { color: '#ff4444', fontSize: 14, fontWeight: 'bold' },

  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    marginLeft: 4,
  },
  strengthBarRow: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { height: 4, flex: 1, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '600', minWidth: 70, textAlign: 'right' },

  passwordRequirements: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  reqTitle: { fontSize: 11, fontWeight: '600', marginBottom: 8 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  reqDot: { fontSize: 12, width: 16 },
  reqText: { fontSize: 12 },
});
