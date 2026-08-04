import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import {
  Clock,
  Dices,
  History,
  Lock,
  ShieldCheck,
  Ticket,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { pageSchema } from '@/lib/structured-data';

const PILLARS = [
  {
    icon: Dices,
    iconColor: '#18a663',
    title: 'True Random Selection',
    text: 'Winners are chosen by a genuinely random process — not picked, guessed, or influenced by anyone. No human selects who wins.',
  },
  {
    icon: Clock,
    iconColor: '#FFD700',
    title: 'Time-Locked Draws',
    text: 'Draws can only run inside a fixed daily window (10:00–10:59 PM Pakistan time), enforced by the system itself — not by admin discretion.',
  },
  {
    icon: Lock,
    iconColor: '#ff4444',
    title: 'Locked, Immutable Results',
    text: 'Once a draw completes, the result is permanently recorded and can never be changed afterward — not even by JeetoBaz.',
  },
  {
    icon: History,
    iconColor: '#4a9eff',
    title: 'Full Audit Trail',
    text: 'Every draw, and every important action taken around it, is permanently logged with a timestamp for accountability.',
  },
  {
    icon: Ticket,
    iconColor: '#EC4899',
    title: 'Publicly Verifiable',
    text: 'Anyone can verify a ticket’s status or a draw’s result directly in the app — you never have to just take our word for it.',
  },
] as const;

export default function WhyFairScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const { theme } = useAppTheme();

  const schema = pageSchema('WebPage', '/why-fair', 'Why JeetoBaz is Fair', 'How JeetoBaz guarantees fair, random, and verifiable prize draws — true randomness, time-locked draws, immutable results, and a full audit trail.');

  return (
    <>
    <Head>
      <title>Why JeetoBaz is Fair | JeetoBaz</title>
      <meta name="robots" content="index, follow" />
      <meta name="description" content="How JeetoBaz guarantees fair, random, and verifiable prize draws — true randomness, time-locked draws, immutable results, and a full audit trail." />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Why JeetoBaz is Fair | JeetoBaz" />
      <meta property="og:description" content="How JeetoBaz guarantees fair, random, and verifiable prize draws." />
      <meta property="og:url" content="https://jeetobaz.pk/why-fair" />
      <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
      <meta property="og:image:alt" content="JeetoBaz — Pakistan's trusted prize draw platform" />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta property="og:locale" content="en_PK" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content="Why JeetoBaz is Fair | JeetoBaz" />
      <meta name="twitter:description" content="How JeetoBaz guarantees fair, random, and verifiable prize draws." />
      <meta name="twitter:image" content="https://jeetobaz.pk/twitter-image.png" />
      <link rel="canonical" href="https://jeetobaz.pk/why-fair" />
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Head>
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <TouchableOpacity onPress={() => params.source === 'profile' ? router.replace('/login') : router.back()}>
          <Text style={[styles.back, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <ShieldCheck color={theme.gold} size={22} />
          <Text style={[styles.headerTitle, { color: theme.gold }]}>Why JeetoBaz is Fair</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.hero}>
        <Text role="heading" aria-level={1} style={[styles.heroTitle, { color: theme.gold }]}>Fair by Design</Text>
        <Text style={[styles.heroText, { color: theme.muted }]}>
          JeetoBaz draws are built to be trusted, not just claimed. Here is exactly how.
        </Text>
      </View>

      <View style={styles.list}>
        {PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <View key={pillar.title} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
                <Icon color={pillar.iconColor} size={22} />
              </View>
              <View style={styles.cardCopy}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{pillar.title}</Text>
                <Text style={[styles.cardText, { color: theme.muted }]}>{pillar.text}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={[styles.ctaCard, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
        <Text style={[styles.ctaTitle, { color: theme.text }]}>See it for yourself</Text>
        <Text style={[styles.ctaText, { color: theme.muted }]}>
          Check any ticket's status, or browse every verified past winner — no need to trust a claim.
        </Text>
        <View style={styles.ctaRow}>
          <TouchableOpacity style={[styles.ctaButton, { backgroundColor: theme.gold }]} onPress={() => router.push('/verify-ticket')}>
            <Text style={styles.ctaButtonText}>Verify a Ticket</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ctaSecondaryButton, { borderColor: theme.primary }]} onPress={() => router.push('/explore')}>
            <Text style={[styles.ctaSecondaryButtonText, { color: theme.primary }]}>Past Winners</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSpacer: { width: 48 },
  hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20 },
  heroTitle: { fontSize: 27, fontWeight: '800', textAlign: 'center' },
  heroText: { fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 560, marginTop: 7 },
  list: { margin: 15, gap: 10 },
  card: { borderWidth: 1, borderRadius: 15, padding: 16, flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardText: { fontSize: 14, lineHeight: 21 },
  ctaCard: { marginHorizontal: 15, marginTop: 5, borderRadius: 18, padding: 22, borderWidth: 1, alignItems: 'center' },
  ctaTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  ctaText: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 16 },
  ctaRow: { flexDirection: 'row', gap: 10, width: '100%' },
  ctaButton: { flex: 1, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaButtonText: { fontSize: 14, fontWeight: '800', color: '#000' },
  ctaSecondaryButton: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ctaSecondaryButtonText: { fontSize: 14, fontWeight: '800' },
});
