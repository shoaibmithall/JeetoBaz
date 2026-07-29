import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { Truck, TriangleAlert } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { pageSchema } from '@/lib/structured-data';

export default function ShippingPolicyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const { theme } = useAppTheme();

  const shippingSchema = pageSchema('WebPage', '/shipping-policy', 'Shipping Policy', 'Review the JeetoBaz Shipping Policy covering prize delivery, winner verification, delivery timelines, and prize collection procedures.');
  return (
    <>
    <Head>
      <title>Shipping Policy | JeetoBaz</title>
      <meta name="robots" content="index, follow" />
      <meta name="description" content="Review the JeetoBaz Shipping Policy covering prize delivery, winner verification, delivery timelines, and prize collection procedures." />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Shipping Policy | JeetoBaz" />
      <meta property="og:description" content="Review the JeetoBaz Shipping Policy covering prize delivery, winner verification, delivery timelines, and prize collection procedures." />
      <meta property="og:url" content="https://jeetobaz.pk/shipping-policy" />
      <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content="Shipping Policy | JeetoBaz" />
      <meta name="twitter:description" content="Review the JeetoBaz Shipping Policy covering prize delivery, winner verification, delivery timelines, and prize collection procedures." />
      <meta name="twitter:image" content="https://jeetobaz.pk/twitter-image.png" />
      <link rel="canonical" href="https://jeetobaz.pk/shipping-policy" />
      <script type="application/ld+json">{JSON.stringify(shippingSchema)}</script>
    </Head>
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <View style={styles.titleRow}><Truck color={theme.gold} size={25} /><Text role="heading" aria-level={1} style={[styles.title, { color: theme.gold }]}>Shipping Policy</Text></View>
        <Text style={[styles.subtitle, { color: theme.muted }]}>JeetoBaz — Lucky Draw Platform</Text>
      </View>

      <View style={styles.content}>

        <View style={[styles.importantBox, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}>
          <View style={styles.importantTitleRow}><TriangleAlert color={theme.gold} size={18} /><Text style={[styles.importantTitle, { color: theme.gold }]}>IMPORTANT NOTICE</Text></View>
          <Text style={[styles.importantText, { color: theme.muted }]}>
            JeetoBaz currently delivers prizes only within Pakistan. Please read this policy carefully.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>1. Introduction</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          Welcome to JeetoBaz. JeetoBaz is committed to delivering prizes securely, fairly, and transparently to verified winners across Pakistan. This Shipping Policy explains how prizes are delivered, the verification process, delivery timelines, prize collection procedures, and the responsibilities of both JeetoBaz and prize winners.{'\n\n'}
          By participating in any JeetoBaz draw, you agree to this Shipping Policy together with our Terms & Conditions, Privacy Policy, and other applicable platform policies.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>2. Prize Delivery Coverage</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          JeetoBaz currently delivers prizes only within Pakistan. Nationwide delivery is available for eligible small and medium-sized prizes. International shipping is not available unless specifically announced by JeetoBaz.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>3. Types of Prize Delivery</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          Depending on the prize category, JeetoBaz may use one of the following delivery methods.{'\n\n'}
          <Text style={{ fontWeight: '700' }}>A. Courier Delivery</Text>{'\n'}
          Small and medium-sized prizes may be delivered directly to the verified winner through an authorized courier service, such as mobile phones, laptops, tablets, smart watches, earbuds, cameras, books, toys, home appliances, fashion items, gift boxes, and other eligible products.{'\n\n'}
          <Text style={{ fontWeight: '700' }}>B. Physical Prize Collection</Text>{'\n'}
          High-value prizes may require physical collection from an official JeetoBaz office or another officially announced location, such as cars, motorcycles, houses, Umrah packages, travel packages, luxury prizes, and other premium rewards. JeetoBaz may also organize an official prize handover ceremony for selected high-value prizes.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>4. Free Shipping</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          JeetoBaz will bear the shipping cost for eligible courier-delivered prizes. Winners will not be charged any standard delivery fee for eligible prize shipments within Pakistan.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>5. Winner Verification (Mandatory)</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          Before any prize is shipped or handed over, the selected winner must successfully complete the verification process, which may include a valid CNIC, registered mobile number verification, account verification, identity confirmation, proof of ownership where required, or additional documentation for premium prizes. JeetoBaz reserves the right to refuse delivery until verification has been successfully completed.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>6. Winner Notification</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          Once a winner is selected and verified, JeetoBaz will attempt to contact the winner using the registered contact information — via phone call, SMS, email, in-app notification, or official JeetoBaz announcements where appropriate. Participants are responsible for keeping their contact information accurate and up to date.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>7. Prize Claim Period</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          A winner must claim their prize within 7 calendar days from the date of the first official notification. If the winner does not respond within this period, JeetoBaz may make additional reasonable attempts to establish contact through available communication channels.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>8. Failure to Claim a Prize</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          If the winner remains unreachable or does not complete the required verification after multiple contact attempts, the prize may no longer remain reserved indefinitely. JeetoBaz may provide a reasonable grace period where appropriate, and if there is still no response, the prize may be forfeited and handled according to JeetoBaz's internal prize management procedures or future draw plans. The specific handling of forfeited prizes shall remain at JeetoBaz's discretion while maintaining fairness and transparency.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>9. Delivery Time</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          After successful verification, small prizes are generally dispatched within 3–10 business days. Delivery times may vary depending on courier operations, destination, weather, public holidays, security conditions, or other circumstances beyond JeetoBaz's reasonable control. Premium prizes may require additional processing time.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>10. Delivery Address</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          The winner must provide a complete and accurate delivery address. JeetoBaz is not responsible for delays caused by incorrect addresses, incomplete information, unavailable recipients, or incorrect phone numbers. Any additional delivery expenses resulting from incorrect information may become the responsibility of the winner.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>11. Damaged Items During Delivery</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          If a courier-delivered prize arrives visibly damaged, the winner should report the issue to JeetoBaz as soon as reasonably possible after delivery. Supporting photographs or videos may be requested, and after verification, JeetoBaz may provide a replacement of the same item or an equivalent alternative where the original product is unavailable. Claims submitted after an unreasonable delay or where damage resulted after delivery may not be accepted.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>12. Large Prize Collection</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          For prizes requiring physical collection, the winner may be required to visit an official JeetoBaz location with an original CNIC, verification documents, winner confirmation, and any additional documents requested by JeetoBaz. Failure to appear within the applicable claim period may affect eligibility to receive the prize.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>13. House Prize</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          For house prizes offered through JeetoBaz, the verified winner may select the preferred city from the options approved by JeetoBaz. JeetoBaz will arrange the house in accordance with the specific promotional campaign, applicable terms, availability, and legal requirements. The exact property specifications, location, and transfer process will be communicated separately to the winner.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>14. Vehicle Registration, Taxes & Government Charges</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          For vehicles, houses, and other assets requiring legal registration or transfer, the winner shall be responsible for government taxes, registration fees, transfer charges, stamp duties, withholding taxes, and any other legally applicable government fees. Unless expressly stated otherwise in a specific promotional campaign, these expenses are not included in the prize.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>15. Umrah & Travel Prizes</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          For Umrah packages and travel-related prizes, delivery and booking are subject to passport validity, visa approval, government regulations, airline availability, travel agency requirements, and Saudi Arabian or destination country regulations. JeetoBaz cannot guarantee travel where governmental or immigration authorities decline approval.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>16. Force Majeure</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          JeetoBaz shall not be liable for delays or failure to deliver prizes caused by circumstances beyond its reasonable control, including but not limited to natural disasters, floods, earthquakes, political unrest, government restrictions, war, pandemics, courier disruptions, or transportation failures.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>17. Fraud Prevention</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          JeetoBaz reserves the right to delay, suspend, or refuse prize delivery where there is evidence of identity fraud, false documentation, multiple fake accounts, manipulation of the draw system, violation of JeetoBaz policies, or any unlawful activity. Where necessary, JeetoBaz may report suspected fraud to the relevant authorities.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>18. Limitation of Liability</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          Once a prize has been successfully delivered or officially handed over to the verified winner, responsibility for the prize transfers to the winner, except where consumer protection laws provide otherwise. JeetoBaz is not responsible for loss caused by misuse of the prize, damage occurring after successful delivery, or warranty claims handled directly by the manufacturer where applicable.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>19. Policy Updates</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          JeetoBaz may update this Shipping Policy from time to time to reflect operational improvements, legal requirements, courier changes, security enhancements, or platform updates. The latest version will always be available on the official JeetoBaz website and mobile application.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>20. Contact Support</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          For delivery-related questions or prize collection assistance, please contact JeetoBaz Support through the official support channels available on the JeetoBaz website or mobile application. When contacting support, please include your registered mobile number, winner ID (if available), prize name, draw reference, delivery address (if applicable), a description of the issue, and supporting photos or documents if required. This information helps us process your request efficiently.
        </Text>

        <View style={[styles.finalBox, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
          <Text style={[styles.finalText, { color: theme.primary }]}>
            By participating in JeetoBaz draws, you confirm that you have read, understood, and agreed to this Shipping Policy.
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
