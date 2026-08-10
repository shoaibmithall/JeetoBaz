import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import Head from 'expo-router/head';
import { RotateCcw } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { breadcrumbSchema, pageSchema } from '@/lib/structured-data';
import { useSafeBack } from '@/lib/safe-back';

const REFUND_FAQS = [
  {
    category: 'Overview',
    question: 'Introduction',
    answer:
      "Welcome to JeetoBaz. JeetoBaz is a transparent and verified fair draw platform where users can participate in prize draws by purchasing eligible entries. This Refund & Cancellation Policy explains when refunds may be issued, when cancellations are allowed, and how payment-related issues are handled.\n\nBy using JeetoBaz, creating an account, purchasing an entry, or participating in any draw, you agree to this Refund & Cancellation Policy together with our Terms & Conditions and Privacy Policy.",
  },
  {
    category: 'Overview',
    question: 'Purpose of this Policy',
    answer:
      'This policy is designed to:\n• Protect all participants equally\n• Maintain fairness and transparency\n• Prevent fraudulent refund requests\n• Explain eligible refund situations\n• Describe how payment issues are resolved',
  },
  {
    category: 'Refund Eligibility',
    question: 'Entry Purchase is Final',
    answer:
      'Once an entry has been successfully purchased and added to a draw:\n• The purchase is considered final\n• The participant cannot cancel the entry\n• Entry fees are non-refundable, except in situations specifically described in this policy\n\nThis rule ensures that every participant has an equal opportunity and that no user gains an unfair advantage after joining a draw.',
  },
  {
    category: 'Refund Eligibility',
    question: 'When Refunds Are Available',
    answer:
      "Refunds may be issued only under the following circumstances.\n\nA. Draw Cancelled by JeetoBaz\nIf JeetoBaz cancels a draw for operational, legal, technical, or unforeseen reasons before a winner is selected, every eligible participant will receive a full refund of the entry fee(s). Refunds may be processed through the original payment method, the JeetoBaz Wallet, or another approved refund method.\n\nB. Successful Payment but No Entry Created\nIf payment has been successfully completed but no valid entry appears in the participant's account, JeetoBaz may resolve the issue by automatically issuing a refund, manually verifying the payment and processing a refund, or crediting the equivalent amount to the JeetoBaz Wallet. Each case will be reviewed using payment records and system logs.\n\nC. Technical Errors\nRefunds may be considered where a verified technical issue caused failure to generate an entry, a duplicate transaction due to a confirmed system error, or a payment processing failure caused by JeetoBaz systems.",
  },
  {
    category: 'Refund Eligibility',
    question: 'Situations Where Refunds Will NOT Be Issued',
    answer:
      "Refunds will not be provided for:\n• Change of mind after purchasing an entry\n• Accidental participation by the user\n• Failure to read prize details before entering\n• Dissatisfaction after not winning\n• Incorrect information entered by the participant\n• Network delays outside JeetoBaz's control\n• Payment delays caused by banks or payment providers",
  },
  {
    category: 'Payments',
    question: 'Duplicate Payments',
    answer:
      'JeetoBaz systems are designed to prevent duplicate entry purchases for the same transaction. If an unexpected duplicate payment is reported, JeetoBaz will investigate the matter using payment records before taking appropriate action.',
  },
  {
    category: 'Payments',
    question: 'JeetoBaz Wallet',
    answer:
      'Where available, JeetoBaz may offer refunds through the JeetoBaz Wallet. Wallet balances may be used for future draw entries, eligible platform services, or other features introduced by JeetoBaz. Wallet usage will always be governed by JeetoBaz policies.',
  },
  {
    category: 'Payments',
    question: 'Refund Processing Time',
    answer:
      'Approved refunds are generally processed within 7–14 business days. Actual processing time may vary depending on the payment provider, bank processing, wallet provider, public holidays, or verification requirements. JeetoBaz is not responsible for delays caused by third-party financial institutions.',
  },
  {
    category: 'Verification',
    question: 'Verification Before Refund',
    answer:
      'Before approving any refund request, JeetoBaz may request CNIC verification, account verification, payment proof, transaction ID, bank confirmation, or additional information where necessary. Failure to provide requested information may delay or prevent refund processing.',
  },
  {
    category: 'Fraud & Security',
    question: 'Fraud Prevention',
    answer:
      'To protect all participants, JeetoBaz reserves the right to refuse refunds where there is evidence of fraudulent activity, false payment claims, chargeback abuse, identity misuse, multiple fake accounts, manipulation of the draw process, or violation of JeetoBaz Terms & Conditions. Accounts involved in fraudulent activity may be suspended or permanently removed.',
  },
  {
    category: 'Fraud & Security',
    question: 'Chargebacks',
    answer:
      'Initiating an unauthorized chargeback after receiving a valid entry may result in account suspension, cancellation of participation, recovery proceedings where legally permitted, or permanent restriction from JeetoBaz services. Participants are encouraged to contact JeetoBaz Support before requesting a chargeback through their bank.',
  },
  {
    category: 'Responsibilities',
    question: 'User Responsibilities',
    answer:
      'Participants are responsible for:\n• Providing correct payment details\n• Using their own payment method where legally permitted\n• Reviewing prize information before purchasing entries\n• Checking transaction confirmations\n• Reporting payment issues promptly',
  },
  {
    category: 'Responsibilities',
    question: 'JeetoBaz Responsibilities',
    answer:
      'JeetoBaz is committed to maintaining a transparent refund process, investigating payment-related issues fairly, protecting participant funds where applicable, resolving verified payment problems as quickly as reasonably possible, and treating all participants equally.',
  },
  {
    category: 'Policy & Support',
    question: 'Changes to this Policy',
    answer:
      'JeetoBaz may update this Refund & Cancellation Policy from time to time to reflect legal requirements, operational improvements, payment system updates, platform enhancements, or security improvements. The latest version will always be published on the JeetoBaz website and mobile application.',
  },
  {
    category: 'Policy & Support',
    question: 'Contact Support',
    answer:
      'For refund-related questions or payment issues, please contact JeetoBaz Support through the official support channels available on the JeetoBaz website or mobile application. Please include your registered mobile number, transaction ID, date of payment, draw or prize name, a description of the issue, and supporting screenshots if available. This helps our support team investigate and resolve your request more efficiently.',
  },
] as const;

