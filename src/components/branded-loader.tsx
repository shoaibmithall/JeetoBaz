import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks/use-theme';

export function BrandedLoader({ message = 'Loading JeetoBaz...' }: { message?: string }) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/icon-small.png')} style={styles.logo} accessibilityLabel="JeetoBaz logo" />
      <ActivityIndicator color={theme.gold} accessibilityLabel={message} />
      <Text style={[styles.message, { color: theme.muted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  logo: { width: 64, height: 64, borderRadius: 16 },
  message: { fontSize: 14, fontWeight: '600' },
});
