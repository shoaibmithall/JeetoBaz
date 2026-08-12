import { Image, Text, TouchableOpacity, View, StyleSheet, useWindowDimensions } from 'react-native';
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Shield, ShieldCheck } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { DEFAULT_TRUST_BADGES, getTrustBadges } from '@/lib/app-settings';

// The brand rail is a deliberate, theme-independent choice -- it stays this black/gold treatment
// in both light and dark app mode, because that's where the gold logo mark reads best. Only the
// form card (children) follows the app's light/dark theme.
const RAIL_BG = '#000000';
const RAIL_TEXT = '#f5f7f4';
const RAIL_MUTED = '#9aac9f';
const RAIL_GOLD = '#FFD700';
const RAIL_GOLD_BORDER = 'rgba(255,215,0,0.35)';
const RAIL_GREEN = '#18a663';
const RAIL_GREEN_SOFT = 'rgba(24,166,99,0.14)';

// The logo asset's real aspect ratio (height/width), so it scales without distortion at any size.
const LOGO_ASPECT_RATIO = 742 / 635;

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

  // Fits the logo to a sensible size at every width -- wide enough to read clearly on a large
  // desktop rail, small enough not to crowd the compact mobile header strip.
  const logoWidth = isSplit ? Math.min(200, width * 0.14) : Math.max(84, Math.min(120, width * 0.28));
  const logoHeight = logoWidth * LOGO_ASPECT_RATIO;

  return (
    <View style={[styles.outer, isSplit && styles.outerSplit, { backgroundColor: isSplit ? theme.background : RAIL_BG }]}>
      <View style={[styles.shell, isSplit && styles.shellSplit, isSplit && { borderColor: RAIL_GOLD_BORDER }]}>

        <View style={[styles.rail, isSplit ? styles.railSplit : styles.railStacked]}>
          <Image
            source={require('@/assets/images/jeetobaz-logo-hero.png')}
            style={{ width: logoWidth, height: logoHeight, marginBottom: isSplit ? 18 : 10 }}
            resizeMode="contain"
            accessibilityLabel="JeetoBaz"
          />
          <Text style={styles.railTagline}>Pakistan's Transparent Prize Campaign Platform</Text>
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

  rail: { backgroundColor: RAIL_BG },
  railStacked: { paddingTop: 46, paddingBottom: 22, paddingHorizontal: 20, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: RAIL_GOLD },
  railSplit: { width: '42%', paddingVertical: 48, paddingHorizontal: 38, alignItems: 'center', justifyContent: 'center' },

  railTagline: { fontSize: 13, color: RAIL_MUTED, textAlign: 'center', lineHeight: 19, marginBottom: 18, maxWidth: 260 },

  badgeRow: { alignItems: 'center', gap: 8 },
  badgeRowCompact: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  badgeText: { color: RAIL_TEXT, fontSize: 12.5, fontWeight: '600' },

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
