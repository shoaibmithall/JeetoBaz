import { Image, Text, TouchableOpacity, View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Lock, Shield, ShieldCheck } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { DEFAULT_TRUST_BADGES, getTrustBadges } from '@/lib/app-settings';

// The brand rail is a deliberate, theme-independent choice -- it stays this black/gold treatment
// in both light and dark app mode, because that's where the gold logo mark reads best. Only the
// form card (children) follows the app's light/dark theme. RAIL_BG is JeetoBaz's own dark-theme
// background token (AppThemes.dark.background in constants/theme.ts), not an arbitrary black --
// it reads as near-black but carries the brand's established dark tone.
const RAIL_BG = '#020d09';
const RAIL_TEXT = '#f5f7f4';
const RAIL_MUTED = '#9aac9f';
const RAIL_GOLD = '#FFD700';
const RAIL_GOLD_BORDER = 'rgba(255,215,0,0.35)';
const RAIL_GREEN = '#18a663';
const RAIL_GREEN_SOFT = 'rgba(24,166,99,0.14)';

// The logo asset's real aspect ratio (height/width), so it scales without distortion at any size.
const LOGO_ASPECT_RATIO = 742 / 635;

const SPLIT_BREAKPOINT = 760;

// Fixed (not random) positions for the rail's decorative gold bokeh blobs and sparkle dots, in a
// 400x700 virtual canvas that the backdrop SVG scales/crops to cover the rail at any real size.
// Kept as static data so the texture is stable across renders instead of reshuffling.
const BOKEH_BLOBS = [
  { x: 90, y: 110, r: 95 },
  { x: 330, y: 70, r: 60 },
  { x: 55, y: 540, r: 100 },
  { x: 350, y: 610, r: 75 },
  { x: 205, y: 330, r: 140 },
];

const SPARKLES = [
  { x: 40, y: 55, r: 1.6 }, { x: 135, y: 35, r: 1.2 }, { x: 255, y: 65, r: 1.8 },
  { x: 355, y: 125, r: 1.3 }, { x: 65, y: 245, r: 1.5 }, { x: 335, y: 275, r: 1.4 },
  { x: 150, y: 445, r: 1.6 }, { x: 285, y: 495, r: 1.2 }, { x: 45, y: 600, r: 1.5 },
  { x: 375, y: 645, r: 1.3 }, { x: 205, y: 195, r: 1.4 }, { x: 110, y: 660, r: 1.5 },
];

// The rail's dark-luxury texture -- soft green depth glow, low-opacity gold bokeh, and a scatter
// of tiny sparkle dots -- built entirely from SVG gradients/shapes rather than a bitmap asset, so
// it scales cleanly to any rail size without needing an uploaded background image.
function RailBackdrop() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="depth" cx="50%" cy="12%" r="80%">
          <Stop offset="0%" stopColor={RAIL_GREEN} stopOpacity={0.14} />
          <Stop offset="100%" stopColor={RAIL_GREEN} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="bokeh" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={RAIL_GOLD} stopOpacity={0.14} />
          <Stop offset="55%" stopColor={RAIL_GOLD} stopOpacity={0.045} />
          <Stop offset="100%" stopColor={RAIL_GOLD} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={400} height={700} fill="url(#depth)" />
      {BOKEH_BLOBS.map((b, i) => (
        <Circle key={i} cx={b.x} cy={b.y} r={b.r} fill="url(#bokeh)" />
      ))}
      {SPARKLES.map((s, i) => (
        <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill={RAIL_GOLD} opacity={0.35} />
      ))}
    </Svg>
  );
}

// A thin gold "picture frame" corner bracket -- purely decorative, mirrored for the two corners.
function CornerFlourish({ corner }: { corner: 'top-right' | 'bottom-left' }) {
  const d = corner === 'top-right'
    ? 'M14 4 H42 Q52 4 52 14 V42'
    : 'M42 52 H14 Q4 52 4 42 V14';
  return (
    <Svg
      width={56}
      height={56}
      viewBox="0 0 56 56"
      style={[styles.cornerFlourish, corner === 'top-right' ? styles.cornerTopRight : styles.cornerBottomLeft]}
    >
      <Path d={d} stroke={RAIL_GOLD} strokeWidth={1.5} strokeOpacity={0.55} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

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
          <RailBackdrop />
          {isSplit && <CornerFlourish corner="top-right" />}
          {isSplit && <CornerFlourish corner="bottom-left" />}
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
          {isSplit && (
            <View style={styles.railFooter}>
              <View style={styles.railFooterRow}>
                <Shield color={RAIL_MUTED} size={11} />
                <Text style={styles.railFooterText}>Secure Platform</Text>
              </View>
              <View style={styles.railFooterRow}>
                <Lock color={RAIL_MUTED} size={11} />
                <Text style={styles.railFooterText}>Your data is protected</Text>
              </View>
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, isSplit && styles.cardSplit]}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
              <ChevronLeft color={theme.text} size={22} />
            </TouchableOpacity>
          )}
          <Image
            source={require('@/assets/images/icon-small.png')}
            style={styles.cardBadgeIcon}
            resizeMode="contain"
            accessibilityLabel="JeetoBaz"
          />
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

  rail: { backgroundColor: RAIL_BG, overflow: 'hidden' },
  railStacked: { paddingTop: 46, paddingBottom: 22, paddingHorizontal: 20, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: RAIL_GOLD },
  railSplit: { width: '42%', paddingVertical: 48, paddingHorizontal: 38, alignItems: 'center', justifyContent: 'center' },

  railTagline: { fontSize: 13, color: RAIL_MUTED, textAlign: 'center', lineHeight: 19, marginBottom: 18, maxWidth: 260 },

  badgeRow: { alignItems: 'center', gap: 8 },
  badgeRowCompact: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  badgeText: { color: RAIL_TEXT, fontSize: 12.5, fontWeight: '600' },

  cornerFlourish: { position: 'absolute' },
  cornerTopRight: { top: 14, right: 14 },
  cornerBottomLeft: { bottom: 14, left: 14 },

  railFooter: { position: 'absolute', bottom: 26, left: 38, gap: 6 },
  railFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  railFooterText: { color: RAIL_MUTED, fontSize: 11 },

  card: { padding: 24, position: 'relative', overflow: 'hidden' },
  cardSplit: { width: '58%', justifyContent: 'center' },

  backBtn: { position: 'absolute', top: 18, left: 16, zIndex: 2, padding: 4 },

  cardBadgeIcon: { width: 52, height: 52, borderRadius: 13, alignSelf: 'center', marginBottom: 16 },

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
