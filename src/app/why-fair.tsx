import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import {
  Award,
  Bell,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Dices,
  EyeOff,
  KeyRound,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UsersRound,
  Wallet,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { breadcrumbSchema, pageSchema } from '@/lib/structured-data';
import { useSafeBack } from '@/lib/safe-back';

const WHY_FAIR_SECTIONS = [
  {
    icon: Dices,
    iconColor: '#18a663',
    title: 'Equal Chance for Every Verified Entry',
    body:
      'Every approved entry has an equal opportunity to be selected.\n\n' +
      '• Every verified entry is counted once.\n' +
      '• No participant receives hidden priority.\n' +
      '• The draw process is based on confirmed entries only.\n' +
      '• Cancelled or unpaid entries are not included.\n\n' +
      'Example: if a campaign has 5,000 verified entries, each approved entry participates according to the published campaign rules.',
  },
  {
    icon: Wallet,
    iconColor: '#F59E0B',
    title: 'Only Verified Payments Are Accepted',
    body:
      'Entries become eligible only after payment verification. This helps prevent:\n\n' +
      '• Fake entries\n' +
      '• Spam registrations\n' +
      '• Duplicate payment abuse\n' +
      '• Invalid participation\n\n' +
      'Until payment is approved, the entry is not included in the draw.',
  },
  {
    icon: ShieldCheck,
    iconColor: '#3B82F6',
    title: 'Real Winners Only',
    body:
      'Before announcing any winner, JeetoBaz verifies the winner’s identity. Verification may include:\n\n' +
      '• Registered mobile number\n' +
      '• CNIC/B-Form (where applicable)\n' +
      '• Payment verification\n' +
      '• Account ownership confirmation\n\n' +
      'This helps ensure prizes are awarded to genuine participants.',
  },
  {
    icon: Bell,
    iconColor: '#FFD700',
    title: 'Winner Announcement',
    body:
      'After a successful draw:\n\n' +
      '• Winner information is published according to platform privacy rules.\n' +
      '• Winners are contacted using their registered phone number or email.\n' +
      '• Prize claim instructions are provided.',
  },
  {
    icon: UsersRound,
    iconColor: '#EC4899',
    title: 'Duplicate Account Protection',
    body:
      'To maintain fairness, JeetoBaz may detect and investigate:\n\n' +
      '• Multiple accounts\n' +
      '• Suspicious activity\n' +
      '• Automated registrations\n' +
      '• Fraud attempts\n\n' +
      'Accounts violating platform rules may be suspended.',
  },
  {
    icon: ClipboardList,
    iconColor: '#8B5CF6',
    title: 'Transparent Campaign Information',
    body:
      'Every campaign clearly displays:\n\n' +
      '• Prize details\n' +
      '• Entry price\n' +
      '• Campaign closing date\n' +
      '• Draw schedule\n' +
      '• Number of available entries (if applicable)\n' +
      '• Terms and conditions\n\n' +
      'Participants know exactly what they are entering.',
  },
  {
    icon: KeyRound,
    iconColor: '#4a9eff',
    title: 'Secure User Accounts',
    body:
      'JeetoBaz protects user accounts through features such as:\n\n' +
      '• OTP verification\n' +
      '• Verified email\n' +
      '• Verified phone number\n' +
      '• Secure authentication\n' +
      '• Encrypted communication\n\n' +
      'Users should never share their OTP or password.',
  },
  {
    icon: Scale,
    iconColor: '#F97316',
    title: 'Clear Rules for Everyone',
    body:
      'Every participant follows the same rules.\n\n' +
      'No hidden conditions. No secret pricing. No private winner selection.\n\n' +
      'All users participate under the published Terms & Conditions.',
  },
  {
    icon: Award,
    iconColor: '#18a663',
    title: 'Fair Prize Distribution',
    body:
      'Every verified winner goes through the same prize claim process. This helps ensure:\n\n' +
      '• Correct identity verification\n' +
      '• Secure prize delivery\n' +
      '• Accurate ownership records',
  },
  {
    icon: ShieldAlert,
    iconColor: '#ff4444',
    title: 'Fraud Prevention',
    body:
      'JeetoBaz actively works to prevent:\n\n' +
      '• Fake payments\n' +
      '• Duplicate entries\n' +
      '• Identity misuse\n' +
      '• Unauthorized prize claims\n' +
      '• Platform abuse\n\n' +
      'Suspicious activity may be reviewed before participation or prize delivery.',
  },
  {
    icon: EyeOff,
    iconColor: '#6366F1',
    title: 'Privacy Protection',
    body:
      'Winner verification documents remain confidential.\n\n' +
      'Sensitive information is never publicly shared except where required by law or with the participant’s consent.',
  },
  {
    icon: TrendingUp,
    iconColor: '#14B8A6',
    title: 'Continuous Improvement',
    body:
      'JeetoBaz regularly improves:\n\n' +
      '• Security\n' +
      '• Verification\n' +
      '• Payment review\n' +
      '• User protection\n' +
      '• Platform reliability\n\n' +
      'Our goal is to make every campaign more transparent and secure.',
  },
] as const;

export default function WhyFairScreen() {
  const router = useRouter();
  const goBack = useSafeBack();
  const { theme } = useAppTheme();
  const [openSection, setOpenSection] = useState<string | null>(WHY_FAIR_SECTIONS[0].title);

  const schema = pageSchema(
    'WebPage',
    '/why-fair',
    'Why JeetoBaz is Fair',
    'How JeetoBaz keeps every prize draw fair and transparent: verified payments, verified winners, equal entry, and a locked, immutable draw process.',
  );
  const breadcrumb = breadcrumbSchema([{ name: 'Why JeetoBaz is Fair', path: '/why-fair' }]);

  return (
    <>
    <Head>
      <title>Why JeetoBaz is Fair | JeetoBaz</title>
      <meta name="robots" content="index, follow" />
      <meta name="description" content="How JeetoBaz keeps every prize draw fair and transparent: verified payments, verified winners, equal entry, and a locked, immutable draw process." />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Why JeetoBaz is Fair | JeetoBaz" />
      <meta property="og:description" content="How JeetoBaz keeps every prize draw fair and transparent, from verified payments to a locked, immutable draw process." />
      <meta property="og:url" content="https://jeetobaz.pk/why-fair" />
      <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
      <meta property="og:image:alt" content="JeetoBaz — Pakistan's trusted prize draw platform" />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta property="og:locale" content="en_PK" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content="Why JeetoBaz is Fair | JeetoBaz" />
      <meta name="twitter:description" content="How JeetoBaz keeps every prize draw fair and transparent, from verified payments to a locked, immutable draw process." />
      <meta name="twitter:image" content="https://jeetobaz.pk/twitter-image.png" />
      <link rel="canonical" href="https://jeetobaz.pk/why-fair" />
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
    </Head>
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <TouchableOpacity onPress={goBack}>
          <Text style={[styles.back, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <ShieldCheck color={theme.gold} size={22} />
          <Text style={[styles.headerTitle, { color: theme.gold }]}>Why JeetoBaz is Fair</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.hero}>
        <Text role="heading" aria-level={1} style={[styles.heroTitle, { color: theme.gold }]}>
          Fair, Transparent &amp; Trusted Prize Campaigns
        </Text>
        <Text style={[styles.heroText, { color: theme.muted }]}>
          Fairness is our highest priority. Every prize campaign is managed using transparent processes, verified payments, and clear winner announcements — so every participant has confidence in the results. Below is exactly how.
        </Text>
      </View>

      <View style={styles.list}>
        {WHY_FAIR_SECTIONS.map((section, index) => {
          const expanded = openSection === section.title;
          const Icon = section.icon;
          return (
            <View
              key={section.title}
              style={[styles.card, { backgroundColor: theme.surface, borderColor: expanded ? theme.gold : theme.border }]}
            >
              <TouchableOpacity
                style={styles.sectionRow}
                onPress={() => setOpenSection(expanded ? null : section.title)}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
              >
                <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
                  <Icon color={section.iconColor} size={20} />
                </View>
                <View style={styles.sectionCopy}>
                  <Text style={[styles.sectionNumber, { color: theme.primary }]}>{String(index + 1).padStart(2, '0')}</Text>
                  <Text style={[styles.sectionTitle, { color: theme.gold }]}>{section.title}</Text>
                </View>
                {expanded ? (
                  <ChevronDown color={theme.gold} size={21} />
                ) : (
                  <ChevronRight color={theme.subtle} size={21} />
                )}
              </TouchableOpacity>
              {/*
                Always mounted, visibility toggled via `display` rather than conditionally
                rendering `null` -- see the same fix applied to the footer and FAQ pages: the
                static export always starts collapsed, so conditional mounting would make this
                entire trust-focused page's real content invisible to crawlers.
              */}
              <View style={[styles.bodyBox, { borderTopColor: theme.border }, !expanded && styles.bodyBoxHidden]}>
                <Text style={[styles.bodyText, { color: theme.muted }]}>{section.body}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={[styles.commitmentCard, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
        <Text style={[styles.commitmentTitle, { color: theme.text }]}>Our Commitment</Text>
        <Text style={[styles.commitmentText, { color: theme.muted }]}>
          JeetoBaz is committed to building a prize platform based on fair participation, transparent campaigns, verified winners, secure payments, user privacy, and responsible operations. Every improvement we make is focused on creating a more trustworthy experience for all participants.
        </Text>
      </View>

      <View style={[styles.ctaCard, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
        <Text style={[styles.ctaTitle, { color: theme.text }]}>See it for yourself</Text>
        <Text style={[styles.ctaText, { color: theme.muted }]}>
          Check any ticket's status, browse every verified past winner, or read our full registration and verification details — no need to just take our word for it.
        </Text>
        <View style={styles.ctaRow}>
          <Link href="/verify-ticket" asChild>
            <TouchableOpacity style={StyleSheet.flatten([styles.ctaButton, { backgroundColor: theme.gold }])} accessibilityRole="link">
              <Text style={styles.ctaButtonText}>Verify a Ticket</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/explore" asChild>
            <TouchableOpacity style={StyleSheet.flatten([styles.ctaSecondaryButton, { borderColor: theme.primary }])} accessibilityRole="link">
              <Text style={[styles.ctaSecondaryButtonText, { color: theme.primary }]}>Past Winners</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <Link href="/registered-verified" asChild>
          <TouchableOpacity accessibilityRole="link">
            <Text style={[styles.registeredLink, { color: theme.primary }]}>See our registration &amp; verification details →</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 40 },
  header: { borderBottomWidth: 2, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { fontSize: 16, fontWeight: '700' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSpacer: { width: 48 },
  hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20 },
  heroTitle: { fontSize: 25, fontWeight: '800', textAlign: 'center' },
  heroText: { fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 640, marginTop: 9 },
  list: { margin: 15, gap: 10 },
  card: { borderWidth: 1, borderRadius: 15, overflow: 'hidden' },
  sectionRow: { minHeight: 74, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionCopy: { flex: 1 },
  sectionNumber: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 3 },
  sectionTitle: { fontSize: 15, fontWeight: '700', lineHeight: 21 },
  bodyBox: { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 16 },
  bodyBoxHidden: { display: 'none' },
  bodyText: { fontSize: 14, lineHeight: 22 },
  commitmentCard: { marginHorizontal: 15, marginTop: 5, borderRadius: 18, padding: 22, borderWidth: 1 },
  commitmentTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  commitmentText: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  ctaCard: { marginHorizontal: 15, marginTop: 15, borderRadius: 18, padding: 22, borderWidth: 1, alignItems: 'center' },
  ctaTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  ctaText: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 16 },
  ctaRow: { flexDirection: 'row', gap: 10, width: '100%' },
  ctaButton: { flex: 1, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaButtonText: { fontSize: 14, fontWeight: '800', color: '#000' },
  ctaSecondaryButton: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ctaSecondaryButtonText: { fontSize: 14, fontWeight: '800' },
  registeredLink: { fontSize: 13, fontWeight: '700', marginTop: 16 },
});
