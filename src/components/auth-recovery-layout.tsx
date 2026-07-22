import { Image, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';

interface TrustItem {
  icon: ReactNode;
  text: string;
}

interface AuthRecoveryLayoutProps {
  children: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  trustItems?: TrustItem[];
  showFooter?: boolean;
}

export function AuthRecoveryLayout({
  children,
  showBack = true,
  onBack,
  trustItems,
  showFooter = true,
}: AuthRecoveryLayoutProps) {
  const { theme } = useAppTheme();
  const router = useRouter();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.wrapper}>
          <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
            {showBack && (
              <TouchableOpacity onPress={onBack || (() => router.back())} style={styles.backBtn}>
                <ChevronLeft color={theme.text} size={24} />
              </TouchableOpacity>
            )}
            <View style={styles.logoRow}>
              <Image source={require('@/assets/images/icon.png')} style={styles.logoImage} />
              <Text style={[styles.logo, { color: theme.text }]}>JeetoBaz</Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {children}
          </View>

          {trustItems && trustItems.length > 0 && (
            <View style={[styles.trustStrip, { backgroundColor: theme.primarySoft }]}>
              {trustItems.map((item, index) => (
                <View key={index} style={styles.trustItem}>
                  {item.icon}
                  <Text style={[styles.trustText, { color: theme.subtle }]}>{item.text}</Text>
                </View>
              ))}
            </View>
          )}

          {showFooter && (
            <View style={[styles.footerPanel, { backgroundColor: theme.surfaceAlt }]}>
              <View style={styles.footerRow}>
                <TouchableOpacity onPress={() => router.push('/terms' as never)}>
                  <Text style={[styles.footerLink, { color: theme.muted }]}>Terms</Text>
                </TouchableOpacity>
                <Text style={[styles.footerDot, { color: theme.muted }]}>•</Text>
                <TouchableOpacity onPress={() => router.push('/privacy' as never)}>
                  <Text style={[styles.footerLink, { color: theme.muted }]}>Privacy</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export function Badge({ icon, text }: { icon: ReactNode; text: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.primarySoft }]}>
      {icon}
      <Text style={[styles.badgeText, { color: theme.primary }]}>{text}</Text>
    </View>
  );
}

export function PrimaryButton({
  onPress,
  disabled,
  loading,
  icon,
  text,
}: {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  text: string;
}) {
  const { theme } = useAppTheme();
  return (
    <TouchableOpacity
      style={[styles.primaryButton, { backgroundColor: '#FFD700' }, disabled && { backgroundColor: theme.muted }]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>Please wait...</Text>
      ) : (
        <View style={styles.primaryButtonInner}>
          {icon}
          <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>{text}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  wrapper: { width: '100%' },

  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 2,
  },
  backBtn: { padding: 4 },
  logoRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImage: { width: 40, height: 40, borderRadius: 8 },
  logo: { fontSize: 28, fontWeight: 'bold' },

  card: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },

  primaryButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  primaryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: { fontSize: 17, fontWeight: 'bold' },

  trustStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 24,
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexWrap: 'wrap',
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontSize: 11, fontWeight: '500' },

  footerPanel: {
    marginTop: 16,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  footerLink: { fontSize: 12 },
  footerDot: { fontSize: 12 },
});
