import { useEffect, useState } from 'react';
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
import { ArrowLeft, Phone, Save, User } from 'lucide-react-native';

import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { updateUserProfile } from '@/lib/auth';
import { validateName, validatePhone } from '@/lib/auth-validation';
import { normalizePakistaniMobile } from '@/lib/validation';
import { useSafeBack } from '@/lib/safe-back';

export default function EditProfileScreen() {
  const { theme } = useAppTheme();
  const { user, loading: authLoading } = useAuth();
  const goBack = useSafeBack('/login');
  const [name, setName] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (authLoading) return;
      if (!user?.id) {
        router.replace('/login');
        return;
      }

      setLoading(true);
      const { data, error: loadError } = await supabase
        .from('users')
        .select('name, phone')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!active) return;

      if (loadError) {
        setError('Profile details could not be loaded. Please try again.');
      } else {
        setName(data?.name || '');
        setInputPhone(normalizePakistaniMobile(data?.phone || ''));
      }
      setLoading(false);
    };

    void loadProfile();
    return () => {
      active = false;
    };
  }, [authLoading, user?.id]);

  const saveProfile = async () => {
    if (!user?.id || saving) return;

    const trimmedName = name.trim();
    const fullPhone = '+92' + inputPhone;
    const nameError = validateName(trimmedName);
    const phoneError = validatePhone(fullPhone);

    if (nameError || phoneError) {
      setErrors({ name: nameError || undefined, phone: phoneError || undefined });
      return;
    }

    setSaving(true);
    setError('');
    const { error: saveError } = await updateUserProfile(trimmedName, undefined, fullPhone);

    setSaving(false);
    if (saveError) {
      setError('Profile could not be saved. Please try again.');
      return;
    }

    goBack();
  };

  return (
    <>
      <Head>
        <title>Edit Profile | JeetoBaz</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Back to profile"
            style={styles.backButton}
          >
            <ArrowLeft color={theme.primary} size={22} />
            <Text style={[styles.backText, { color: theme.primary }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.gold }]}>Edit Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}>
            <User color={theme.primary} size={26} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Update your details</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Your name and phone number are used for draw entries, verification, and prize delivery.
          </Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={theme.primary} accessibilityLabel="Loading" />
              <Text style={[styles.loadingText, { color: theme.muted }]}>Loading profile...</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
              <TextInput
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  setErrors((e) => ({ ...e, name: undefined }));
                }}
                maxLength={80}
                placeholder="Your Full Name"
                placeholderTextColor={theme.subtle}
                style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: errors.name ? '#ff4444' : theme.border }]}
                accessibilityLabel="Full name"
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

              <Text style={[styles.label, { color: theme.text }]}>Phone Number</Text>
              <View style={[styles.phoneRow, { backgroundColor: theme.background, borderColor: errors.phone ? '#ff4444' : theme.border }]}>
                <Phone color={theme.muted} size={18} />
                <Text style={[styles.phoneCode, { color: theme.muted, borderRightColor: theme.border }]}>+92</Text>
                <TextInput
                  style={[styles.phoneInput, { color: theme.text }]}
                  placeholder="3001234567"
                  placeholderTextColor={theme.subtle}
                  keyboardType="phone-pad"
                  value={inputPhone}
                  onChangeText={(value) => {
                    setInputPhone(normalizePakistaniMobile(value));
                    setErrors((e) => ({ ...e, phone: undefined }));
                  }}
                  maxLength={10}
                  accessibilityLabel="Phone number"
                />
              </View>
              {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                onPress={saveProfile}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Save profile"
                style={[styles.saveButton, saving && styles.disabledButton]}
              >
                {saving ? <ActivityIndicator color="#000" accessibilityLabel="Saving" /> : <Save color="#000" size={19} />}
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
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
  loadingBox: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 15, fontSize: 16, marginBottom: 4 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', minHeight: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, gap: 8 },
  phoneCode: { fontSize: 15, fontWeight: '700', paddingRight: 8, borderRightWidth: 1 },
  phoneInput: { flex: 1, fontSize: 16, minHeight: 50 },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600', marginBottom: 14, marginTop: 4 },
  saveButton: { minHeight: 54, borderRadius: 12, backgroundColor: '#FFD700', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  disabledButton: { opacity: 0.6 },
  saveButtonText: { color: '#000', fontSize: 16, fontWeight: '800' },
});
