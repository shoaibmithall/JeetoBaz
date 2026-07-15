import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { exchangeCodeForSession } from '@/lib/auth';
import { useAppTheme } from '@/hooks/use-theme';

export default function ResetPasswordCallbackScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const [error, setError] = useState('');

  useEffect(() => {
    async function handle() {
      const code = params.code;
      if (!code) {
        setError('Invalid reset link. Please try again.');
        return;
      }

      const { error: exchangeError } = await exchangeCodeForSession(code);

      if (exchangeError) {
        if (exchangeError.message.includes('expired')) {
          setError('This link has expired. Please request a new one.');
        } else {
          setError('Reset failed: ' + exchangeError.message);
        }
        return;
      }

      router.replace('/reset-password');
    }

    handle();
  }, [params.code]);

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color="#FFD700" />
      <Text style={[styles.loadingText, { color: theme.muted }]}>Verifying reset link...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09', alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 16, marginTop: 16 },
  errorText: { fontSize: 16, color: '#ff4444', textAlign: 'center', padding: 30 },
});
