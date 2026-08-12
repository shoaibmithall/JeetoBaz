import { Image, Text, TouchableOpacity, View, StyleSheet, useWindowDimensions } from 'react-native';
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Shield, ShieldCheck } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { DEFAULT_TRUST_BADGES, getTrustBadges } from '@/lib/app-settings';
import { AuthCardGlow } from '@/components/auth-decor';

// The brand rail is a deliberate, theme-independent choice -- it stays this dark green/gold
// treatment in both light and dark app mode, because that's where the gold logo mark reads best.
// Only the form card (children) follows the app's light/dark theme.
const RAIL_BG = '#04140e';
const RAIL_BG_ALT = '#071b13';
const RAIL_BORDER = '#174a35';
const RAIL_TEXT = '#f5f7f4';
const RAIL_MUTED = '#9aac9f';
const RAIL_GOLD = '#FFD700';
const RAIL_GREEN = '#18a663';
const RAIL_GREEN_SOFT = 'rgba(24,166,99,0.14)';

const SPLIT_BREAKPOINT = 760;

export type AuthTrustItem = { icon: ComponentType<{ color?: string; size?: number }>; label: string };

type AuthScreenShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  onBack?: () => void;
  trustItems: AuthTrustItem[];
  children: ReactNode;
};

export function AuthScreenShell({ eyebrow, title, subtitle, onBack, trustItems, children }: AuthScreenShellProps) {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const isSplit = width >= SPLIT_BREAKPOINT;
  const [trustBadges, setTrustBadges] = useState<[string, string, string]>(DEFAULT_TRUST_BADGES);

  useEffect(() => {
    let active = true;
    getTrustBadges().then(({ badges }) => {
      if (active) setTrustBadges(badges);
    });
    return () => { active = false; };
  }, []);

  return (
    <View style={[styles.outer, isSplit && styles.outerSplit, { backgroundColor: isSplit ? theme.background : RAIL_BG }]}>
      <View style={[styles.shell, isSplit && styles.shellSplit, isSplit && { borderColor: theme.border }]}>

        <View style={[styles.rail, isSplit ? styles.railSplit : styles.railStacked]}>
          <View style={[styles.railGlow, styles.railGlowGold]} />
          <View style={[styles.railGlow, styles.railGlowGreen]} />
          <Image
            source={require('@/assets/images/jeetobaz-logo-hero.png')}
            style={[styles.heroLogo, !isSplit && styles.heroLogoCompact]}
            resizeMode="contain"
            accessibilityLabel="JeetoBaz"
          />
          {isSplit && (
            <>
              <Text style={styles.railHeadline}>
                Pakistan's <Text style={styles.railHeadlineAccent}>transparent</Text> prize platform
              </Text>
              <Text style={styles.railLede}>
                Enter live draws, track every entry, and follow verified winners -- all in one place.
              </Text>
            </>
          )}
          <View style={[styles.badgeRow, !isSplit && styles.badgeRowCompact]}>
            {trustBadges.map((label) => (
              <View key={label} style={styles.badge}>
                <ShieldCheck color={RAIL_GREEN} size={13} />
                <Text style={styles.badgeText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, isSplit && styles.cardSplit]}>
          <AuthCardGlow />
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
              <ChevronLeft color={theme.text} size={22} />
            </TouchableOpacity>
          )}
          <View style={[styles.eyebrowBadge, { backgroundColor: theme.primarySoft }]}>
            <Shield color={RAIL_GREEN} size={16} />
            <Text style={styles.eyebrowText}>{eyebrow}</Text>
          </View>

          <Text role="heading" aria-level={1} style={[styles.title, { color: theme.gold }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>

          {children}

          <View style={styles.trustStrip}>
            {trustItems.map(({ icon: Icon, label }) => (
              <View key={label} style={styles.trustItem}>
                <Icon color={RAIL_GREEN} size={14} />
                <Text style={[styles.trustText, { color: theme.subtle }]}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => router.push('/terms')}>
              <Text style={[styles.footerLink, { color: theme.subtle }]}>Terms</Text>
            </TouchableOpacity>
            <Text style={[styles.footerDot, { color: theme.subtle }]}>&bull;</Text>
            <TouchableOpacity onPress={() => router.push('/privacy')}>
              <Text style={[styles.footerLink, { color: theme.subtle }]}>Privacy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {},
  outerSplit: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },

  shell: { width: '100%' },
  shellSplit: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 1040,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },

  rail: { overflow: 'hidden', backgroundColor: RAIL_BG, position: 'relative' },
  railStacked: { paddingTop: 46, paddingBottom: 22, paddingHorizontal: 20, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: RAIL_GOLD },
  railSplit: { width: '42%', paddingVertical: 48, paddingHorizontal: 38, justifyContent: 'center', gap: 18 },

  railGlow: { position: 'absolute', borderRadius: 999, opacity: 0.16 },
  railGlowGold: { width: 220, height: 220, backgroundColor: RAIL_GOLD, top: -120, left: -60 },
  railGlowGreen: { width: 200, height: 200, backgroundColor: RAIL_GREEN, bottom: -110, right: -70 },

  heroLogo: { width: 190, height: 198, marginBottom: 14 },
  heroLogoCompact: { width: 96, height: 100, marginBottom: 10 },

  railHeadline: { fontSize: 26, fontWeight: '800', color: RAIL_TEXT, lineHeight: 33 },
  railHeadlineAccent: { color: RAIL_GOLD },
  railLede: { fontSize: 14, color: RAIL_MUTED, lineHeight: 21, maxWidth: 320 },

  badgeRow: { gap: 10, marginTop: 6 },
  badgeRowCompact: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: RAIL_BG_ALT, borderWidth: 1, borderColor: RAIL_BORDER,
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start',
  },
  badgeText: { color: RAIL_TEXT, fontSize: 12.5, fontWeight: '700' },

  card: { padding: 24, position: 'relative', overflow: 'hidden' },
  cardSplit: { width: '58%', justifyContent: 'center' },

  backBtn: { position: 'absolute', top: 18, left: 16, zIndex: 2, padding: 4 },

  eyebrowBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginBottom: 20, paddingVertical: 8, backgroundColor: RAIL_GREEN_SOFT, borderRadius: 8,
  },
  eyebrowText: { color: RAIL_GREEN, fontSize: 12, fontWeight: '600' },

  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },

  trustStrip: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 24, flexWrap: 'wrap' },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontSize: 11, fontWeight: '500' },

  footerLinks: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16 },
  footerLink: { fontSize: 12 },
  footerDot: { fontSize: 12 },
});
