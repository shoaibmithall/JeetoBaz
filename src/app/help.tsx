import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Mail, MessageCircle } from 'lucide-react-native';
import { getStoredValue } from '@/lib/storage';
import { useLanguage } from '@/lib/i18n';
import { useAppTheme } from '@/hooks/use-theme';

const SUPPORT_PHONE_DISPLAY = '+92 337 2561482';
const SUPPORT_PHONE = '923372561482';
const SUPPORT_EMAIL = 'complaintsjeetobaz@gmail.com';

export default function HelpCenterScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const router = useRouter();
  const { language, t } = useLanguage();
  const { theme } = useAppTheme();

  useEffect(() => {
    Promise.all([getStoredValue('userName'), getStoredValue('userPhone')]).then(([name, phone]) => {
      setUserName(name || t('notProvided'));
      setUserPhone(phone || t('notProvided'));
    });
  }, [language]);

  async function openLink(url: string, errorMessage: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open', errorMessage);
    }
  }

  function openWhatsApp() {
    const messages = {
      en: 'Hello, I need help with JeetoBaz.',
      ur: 'السلام علیکم، مجھے JeetoBaz کے بارے میں مدد چاہیے۔',
      roman: 'Assalam-o-Alaikum, mujhe JeetoBaz mein help chahiye.',
    };
    const text = encodeURIComponent(messages[language]);
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
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} keyboardShouldPersistTaps="handled">
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: theme.primary }]}>← {t('back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.gold }]}>{t('helpCenter')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.intro}>
        <Text style={[styles.introTitle, { color: theme.text }]}>{t('helpIntroTitle')}</Text>
        <Text style={[styles.introText, { color: theme.muted }]}>{t('supportIntro')}</Text>
      </View>

      <View style={styles.contactSection}>
        <TouchableOpacity style={[styles.contactRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={openWhatsApp}>
          <View style={[styles.contactIcon, { backgroundColor: theme.primarySoft }]}><MessageCircle color="#25D366" size={23} /></View>
          <View style={styles.contactInfo}>
            <Text style={[styles.contactTitle, { color: theme.text }]}>WhatsApp</Text>
            <Text style={[styles.contactValue, { color: theme.muted }]}>{SUPPORT_PHONE_DISPLAY}</Text>
          </View>
          <ChevronRight color={theme.subtle} size={22} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.contactRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={openEmail}>
          <View style={[styles.contactIcon, { backgroundColor: theme.infoSoft }]}><Mail color={theme.info} size={23} /></View>
          <View style={styles.contactInfo}>
            <Text style={[styles.contactTitle, { color: theme.text }]}>Email</Text>
            <Text style={[styles.contactValue, { color: theme.muted }]}>{SUPPORT_EMAIL}</Text>
          </View>
          <ChevronRight color={theme.subtle} size={22} />
        </TouchableOpacity>
      </View>

      <View style={styles.ticketSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('supportTicket')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          placeholder={t('issueSubject')}
          accessibilityLabel={t('issueSubject')}
          placeholderTextColor={theme.subtle}
          value={subject}
          onChangeText={setSubject}
          maxLength={80}
        />
        <TextInput
          style={[styles.input, styles.messageInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          placeholder={t('describeIssue')}
          accessibilityLabel={t('describeIssue')}
          placeholderTextColor={theme.subtle}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
          textAlignVertical="top"
        />
        <TouchableOpacity style={[styles.ticketButton, { backgroundColor: theme.gold }]} onPress={createTicket}>
          <Text style={[styles.ticketButtonText, { color: theme.buttonText }]}>{t('submitTicket')}</Text>
        </TouchableOpacity>
        <Text style={[styles.ticketNote, { color: theme.subtle }]}>{t('emailAppTicket')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  header: { backgroundColor: '#04140e', borderBottomColor: '#FFD700', borderBottomWidth: 2, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { color: '#18a663', fontSize: 16, fontWeight: 'bold' },
  title: { color: '#FFD700', fontSize: 20, fontWeight: 'bold' },
  headerSpacer: { width: 48 },
  intro: { padding: 24, alignItems: 'center' },
  introTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 6 },
  introText: { color: '#aaa', fontSize: 14, textAlign: 'center' },
  contactSection: { marginHorizontal: 15, gap: 10 },
  contactRow: { minHeight: 74, backgroundColor: '#071b13', borderColor: '#174a35', borderWidth: 1, borderRadius: 8, padding: 14, flexDirection: 'row', alignItems: 'center' },
  contactIcon: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  whatsAppIcon: { backgroundColor: '#082d1e' },
  emailIcon: { backgroundColor: '#1a2b3d' },
  contactInfo: { flex: 1 },
  contactTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 3 },
  contactValue: { color: '#aaa', fontSize: 13 },
  ticketSection: { margin: 15, paddingTop: 12, paddingBottom: 40 },
  sectionTitle: { color: 'white', fontSize: 19, fontWeight: 'bold', marginBottom: 14 },
  input: { backgroundColor: '#071b13', borderColor: '#174a35', borderWidth: 1, borderRadius: 8, color: 'white', fontSize: 15, padding: 14, marginBottom: 12 },
  messageInput: { minHeight: 150 },
  ticketButton: { backgroundColor: '#FFD700', borderRadius: 8, padding: 16, alignItems: 'center' },
  ticketButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  ticketNote: { color: '#777', fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 10 },
});
