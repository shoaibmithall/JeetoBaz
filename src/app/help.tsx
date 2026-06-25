import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getStoredValue } from '@/lib/storage';

const SUPPORT_PHONE_DISPLAY = '+92 337 2561482';
const SUPPORT_PHONE = '923372561482';
const SUPPORT_EMAIL = 'complaintsjeetobaz@gmail.com';

export default function HelpCenterScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const router = useRouter();

  useEffect(() => {
    Promise.all([getStoredValue('userName'), getStoredValue('userPhone')]).then(([name, phone]) => {
      setUserName(name || 'Not provided');
      setUserPhone(phone || 'Not provided');
    });
  }, []);

  async function openLink(url: string, errorMessage: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open', errorMessage);
    }
  }

  function openWhatsApp() {
    const text = encodeURIComponent('Assalam-o-Alaikum, I need help with JeetoBaz.');
    openLink(`https://wa.me/${SUPPORT_PHONE}?text=${text}`, `Please contact us at ${SUPPORT_PHONE_DISPLAY}.`);
  }

  function openEmail() {
    const subjectText = encodeURIComponent('JeetoBaz Support Request');
    openLink(`mailto:${SUPPORT_EMAIL}?subject=${subjectText}`, `Please email us at ${SUPPORT_EMAIL}.`);
  }

  function createTicket() {
    const cleanSubject = subject.trim().replace(/\s+/g, ' ');
    const cleanMessage = message.trim();

    if (cleanSubject.length < 3) {
      Alert.alert('Subject required', 'Please enter a short subject for your issue.');
      return;
    }

    if (cleanMessage.length < 10) {
      Alert.alert('More details needed', 'Please explain the issue in at least 10 characters.');
      return;
    }

    const ticketId = `JB-${Date.now().toString().slice(-8)}`;
    const ticketSubject = encodeURIComponent(`[${ticketId}] ${cleanSubject}`);
    const ticketBody = encodeURIComponent(
      `Ticket ID: ${ticketId}\nName: ${userName}\nPhone: ${userPhone}\n\nIssue:\n${cleanMessage}`
    );

    openLink(
      `mailto:${SUPPORT_EMAIL}?subject=${ticketSubject}&body=${ticketBody}`,
      `Please email your issue to ${SUPPORT_EMAIL} and mention ticket ${ticketId}.`
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Help Center</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.intro}>
        <Text style={styles.introTitle}>How can we help?</Text>
        <Text style={styles.introText}>Contact JeetoBaz support or create a complaint ticket.</Text>
      </View>

      <View style={styles.contactSection}>
        <TouchableOpacity style={styles.contactRow} onPress={openWhatsApp}>
          <View style={[styles.contactIcon, styles.whatsAppIcon]}><Text style={styles.contactEmoji}>💬</Text></View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>WhatsApp</Text>
            <Text style={styles.contactValue}>{SUPPORT_PHONE_DISPLAY}</Text>
          </View>
          <Text style={styles.contactArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactRow} onPress={openEmail}>
          <View style={[styles.contactIcon, styles.emailIcon]}><Text style={styles.contactEmoji}>✉️</Text></View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Email</Text>
            <Text style={styles.contactValue}>{SUPPORT_EMAIL}</Text>
          </View>
          <Text style={styles.contactArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ticketSection}>
        <Text style={styles.sectionTitle}>Create Support Ticket</Text>
        <TextInput
          style={styles.input}
          placeholder="Issue subject"
          placeholderTextColor="#666"
          value={subject}
          onChangeText={setSubject}
          maxLength={80}
        />
        <TextInput
          style={[styles.input, styles.messageInput]}
          placeholder="Describe your issue in detail"
          placeholderTextColor="#666"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
          textAlignVertical="top"
        />
        <TouchableOpacity style={styles.ticketButton} onPress={createTicket}>
          <Text style={styles.ticketButtonText}>Submit Ticket</Text>
        </TouchableOpacity>
        <Text style={styles.ticketNote}>Your email app will open with the ticket details ready to send.</Text>
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
  intro: { padding: 24, alignItems: 'center' },
  introTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 6 },
  introText: { color: '#aaa', fontSize: 14, textAlign: 'center' },
  contactSection: { marginHorizontal: 15, gap: 10 },
  contactRow: { minHeight: 74, backgroundColor: '#1a1a1a', borderColor: '#333', borderWidth: 1, borderRadius: 8, padding: 14, flexDirection: 'row', alignItems: 'center' },
  contactIcon: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  whatsAppIcon: { backgroundColor: '#0d2b1a' },
  emailIcon: { backgroundColor: '#1a2b3d' },
  contactEmoji: { fontSize: 22 },
  contactInfo: { flex: 1 },
  contactTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 3 },
  contactValue: { color: '#aaa', fontSize: 13 },
  contactArrow: { color: '#666', fontSize: 26 },
  ticketSection: { margin: 15, paddingTop: 12, paddingBottom: 40 },
  sectionTitle: { color: 'white', fontSize: 19, fontWeight: 'bold', marginBottom: 14 },
  input: { backgroundColor: '#1a1a1a', borderColor: '#333', borderWidth: 1, borderRadius: 8, color: 'white', fontSize: 15, padding: 14, marginBottom: 12 },
  messageInput: { minHeight: 150 },
  ticketButton: { backgroundColor: '#FFD700', borderRadius: 8, padding: 16, alignItems: 'center' },
  ticketButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  ticketNote: { color: '#777', fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 10 },
});
