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
import { ArrowLeft, Check, Mail, Save } from 'lucide-react-native';

import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { validateEmail } from '@/lib/auth-validation';

export default function ChangeEmailScreen() {
  const { theme } = useAppTheme();
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const currentEmail = user?.email || 'Not set';

  const saveEmail = async () => {
    if (saving) return;

    const trimmed = newEmail.trim().toLowerCase();
    const emailError = validateEmail(trimmed);
    if (emailError) {
      setError(emailError);
      return;
    }
    if (trimmed === (user?.email || '').toLowerCase()) {
      setError('This is already your current email.');
      return;
    }

    setSaving(true);
    setError('');
    const { error: saveError } = await supabase.auth.updateUser({ email: trimmed });
    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setSuccess(true);
  };

  return (
    <>
      <Head>
        <title>Change Email | JeetoBaz</title>
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
          <Text style={[styles.headerTitle, { color: theme.gold }]}>Change Email</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}>
            <Mail color={theme.primary} size={26} />
          </View>

          {success ? (
            <>
              <Text style={[styles.title, { color: theme.text }]}>Confirmation Sent!</Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                Check {newEmail.trim() || 'your new inbox'} and tap the confirmation link to finish changing your email. It stays as {currentEmail} until then.
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
              <Text style={[styles.title, { color: theme.text }]}>Update your email</Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                Current email: {currentEmail}{'\n'}We'll send a confirmation link to your new email before the change takes effect.
              </Text>

              <Text style={[styles.label, { color: theme.text }]}>New Email</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.background, borderColor: error ? '#ff4444' : theme.border }]}>
                <Mail color={theme.muted} size={18} />
                <TextInput
                  style={[styles.inputField, { color: theme.text }]}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.subtle}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={newEmail}
                  onChangeText={(value) => {
                    setNewEmail(value);
                    setError('');
                  }}
                  accessibilityLabel="New email address"
                />
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                onPress={saveEmail}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Send confirmation to new email"
                style={[styles.saveButton, saving && styles.disabledButton]}
              >
                {saving ? <ActivityIndicator color="#000" accessibilityLabel="Saving" /> : <Save color="#000" size={19} />}
                <Text style={styles.saveButtonText}>{saving ? 'Sending...' : 'Send Confirmation'}</Text>
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
  saveButton: { minHeight: 54, borderRadius: 12, backgroundColor: '#FFD700', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  disabledButton: { opacity: 0.6 },
  saveButtonText: { color: '#000', fontSize: 16, fontWeight: '800' },
});
