import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Head from 'expo-router/head';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, Clock, LockKeyhole, Mail, Smartphone } from 'lucide-react-native';

import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/hooks/use-theme';
import { useSafeBack } from '@/lib/safe-back';

const PROVIDER_LABELS: Record<string, string> = {
  email: 'Email & Password',
  phone: 'Phone (OTP)',
  google: 'Google',
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Not available';
  return new Date(value).toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function LoginActivityScreen() {
  const { theme } = useAppTheme();
  const { user, isEmailVerified, loading } = useAuth();
  const goBack = useSafeBack('/login');

  if (!loading && !user) {
    router.replace('/login');
    return null;
  }

  const providerKey = typeof user?.app_metadata?.provider === 'string' ? user.app_metadata.provider : '';
  const providerLabel = PROVIDER_LABELS[providerKey] || (providerKey ? providerKey : 'Not available');

  const rows = [
    { icon: Clock, label: 'Last Sign-In', value: formatDateTime(user?.last_sign_in_at) },
    { icon: Calendar, label: 'Account Created', value: formatDateTime(user?.created_at) },
    { icon: Smartphone, label: 'Sign-In Method', value: providerLabel },
    { icon: Mail, label: 'Email Verified', value: isEmailVerified ? 'Yes' : 'No' },
  ];

  return (
    <>
      <Head>
        <title>Login Activity | JeetoBaz</title>
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
          <Text style={[styles.headerTitle, { color: theme.gold }]}>Login Activity</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}>
            <Smartphone color={theme.primary} size={26} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>This device's session</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Details about your current login. This shows your own session only, not a list of every device.
          </Text>

          {rows.map((row) => (
            <View key={row.label} style={[styles.row, { borderColor: theme.border }]}>
              <row.icon color={theme.subtle} size={18} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: theme.muted }]}>{row.label}</Text>
                <Text style={[styles.rowValue, { color: theme.text }]}>{row.value}</Text>
              </View>
            </View>
          ))}

          <Text style={[styles.securityNote, { color: theme.muted }]}>
            Don't recognize this activity? Change your password right away.
          </Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/change-password', params: { from: '/login-activity' } } as never)}
            accessibilityRole="button"
            accessibilityLabel="Change password"
            style={styles.changePasswordButton}
          >
            <LockKeyhole color="#000" size={18} />
            <Text style={styles.changePasswordButtonText}>Change Password</Text>
          </TouchableOpacity>
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
  subtitle: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 7, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: 1 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 12, fontWeight: '700', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
  rowValue: { fontSize: 15, fontWeight: '600' },
  securityNote: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 20, marginBottom: 14 },
  changePasswordButton: { minHeight: 52, borderRadius: 12, backgroundColor: '#FFD700', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  changePasswordButtonText: { color: '#000', fontSize: 15, fontWeight: '800' },
});
