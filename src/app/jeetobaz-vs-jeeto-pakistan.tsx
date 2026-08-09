import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import {
  Award,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Gift,
  LockKeyhole,
  PackageCheck,
  Radio,
  Scale,
  ShieldCheck,
  Smartphone,
  Ticket,
  TicketCheck,
  Tv,
  UserPlus,
  UserRound,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { breadcrumbSchema, pageSchema } from '@/lib/structured-data';
import { useSafeBack } from '@/lib/safe-back';

// Reframed as "different formats", not a feature-by-feature score -- a TV game show and a digital
// platform aren't the same kind of product, so claiming JeetoBaz "wins" every row would be both
// misleading and (for anything about Jeeto Pakistan we can't verify) a risky claim about a
// competitor. Every Jeeto Pakistan cell here only states its known format, never an absence.
const COMPARISON_ROWS = [
  { feature: 'Format', jeetobaz: 'Digital prize-draw platform', jeetoPakistan: 'Television game show' },
  { feature: 'How You Participate', jeetobaz: 'Enter eligible draws through your online account', jeetoPakistan: 'Live studio audience and selected viewer/phone-in participation' },
  { feature: 'Entry Tracking', jeetobaz: 'View your entries and participation history in your account', jeetoPakistan: "Part of the TV show's live format" },
  { feature: 'Draw / Winner Process', jeetobaz: 'Scheduled draw; winning entry selected by the system', jeetoPakistan: 'Prizes awarded through on-air games and segments' },
  { feature: 'Winner Records', jeetobaz: 'Winner records published with privacy masking', jeetoPakistan: "Winners shown or announced within the show's episodes" },
  { feature: 'Digital Certificate', jeetobaz: 'Downloadable winner certificate for eligible winners', jeetoPakistan: 'No equivalent feature in the show format' },
  { feature: 'Account & Profile', jeetobaz: 'Manage your profile, entries, and history in one account', jeetoPakistan: 'Not part of the TV show format' },
] as const;

const DIFFERENTIATORS = [
  { icon: Smartphone, color: '#4a9eff', title: 'Digital First', text: 'Entry to winner verification — the whole experience happens inside one digital platform.' },
  { icon: TicketCheck, color: '#18a663', title: 'Track Your Entry', text: 'View your entries, ticket numbers, and status any time from My Entries.' },
  { icon: Radio, color: '#F59E0B', title: 'Draw Transparency', text: 'Draw details are presented in a clear, structured format you can review.' },
  { icon: ShieldCheck, color: '#EC4899', title: 'Winner Verification', text: 'Winner information and the verification process are shown clearly.' },
  { icon: Award, color: '#FFD700', title: 'Digital Certificate', text: 'Eligible winners can download a digital winner certificate.' },
  { icon: UserRound, color: '#8B5CF6', title: 'One Account', text: 'Profile, entries, notifications, and history all live in a single account.' },
] as const;

const TIMELINE_STEPS = [
  { icon: UserPlus, label: 'Create Account' },
  { icon: Gift, label: 'Select Prize' },
  { icon: Ticket, label: 'Complete Entry' },
  { icon: TicketCheck, label: 'Receive Entry/Ticket' },
  { icon: Radio, label: 'Draw Takes Place' },
  { icon: ShieldCheck, label: 'Winner Verification' },
  { icon: PackageCheck, label: 'Prize Claim' },
] as const;

const SCREENSHOTS = [
  { source: require('@/assets/images/vs-jeeto-pakistan/discover-prizes.png'), title: 'Discover Prizes', caption: 'Explore premium prizes' },
  { source: require('@/assets/images/vs-jeeto-pakistan/my-entries.png'), title: 'My Entries', caption: 'Track your entries & tickets' },
  { source: require('@/assets/images/vs-jeeto-pakistan/live-draw.png'), title: 'Live Draw', caption: 'Watch live draw with proof' },
  { source: require('@/assets/images/vs-jeeto-pakistan/winner-certificate.png'), title: 'Winner Certificate', caption: 'Download digital certificate' },
] as const;

const SCREENSHOT_ASPECT_RATIO = 941 / 1672;

const TRUST_POINTS = [
  { icon: LockKeyhole, color: '#18a663', title: 'Secure Accounts', text: 'Your account is protected with modern security practices.' },
  { icon: ShieldCheck, color: '#4a9eff', title: 'Protected User Data', text: 'We don’t share your personal information.' },
  { icon: TicketCheck, color: '#F59E0B', title: 'Verified Information', text: 'Entries, draws, and winners are properly recorded.' },
  { icon: ClipboardList, color: '#EC4899', title: 'Transparent Records', text: 'Draw and winner records are kept and can be reviewed.' },
  { icon: Scale, color: '#8B5CF6', title: 'Responsible Participation', text: 'We promote fair and responsible participation.' },
  { icon: Award, color: '#FFD700', title: 'Clear Terms', text: 'Read the full Terms & Conditions before entering.' },
] as const;

const FAQS = [
  {
    question: 'Is JeetoBaz the same as Jeeto Pakistan?',
    answer: 'No. JeetoBaz is an independent digital prize-draw platform and Jeeto Pakistan is a television game show. They are not related.',
  },
  {
    question: 'Is JeetoBaz affiliated with ARY Digital?',
    answer: 'No. JeetoBaz has no affiliation with ARY Digital or Jeeto Pakistan.',
  },
  {
    question: 'How are JeetoBaz winners selected?',
    answer: 'Eligible approved entries are included in the scheduled draw, and the JeetoBaz system randomly selects the winning entry. The draw result is recorded by the system and may be presented through the JeetoBaz website, app, or official social channels.',
  },
  {
    question: 'Can I track my entries?',
    answer: 'Yes. Open My Entries from your account to view your participation and entry history.',
  },
  {
    question: 'How does JeetoBaz differ from Jeeto Pakistan?',
    answer: 'JeetoBaz is a digital prize-draw platform, while Jeeto Pakistan is a television game show featuring live-audience games, segments, and viewer participation.',
  },
  {
    question: 'Can I download a winner certificate?',
    answer: 'Yes, eligible winners can download their certificate from the Winner Certificate section.',
  },
  {
    question: 'Where can I see previous winners?',
    answer: 'Visit the Past Winners page to see published winner records.',
  },
] as const;

const PAGE_TITLE = 'JeetoBaz VS Jeeto Pakistan';
const PAGE_DESCRIPTION = 'How JeetoBaz, a digital prize-draw platform, differs from Jeeto Pakistan, a television game show — format, participation, draws, and winner verification compared.';

type Theme = ReturnType<typeof useAppTheme>['theme'];

export default function JeetoBazVsJeetoPakistanScreen() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const goBack = useSafeBack();
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const schema = pageSchema('WebPage', '/jeetobaz-vs-jeeto-pakistan', PAGE_TITLE, PAGE_DESCRIPTION);
  const breadcrumb = breadcrumbSchema([{ name: PAGE_TITLE, path: '/jeetobaz-vs-jeeto-pakistan' }]);
  const faqSchema = pageSchema('FAQPage', '/jeetobaz-vs-jeeto-pakistan', PAGE_TITLE, PAGE_DESCRIPTION);
  faqSchema.mainEntity = FAQS.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  }));

  const screenshotColumns = isMobile ? 2 : 4;

  return (
    <>
    <Head>
      <title>{PAGE_TITLE} | JeetoBaz</title>
      <meta name="robots" content="index, follow" />
      <meta name="description" content={PAGE_DESCRIPTION} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={`${PAGE_TITLE} | JeetoBaz`} />
      <meta property="og:description" content={PAGE_DESCRIPTION} />
      <meta property="og:url" content="https://jeetobaz.pk/jeetobaz-vs-jeeto-pakistan" />
      <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
      <meta property="og:image:alt" content="JeetoBaz — Pakistan's trusted prize draw platform" />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta property="og:locale" content="en_PK" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content={`${PAGE_TITLE} | JeetoBaz`} />
      <meta name="twitter:description" content={PAGE_DESCRIPTION} />
      <meta name="twitter:image" content="https://jeetobaz.pk/twitter-image.png" />
      <link rel="canonical" href="https://jeetobaz.pk/jeetobaz-vs-jeeto-pakistan" />
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
    </Head>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Back">
          <ChevronRight color={theme.primary} size={20} style={styles.backIconFlip} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text role="heading" aria-level={1} style={styles.heroTitle}>
          JEETOBAZ <Text style={styles.heroTitleMuted}>VS</Text> JEETO PAKISTAN
        </Text>
        <Text style={styles.heroSubtitle}>Different formats. Different experiences.</Text>
        <Text style={styles.heroText}>
          JeetoBaz is a digital prize-draw platform where entries, draw information, winners, and
          verification are all managed through one online experience.
        </Text>
        <View style={[styles.heroButtons, isMobile && styles.heroButtonsMobile]}>
          <Link href="/" asChild>
            <TouchableOpacity style={styles.primaryButton} accessibilityRole="link">
              <Text style={styles.primaryButtonText}>Explore JeetoBaz</Text>
            </TouchableOpacity>
          </Link>
          <Link href={{ pathname: '/about', params: { section: 'works' } } as never} asChild>
            <TouchableOpacity style={styles.secondaryButton} accessibilityRole="link">
              <Text style={styles.secondaryButtonText}>How It Works</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* Two Different Experiences */}
      <SectionTitle theme={theme}>Two Different Experiences</SectionTitle>
      <View style={[styles.experienceRow, isMobile && styles.experienceRowMobile]}>
        <View style={[styles.experienceCard, { borderColor: theme.border }]}>
          <Tv color={theme.subtle} size={30} />
          <Text style={styles.experienceTitle}>Jeeto Pakistan</Text>
          <Text style={styles.experienceSubtitle}>Television Game Show</Text>
          <View style={styles.experienceList}>
            <ExperienceLine theme={theme}>Television broadcast format</ExperienceLine>
            <ExperienceLine theme={theme}>Live studio audience</ExperienceLine>
            <ExperienceLine theme={theme}>Games and segments</ExperienceLine>
            <ExperienceLine theme={theme}>Viewer/phone-in participation</ExperienceLine>
          </View>
        </View>

        <View style={styles.vsBadge}>
          <Text style={styles.vsBadgeText}>VS</Text>
        </View>

        <View style={[styles.experienceCard, styles.experienceCardBrand, { borderColor: theme.gold }]}>
          <Smartphone color={theme.gold} size={30} />
          <Text style={[styles.experienceTitle, { color: theme.gold }]}>JeetoBaz</Text>
          <Text style={styles.experienceSubtitle}>Digital Prize Platform</Text>
          <View style={styles.experienceList}>
            <ExperienceLine theme={theme}>Web &amp; mobile experience</ExperienceLine>
            <ExperienceLine theme={theme}>Online account &amp; entry history</ExperienceLine>
            <ExperienceLine theme={theme}>Draw information &amp; records</ExperienceLine>
            <ExperienceLine theme={theme}>Digital winner certificate</ExperienceLine>
          </View>
        </View>
      </View>

      {/* Feature Comparison */}
      <SectionTitle theme={theme}>Feature Comparison</SectionTitle>
      {isMobile ? (
        <View style={styles.comparisonStack}>
          {COMPARISON_ROWS.map((row) => (
            <View key={row.feature} style={[styles.comparisonCard, { borderColor: theme.border }]}>
              <Text style={styles.comparisonFeature}>{row.feature}</Text>
              <View style={styles.comparisonCardRow}>
                <Text style={[styles.comparisonBadge, { color: theme.gold, borderColor: theme.gold }]}>JeetoBaz</Text>
                <Text style={styles.comparisonValue}>{row.jeetobaz}</Text>
              </View>
              <View style={styles.comparisonCardRow}>
                <Text style={[styles.comparisonBadge, { color: theme.subtle, borderColor: theme.border }]}>Jeeto Pakistan</Text>
                <Text style={styles.comparisonValueMuted}>{row.jeetoPakistan}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={[styles.table, { borderColor: theme.border }]}>
          <View style={[styles.tableRow, styles.tableHeaderRow, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
            <Text style={[styles.tableCell, styles.tableFeatureCell, styles.tableHeaderText]}>Feature</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText, { color: theme.gold }]}>JeetoBaz</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>Jeeto Pakistan</Text>
          </View>
          {COMPARISON_ROWS.map((row, index) => (
            <View
              key={row.feature}
              style={[
                styles.tableRow,
                { borderColor: theme.border, backgroundColor: index % 2 === 0 ? theme.surface : theme.background },
              ]}
            >
              <Text style={[styles.tableCell, styles.tableFeatureCell, styles.tableFeatureText]}>{row.feature}</Text>
              <Text style={[styles.tableCell, styles.tableValueText, { color: theme.text }]}>{row.jeetobaz}</Text>
              <Text style={[styles.tableCell, styles.tableValueText, { color: theme.muted }]}>{row.jeetoPakistan}</Text>
            </View>
          ))}
        </View>
      )}

      {/* What Makes JeetoBaz Different */}
      <SectionTitle theme={theme}>What Makes JeetoBaz Different?</SectionTitle>
      <View style={styles.differentiatorGrid}>
        {DIFFERENTIATORS.map((item, index) => (
          <View key={item.title} style={[styles.differentiatorCard, { borderColor: theme.border }, isMobile && styles.differentiatorCardMobile]}>
            <View style={styles.differentiatorHeader}>
              <Text style={styles.differentiatorIndex}>{String(index + 1).padStart(2, '0')}</Text>
              <item.icon color={item.color} size={22} />
            </View>
            <Text style={styles.differentiatorTitle}>{item.title}</Text>
            <Text style={styles.differentiatorText}>{item.text}</Text>
          </View>
        ))}
      </View>

      {/* From Entry to Winner */}
      <SectionTitle theme={theme}>From Entry to Winner</SectionTitle>
      <View style={styles.timeline}>
        {TIMELINE_STEPS.map((step, index) => (
          <View key={step.label} style={styles.timelineStep}>
            <View style={styles.timelineNode}>
              <View style={[styles.timelineCircle, { borderColor: theme.gold }]}>
                <step.icon color={theme.gold} size={20} />
              </View>
              <Text style={styles.timelineNumber}>{String(index + 1).padStart(2, '0')}</Text>
            </View>
            <Text style={styles.timelineLabel}>{step.label}</Text>
          </View>
        ))}
      </View>

      {/* See JeetoBaz in Action */}
      <SectionTitle theme={theme}>See JeetoBaz in Action</SectionTitle>
      <View style={[styles.screenshotGrid, { flexBasis: `${100 / screenshotColumns}%` as never }]}>
        {SCREENSHOTS.map((shot) => (
          <View key={shot.title} style={[styles.screenshotCard, { width: `${100 / screenshotColumns}%` as never }]}>
            <View style={[styles.screenshotFrame, { borderColor: theme.border, aspectRatio: SCREENSHOT_ASPECT_RATIO }]}>
              <Image source={shot.source} style={styles.screenshotImage} contentFit="cover" accessibilityLabel={`${shot.title} screen`} />
            </View>
            <Text style={styles.screenshotTitle}>{shot.title}</Text>
            <Text style={styles.screenshotCaption}>{shot.caption}</Text>
          </View>
        ))}
      </View>

      {/* Trust */}
      <SectionTitle theme={theme}>Built Around Transparency</SectionTitle>
      <View style={styles.trustGrid}>
        {TRUST_POINTS.map((item) => (
          <View key={item.title} style={[styles.trustCard, { borderColor: theme.border }, isMobile && styles.trustCardMobile]}>
            <item.icon color={item.color} size={20} />
            <View style={styles.trustCopy}>
              <Text style={styles.trustTitle}>{item.title}</Text>
              <Text style={styles.trustText}>{item.text}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* FAQ */}
      <SectionTitle theme={theme}>Frequently Asked Questions</SectionTitle>
      <View style={styles.faqList}>
        {FAQS.map((item) => {
          const expanded = openFaq === item.question;
          return (
            <View key={item.question} style={[styles.faqCard, { borderColor: expanded ? theme.gold : theme.border }]}>
              <TouchableOpacity
                style={styles.faqQuestionRow}
                onPress={() => setOpenFaq(expanded ? null : item.question)}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
              >
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <ChevronDown color={theme.gold} size={19} style={expanded ? undefined : styles.faqChevronClosed} />
              </TouchableOpacity>
              <View style={[styles.faqAnswerBox, { borderColor: theme.border }, !expanded && styles.faqAnswerHidden]}>
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Disclaimer */}
      <View style={[styles.disclaimerBox, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
        <Text style={styles.disclaimerTitle}>Comparison Disclaimer</Text>
        <Text style={styles.disclaimerText}>
          This page compares JeetoBaz, a digital prize-draw platform, with Jeeto Pakistan, a
          television game show, to help visitors understand the differences between their formats
          and participation experiences. JeetoBaz is independently operated and is not affiliated
          with, sponsored by, endorsed by, or connected to Jeeto Pakistan, ARY Digital, or their
          respective owners/operators. All third-party names, trademarks, and logos referenced
          belong to their respective owners.
        </Text>
      </View>

      {/* CTA */}
      <View style={[styles.ctaBox, { backgroundColor: theme.surface, borderColor: theme.gold }]}>
        <Text style={styles.ctaTitle}>Ready to experience JeetoBaz?</Text>
        <Text style={styles.ctaText}>Participate responsibly. Review the eligibility requirements and Terms &amp; Conditions before entering.</Text>
        <View style={[styles.ctaButtons, isMobile && styles.heroButtonsMobile]}>
          <Link href="/" asChild>
            <TouchableOpacity style={styles.primaryButton} accessibilityRole="link">
              <Text style={styles.primaryButtonText}>Explore Prizes</Text>
            </TouchableOpacity>
          </Link>
          <Link href={{ pathname: '/about', params: { section: 'works' } } as never} asChild>
            <TouchableOpacity style={styles.secondaryButton} accessibilityRole="link">
              <Text style={styles.secondaryButtonText}>How JeetoBaz Works</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
    </>
  );
}

function SectionTitle({ children, theme }: { children: string; theme: Theme }) {
  return (
    <View style={sharedStyles.sectionTitleWrap}>
      <Text style={[sharedStyles.sectionTitle, { color: theme.gold }]}>{children}</Text>
      <View style={[sharedStyles.sectionTitleUnderline, { backgroundColor: theme.gold }]} />
    </View>
  );
}

function ExperienceLine({ children, theme }: { children: string; theme: Theme }) {
  return (
    <View style={sharedStyles.experienceLineRow}>
      <View style={[sharedStyles.experienceDot, { backgroundColor: theme.primary }]} />
      <Text style={[sharedStyles.experienceLineText, { color: theme.muted }]}>{children}</Text>
    </View>
  );
}

const sharedStyles = StyleSheet.create({
  sectionTitleWrap: { alignItems: 'center', marginTop: 44, marginBottom: 20 },
  sectionTitle: { fontSize: 21, fontWeight: '800', textAlign: 'center' },
  sectionTitleUnderline: { width: 46, height: 3, borderRadius: 2, marginTop: 8 },
  experienceLineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  experienceDot: { width: 6, height: 6, borderRadius: 3 },
  experienceLineText: { fontSize: 13, lineHeight: 19 },
});

function createStyles(theme: Theme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    content: { paddingBottom: 60 },
    header: { minHeight: 60, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
    backIconFlip: { transform: [{ scaleX: -1 }] },
    backText: { color: theme.primary, fontSize: 15, fontWeight: '700' },
    headerSpacer: { width: 60 },

    hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
    heroTitle: { color: theme.gold, fontSize: 26, fontWeight: '900', textAlign: 'center', letterSpacing: 0.3 },
    heroTitleMuted: { color: theme.subtle },
    heroSubtitle: { color: theme.primary, fontSize: 16, fontWeight: '700', marginTop: 10, textAlign: 'center' },
    heroText: { color: theme.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 620, marginTop: 12 },
    heroButtons: { flexDirection: 'row', gap: 12, marginTop: 22 },
    heroButtonsMobile: { flexDirection: 'column', width: '100%', maxWidth: 320 },
    primaryButton: { backgroundColor: theme.gold, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 24, alignItems: 'center' },
    primaryButtonText: { color: theme.buttonText, fontWeight: '800', fontSize: 14 },
    secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 24, alignItems: 'center' },
    secondaryButtonText: { color: theme.text, fontWeight: '700', fontSize: 14 },

    experienceRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, maxWidth: 900, alignSelf: 'center', width: '100%' },
    experienceRowMobile: { flexDirection: 'column' },
    experienceCard: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 20, backgroundColor: theme.surface, gap: 6 },
    experienceCardBrand: { backgroundColor: theme.primarySoft },
    experienceTitle: { color: theme.text, fontSize: 18, fontWeight: '800', marginTop: 8 },
    experienceSubtitle: { color: theme.muted, fontSize: 13, marginBottom: 10 },
    experienceList: { gap: 8 },
    vsBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.surfaceAlt, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
    vsBadgeText: { color: theme.gold, fontWeight: '900', fontSize: 13 },

    comparisonStack: { paddingHorizontal: 16, gap: 12 },
    comparisonCard: { borderWidth: 1, borderRadius: 14, padding: 16, backgroundColor: theme.surface, gap: 10 },
    comparisonFeature: { color: theme.gold, fontSize: 14, fontWeight: '800', marginBottom: 2 },
    comparisonCardRow: { gap: 4 },
    comparisonBadge: { alignSelf: 'flex-start', fontSize: 11, fontWeight: '800', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, textTransform: 'uppercase' },
    comparisonValue: { color: theme.text, fontSize: 13, lineHeight: 19 },
    comparisonValueMuted: { color: theme.muted, fontSize: 13, lineHeight: 19 },

    table: { marginHorizontal: 20, borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1 },
    tableHeaderRow: { borderBottomWidth: 2 },
    tableCell: { flex: 1, paddingVertical: 14, paddingHorizontal: 14, fontSize: 13 },
    tableFeatureCell: { flex: 0.8 },
    tableHeaderText: { color: theme.text, fontWeight: '800', fontSize: 13 },
    tableFeatureText: { color: theme.gold, fontWeight: '700' },
    tableValueText: { lineHeight: 19 },

    differentiatorGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 12, justifyContent: 'center' },
    differentiatorCard: { width: 260, borderWidth: 1, borderRadius: 14, padding: 18, backgroundColor: theme.surface, gap: 8 },
    differentiatorCardMobile: { width: '100%' },
    differentiatorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    differentiatorIndex: { color: theme.subtle, fontSize: 12, fontWeight: '800' },
    differentiatorTitle: { color: theme.text, fontSize: 15, fontWeight: '800' },
    differentiatorText: { color: theme.muted, fontSize: 13, lineHeight: 19 },

    timeline: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 20, gap: 18, rowGap: 22 },
    timelineStep: { alignItems: 'center', width: 96 },
    timelineNode: { alignItems: 'center' },
    timelineCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface },
    timelineNumber: { color: theme.subtle, fontSize: 11, fontWeight: '800', marginTop: 5 },
    timelineLabel: { color: theme.muted, fontSize: 12, textAlign: 'center', marginTop: 4, lineHeight: 16 },

    screenshotGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
    screenshotCard: { padding: 8, alignItems: 'center' },
    screenshotFrame: { width: '100%', borderWidth: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: theme.surface },
    screenshotImage: { width: '100%', height: '100%' },
    screenshotTitle: { color: theme.text, fontSize: 13, fontWeight: '800', marginTop: 10, textAlign: 'center' },
    screenshotCaption: { color: theme.subtle, fontSize: 11, marginTop: 2, textAlign: 'center' },

    trustGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 12, justifyContent: 'center' },
    trustCard: { width: 300, borderWidth: 1, borderRadius: 14, padding: 16, backgroundColor: theme.surface, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    trustCardMobile: { width: '100%' },
    trustCopy: { flex: 1 },
    trustTitle: { color: theme.text, fontSize: 14, fontWeight: '800' },
    trustText: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },

    faqList: { marginHorizontal: 16, gap: 10 },
    faqCard: { borderWidth: 1, borderRadius: 13, overflow: 'hidden', backgroundColor: theme.surface },
    faqQuestionRow: { minHeight: 60, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    faqQuestion: { flex: 1, color: theme.text, fontSize: 14, fontWeight: '700', lineHeight: 20 },
    faqChevronClosed: { transform: [{ rotate: '-90deg' }] },
    faqAnswerBox: { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
    faqAnswerHidden: { display: 'none' },
    faqAnswer: { color: theme.muted, fontSize: 13, lineHeight: 20 },

    disclaimerBox: { marginHorizontal: 20, marginTop: 44, borderWidth: 1, borderRadius: 14, padding: 18 },
    disclaimerTitle: { color: theme.gold, fontSize: 13, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
    disclaimerText: { color: theme.muted, fontSize: 12, lineHeight: 19 },

    ctaBox: { marginHorizontal: 20, marginTop: 30, borderWidth: 1, borderRadius: 18, padding: 26, alignItems: 'center' },
    ctaTitle: { color: theme.gold, fontSize: 19, fontWeight: '800', textAlign: 'center' },
    ctaText: { color: theme.muted, fontSize: 13, textAlign: 'center', marginTop: 8, marginBottom: 18, maxWidth: 480 },
    ctaButtons: { flexDirection: 'row', gap: 12 },
  });
}
