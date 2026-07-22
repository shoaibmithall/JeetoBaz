import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { ClipboardList, TriangleAlert } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';

export default function TermsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const { theme } = useAppTheme();

  return (
    <>
    <Head>
      <title>Terms &amp; Conditions | JeetoBaz</title>
    </Head>
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <View style={styles.titleRow}><ClipboardList color={theme.gold} size={25} /><Text style={[styles.title, { color: theme.gold }]}>Terms & Conditions</Text></View>
        <Text style={[styles.subtitle, { color: theme.muted }]}>JeetoBaz — Lucky Draw Platform</Text>
      </View>

      <View style={styles.content}>

        <View style={[styles.importantBox, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}>
          <View style={styles.importantTitleRow}><TriangleAlert color={theme.gold} size={18} /><Text style={[styles.importantTitle, { color: theme.gold }]}>IMPORTANT NOTICE</Text></View>
          <Text style={[styles.importantText, { color: theme.muted }]}>
            JeetoBaz is a Lucky Draw platform. Please read all terms carefully before participating.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>1. Nature of Platform</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          JeetoBaz operates prize draws for eligible participants in Pakistan. Availability and operation are subject to applicable laws, regulatory requirements, and platform rules. JeetoBaz may pause or restrict participation where required. Winners are selected randomly by the JeetoBaz system after the published participation conditions are met and an authorized admin starts the scheduled draw.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>2. No Refund Policy</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          • All entry fees paid are strictly NON-REFUNDABLE{'\n'}
          • Once payment is made and entry is confirmed, it cannot be cancelled{'\n'}
          • Entry fees will NOT be returned under any circumstances{'\n'}
          • By paying the entry fee, you accept this no-refund policy{'\n'}
          • In case of draw cancellation by JeetoBaz, a full refund will be processed within 7 business days
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>3. Winner Selection</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          • The winner is selected from eligible approved entry tickets by the JeetoBaz random draw system{'\n'}
          • An authorized admin controls when an eligible scheduled draw starts, but does not choose the winning ticket{'\n'}
          • Each completed draw result is locked and recorded by the system{'\n'}
          • A draw may be shown live or published through the JeetoBaz app, website, or official social channel{'\n'}
          • Draw results are final and cannot be challenged or disputed
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>4. Draw Schedule</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          • Draw scheduling starts after ALL participation spots are filled{'\n'}
          • JeetoBaz will announce the exact draw date and time after the draw becomes full{'\n'}
          • The target is usually within about 1 week, depending on verification and operations{'\n'}
          • Scheduled draws are held at 10:00 PM (PKT){'\n'}
          • Draw may be broadcast LIVE on the JeetoBaz app, website, or official social channel{'\n'}
          • Registered participants should check the app for the latest draw update
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>5. Prize Delivery</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          • Prize is awarded ONLY to the lucky winner selected by the system{'\n'}
          • No other participant is entitled to any prize{'\n'}
          • Winner will be contacted via their registered phone number{'\n'}
          • Prize must be claimed within 7 days of the draw{'\n'}
          • JeetoBaz will arrange prize delivery or pickup{'\n'}
          • Prize cannot be exchanged for cash
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>6. Eligibility</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          • Must be 18 years or older{'\n'}
          • Must have a valid Pakistani phone number{'\n'}
          • One entry per person per draw{'\n'}
          • Multiple accounts are strictly prohibited and will result in disqualification
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>7. Payment</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          • Payments accepted via JazzCash, Easypaisa, or bank transfer{'\n'}
          • Entry is confirmed only after payment verification by JeetoBaz{'\n'}
          • Always keep your transaction ID as proof of payment{'\n'}
          • Fraudulent transactions will result in permanent ban
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>8. Transparency & Fairness</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          • Draw records and winner results are published for transparency{'\n'}
          • Participant information shown publicly is limited and masked where appropriate{'\n'}
          • Phone numbers are partially masked to protect privacy{'\n'}
          • JeetoBaz records the selected winner entry and draw time
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>9. Privacy Policy</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          • Your personal information is handled according to the JeetoBaz Privacy Policy{'\n'}
          • JeetoBaz does not sell your personal information{'\n'}
          • Trusted providers may be used only as needed to operate JeetoBaz, verify payments, host the app, provide support, or comply with law{'\n'}
          • Phone numbers are partially masked in all public displays{'\n'}
          • Data is used for draw participation, payment verification, winner notification, support, and fraud prevention
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>10. Contact Us</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          For any queries:{'\n'}
          • WhatsApp: +92 337 2561482{'\n'}
          • Email: complaintsjeetobaz@gmail.com{'\n'}
          • Website: jeetobaz.pk
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.gold }]}>11. Platform Disclaimer</Text>
        <Text style={[styles.text, { color: theme.muted }]}>
          • JeetoBaz draws are sponsored and administered by JeetoBaz{'\n'}
          • Apple, Google, Meta, and their related platforms are not sponsors of, administrators of, or involved with JeetoBaz draws{'\n'}
          • Participation is permitted only where lawful and subject to these official rules
        </Text>

        <View style={[styles.finalBox, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
          <Text style={[styles.finalText, { color: theme.primary }]}>
            By participating in JeetoBaz draws, you confirm that you have read, understood, and agreed to all the above Terms & Conditions.
          </Text>
        </View>

        <Text style={[styles.lastUpdated, { color: theme.subtle }]}>Last updated: June 2026</Text>
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
