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
import { ArrowLeft, MapPin, Save } from 'lucide-react-native';

import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

const MAX_LOCATION_LENGTH = 80;

export default function ProfileLocationScreen() {
  const { theme } = useAppTheme();
  const { user, loading: authLoading } = useAuth();
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadLocation = async () => {
      if (authLoading) return;
      if (!user?.id) {
        router.replace('/login');
        return;
      }

      setLoading(true);
      const { data, error: loadError } = await supabase
        .from('user_profile_details')
        .select('city, province, country')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!active) return;

      if (loadError) {
        setError('Location details could not be loaded. Please try again.');
      } else {
        setCity(data?.city || '');
        setProvince(data?.province || '');
        setCountry(data?.country || '');
      }
      setLoading(false);
    };

    void loadLocation();
    return () => {
      active = false;
    };
  }, [authLoading, user?.id]);

  const saveLocation = async () => {
    if (!user?.id || saving) return;

    const nextCity = city.trim();
    const nextProvince = province.trim();
    const nextCountry = country.trim();

    if (!nextCity || !nextProvince || !nextCountry) {
      setError('City, province, and country are required.');
      return;
    }

    setSaving(true);
    setError('');
    const { error: saveError } = await supabase
      .from('user_profile_details')
      .upsert(
        {
          auth_user_id: user.id,
          city: nextCity,
          province: nextProvince,
          country: nextCountry,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'auth_user_id' },
      );

    setSaving(false);
    if (saveError) {
      setError('Location details could not be saved. Please try again.');
      return;
    }

    router.back();
  };

  return (
    <>
      <Head>
        <title>Profile Location | JeetoBaz</title>
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
          <Text style={[styles.headerTitle, { color: theme.gold }]}>Profile Location</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}>
            <MapPin color={theme.primary} size={26} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Your location</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Only your city is shown on your public-facing profile. Province and country remain in your account details.
          </Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={theme.primary} accessibilityLabel="Loading" />
              <Text style={[styles.loadingText, { color: theme.muted }]}>Loading location...</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.label, { color: theme.text }]}>City</Text>
              <TextInput
                value={city}
                onChangeText={(value) => {
                  setCity(value);
                  setError('');
                }}
                maxLength={MAX_LOCATION_LENGTH}
                placeholder="e.g. Hyderabad"
                placeholderTextColor={theme.subtle}
                autoCapitalize="words"
                style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                accessibilityLabel="City"
              />

              <Text style={[styles.label, { color: theme.text }]}>Province</Text>
              <TextInput
                value={province}
                onChangeText={(value) => {
                  setProvince(value);
                  setError('');
                }}
                maxLength={MAX_LOCATION_LENGTH}
                placeholder="e.g. Sindh"
                placeholderTextColor={theme.subtle}
                autoCapitalize="words"
                style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                accessibilityLabel="Province"
              />

              <Text style={[styles.label, { color: theme.text }]}>Country</Text>
              <TextInput
                value={country}
                onChangeText={(value) => {
                  setCountry(value);
                  setError('');
                }}
                maxLength={MAX_LOCATION_LENGTH}
                placeholder="e.g. Pakistan"
                placeholderTextColor={theme.subtle}
                autoCapitalize="words"
                style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                accessibilityLabel="Country"
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                onPress={saveLocation}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Save profile location"
                style={[styles.saveButton, saving && styles.disabledButton]}
              >
                {saving ? <ActivityIndicator color="#000" accessibilityLabel="Saving" /> : <Save color="#000" size={19} />}
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Location'}</Text>
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
  input: { minHeight: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 15, fontSize: 16, marginBottom: 18 },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600', marginBottom: 14 },
  saveButton: { minHeight: 54, borderRadius: 12, backgroundColor: '#FFD700', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  disabledButton: { opacity: 0.6 },
  saveButtonText: { color: '#000', fontSize: 16, fontWeight: '800' },
});
