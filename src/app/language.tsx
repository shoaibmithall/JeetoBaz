import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { LANGUAGE_OPTIONS, useLanguage, type LanguageCode } from '@/lib/i18n';
import { Check } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';

const SAMPLE_TEXT: Record<LanguageCode, string> = {
  en: 'JeetoBaz will use English across the app.',
  ur: 'JeetoBaz ایپ میں اردو استعمال کرے گا۔',
  roman: 'JeetoBaz app mein Roman Urdu use hogi.',
};

export default function LanguageScreen() {
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const { theme } = useAppTheme();

  async function chooseLanguage(code: LanguageCode) {
    await setLanguage(code);
    router.back();
  }

  return (
    <>
    <Head>
      <title>Language | JeetoBaz</title>
    </Head>
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: theme.primary }]}>← {t('back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.gold }]}>{t('language')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.heading, { color: theme.text }]}>{t('selectLanguage')}</Text>
        <Text style={[styles.hint, { color: theme.muted }]}>{t('languageHint')}</Text>

        {LANGUAGE_OPTIONS.map((option) => {
          const selected = language === option.code;
          return (
            <TouchableOpacity
              key={option.code}
              style={[styles.option, { backgroundColor: selected ? theme.selected : theme.surface, borderColor: selected ? theme.gold : theme.border }]}
              onPress={() => chooseLanguage(option.code)}
            >
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>{option.label}</Text>
                <Text style={[styles.optionSubtitle, { color: theme.primary }]}>{option.nativeLabel}</Text>
                <Text style={[styles.sample, { color: theme.muted }]}>{SAMPLE_TEXT[option.code]}</Text>
              </View>
              <View style={[styles.check, { borderColor: selected ? theme.gold : theme.border }, selected && { backgroundColor: theme.gold }]}>
                {selected ? <Check color="#000" size={18} strokeWidth={3} /> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  header: { backgroundColor: '#04140e', borderBottomColor: '#FFD700', borderBottomWidth: 2, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { color: '#18a663', fontSize: 16, fontWeight: 'bold' },
  title: { color: '#FFD700', fontSize: 20, fontWeight: 'bold' },
  headerSpacer: { width: 70 },
  content: { padding: 20, paddingBottom: 50 },
  heading: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  hint: { color: '#aaa', fontSize: 14, lineHeight: 21, marginBottom: 20 },
  option: { backgroundColor: '#071b13', borderColor: '#174a35', borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  optionSelected: { borderColor: '#FFD700', backgroundColor: '#2a2105' },
  optionText: { flex: 1 },
  optionTitle: { color: 'white', fontSize: 17, fontWeight: 'bold' },
  optionSubtitle: { color: '#18a663', fontSize: 14, marginTop: 4 },
  sample: { color: '#aaa', fontSize: 13, lineHeight: 19, marginTop: 8 },
  check: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#444', alignItems: 'center', justifyContent: 'center' },
  checkSelected: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
});
