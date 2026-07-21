import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { createUserProfile } from '@/lib/auth';
import { validatePhone, validateName } from '@/lib/auth-validation';
import { normalizePakistaniMobile } from '@/lib/validation';
import { claimPendingReferral } from '@/lib/referrals';
import { setStoredValue } from '@/lib/storage';
import { useAppTheme } from '@/hooks/use-theme';
import { Phone, Rocket, User } from 'lucide-react-native';

export default function ProfileSetupScreen() {
  const { theme } = useAppTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [phone, setInputPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSetup() {
    const newErrors: Record<string, string> = {};

    const nameError = validateName(name);
    if (nameError) newErrors.name = nameError;

    const normalizedPhone = '+92' + normalizePakistaniMobile(phone);
    const phoneError = validatePhone(normalizedPhone);
    if (phoneError) newErrors.phone = phoneError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const normalizedPhoneFull = '+92' + normalizePakistaniMobile(phone);
    const { error } = await createUserProfile(name.trim(), normalizedPhoneFull);

    if (error) {
      if (error.message.includes('already')) {
        setErrors({ phone: 'This phone number is already linked to another JeetoBaz account. Please use a different number or contact support.' });
      } else {
        alert('Error: ' + error.message);
      }
    } else {
      await claimPendingReferral(normalizedPhoneFull);
      await setStoredValue('userPhone', normalizedPhoneFull);
      await setStoredValue('userName', name.trim());
      router.replace('/');
    }

    setLoading(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={styles.logo}>JeetoBaz</Text>
        <Text style={styles.tagline}>Complete Your Profile</Text>
      </View>

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Almost done! Enter your details to get started.
        </Text>

        <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: errors.name ? '#ff4444' : theme.border }]}>
          <User color={theme.muted} size={18} />
          <TextInput
            style={[styles.inputField, { color: theme.text }]}
            placeholder="Your Full Name"
            placeholderTextColor="#666"
            value={name}
            onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: '' })); }}
            maxLength={80}
          />
        </View>
        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

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

        <Text style={[styles.hint, { color: theme.muted }]}>
          Phone number is required for draw participation and payment verification.
        </Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSetup}
          disabled={loading}
        >
          {!loading && <Rocket color="#000" size={19} />}
          <Text style={styles.buttonText}>{loading ? 'Setting up...' : 'Complete Setup'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  header: { backgroundColor: '#04140e', borderBottomColor: '#FFD700', borderBottomWidth: 2, padding: 50, alignItems: 'center' },
  logo: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  tagline: { fontSize: 14, color: 'white', marginTop: 8 },
  form: { padding: 25, marginTop: 20 },
  subtitle: { fontSize: 14, color: '#aaa', marginBottom: 25, textAlign: 'center', lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#071b13', borderRadius: 10, borderWidth: 1, marginBottom: 6, paddingHorizontal: 14, gap: 10 },
  inputField: { flex: 1, padding: 15, fontSize: 16 },
  phoneCode: { paddingVertical: 15, paddingLeft: 10, paddingRight: 12, fontSize: 14, borderRightWidth: 1, borderRightColor: '#174a35' },
  errorText: { color: '#ff4444', fontSize: 12, marginBottom: 10, marginLeft: 4 },
  hint: { fontSize: 12, color: '#aaa', marginTop: 10, marginBottom: 25, textAlign: 'center', lineHeight: 18 },
  button: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20, flexDirection: 'row', gap: 7 },
  buttonDisabled: { backgroundColor: '#555' },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
});
