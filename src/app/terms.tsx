import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Terms & Conditions</Text>
        <Text style={styles.subtitle}>JeetoBaz — Pakistan's No.1 Lucky Draw</Text>
      </View>

      <View style={styles.content}>

        <View style={styles.importantBox}>
          <Text style={styles.importantTitle}>⚠️ IMPORTANT NOTICE</Text>
          <Text style={styles.importantText}>
            JeetoBaz is a Lucky Draw platform. Please read all terms carefully before participating.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>1. Nature of Platform</Text>
        <Text style={styles.text}>
          JeetoBaz is a 100% transparent and fair lucky draw platform based in Pakistan. This is NOT a gambling platform. Winners are selected through a fully automated and random computer algorithm in front of all participants.
        </Text>

        <Text style={styles.sectionTitle}>2. No Refund Policy</Text>
        <Text style={styles.text}>
          • All entry fees paid are strictly NON-REFUNDABLE{'\n'}
          • Once payment is made and entry is confirmed, it cannot be cancelled{'\n'}
          • Entry fees will NOT be returned under any circumstances{'\n'}
          • By paying the entry fee, you accept this no-refund policy{'\n'}
          • In case of draw cancellation by JeetoBaz, a full refund will be processed within 7 business days
        </Text>

        <Text style={styles.sectionTitle}>3. Winner Selection</Text>
        <Text style={styles.text}>
          • The winner is selected ONLY through an automated computer algorithm{'\n'}
          • JeetoBaz management has NO control over who wins{'\n'}
          • The selection process is 100% random and fair{'\n'}
          • The draw is conducted LIVE on the JeetoBaz app and website{'\n'}
          • All participants can watch the live draw in real-time{'\n'}
          • Draw results are final and cannot be challenged or disputed
        </Text>

        <Text style={styles.sectionTitle}>4. Draw Schedule</Text>
        <Text style={styles.text}>
          • Draw is conducted when ALL participation spots are filled{'\n'}
          • Once a product reaches maximum participants, the draw is held at 10:00 PM (PKT) the same night{'\n'}
          • Draw is broadcast LIVE on the JeetoBaz app and website{'\n'}
          • All registered participants will be notified before the draw
        </Text>

        <Text style={styles.sectionTitle}>5. Prize Delivery</Text>
        <Text style={styles.text}>
          • Prize is awarded ONLY to the lucky winner selected by the system{'\n'}
          • No other participant is entitled to any prize{'\n'}
          • Winner will be contacted via their registered phone number{'\n'}
          • Prize must be claimed within 7 days of the draw{'\n'}
          • JeetoBaz will arrange prize delivery or pickup{'\n'}
          • Prize cannot be exchanged for cash
        </Text>

        <Text style={styles.sectionTitle}>6. Eligibility</Text>
        <Text style={styles.text}>
          • Must be 18 years or older{'\n'}
          • Must have a valid Pakistani phone number{'\n'}
          • One entry per person per draw{'\n'}
          • Multiple accounts are strictly prohibited and will result in disqualification
        </Text>

        <Text style={styles.sectionTitle}>7. Payment</Text>
        <Text style={styles.text}>
          • Payments accepted via JazzCash, Easypaisa, or bank transfer{'\n'}
          • Entry is confirmed only after payment verification by JeetoBaz{'\n'}
          • Always keep your transaction ID as proof of payment{'\n'}
          • Fraudulent transactions will result in permanent ban
        </Text>

        <Text style={styles.sectionTitle}>8. Transparency & Fairness</Text>
        <Text style={styles.text}>
          • All draws are conducted publicly and live{'\n'}
          • The complete participant list is visible to everyone during the draw{'\n'}
          • Phone numbers are partially masked to protect privacy{'\n'}
          • JeetoBaz is committed to 100% fair and transparent operations
        </Text>

        <Text style={styles.sectionTitle}>9. Privacy Policy</Text>
        <Text style={styles.text}>
          • Your personal information is handled according to the JeetoBaz Privacy Policy{'\n'}
          • JeetoBaz does not sell your personal information{'\n'}
          • Trusted providers may be used only as needed to operate JeetoBaz, verify payments, host the app, provide support, or comply with law{'\n'}
          • Phone numbers are partially masked in all public displays{'\n'}
          • Data is used for draw participation, payment verification, winner notification, support, and fraud prevention
        </Text>

        <Text style={styles.sectionTitle}>10. Contact Us</Text>
        <Text style={styles.text}>
          For any queries:{'\n'}
          • WhatsApp: +92 337 2561482{'\n'}
          • Email: complaintsjeetobaz@gmail.com{'\n'}
          • Website: jeetobaz-pk.netlify.app
        </Text>

        <View style={styles.finalBox}>
          <Text style={styles.finalText}>
            By participating in JeetoBaz draws, you confirm that you have read, understood, and agreed to all the above Terms & Conditions.
          </Text>
        </View>

        <Text style={styles.lastUpdated}>Last updated: June 2026</Text>
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>← Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { backgroundColor: '#1DB954', padding: 30, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 13, color: 'white', marginTop: 5 },
  content: { padding: 20 },
  importantBox: { backgroundColor: '#2b1a00', borderRadius: 12, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#FFD700' },
  importantTitle: { color: '#FFD700', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  importantText: { color: '#aaa', fontSize: 14, lineHeight: 22 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginTop: 20, marginBottom: 8 },
  text: { color: '#aaa', fontSize: 14, lineHeight: 24 },
  finalBox: { backgroundColor: '#0d2b1a', borderRadius: 12, padding: 15, marginTop: 25, borderWidth: 1, borderColor: '#1DB954' },
  finalText: { color: '#1DB954', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  lastUpdated: { color: '#555', fontSize: 12, marginTop: 20, marginBottom: 10, textAlign: 'center' },
  backBtn: { margin: 20, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333', marginBottom: 40 },
  backBtnText: { color: '#aaa', fontSize: 16 },
});