export default function RefundPolicyScreen() {
  const goBack = useSafeBack();
  const { theme } = useAppTheme();

  const refundSchema = pageSchema('WebPage', '/refund-policy', 'Refund & Cancellation Policy', 'Review the JeetoBaz Refund & Cancellation Policy covering entry purchases, refund eligibility, payment issues, and processing timelines.');
  const breadcrumb = breadcrumbSchema([{ name: 'Refund & Cancellation Policy', path: '/refund-policy' }]);
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

      <View style={styles.list}>
        {REFUND_FAQS.map((item, index) => (
          <View
            key={item.question}
            style={[
              styles.section,
              { borderBottomColor: theme.border },
              index === REFUND_FAQS.length - 1 && styles.sectionLast,
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.gold }]}>{index + 1}. {item.question}</Text>
            <Text style={[styles.sectionAnswer, { color: theme.muted }]}>{item.answer}</Text>
          </View>
        ))}
      </View>

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
  hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 34, paddingBottom: 20 },
  heroTitle: { fontSize: 40, fontWeight: '900', textAlign: 'center' },
  heroText: { fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 680, marginTop: 10 },
  list: { marginHorizontal: 20, marginTop: 10 },
  section: { borderBottomWidth: 1, paddingVertical: 28 },
  sectionLast: { borderBottomWidth: 0 },
  sectionTitle: { fontSize: 28, fontWeight: '900', marginBottom: 12 },
  sectionAnswer: { fontSize: 16, lineHeight: 26 },
  finalBox: { borderRadius: 12, padding: 18, marginHorizontal: 15, marginTop: 14, borderWidth: 1 },
  finalText: { fontSize: 15, lineHeight: 24, textAlign: 'center' },
  lastUpdated: { fontSize: 12, marginTop: 18, marginBottom: 4, textAlign: 'center' },
});
