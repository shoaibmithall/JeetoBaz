import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { BadgeCheck, CreditCard, ShieldCheck, Sparkles } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useAppTheme } from '@/hooks/use-theme';
import { AUTH_BRAND, AUTH_LAYOUT } from '@/constants/auth-theme';

type AuthScreenShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: 'Transparent Draws', detail: 'Fair, open and verifiable results' },
  { icon: CreditCard, label: 'Secure Payments', detail: 'Your payment information stays protected' },
  { icon: BadgeCheck, label: 'Verified Winners', detail: 'Real people, real prizes' },
] as const;

function BrandBackdrop() {
  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height="100%"
      viewBox="0 0 460 760"
      preserveAspectRatio="xMidYMid slice"
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Defs>
        <LinearGradient id="railDepth" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={AUTH_BRAND.emeraldDeep} />
          <Stop offset="0.55" stopColor={AUTH_BRAND.emerald} />
          <Stop offset="1" stopColor="#063326" />
        </LinearGradient>
      </Defs>
      <Rect width="460" height="760" fill="url(#railDepth)" />
      <Circle cx="390" cy="90" r="150" fill={AUTH_BRAND.gold} opacity="0.06" />
      <Circle cx="70" cy="420" r="190" fill="#0E6B4F" opacity="0.14" />
      <Path d="M-20 550 C95 500 175 610 285 548 C370 500 430 515 500 470" fill="none" stroke={AUTH_BRAND.railLine} strokeWidth="1.4" opacity="0.36" />
      <Path d="M-20 578 C105 530 165 628 288 573 C374 535 440 538 500 505" fill="none" stroke={AUTH_BRAND.railLine} strokeWidth="0.9" opacity="0.22" />
      <Path d="M36 98 h42 l14 14 -14 14 h-42 l-14 -14 z" fill="none" stroke={AUTH_BRAND.railLine} strokeWidth="1.4" opacity="0.38" />
      <Path d="M365 270 h54 l12 12 -12 12 h-54 l-12 -12 z" fill="none" stroke={AUTH_BRAND.railLine} strokeWidth="1.3" opacity="0.28" />
      {[{ x: 118, y: 62 }, { x: 320, y: 176 }, { x: 82, y: 318 }, { x: 402, y: 430 }].map((spark) => (
        <Path
          key={`${spark.x}-${spark.y}`}
          d={`M${spark.x} ${spark.y - 7} L${spark.x + 2} ${spark.y - 2} L${spark.x + 7} ${spark.y} L${spark.x + 2} ${spark.y + 2} L${spark.x} ${spark.y + 7} L${spark.x - 2} ${spark.y + 2} L${spark.x - 7} ${spark.y} L${spark.x - 2} ${spark.y - 2} Z`}
          fill={AUTH_BRAND.goldBright}
          opacity="0.55"
        />
      ))}
    </Svg>
  );
}

function PakistanSkyline() {
  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height="92"
      viewBox="0 0 460 92"
      preserveAspectRatio="xMidYMax meet"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path d="M0 86 H460" stroke={AUTH_BRAND.railLine} strokeWidth="1.2" />
      <Path d="M22 86 V61 M18 61 H26 M20 55 H24 M22 34 V55" stroke={AUTH_BRAND.railLine} fill="none" strokeWidth="1.3" />
      <Path d="M44 86 V70 L57 57 L70 70 V86 M51 86 V72 H63 V86 M57 57 V45" stroke={AUTH_BRAND.railLine} fill="none" strokeWidth="1.3" />
      <Path d="M89 86 V58 M83 58 H95 M85 52 H93 M89 25 V52 M80 86 H98" stroke={AUTH_BRAND.railLine} fill="none" strokeWidth="1.3" />
      <Path d="M122 86 V67 L144 51 L166 67 V86 M132 86 V68 H156 V86 M144 51 V39" stroke={AUTH_BRAND.railLine} fill="none" strokeWidth="1.3" />
      <Path d="M201 86 V49 H229 V86 M196 49 H234 M206 49 V39 H224 V49 M210 86 V65 H220 V86" stroke={AUTH_BRAND.railLine} fill="none" strokeWidth="1.3" />
      <Path d="M274 86 V43 M267 43 H281 M270 37 H278 M274 8 V37 M260 86 H288" stroke={AUTH_BRAND.goldBright} fill="none" strokeWidth="1.5" />
      <Path d="M318 86 V61 L338 46 L358 61 V86 M328 86 V65 H348 V86 M338 46 V35" stroke={AUTH_BRAND.railLine} fill="none" strokeWidth="1.3" />
      <Path d="M388 86 V57 H428 V86 M382 57 H434 M394 57 V48 H422 V57 M402 86 V67 H414 V86" stroke={AUTH_BRAND.railLine} fill="none" strokeWidth="1.3" />
      <Path d="M298 25 A15 15 0 1 0 312 39 A12 12 0 1 1 298 25" fill={AUTH_BRAND.goldBright} opacity="0.68" />
      <Circle cx="326" cy="25" r="2" fill={AUTH_BRAND.goldBright} opacity="0.72" />
    </Svg>
  );
}

