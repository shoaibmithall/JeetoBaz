import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import {
  Bell,
  CalendarClock,
  Car,
  ChevronDown,
  ChevronRight,
  Clock,
  CloudRain,
  FileWarning,
  Gift,
  Headphones,
  Home,
  IdCard,
  Info,
  MapPin,
  Package2,
  PackageX,
  Plane,
  Scale,
  Search,
  ShieldAlert,
  Truck,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { pageSchema } from '@/lib/structured-data';

const SHIPPING_FAQS = [
  {
    category: 'Overview',
    icon: Info,
    iconColor: '#3B82F6',
    question: 'Introduction',
    answer:
      'Welcome to JeetoBaz. JeetoBaz is committed to delivering prizes securely, fairly, and transparently to verified winners across Pakistan. This Shipping Policy explains how prizes are delivered, the verification process, delivery timelines, prize collection procedures, and the responsibilities of both JeetoBaz and prize winners.\n\nBy participating in any JeetoBaz draw, you agree to this Shipping Policy together with our Terms & Conditions, Privacy Policy, and other applicable platform policies.',
  },
  {
    category: 'Delivery',
    icon: MapPin,
    iconColor: '#10B981',
    question: 'Prize Delivery Coverage',
    answer:
      'JeetoBaz currently delivers prizes only within Pakistan. Nationwide delivery is available for eligible small and medium-sized prizes. International shipping is not available unless specifically announced by JeetoBaz.',
  },
  {
    category: 'Delivery',
    icon: Package2,
    iconColor: '#F59E0B',
    question: 'Types of Prize Delivery',
    answer:
      "Depending on the prize category, JeetoBaz may use one of the following delivery methods.\n\nA. Courier Delivery\nSmall and medium-sized prizes may be delivered directly to the verified winner through an authorized courier service, such as mobile phones, laptops, tablets, smart watches, earbuds, cameras, books, toys, home appliances, fashion items, gift boxes, and other eligible products.\n\nB. Physical Prize Collection\nHigh-value prizes may require physical collection from an official JeetoBaz office or another officially announced location, such as cars, motorcycles, houses, Umrah packages, travel packages, luxury prizes, and other premium rewards. JeetoBaz may also organize an official prize handover ceremony for selected high-value prizes.",
  },
  {
    category: 'Delivery',
    icon: Truck,
    iconColor: '#14B8A6',
    question: 'Free Shipping',
    answer:
      'JeetoBaz will bear the shipping cost for eligible courier-delivered prizes. Winners will not be charged any standard delivery fee for eligible prize shipments within Pakistan.',
  },
  {
    category: 'Verification',
    icon: IdCard,
    iconColor: '#8B5CF6',
    question: 'Winner Verification (Mandatory)',
    answer:
      'Before any prize is shipped or handed over, the selected winner must successfully complete the verification process, which may include a valid CNIC, registered mobile number verification, account verification, identity confirmation, proof of ownership where required, or additional documentation for premium prizes. JeetoBaz reserves the right to refuse delivery until verification has been successfully completed.',
  },
  {
    category: 'Verification',
    icon: Bell,
    iconColor: '#EC4899',
    question: 'Winner Notification',
    answer:
      'Once a winner is selected and verified, JeetoBaz will attempt to contact the winner using the registered contact information — via phone call, SMS, email, in-app notification, or official JeetoBaz announcements where appropriate. Participants are responsible for keeping their contact information accurate and up to date.',
  },
  {
    category: 'Claiming Your Prize',
    icon: CalendarClock,
    iconColor: '#F97316',
    question: 'Prize Claim Period',
    answer:
      'A winner must claim their prize within 7 calendar days from the date of the first official notification. If the winner does not respond within this period, JeetoBaz may make additional reasonable attempts to establish contact through available communication channels.',
  },
  {
    category: 'Claiming Your Prize',
    icon: PackageX,
    iconColor: '#EF4444',
    question: 'Failure to Claim a Prize',
    answer:
      "If the winner remains unreachable or does not complete the required verification after multiple contact attempts, the prize may no longer remain reserved indefinitely. JeetoBaz may provide a reasonable grace period where appropriate, and if there is still no response, the prize may be forfeited and handled according to JeetoBaz's internal prize management procedures or future draw plans. The specific handling of forfeited prizes shall remain at JeetoBaz's discretion while maintaining fairness and transparency.",
  },
  {
    category: 'Delivery',
    icon: Clock,
    iconColor: '#14B8A6',
    question: 'Delivery Time',
    answer:
      "After successful verification, small prizes are generally dispatched within 3–10 business days. Delivery times may vary depending on courier operations, destination, weather, public holidays, security conditions, or other circumstances beyond JeetoBaz's reasonable control. Premium prizes may require additional processing time.",
  },
  {
    category: 'Delivery',
    icon: MapPin,
    iconColor: '#3B82F6',
    question: 'Delivery Address',
    answer:
      'The winner must provide a complete and accurate delivery address. JeetoBaz is not responsible for delays caused by incorrect addresses, incomplete information, unavailable recipients, or incorrect phone numbers. Any additional delivery expenses resulting from incorrect information may become the responsibility of the winner.',
  },
  {
    category: 'Delivery Issues',
    icon: PackageX,
    iconColor: '#FF6B6B',
    question: 'Damaged Items During Delivery',
    answer:
      'If a courier-delivered prize arrives visibly damaged, the winner should report the issue to JeetoBaz as soon as reasonably possible after delivery. Supporting photographs or videos may be requested, and after verification, JeetoBaz may provide a replacement of the same item or an equivalent alternative where the original product is unavailable. Claims submitted after an unreasonable delay or where damage resulted after delivery may not be accepted.',
  },
  {
    category: 'Claiming Your Prize',
    icon: Gift,
    iconColor: '#FFD700',
    question: 'Large Prize Collection',
    answer:
      'For prizes requiring physical collection, the winner may be required to visit an official JeetoBaz location with an original CNIC, verification documents, winner confirmation, and any additional documents requested by JeetoBaz. Failure to appear within the applicable claim period may affect eligibility to receive the prize.',
  },
  {
    category: 'Special Prizes',
    icon: Home,
    iconColor: '#10B981',
    question: 'House Prize',
    answer:
      'For house prizes offered through JeetoBaz, the verified winner may select the preferred city from the options approved by JeetoBaz. JeetoBaz will arrange the house in accordance with the specific promotional campaign, applicable terms, availability, and legal requirements. The exact property specifications, location, and transfer process will be communicated separately to the winner.',
  },
  {
    category: 'Special Prizes',
    icon: Car,
    iconColor: '#F59E0B',
    question: 'Vehicle Registration, Taxes & Government Charges',
    answer:
      'For vehicles, houses, and other assets requiring legal registration or transfer, the winner shall be responsible for government taxes, registration fees, transfer charges, stamp duties, withholding taxes, and any other legally applicable government fees. Unless expressly stated otherwise in a specific promotional campaign, these expenses are not included in the prize.',
  },
  {
    category: 'Special Prizes',
    icon: Plane,
    iconColor: '#8B5CF6',
    question: 'Umrah & Travel Prizes',
    answer:
      'For Umrah packages and travel-related prizes, delivery and booking are subject to passport validity, visa approval, government regulations, airline availability, travel agency requirements, and Saudi Arabian or destination country regulations. JeetoBaz cannot guarantee travel where governmental or immigration authorities decline approval.',
  },
  {
    category: 'Legal',
    icon: CloudRain,
    iconColor: '#3B82F6',
    question: 'Force Majeure',
    answer:
      'JeetoBaz shall not be liable for delays or failure to deliver prizes caused by circumstances beyond its reasonable control, including but not limited to natural disasters, floods, earthquakes, political unrest, government restrictions, war, pandemics, courier disruptions, or transportation failures.',
  },
  {
    category: 'Fraud & Security',
    icon: ShieldAlert,
    iconColor: '#EF4444',
    question: 'Fraud Prevention',
    answer:
      'JeetoBaz reserves the right to delay, suspend, or refuse prize delivery where there is evidence of identity fraud, false documentation, multiple fake accounts, manipulation of the draw system, violation of JeetoBaz policies, or any unlawful activity. Where necessary, JeetoBaz may report suspected fraud to the relevant authorities.',
  },
  {
    category: 'Legal',
    icon: Scale,
    iconColor: '#F97316',
    question: 'Limitation of Liability',
    answer:
      'Once a prize has been successfully delivered or officially handed over to the verified winner, responsibility for the prize transfers to the winner, except where consumer protection laws provide otherwise. JeetoBaz is not responsible for loss caused by misuse of the prize, damage occurring after successful delivery, or warranty claims handled directly by the manufacturer where applicable.',
  },
  {
    category: 'Policy & Support',
    icon: FileWarning,
    iconColor: '#FFD700',
    question: 'Policy Updates',
    answer:
      'JeetoBaz may update this Shipping Policy from time to time to reflect operational improvements, legal requirements, courier changes, security enhancements, or platform updates. The latest version will always be available on the official JeetoBaz website and mobile application.',
  },
  {
    category: 'Policy & Support',
    icon: Headphones,
    iconColor: '#14B8A6',
    question: 'Contact Support',
    answer:
      'For delivery-related questions or prize collection assistance, please contact JeetoBaz Support through the official support channels available on the JeetoBaz website or mobile application. When contacting support, please include your registered mobile number, winner ID (if available), prize name, draw reference, delivery address (if applicable), a description of the issue, and supporting photos or documents if required. This information helps us process your request efficiently.',
  },
] as const;

export default function ShippingPolicyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const { theme } = useAppTheme();
  const [query, setQuery] = useState('');
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return SHIPPING_FAQS;
    return SHIPPING_FAQS.filter(
      (item) =>
        item.question.toLowerCase().includes(search) ||
        item.answer.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search),
    );
  }, [query]);

  const shippingSchema = pageSchema('WebPage', '/shipping-policy', 'Shipping Policy', 'Review the JeetoBaz Shipping Policy covering prize delivery, winner verification, delivery timelines, and prize collection procedures.');
  return (
    <>
    <Head>
      <title>Shipping Policy | JeetoBaz</title>
      <meta name="robots" content="index, follow" />
      <meta name="description" content="Review the JeetoBaz Shipping Policy covering prize delivery, winner verification, delivery timelines, and prize collection procedures." />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Shipping Policy | JeetoBaz" />
      <meta property="og:description" content="Review the JeetoBaz Shipping Policy covering prize delivery, winner verification, delivery timelines, and prize collection procedures." />
      <meta property="og:url" content="https://jeetobaz.pk/shipping-policy" />
      <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
      <meta property="og:image:alt" content="JeetoBaz — Pakistan's trusted prize draw platform" />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content="Shipping Policy | JeetoBaz" />
      <meta name="twitter:description" content="Review the JeetoBaz Shipping Policy covering prize delivery, winner verification, delivery timelines, and prize collection procedures." />
      <meta name="twitter:image" content="https://jeetobaz.pk/twitter-image.png" />
      <link rel="canonical" href="https://jeetobaz.pk/shipping-policy" />
      <script type="application/ld+json">{JSON.stringify(shippingSchema)}</script>
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
          <Truck color={theme.gold} size={22} />
          <Text style={[styles.headerTitle, { color: theme.gold }]}>Shipping Policy</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.hero}>
        <Text role="heading" aria-level={1} style={[styles.heroTitle, { color: theme.gold }]}>Shipping Policy</Text>
        <Text style={[styles.heroText, { color: theme.muted }]}>
          JeetoBaz currently delivers prizes only within Pakistan. Please read this policy carefully.
        </Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Search color={theme.subtle} size={20} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search this policy..."
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
          <Text style={[styles.emptyTitle, { color: theme.gold }]}>No matching section found</Text>
          <TouchableOpacity onPress={() => router.push('/help')}>
            <Text style={[styles.helpLink, { color: theme.primary }]}>Open Help Center</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={[styles.finalBox, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
        <Text style={[styles.finalText, { color: theme.primary }]}>
          By participating in JeetoBaz draws, you confirm that you have read, understood, and agreed to this Shipping Policy.
        </Text>
      </View>

      <Text style={[styles.lastUpdated, { color: theme.subtle }]}>Last Updated: 2026</Text>
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
  answer: { fontSize: 14, lineHeight: 22 },
  empty: { alignItems: 'center', padding: 35 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  helpLink: { fontSize: 15, fontWeight: '700', marginTop: 12 },
  finalBox: { borderRadius: 12, padding: 15, marginHorizontal: 15, marginTop: 10, borderWidth: 1 },
  finalText: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  lastUpdated: { fontSize: 12, marginTop: 18, marginBottom: 4, textAlign: 'center' },
});
