import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { RotateCcw, TriangleAlert } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { pageSchema } from '@/lib/structured-data';

export default function RefundPolicyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const { theme } = useAppTheme();

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
      <meta property="og:site_name" content="JeetoBaz" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content="Refund &amp; Cancellation Policy | JeetoBaz" />
      <meta name="twitter:description" content="Review the JeetoBaz Refund & Cancellation Policy covering entry purchases, refund eligibility, payment issues, and processing timelines." />
      <meta name="twitter:image" content="https://jeetobaz.pk/twitter-image.png" />
      <link rel="canonical" href="https://jeetobaz.pk/refund-policy" />
      <script type="application/ld+json">{JSON.stringify(refundSchema)}</script>
    </Head>
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <View style={styles.titleRow}><RotateCcw color={theme.gold} size={25} /><Text role="heading" aria-level={1} style={[styles.title, { color: theme.gold }]}>Refund & Cancellation Policy</Text></View>
        <Text style={[styles.subtitle, { color: theme.muted }]}>JeetoBaz — Lucky Draw Platform</Text>
      </View>

      <View style={styles.content}>

        <View style={[styles.importantBox, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}>
          <View style={styles.importantTitleRow}><TriangleAlert color={theme.gold} size={18} /><Text style={[styles.importantTitle, { color: theme.gold }]}>IMPORTANT NOTICE</Text></View>
          <Text style={[styles.importantText, { color: theme.muted }]}>
            JeetoBaz is a transparent and verified fair draw platform. Please read this policy carefully before purchasing an entry.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>1. Introduction</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          Welcome to JeetoBaz. JeetoBaz is a transparent and verified fair draw platform where users can participate in prize draws by purchasing eligible entries. This Refund & Cancellation Policy explains when refunds may be issued, when cancellations are allowed, and how payment-related issues are handled.{'\n\n'}
          By using JeetoBaz, creating an account, purchasing an entry, or participating in any draw, you agree to this Refund & Cancellation Policy together with our Terms & Conditions and Privacy Policy.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>2. Purpose of this Policy</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          This policy is designed to:{'\n'}
          • Protect all participants equally{'\n'}
          • Maintain fairness and transparency{'\n'}
          • Prevent fraudulent refund requests{'\n'}
          • Explain eligible refund situations{'\n'}
          • Describe how payment issues are resolved
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>3. Entry Purchase is Final</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          Once an entry has been successfully purchased and added to a draw:{'\n'}
          • The purchase is considered final{'\n'}
          • The participant cannot cancel the entry{'\n'}
          • Entry fees are non-refundable, except in situations specifically described in this policy{'\n\n'}
          This rule ensures that every participant has an equal opportunity and that no user gains an unfair advantage after joining a draw.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>4. When Refunds Are Available</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          Refunds may be issued only under the following circumstances.{'\n\n'}
          <Text style={{ fontWeight: '700' }}>A. Draw Cancelled by JeetoBaz</Text>{'\n'}
          If JeetoBaz cancels a draw for operational, legal, technical, or unforeseen reasons before a winner is selected, every eligible participant will receive a full refund of the entry fee(s). Refunds may be processed through the original payment method, the JeetoBaz Wallet, or another approved refund method.{'\n\n'}
          <Text style={{ fontWeight: '700' }}>B. Successful Payment but No Entry Created</Text>{'\n'}
          If payment has been successfully completed but no valid entry appears in the participant's account, JeetoBaz may resolve the issue by automatically issuing a refund, manually verifying the payment and processing a refund, or crediting the equivalent amount to the JeetoBaz Wallet. Each case will be reviewed using payment records and system logs.{'\n\n'}
          <Text style={{ fontWeight: '700' }}>C. Technical Errors</Text>{'\n'}
          Refunds may be considered where a verified technical issue caused failure to generate an entry, a duplicate transaction due to a confirmed system error, or a payment processing failure caused by JeetoBaz systems.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>5. Situations Where Refunds Will NOT Be Issued</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          Refunds will not be provided for:{'\n'}
          • Change of mind after purchasing an entry{'\n'}
          • Accidental participation by the user{'\n'}
          • Failure to read prize details before entering{'\n'}
          • Dissatisfaction after not winning{'\n'}
          • Incorrect information entered by the participant{'\n'}
          • Network delays outside JeetoBaz's control{'\n'}
          • Payment delays caused by banks or payment providers
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>6. Duplicate Payments</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          JeetoBaz systems are designed to prevent duplicate entry purchases for the same transaction. If an unexpected duplicate payment is reported, JeetoBaz will investigate the matter using payment records before taking appropriate action.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>7. JeetoBaz Wallet</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          Where available, JeetoBaz may offer refunds through the JeetoBaz Wallet. Wallet balances may be used for future draw entries, eligible platform services, or other features introduced by JeetoBaz. Wallet usage will always be governed by JeetoBaz policies.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>8. Refund Processing Time</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          Approved refunds are generally processed within 7–14 business days. Actual processing time may vary depending on the payment provider, bank processing, wallet provider, public holidays, or verification requirements. JeetoBaz is not responsible for delays caused by third-party financial institutions.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>9. Verification Before Refund</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          Before approving any refund request, JeetoBaz may request CNIC verification, account verification, payment proof, transaction ID, bank confirmation, or additional information where necessary. Failure to provide requested information may delay or prevent refund processing.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>10. Fraud Prevention</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          To protect all participants, JeetoBaz reserves the right to refuse refunds where there is evidence of fraudulent activity, false payment claims, chargeback abuse, identity misuse, multiple fake accounts, manipulation of the draw process, or violation of JeetoBaz Terms & Conditions. Accounts involved in fraudulent activity may be suspended or permanently removed.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>11. Chargebacks</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          Initiating an unauthorized chargeback after receiving a valid entry may result in account suspension, cancellation of participation, recovery proceedings where legally permitted, or permanent restriction from JeetoBaz services. Participants are encouraged to contact JeetoBaz Support before requesting a chargeback through their bank.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>12. User Responsibilities</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          Participants are responsible for:{'\n'}
          • Providing correct payment details{'\n'}
          • Using their own payment method where legally permitted{'\n'}
          • Reviewing prize information before purchasing entries{'\n'}
          • Checking transaction confirmations{'\n'}
          • Reporting payment issues promptly
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>13. JeetoBaz Responsibilities</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          JeetoBaz is committed to maintaining a transparent refund process, investigating payment-related issues fairly, protecting participant funds where applicable, resolving verified payment problems as quickly as reasonably possible, and treating all participants equally.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>14. Changes to this Policy</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          JeetoBaz may update this Refund & Cancellation Policy from time to time to reflect legal requirements, operational improvements, payment system updates, platform enhancements, or security improvements. The latest version will always be published on the JeetoBaz website and mobile application.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>15. Contact Support</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          For refund-related questions or payment issues, please contact JeetoBaz Support through the official support channels available on the JeetoBaz website or mobile application. Please include your registered mobile number, transaction ID, date of payment, draw or prize name, a description of the issue, and supporting screenshots if available. This helps our support team investigate and resolve your request more efficiently.
        </Text>

        <View style={[styles.finalBox, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
          <Text style={[styles.finalText, { color: theme.primary }]}>
            By purchasing an entry on JeetoBaz, you confirm that you have read, understood, and agreed to this Refund & Cancellation Policy.
          </Text>
        </View>

        <Text style={[styles.lastUpdated, { color: theme.subtle }]}>Last Updated: 2026</Text>
      </View>

      <TouchableOpacity style={[styles.backBtn, { borderColor: theme.border }]} onPress={() => params.source === 'profile' ? router.replace('/login') : router.back()}>
        <Text style={[styles.backBtnText, { color: theme.muted }]}>← Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  header: { backgroundColor: '#04140e', borderBottomColor: '#FFD700', borderBottomWidth: 2, padding: 30, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFD700' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subtitle: { fontSize: 13, color: '#9aac9f', marginTop: 5 },
  content: { padding: 20 },
  importantBox: { backgroundColor: '#2b1a00', borderRadius: 12, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#FFD700' },
  importantTitle: { color: '#FFD700', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  importantTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  importantText: { color: '#aaa', fontSize: 14, lineHeight: 22 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginTop: 20, marginBottom: 8 },
  text: { color: '#aaa', fontSize: 14, lineHeight: 24 },
  finalBox: { backgroundColor: '#082d1e', borderRadius: 12, padding: 15, marginTop: 25, borderWidth: 1, borderColor: '#18a663' },
  finalText: { color: '#18a663', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  lastUpdated: { color: '#555', fontSize: 12, marginTop: 20, marginBottom: 10, textAlign: 'center' },
  backBtn: { margin: 20, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#174a35', marginBottom: 40 },
  backBtnText: { color: '#aaa', fontSize: 16 },
});
