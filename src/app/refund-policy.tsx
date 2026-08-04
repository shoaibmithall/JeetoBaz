import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import {
  Ban,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  FileWarning,
  Headphones,
  IdCard,
  Info,
  RefreshCw,
  RotateCcw,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Wallet,
  XCircle,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { pageSchema } from '@/lib/structured-data';

const REFUND_FAQS = [
  {
    category: 'Overview',
    icon: Info,
    iconColor: '#3B82F6',
    question: 'Introduction',
    answer:
      "Welcome to JeetoBaz. JeetoBaz is a transparent and verified fair draw platform where users can participate in prize draws by purchasing eligible entries. This Refund & Cancellation Policy explains when refunds may be issued, when cancellations are allowed, and how payment-related issues are handled.\n\nBy using JeetoBaz, creating an account, purchasing an entry, or participating in any draw, you agree to this Refund & Cancellation Policy together with our Terms & Conditions and Privacy Policy.",
  },
  {
    category: 'Overview',
    icon: FileText,
    iconColor: '#14B8A6',
    question: 'Purpose of this Policy',
    answer:
      'This policy is designed to:\n• Protect all participants equally\n• Maintain fairness and transparency\n• Prevent fraudulent refund requests\n• Explain eligible refund situations\n• Describe how payment issues are resolved',
  },
  {
    category: 'Refund Eligibility',
    icon: Ban,
    iconColor: '#EF4444',
    question: 'Entry Purchase is Final',
    answer:
      'Once an entry has been successfully purchased and added to a draw:\n• The purchase is considered final\n• The participant cannot cancel the entry\n• Entry fees are non-refundable, except in situations specifically described in this policy\n\nThis rule ensures that every participant has an equal opportunity and that no user gains an unfair advantage after joining a draw.',
  },
  {
    category: 'Refund Eligibility',
    icon: RotateCcw,
    iconColor: '#10B981',
    question: 'When Refunds Are Available',
    answer:
      "Refunds may be issued only under the following circumstances.\n\nA. Draw Cancelled by JeetoBaz\nIf JeetoBaz cancels a draw for operational, legal, technical, or unforeseen reasons before a winner is selected, every eligible participant will receive a full refund of the entry fee(s). Refunds may be processed through the original payment method, the JeetoBaz Wallet, or another approved refund method.\n\nB. Successful Payment but No Entry Created\nIf payment has been successfully completed but no valid entry appears in the participant's account, JeetoBaz may resolve the issue by automatically issuing a refund, manually verifying the payment and processing a refund, or crediting the equivalent amount to the JeetoBaz Wallet. Each case will be reviewed using payment records and system logs.\n\nC. Technical Errors\nRefunds may be considered where a verified technical issue caused failure to generate an entry, a duplicate transaction due to a confirmed system error, or a payment processing failure caused by JeetoBaz systems.",
  },
  {
    category: 'Refund Eligibility',
    icon: XCircle,
    iconColor: '#FF6B6B',
    question: 'Situations Where Refunds Will NOT Be Issued',
    answer:
      "Refunds will not be provided for:\n• Change of mind after purchasing an entry\n• Accidental participation by the user\n• Failure to read prize details before entering\n• Dissatisfaction after not winning\n• Incorrect information entered by the participant\n• Network delays outside JeetoBaz's control\n• Payment delays caused by banks or payment providers",
  },
  {
    category: 'Payments',
    icon: RefreshCw,
    iconColor: '#F59E0B',
    question: 'Duplicate Payments',
    answer:
      'JeetoBaz systems are designed to prevent duplicate entry purchases for the same transaction. If an unexpected duplicate payment is reported, JeetoBaz will investigate the matter using payment records before taking appropriate action.',
  },
  {
    category: 'Payments',
    icon: Wallet,
    iconColor: '#8B5CF6',
    question: 'JeetoBaz Wallet',
    answer:
      'Where available, JeetoBaz may offer refunds through the JeetoBaz Wallet. Wallet balances may be used for future draw entries, eligible platform services, or other features introduced by JeetoBaz. Wallet usage will always be governed by JeetoBaz policies.',
  },
  {
    category: 'Payments',
    icon: Clock,
    iconColor: '#14B8A6',
    question: 'Refund Processing Time',
    answer:
      'Approved refunds are generally processed within 7–14 business days. Actual processing time may vary depending on the payment provider, bank processing, wallet provider, public holidays, or verification requirements. JeetoBaz is not responsible for delays caused by third-party financial institutions.',
  },
  {
    category: 'Verification',
    icon: IdCard,
    iconColor: '#3B82F6',
    question: 'Verification Before Refund',
    answer:
      'Before approving any refund request, JeetoBaz may request CNIC verification, account verification, payment proof, transaction ID, bank confirmation, or additional information where necessary. Failure to provide requested information may delay or prevent refund processing.',
  },
  {
    category: 'Fraud & Security',
    icon: ShieldAlert,
    iconColor: '#EF4444',
    question: 'Fraud Prevention',
    answer:
      'To protect all participants, JeetoBaz reserves the right to refuse refunds where there is evidence of fraudulent activity, false payment claims, chargeback abuse, identity misuse, multiple fake accounts, manipulation of the draw process, or violation of JeetoBaz Terms & Conditions. Accounts involved in fraudulent activity may be suspended or permanently removed.',
  },
  {
    category: 'Fraud & Security',
    icon: Scale,
    iconColor: '#F97316',
    question: 'Chargebacks',
    answer:
      'Initiating an unauthorized chargeback after receiving a valid entry may result in account suspension, cancellation of participation, recovery proceedings where legally permitted, or permanent restriction from JeetoBaz services. Participants are encouraged to contact JeetoBaz Support before requesting a chargeback through their bank.',
  },
  {
    category: 'Responsibilities',
    icon: UserRound,
    iconColor: '#EC4899',
    question: 'User Responsibilities',
    answer:
      'Participants are responsible for:\n• Providing correct payment details\n• Using their own payment method where legally permitted\n• Reviewing prize information before purchasing entries\n• Checking transaction confirmations\n• Reporting payment issues promptly',
  },
  {
    category: 'Responsibilities',
    icon: ShieldCheck,
    iconColor: '#10B981',
    question: 'JeetoBaz Responsibilities',
    answer:
      'JeetoBaz is committed to maintaining a transparent refund process, investigating payment-related issues fairly, protecting participant funds where applicable, resolving verified payment problems as quickly as reasonably possible, and treating all participants equally.',
  },
  {
    category: 'Policy & Support',
    icon: FileWarning,
    iconColor: '#FFD700',
    question: 'Changes to this Policy',
    answer:
      'JeetoBaz may update this Refund & Cancellation Policy from time to time to reflect legal requirements, operational improvements, payment system updates, platform enhancements, or security improvements. The latest version will always be published on the JeetoBaz website and mobile application.',
  },
  {
    category: 'Policy & Support',
    icon: Headphones,
    iconColor: '#14B8A6',
    question: 'Contact Support',
    answer:
      'For refund-related questions or payment issues, please contact JeetoBaz Support through the official support channels available on the JeetoBaz website or mobile application. Please include your registered mobile number, transaction ID, date of payment, draw or prize name, a description of the issue, and supporting screenshots if available. This helps our support team investigate and resolve your request more efficiently.',
  },
] as const;

export default function RefundPolicyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const { theme } = useAppTheme();
  const [query, setQuery] = useState('');
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return REFUND_FAQS;
    return REFUND_FAQS.filter(
      (item) =>
        item.question.toLowerCase().includes(search) ||
        item.answer.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search),
    );
  }, [query]);

  const refundSchema = pageSchema('WebPage', '/refund-policy', 'Refund & Cancellation Policy', 'Review the JeetoBaz Refund & Cancellation Policy covering entry purchases, refund eligibility, payment issues, and processing timelines.');
  return (
    <>
    <Head>
      <title>Refund &amp; Cancellation Policy | JeetoBaz</title>
      <meta name="robots" content="index, follow" />
      <meta name="description" content="Review the JeetoBaz Refund & Cancellation Policy covering entry purchases, refund eligibility, payment issues, and processing timelines." />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Refund &amp; Cancellation Policy | JeetoBaz" />
      <meta property="og:description" content="Review the JeetoBaz Refund & Cancellation Policy covering entry purchases, refund eligibility, payment issues, and processing timelines." />
      <meta property="og:url" content="https://jeetobaz.pk/refund-policy" />
      <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
      <meta property="og:image:alt" content="JeetoBaz — Pakistan's trusted prize draw platform" />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta property="og:locale" content="en_PK" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content="Refund &amp; Cancellation Policy | JeetoBaz" />
      <meta name="twitter:description" content="Review the JeetoBaz Refund & Cancellation Policy covering entry purchases, refund eligibility, payment issues, and processing timelines." />
      <meta name="twitter:image" content="https://jeetobaz.pk/twitter-image.png" />
      <link rel="canonical" href="https://jeetobaz.pk/refund-policy" />
      <script type="application/ld+json">{JSON.stringify(refundSchema)}</script>
    </Head>
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <TouchableOpacity onPress={() => params.source === 'profile' ? router.replace('/login') : router.back()}>
          <Text style={[styles.back, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <RotateCcw color={theme.gold} size={22} />
          <Text style={[styles.headerTitle, { color: theme.gold }]}>Refund Policy</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.hero}>
        <Text role="heading" aria-level={1} style={[styles.heroTitle, { color: theme.gold }]}>Refund & Cancellation Policy</Text>
        <Text style={[styles.heroText, { color: theme.muted }]}>
          JeetoBaz is a transparent and verified fair draw platform. Please read this policy carefully before purchasing an entry.
        </Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Search color={theme.subtle} size={20} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search this policy..."
          placeholderTextColor={theme.subtle}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      <View style={styles.list}>
        {filteredFaqs.map((item) => {
          const expanded = openQuestion === item.question;
          const Icon = item.icon;
          return (
            <View
              key={item.question}
              style={[styles.card, { backgroundColor: theme.surface, borderColor: expanded ? theme.gold : theme.border }]}
            >
              <TouchableOpacity
                style={styles.questionRow}
                onPress={() => setOpenQuestion(expanded ? null : item.question)}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
              >
                <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
                  <Icon color={item.iconColor} size={20} />
                </View>
                <View style={styles.questionCopy}>
                  <Text style={[styles.category, { color: theme.primary }]}>{item.category}</Text>
                  <Text style={[styles.question, { color: theme.gold }]}>{item.question}</Text>
                </View>
                {expanded ? (
                  <ChevronDown color={theme.gold} size={21} />
                ) : (
                  <ChevronRight color={theme.subtle} size={21} />
                )}
              </TouchableOpacity>
              {expanded ? (
                <View style={[styles.answerBox, { borderTopColor: theme.border }]}>
                  <Text style={[styles.answer, { color: theme.muted }]}>{item.answer}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {filteredFaqs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: theme.gold }]}>No matching section found</Text>
          <TouchableOpacity onPress={() => router.push('/help')}>
            <Text style={[styles.helpLink, { color: theme.primary }]}>Open Help Center</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={[styles.finalBox, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
        <Text style={[styles.finalText, { color: theme.primary }]}>
          By purchasing an entry on JeetoBaz, you confirm that you have read, understood, and agreed to this Refund & Cancellation Policy.
        </Text>
      </View>

      <Text style={[styles.lastUpdated, { color: theme.subtle }]}>Last Updated: 2026</Text>
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
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSpacer: { width: 48 },
  hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20 },
  heroTitle: { fontSize: 27, fontWeight: '800', textAlign: 'center' },
  heroText: { fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 620, marginTop: 7 },
  searchBox: { marginHorizontal: 15, borderWidth: 1, borderRadius: 12, minHeight: 52, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 12, outlineStyle: 'none' } as never,
  list: { margin: 15, gap: 10 },
  card: { borderWidth: 1, borderRadius: 13, overflow: 'hidden' },
  questionRow: { minHeight: 78, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  questionCopy: { flex: 1 },
  category: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  question: { fontSize: 15, fontWeight: '700', lineHeight: 21 },
  answerBox: { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 15 },
  answer: { fontSize: 14, lineHeight: 22 },
  empty: { alignItems: 'center', padding: 35 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  helpLink: { fontSize: 15, fontWeight: '700', marginTop: 12 },
  finalBox: { borderRadius: 12, padding: 15, marginHorizontal: 15, marginTop: 10, borderWidth: 1 },
  finalText: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  lastUpdated: { fontSize: 12, marginTop: 18, marginBottom: 4, textAlign: 'center' },
});
