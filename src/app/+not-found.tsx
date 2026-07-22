import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useAppTheme } from '@/hooks/use-theme';
import { House } from 'lucide-react-native';

export default function NotFoundScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  return (
    <>
    <Head>
      <title>Page Not Found | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="The JeetoBaz page you requested could not be found. Return to the homepage to explore prize campaigns." />
    </Head>
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.code, { color: theme.gold }]}>404</Text>
      <Text style={[styles.title, { color: theme.text }]}>Page Not Found</Text>
      <Text style={[styles.message, { color: theme.muted }]}>
        The page you are looking for does not exist or has been moved.
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.gold }]}
        onPress={() => router.replace('/')}
      >
        <House color="#000" size={20} />
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  code: {
    fontSize: 80,
    fontWeight: '800',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 400,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
