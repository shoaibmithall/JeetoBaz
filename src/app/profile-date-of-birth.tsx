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
import { ArrowLeft, CalendarDays, Save } from 'lucide-react-native';

import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { useSafeBack } from '@/lib/safe-back';

function parseStoredDate(value: string | null | undefined) {
  const [year = '', month = '', day = ''] = (value || '').split('-');
  return { day, month, year };
}

function isValidDate(day: number, month: number, year: number) {
  const candidate = new Date(year, month - 1, day);
  return candidate.getFullYear() === year
    && candidate.getMonth() === month - 1
    && candidate.getDate() === day;
}

export default function ProfileDateOfBirthScreen() {
  const { theme } = useAppTheme();
  const { user, loading: authLoading } = useAuth();
  const goBack = useSafeBack('/login');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadDateOfBirth = async () => {
      if (authLoading) return;
      if (!user?.id) {
        router.replace('/login');
        return;
      }

      setLoading(true);
      const { data, error: loadError } = await supabase
        .from('user_profile_details')
        .select('date_of_birth')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!active) return;

      if (loadError) {
        setError('Date of birth could not be loaded. Please try again.');
      } else {
        const stored = parseStoredDate(data?.date_of_birth);
        setDay(stored.day);
        setMonth(stored.month);
        setYear(stored.year);
      }
      setLoading(false);
    };

    void loadDateOfBirth();
    return () => {
      active = false;
    };
  }, [authLoading, user?.id]);

  const saveDateOfBirth = async () => {
    if (!user?.id || saving) return;

    const numericDay = Number(day);
    const numericMonth = Number(month);
    const numericYear = Number(year);
    const currentYear = new Date().getFullYear();

    if (!day || !month || !year) {
      setError('Day, month, and year are required.');
      return;
    }
    if (
      !Number.isInteger(numericDay)
      || !Number.isInteger(numericMonth)
      || !Number.isInteger(numericYear)
      || numericYear < 1900
      || numericYear > currentYear
      || !isValidDate(numericDay, numericMonth, numericYear)
    ) {
      setError('Please enter a valid date of birth.');
      return;
    }

    const candidate = new Date(numericYear, numericMonth - 1, numericDay);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (candidate > today) {
      setError('Date of birth cannot be in the future.');
      return;
    }

    const dateOfBirth = [
      String(numericYear).padStart(4, '0'),
      String(numericMonth).padStart(2, '0'),
      String(numericDay).padStart(2, '0'),
    ].join('-');

    setSaving(true);
    setError('');
    const { error: saveError } = await supabase
      .from('user_profile_details')
      .upsert(
        {
          auth_user_id: user.id,
          date_of_birth: dateOfBirth,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'auth_user_id' },
      );

    setSaving(false);
    if (saveError) {
      setError('Date of birth could not be saved. Please try again.');
      return;
    }

    goBack();
  };

  return (
    <>
      <Head>
        <title>Date of Birth | JeetoBaz</title>
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
          <Text style={[styles.headerTitle, { color: theme.gold }]}>Date of Birth</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}>
            <CalendarDays color={theme.primary} size={26} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Your date of birth</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Enter your date carefully. It is stored securely with your profile details.
          </Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={theme.primary} accessibilityLabel="Loading" />
              <Text style={[styles.loadingText, { color: theme.muted }]}>Loading date of birth...</Text>
            </View>
          ) : (
            <>
              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <Text style={[styles.label, { color: theme.text }]}>Day</Text>
                  <TextInput
                    value={day}
                    onChangeText={(value) => {
                      setDay(value.replace(/\D/g, '').slice(0, 2));
                      setError('');
                    }}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    placeholder="DD"
                    placeholderTextColor={theme.subtle}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                    accessibilityLabel="Birth day"
                  />
                </View>
                <View style={styles.dateField}>
                  <Text style={[styles.label, { color: theme.text }]}>Month</Text>
                  <TextInput
                    value={month}
                    onChangeText={(value) => {
                      setMonth(value.replace(/\D/g, '').slice(0, 2));
                      setError('');
                    }}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    placeholder="MM"
                    placeholderTextColor={theme.subtle}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                    accessibilityLabel="Birth month"
                  />
                </View>
                <View style={[styles.dateField, styles.yearField]}>
                  <Text style={[styles.label, { color: theme.text }]}>Year</Text>
                  <TextInput
                    value={year}
                    onChangeText={(value) => {
                      setYear(value.replace(/\D/g, '').slice(0, 4));
                      setError('');
                    }}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    placeholder="YYYY"
                    placeholderTextColor={theme.subtle}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                    accessibilityLabel="Birth year"
                  />
                </View>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                onPress={saveDateOfBirth}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Save date of birth"
                style={[styles.saveButton, saving && styles.disabledButton]}
              >
                {saving ? <ActivityIndicator color="#000" accessibilityLabel="Saving" /> : <Save color="#000" size={19} />}
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Date of Birth'}</Text>
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
  card: { width: '94%', maxWidth: 620, alignSelf: 'center', marginTop: 28, borderRadius: 18, borderWidth: 1, padding: 24 },
  iconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 14 },
  subtitle: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 7, marginBottom: 24 },
  loadingBox: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateField: { flex: 1 },
  yearField: { flex: 1.35 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 54, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600', marginTop: 14 },
  saveButton: { minHeight: 54, borderRadius: 12, backgroundColor: '#FFD700', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 22 },
  disabledButton: { opacity: 0.6 },
  saveButtonText: { color: '#000', fontSize: 16, fontWeight: '800' },
});
