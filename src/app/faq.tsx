import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Headphones,
  Search,
  ShieldCheck,
  TicketCheck,
  Trophy,
  UserRound,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';

const FAQS = [
  {
    category: 'Getting Started',
    icon: UserRound,
    iconColor: '#EC4899',
    question: 'Who can participate in JeetoBaz draws?',
    answer: 'JeetoBaz participation is for eligible users in Pakistan who are 18 years or older and accept the Terms and Privacy Policy.',
  },
  {
    category: 'Getting Started',
    icon: TicketCheck,
    iconColor: '#10B981',
    question: 'How do I enter a draw?',
    answer: 'Open an active draw, review its entry fee and available spots, make the payment, upload a clear receipt, and submit it for verification.',
  },
  {
    category: 'Entries',
    icon: TicketCheck,
    iconColor: '#3B82F6',
    question: 'When is my entry confirmed?',
    answer: 'Your entry is confirmed only after JeetoBaz verifies the payment. You can check its latest status under My Entries.',
  },
  {
    category: 'Entries',
    icon: TicketCheck,
    iconColor: '#8B5CF6',
    question: 'Can I enter the same draw more than once?',
    answer: 'No. JeetoBaz currently allows one approved entry per person for each draw.',
  },
  {
    category: 'Payments',
    icon: CreditCard,
    iconColor: '#F59E0B',
    question: 'Which payment methods are available?',
    answer: 'The payment screen shows the currently supported JazzCash, Easypaisa, and bank transfer details. Always use the account details displayed inside JeetoBaz.',
  },
  {
    category: 'Payments',
    icon: CreditCard,
    iconColor: '#FF6B6B',
    question: 'Why is my payment still pending?',
    answer: 'Pending means the receipt is waiting for review. Keep your transaction ID and upload a clear receipt showing the amount, date, and reference.',
  },
  {
    category: 'Payments',
    icon: CreditCard,
    iconColor: '#14B8A6',
    question: 'Are entry fees refundable?',
    answer: 'Confirmed entry fees are non-refundable. If JeetoBaz cancels a draw, the applicable refund is processed according to the Terms & Conditions.',
  },
  {
    category: 'Draws & Winners',
    icon: Trophy,
    iconColor: '#FFD700',
    question: 'When does a draw take place?',
    answer: 'JeetoBaz announces the draw date and time after the required spots are filled. Check the app notifications and draw details for the latest schedule.',
  },
  {
    category: 'Draws & Winners',
    icon: ShieldCheck,
    iconColor: '#10B981',
    question: 'How is the winner selected?',
    answer: 'The winner is selected randomly from eligible approved entries by the JeetoBaz draw system. Completed results are locked and recorded.',
  },
  {
    category: 'Draws & Winners',
    icon: Trophy,
    iconColor: '#F97316',
    question: 'How will a winner receive the prize?',
    answer: 'JeetoBaz contacts the winner using the registered details. After verification, prize delivery or pickup is arranged. The prize must be claimed within the period stated in the Terms.',
  },
  {
    category: 'Account & Security',
    icon: ShieldCheck,
    iconColor: '#EC4899',
    question: 'How does JeetoBaz use my information?',
    answer: 'Information is used to manage your profile, verify payments, process entries, contact winners, provide support, and prevent fraud. See Privacy & Account Data for full details.',
  },
  {
    category: 'Support',
    icon: Headphones,
    iconColor: '#14B8A6',
    question: 'What should I do if I still need help?',
    answer: 'Open Help Center from the main menu to contact JeetoBaz through WhatsApp or email, or submit a support ticket with your issue details.',
  },
] as const;

export default function FaqScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const { theme } = useAppTheme();
  const [query, setQuery] = useState('');
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return FAQS;
    return FAQS.filter(
      (item) =>
        item.question.toLowerCase().includes(search) ||
        item.answer.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search),
    );
  }, [query]);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <TouchableOpacity onPress={() => params.source === 'profile' ? router.replace('/login') : router.back()}>
          <Text style={[styles.back, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <CircleHelp color={theme.gold} size={22} />
          <Text style={[styles.headerTitle, { color: theme.gold }]}>FAQ</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.hero}>
        <Text style={[styles.heroTitle, { color: theme.gold }]}>How can we help?</Text>
        <Text style={[styles.heroText, { color: theme.muted }]}>
          Quick answers about entries, payments, draws, winners, and account security.
        </Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Search color={theme.subtle} size={20} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search questions..."
          placeholderTextColor={theme.subtle}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      <View style={styles.list}>
        {filteredFaqs.map((item) => {
          const expanded = openQuestion === item.question;
          const Icon = item.icon;
          return (
            <View
              key={item.question}
              style={[styles.card, { backgroundColor: theme.surface, borderColor: expanded ? theme.gold : theme.border }]}
            >
              <TouchableOpacity
                style={styles.questionRow}
                onPress={() => setOpenQuestion(expanded ? null : item.question)}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
              >
                <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
                  <Icon color={item.iconColor} size={20} />
                </View>
                <View style={styles.questionCopy}>
                  <Text style={[styles.category, { color: theme.primary }]}>{item.category}</Text>
                  <Text style={[styles.question, { color: theme.gold }]}>{item.question}</Text>
                </View>
                {expanded ? (
                  <ChevronDown color={theme.gold} size={21} />
                ) : (
                  <ChevronRight color={theme.subtle} size={21} />
                )}
              </TouchableOpacity>
              {expanded ? (
                <View style={[styles.answerBox, { borderTopColor: theme.border }]}>
                  <Text style={[styles.answer, { color: theme.muted }]}>{item.answer}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {filteredFaqs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: theme.gold }]}>No matching question found</Text>
          <TouchableOpacity onPress={() => router.push('/help')}>
            <Text style={[styles.helpLink, { color: theme.primary }]}>Open Help Center</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 40 },
  header: { borderBottomWidth: 2, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { fontSize: 16, fontWeight: '700' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSpacer: { width: 48 },
  hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20 },
  heroTitle: { fontSize: 27, fontWeight: '800', textAlign: 'center' },
  heroText: { fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 620, marginTop: 7 },
  searchBox: { marginHorizontal: 15, borderWidth: 1, borderRadius: 12, minHeight: 52, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 12, outlineStyle: 'none' } as never,
  list: { margin: 15, gap: 10 },
  card: { borderWidth: 1, borderRadius: 13, overflow: 'hidden' },
  questionRow: { minHeight: 78, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  questionCopy: { flex: 1 },
  category: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  question: { fontSize: 15, fontWeight: '700', lineHeight: 21 },
  answerBox: { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 15 },
  answer: { fontSize: 14, lineHeight: 22 },
  empty: { alignItems: 'center', padding: 35 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  helpLink: { fontSize: 15, fontWeight: '700', marginTop: 12 },
});
