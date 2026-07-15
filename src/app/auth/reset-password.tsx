import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/hooks/use-theme';

export default function ResetPasswordCallbackScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function handle() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const tokenHash = url.searchParams.get('token_hash');
        const type = url.searchParams.get('type');

        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const hashError = hashParams.get('error_description');

        if (hashError) {
          throw new Error(decodeURIComponent(hashError));
        }

        let authError = null;

        if (code) {
          const result = await supabase.auth.exchangeCodeForSession(code);
          authError = result.error;
        } else if (tokenHash) {
          const result = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          authError = result.error;
        } else if (accessToken && refreshToken) {
          const result = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          authError = result.error;
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('Reset link is invalid or has expired.');
          }
        }

        if (authError) throw authError;

        if (mounted) {
          router.replace('/reset-password' as never);
        }
      } catch (e) {
        console.error('Reset callback error:', e);
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Reset link is invalid.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    handle();
    return () => { mounted = false; };
  }, []);

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/forgot-password')}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
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
  errorText: { fontSize: 16, color: '#ff4444', textAlign: 'center', padding: 30, marginBottom: 20 },
  button: { backgroundColor: '#FFD700', padding: 16, borderRadius: 12, paddingHorizontal: 30 },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
});
