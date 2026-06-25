import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { getStoredValue } from '@/lib/storage';

const SUPPORT_EMAIL = 'complaintsjeetobaz@gmail.com';
const SUPPORT_WHATSAPP = '+92 337 2561482';
const SUPPORT_WHATSAPP_LINK = 'https://wa.me/923372561482';

export default function PrivacyScreen() {
  const [userName, setUserName] = useState('Not provided');
  const [userPhone, setUserPhone] = useState('Not provided');
  const router = useRouter();

  useEffect(() => {
    Promise.all([getStoredValue('userName'), getStoredValue('userPhone')]).then(([name, phone]) => {
      setUserName(name || 'Not provided');
      setUserPhone(phone || 'Not provided');
    });
  }, []);

  async function requestAccountDeletion() {
    const subject = encodeURIComponent('[Account Deletion Request] JeetoBaz');
    const body = encodeURIComponent(
      `I request deletion of my JeetoBaz account and associated personal data.\n\nName: ${userName}\nRegistered phone: ${userPhone}\n\nPlease contact me to verify this request and confirm completion.`
    );

    try {
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
    } catch {
      Alert.alert('Unable to open email', `Please email your deletion request to ${SUPPORT_EMAIL}.`);
    }
  }

  async function openWhatsAppDeletionRequest() {
    const message = encodeURIComponent(
      `JeetoBaz account deletion request\n\nName: ${userName}\nRegistered phone: ${userPhone}\n\nPlease verify my account and guide me for deletion.`
    );

    try {
      await Linking.openURL(`${SUPPORT_WHATSAPP_LINK}?text=${message}`);
    } catch {
      Alert.alert('Unable to open WhatsApp', `Please contact JeetoBaz at ${SUPPORT_WHATSAPP}.`);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.updated}>Effective date: June 24, 2026</Text>
        <Text style={styles.intro}>
          This Privacy Policy explains how JeetoBaz collects, uses, stores, and protects information when you use the app or website.
        </Text>

        <Text style={styles.sectionTitle}>Information We Collect</Text>
        <Text style={styles.text}>
          • Your name and Pakistani mobile number{`\n`}
          • Draw entries and participation history{`\n`}
          • Payment details needed for verification, including amount, payment method, receipt screenshot, and transaction reference where available{`\n`}
          • Support requests you choose to send, including the subject and message
        </Text>

        <Text style={styles.sectionTitle}>How We Use Information</Text>
        <Text style={styles.text}>
          We use this information to create and manage your profile, process draw participation, verify payments, contact winners, provide support, prevent fraud, and operate JeetoBaz securely.
        </Text>

        <Text style={styles.sectionTitle}>Storage and Sharing</Text>
        <Text style={styles.text}>
          App records are stored using our database service provider. We may share only the information needed with payment, hosting, or support providers that help operate JeetoBaz, or where required by law. JeetoBaz does not sell your personal information.
        </Text>

        <Text style={styles.sectionTitle}>Public Information</Text>
        <Text style={styles.text}>
          Winner and participant displays may show a masked version of a phone number. Full phone numbers are not intended to be shown publicly.
        </Text>

        <Text style={styles.sectionTitle}>Data Retention</Text>
        <Text style={styles.text}>
          We retain information while your account is active and as reasonably needed for payment verification, disputes, fraud prevention, record keeping, or legal obligations. Payment receipt screenshots may be cleared after review. Information that is no longer required is deleted or anonymized where practical.
        </Text>

        <Text style={styles.sectionTitle}>Your Choices</Text>
        <Text style={styles.text}>
          You may ask us to review, correct, or delete your account information. We will verify ownership of the registered number before processing a deletion request. Some transaction or legal records may be retained where required.
        </Text>

        <View style={styles.deletionBox}>
          <Text style={styles.deletionTitle}>Delete Your Account</Text>
          <Text style={styles.deletionText}>
            Send a deletion request from your email app. Our support team will verify the account and confirm when the request is completed.
          </Text>
          <TouchableOpacity style={styles.deleteButton} onPress={requestAccountDeletion}>
            <Text style={styles.deleteButtonText}>Request by Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.whatsAppButton} onPress={openWhatsAppDeletionRequest}>
            <Text style={styles.whatsAppButtonText}>Request by WhatsApp</Text>
          </TouchableOpacity>
          <Text style={styles.emailText}>Email: {SUPPORT_EMAIL}</Text>
          <Text style={styles.emailText}>WhatsApp: {SUPPORT_WHATSAPP}</Text>
        </View>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.text}>
          Questions about privacy or personal data can be sent to {SUPPORT_EMAIL} or {SUPPORT_WHATSAPP}.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { backgroundColor: '#1a1a1a', borderBottomColor: '#FFD700', borderBottomWidth: 2, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { color: '#1DB954', fontSize: 16, fontWeight: 'bold' },
  title: { color: '#FFD700', fontSize: 20, fontWeight: 'bold' },
  headerSpacer: { width: 48 },
  content: { padding: 20, paddingBottom: 50 },
  updated: { color: '#777', fontSize: 12, textAlign: 'center', marginBottom: 16 },
  intro: { color: '#ddd', fontSize: 15, lineHeight: 23, marginBottom: 8 },
  sectionTitle: { color: '#FFD700', fontSize: 17, fontWeight: 'bold', marginTop: 22, marginBottom: 8 },
  text: { color: '#aaa', fontSize: 14, lineHeight: 23 },
  deletionBox: { backgroundColor: '#1a1a1a', borderColor: '#ff4444', borderWidth: 1, borderRadius: 8, padding: 18, marginTop: 28 },
  deletionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  deletionText: { color: '#aaa', fontSize: 14, lineHeight: 21 },
  deleteButton: { backgroundColor: '#ff4444', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 16 },
  deleteButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  whatsAppButton: { backgroundColor: '#0d2b1a', borderColor: '#1DB954', borderWidth: 1, borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 10 },
  whatsAppButtonText: { color: '#1DB954', fontSize: 15, fontWeight: 'bold' },
  emailText: { color: '#888', fontSize: 12, textAlign: 'center', marginTop: 12 },
});
