import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import {
  Award,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Headphones,
  Scale,
  Search,
  ShieldCheck,
  Smartphone,
  TicketCheck,
  Trophy,
  UserRound,
  UsersRound,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { breadcrumbSchema, pageSchema } from '@/lib/structured-data';

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
    category: 'Draws & Winners',
    icon: ShieldCheck,
    iconColor: '#18a663',
    question: 'Is JeetoBaz legit?',
    answer: 'JeetoBaz uses verified payments, identity checks on winners, and a locked, immutable draw process. See the "Why JeetoBaz is Fair" page for a full breakdown of how each draw is kept fair and verifiable.',
  },
  {
    category: 'Draws & Winners',
    icon: ShieldCheck,
    iconColor: '#3B82F6',
    question: 'How do I know a draw wasn’t rigged?',
    answer: 'The winner is selected randomly from eligible approved entries, and once a draw completes, the result is locked and cannot be changed — not even by JeetoBaz. Full details are on the "Why JeetoBaz is Fair" page.',
  },
  {
    category: 'Account & Security',
    icon: UserRound,
    iconColor: '#3B82F6',
    question: 'Why do I need to verify my phone number?',
    answer: 'Phone verification helps protect your account, prevents duplicate registrations, and allows us to contact you if you win.',
  },
  {
    category: 'Account & Security',
    icon: UserRound,
    iconColor: '#8B5CF6',
    question: 'I didn’t receive my OTP. What should I do?',
    answer: 'Wait a few minutes and check your mobile signal, then request a new OTP. If the problem continues, contact JeetoBaz Support.',
  },
  {
    category: 'Account & Security',
    icon: UserRound,
    iconColor: '#F97316',
    question: 'Can I have more than one JeetoBaz account?',
    answer: 'No. Multiple accounts created by the same person may be suspended to keep participation fair for everyone.',
  },
  {
    category: 'Account & Security',
    icon: ShieldCheck,
    iconColor: '#18a663',
    question: 'Will JeetoBaz ever ask for my OTP or password?',
    answer: 'No. JeetoBaz will never ask for your OTP or password by phone, message, or email. Never share them with anyone.',
  },
  {
    category: 'Entries',
    icon: TicketCheck,
    iconColor: '#10B981',
    question: 'Where can I see my purchased entries?',
    answer: 'Open My Entries from your profile to view all your active and past entries.',
  },
  {
    category: 'Entries',
    icon: TicketCheck,
    iconColor: '#FF6B6B',
    question: 'Can I cancel an entry after payment?',
    answer: 'No. Once an entry is confirmed, it cannot be cancelled. See the Refund & Cancellation Policy for exceptions.',
  },
  {
    category: 'Draws & Winners',
    icon: Trophy,
    iconColor: '#4a9eff',
    question: 'Can I watch the draw live?',
    answer: 'Live draws or recorded draw videos are published whenever available for a campaign.',
  },
  {
    category: 'Draws & Winners',
    icon: Trophy,
    iconColor: '#EC4899',
    question: 'What happens if a draw is delayed?',
    answer: 'You’ll be notified in the app if a draw’s schedule changes.',
  },
  {
    category: 'Draws & Winners',
    icon: ShieldCheck,
    iconColor: '#F59E0B',
    question: 'What documents are required to claim a prize?',
    answer: 'Winners may be asked for a valid CNIC or B-Form (where applicable), phone verification, and any other document required by law before a prize is released.',
  },
  {
    category: 'Draws & Winners',
    icon: ShieldCheck,
    iconColor: '#8B5CF6',
    question: 'Can someone else collect my prize on my behalf?',
    answer: 'In most cases the registered winner must complete verification before collection. Additional authorization may be required for anyone collecting on their behalf.',
  },
  {
    category: 'Payments',
    icon: CreditCard,
    iconColor: '#18a663',
    question: 'Is my payment information secure?',
    answer: 'Yes. JeetoBaz uses secure payment verification and does not store your banking credentials.',
  },
  {
    category: 'Payments',
    icon: CreditCard,
    iconColor: '#EC4899',
    question: 'What if I accidentally pay twice for the same entry?',
    answer: 'Contact JeetoBaz Support immediately with your payment proof so it can be reviewed.',
  },
  {
    category: 'Referral Program',
    icon: UsersRound,
    iconColor: '#18a663',
    question: 'How does Refer & Earn work?',
    answer: 'Share your referral code with friends. Eligible rewards are credited according to the current Refer & Earn program rules.',
  },
  {
    category: 'Referral Program',
    icon: UsersRound,
    iconColor: '#FF6B6B',
    question: 'Can I refer myself using another account?',
    answer: 'No. Self-referrals and fraudulent referrals are not allowed and may result in the reward being reversed.',
  },
  {
    category: 'Certificates',
    icon: Award,
    iconColor: '#FFD700',
    question: 'What is a Winner Certificate?',
    answer: 'A digital certificate confirming your prize win, available for verified winners to download from My Certificates.',
  },
  {
    category: 'Prize Campaigns',
    icon: Trophy,
    iconColor: '#3B82F6',
    question: 'Where can I find the details of a specific prize?',
    answer: 'Every campaign page lists the prize details, entry price, closing date, and terms for that specific draw — always check the campaign page for the most accurate information.',
  },
  {
    category: 'Prize Campaigns',
    icon: Trophy,
    iconColor: '#8B5CF6',
    question: 'Can I participate in multiple prize campaigns?',
    answer: 'Yes. You can enter as many active campaigns as you’d like.',
  },
  {
    category: 'Technical',
    icon: Smartphone,
    iconColor: '#4a9eff',
    question: 'Which devices are supported?',
    answer: 'JeetoBaz is available as a website that works on modern mobile and desktop browsers.',
  },
  {
    category: 'Technical',
    icon: Smartphone,
    iconColor: '#F97316',
    question: 'JeetoBaz isn’t working properly. What should I do?',
    answer: 'Refresh the page, check your internet connection, and contact support if the issue continues.',
  },
  {
    category: 'Legal',
    icon: Scale,
    iconColor: '#6366F1',
    question: 'How old do I need to be to participate?',
    answer: 'Participants must be 18 years or older and meet the eligibility requirements in the Terms & Conditions.',
  },
  {
    category: 'Legal',
    icon: Scale,
    iconColor: '#EC4899',
    question: 'Where can I read the official rules?',
    answer: 'The complete rules are in the Terms & Conditions, Privacy Policy, Refund & Cancellation Policy, and Shipping Policy.',
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

  const faqSchema = pageSchema('FAQPage', '/faq', 'Frequently Asked Questions', 'Find clear answers to frequently asked questions about JeetoBaz accounts, prize campaigns, entries, payments, draws, winners, and platform support.');
  const breadcrumb = breadcrumbSchema([{ name: 'Frequently Asked Questions', path: '/faq' }]);
  faqSchema.mainEntity = FAQS.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  }));
  return (
    <>
    <Head>
      <title>Frequently Asked Questions | JeetoBaz</title>
      <meta name="robots" content="index, follow" />
      <meta name="description" content="Find clear answers to frequently asked questions about JeetoBaz accounts, prize campaigns, entries, payments, draws, winners, and platform support." />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Frequently Asked Questions | JeetoBaz" />
      <meta property="og:description" content="Find clear answers to frequently asked questions about JeetoBaz accounts, prize campaigns, entries, payments, draws, winners, and platform support." />
      <meta property="og:url" content="https://jeetobaz.pk/faq" />
      <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
      <meta property="og:image:alt" content="JeetoBaz — Pakistan's trusted prize draw platform" />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta property="og:locale" content="en_PK" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content="Frequently Asked Questions | JeetoBaz" />
      <meta name="twitter:description" content="Find clear answers to frequently asked questions about JeetoBaz accounts, prize campaigns, entries, payments, draws, winners, and platform support." />
      <meta name="twitter:image" content="https://jeetobaz.pk/twitter-image.png" />
      <link rel="canonical" href="https://jeetobaz.pk/faq" />
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
    </Head>
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
        <Text role="heading" aria-level={1} style={[styles.heroTitle, { color: theme.gold }]}>How can we help?</Text>
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
              {/*
                Always mounted, visibility toggled via `display` rather than conditionally
                rendering `null` -- the static export always starts with every question collapsed,
                so conditional mounting meant every FAQ answer was completely absent from the HTML
                crawlers receive (same bug found and fixed in the footer accordion). `display: none`
                keeps the exact same collapsed-by-default UX with zero visual change.
              */}
              <View style={[styles.answerBox, { borderTopColor: theme.border }, !expanded && styles.answerBoxHidden]}>
                <Text style={[styles.answer, { color: theme.muted }]}>{item.answer}</Text>
              </View>
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
    </>
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
  answerBoxHidden: { display: 'none' },
  answer: { fontSize: 14, lineHeight: 22 },
  empty: { alignItems: 'center', padding: 35 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  helpLink: { fontSize: 15, fontWeight: '700', marginTop: 12 },
});
