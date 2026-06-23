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
        <Text style={styles.sectionTitle}>1. About JeetoBaz</Text>
        <Text style={styles.text}>JeetoBaz is Pakistan's premier lucky draw platform where users can enter draws for a small fee and win exciting prizes.</Text>

        <Text style={styles.sectionTitle}>2. Eligibility</Text>
        <Text style={styles.text}>• Must be 18 years or older to participate{'\n'}• Must have a valid Pakistani phone number{'\n'}• Must have a valid JazzCash/Easypaisa account for payment</Text>

        <Text style={styles.sectionTitle}>3. Entry & Payment</Text>
        <Text style={styles.text}>• Each entry requires payment of the specified entry fee{'\n'}• Payment must be made via JazzCash, Easypaisa, or bank transfer{'\n'}• Entry is confirmed only after payment verification{'\n'}• One entry per person per draw</Text>

        <Text style={styles.sectionTitle}>4. Draw Process</Text>
        <Text style={styles.text}>• All draws are conducted live and transparently{'\n'}• Winner is selected randomly using a computer algorithm{'\n'}• Draw results are final and cannot be challenged{'\n'}• All participants can watch the live draw</Text>

        <Text style={styles.sectionTitle}>5. Winner Announcement</Text>
        <Text style={styles.text}>• Winner is announced live during the draw{'\n'}• Winner will be contacted via registered phone number{'\n'}• Prize must be claimed within 7 days of announcement{'\n'}• JeetoBaz reserves the right to verify winner's identity</Text>

        <Text style={styles.sectionTitle}>6. Refund Policy</Text>
        <Text style={styles.text}>• Entry fees are non-refundable once verified{'\n'}• In case of draw cancellation, full refund will be provided{'\n'}• Refunds will be processed within 3-5 business days</Text>

        <Text style={styles.sectionTitle}>7. Privacy Policy</Text>
        <Text style={styles.text}>• Your personal information is kept confidential{'\n'}• Phone numbers are partially masked in public displays{'\n'}• We do not share your data with third parties{'\n'}• Data is used only for draw participation and winner notification</Text>

        <Text style={styles.sectionTitle}>8. Fair Play</Text>
        <Text style={styles.text}>• Multiple accounts are strictly prohibited{'\n'}• Any fraudulent activity will result in permanent ban{'\n'}• JeetoBaz reserves the right to disqualify any entry</Text>

        <Text style={styles.sectionTitle}>9. Contact Us</Text>
        <Text style={styles.text}>For any queries or complaints:{'\n'}• WhatsApp: +92 370 6814892{'\n'}• Email: support@jeetobaz.pk{'\n'}• Website: jeetobaz-pk.netlify.app</Text>

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
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginTop: 20, marginBottom: 8 },
  text: { color: '#aaa', fontSize: 14, lineHeight: 22 },
  lastUpdated: { color: '#555', fontSize: 12, marginTop: 30, textAlign: 'center' },
  backBtn: { margin: 20, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333', marginBottom: 40 },
  backBtnText: { color: '#aaa', fontSize: 16 },
});