export function AuthScreenShell({ title, subtitle, children }: AuthScreenShellProps) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const isSplit = width >= AUTH_LAYOUT.splitBreakpoint;

  return (
    <View
      style={[
        styles.outer,
        isSplit ? styles.outerSplit : styles.outerStacked,
        { backgroundColor: theme.background },
      ]}
    >
      <View
        style={[
          styles.shell,
          isSplit ? styles.shellSplit : styles.shellStacked,
          isSplit ? { borderColor: AUTH_BRAND.railBorder } : null,
        ]}
      >
        {isSplit ? (
          <View style={styles.rail}>
            <BrandBackdrop />
            <View style={styles.brandContent}>
              <Image
                source={require('@/assets/images/jeetobaz-logo-official.jpg')}
                style={styles.railLogo}
                resizeMode="cover"
                accessibilityLabel="JeetoBaz logo"
              />
              <Text style={styles.railTagline}>Pakistan&apos;s Transparent Prize Campaign Platform</Text>
              <Text style={styles.railSlogan}>Jeeto Chhota, Jeeto Bada!</Text>

              <View style={styles.trustList}>
                {TRUST_ITEMS.map(({ icon: Icon, label, detail }) => (
                  <View key={label} style={styles.trustItem}>
                    <View style={styles.trustIcon}>
                      <Icon color={AUTH_BRAND.goldBright} size={19} strokeWidth={1.8} />
                    </View>
                    <View style={styles.trustCopy}>
                      <Text style={styles.trustLabel}>{label}</Text>
                      <Text style={styles.trustDetail}>{detail}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.skyline}>
              <PakistanSkyline />
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.formPanel,
            isSplit ? styles.formPanelSplit : styles.formPanelStacked,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {!isSplit ? (
            <View style={styles.mobileBrand}>
              <Image
                source={require('@/assets/images/jeetobaz-logo-official.jpg')}
                style={styles.mobileLogo}
                resizeMode="cover"
                accessibilityLabel="JeetoBaz logo"
              />
              <View style={styles.mobileBrandCopy}>
                <Text style={[styles.mobileBrandName, { color: theme.text }]}>JeetoBaz</Text>
                <Text style={[styles.mobileTagline, { color: theme.muted }]}>Pakistan&apos;s Transparent Prize Platform</Text>
              </View>
            </View>
          ) : null}

          <View style={[styles.securePill, { backgroundColor: theme.primarySoft }]}>
            <ShieldCheck color={theme.primary} size={15} />
            <Text style={[styles.securePillText, { color: theme.primary }]}>Secure account access</Text>
          </View>

          <Text role="heading" aria-level={1} style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>

          {children}

          <View style={styles.formFooter}>
            <Sparkles color={theme.gold} size={13} />
            <Text style={[styles.formFooterText, { color: theme.subtle }]}>Secure • Transparent • Made for Pakistan</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { width: '100%', alignItems: 'center' },
  outerSplit: { minHeight: 700, justifyContent: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  outerStacked: { paddingVertical: 18, paddingHorizontal: 14 },
  shell: { width: '100%' },
  shellSplit: {
    maxWidth: AUTH_LAYOUT.maxWidth,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
    boxShadow: '0 24px 70px rgba(4, 42, 32, 0.18)',
  },
  shellStacked: { maxWidth: AUTH_LAYOUT.mobileMaxWidth },
  rail: { width: '42%', minHeight: 680, backgroundColor: AUTH_BRAND.emerald, overflow: 'hidden', position: 'relative' },
  brandContent: { paddingTop: 44, paddingHorizontal: 40, paddingBottom: 112, alignItems: 'center' },
  railLogo: { width: 174, height: 174, borderRadius: 32, borderCurve: 'continuous', borderWidth: 1, borderColor: AUTH_BRAND.railBorder, marginBottom: 18 },
  railTagline: { maxWidth: 320, color: AUTH_BRAND.railText, textAlign: 'center', fontSize: 15, fontWeight: '700', lineHeight: 22 },
  railSlogan: { color: AUTH_BRAND.goldBright, fontSize: 13, fontWeight: '800', letterSpacing: 0.4, marginTop: 7 },
  trustList: { width: '100%', gap: 15, marginTop: 34 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  trustIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: AUTH_BRAND.railBorder, backgroundColor: 'rgba(255,255,255,0.035)' },
  trustCopy: { flex: 1, minWidth: 0 },
  trustLabel: { color: AUTH_BRAND.railText, fontSize: 14, fontWeight: '800', marginBottom: 2 },
  trustDetail: { color: AUTH_BRAND.railMuted, fontSize: 11.5, lineHeight: 16 },
  skyline: { position: 'absolute', left: 18, right: 18, bottom: 0, opacity: 0.92 },
  formPanel: { position: 'relative' },
  formPanelSplit: { width: '58%', paddingVertical: 42, paddingHorizontal: 52, justifyContent: 'center' },
  formPanelStacked: { borderWidth: 1, borderRadius: 20, borderCurve: 'continuous', paddingVertical: 24, paddingHorizontal: 20, boxShadow: '0 10px 36px rgba(4, 42, 32, 0.10)' },
  mobileBrand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, marginBottom: 20 },
  mobileLogo: { width: 52, height: 52, borderRadius: 13, borderCurve: 'continuous' },
  mobileBrandCopy: { flexShrink: 1 },
  mobileBrandName: { fontSize: 23, fontWeight: '900', letterSpacing: -0.4 },
  mobileTagline: { fontSize: 10.5, lineHeight: 14, marginTop: 1 },
  securePill: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 11, marginBottom: 17 },
  securePillText: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.1 },
  title: { fontSize: 29, fontWeight: '900', letterSpacing: -0.6, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 26 },
  formFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 22 },
  formFooterText: { fontSize: 10.5, fontWeight: '600' },
});
