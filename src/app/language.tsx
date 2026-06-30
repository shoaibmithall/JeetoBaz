import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LANGUAGE_OPTIONS, useLanguage, type LanguageCode } from '@/lib/i18n';
import { Check } from 'lucide-react-native';

const SAMPLE_TEXT: Record<LanguageCode, string> = {
  en: 'JeetoBaz will use English across the app.',
  ur: 'JeetoBaz ایپ میں اردو استعمال کرے گا۔',
  roman: 'JeetoBaz app mein Roman Urdu use hogi.',
};

export default function LanguageScreen() {
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();

  async function chooseLanguage(code: LanguageCode) {
    await setLanguage(code);
    router.back();
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← {t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('language')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>{t('selectLanguage')}</Text>
        <Text style={styles.hint}>{t('languageHint')}</Text>

        {LANGUAGE_OPTIONS.map((option) => {
          const selected = language === option.code;
          return (
            <TouchableOpacity
              key={option.code}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => chooseLanguage(option.code)}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{option.label}</Text>
                <Text style={styles.optionSubtitle}>{option.nativeLabel}</Text>
                <Text style={styles.sample}>{SAMPLE_TEXT[option.code]}</Text>
              </View>
              <View style={[styles.check, selected && styles.checkSelected]}>
                {selected ? <Check color="#000" size={18} strokeWidth={3} /> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { backgroundColor: '#1a1a1a', borderBottomColor: '#FFD700', borderBottomWidth: 2, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { color: '#1DB954', fontSize: 16, fontWeight: 'bold' },
  title: { color: '#FFD700', fontSize: 20, fontWeight: 'bold' },
  headerSpacer: { width: 70 },
  content: { padding: 20, paddingBottom: 50 },
  heading: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  hint: { color: '#aaa', fontSize: 14, lineHeight: 21, marginBottom: 20 },
  option: { backgroundColor: '#1a1a1a', borderColor: '#333', borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  optionSelected: { borderColor: '#FFD700', backgroundColor: '#2b2200' },
  optionText: { flex: 1 },
  optionTitle: { color: 'white', fontSize: 17, fontWeight: 'bold' },
  optionSubtitle: { color: '#1DB954', fontSize: 14, marginTop: 4 },
  sample: { color: '#aaa', fontSize: 13, lineHeight: 19, marginTop: 8 },
  check: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#444', alignItems: 'center', justifyContent: 'center' },
  checkSelected: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
});
