import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { ArrowLeft, BadgeCheck, ChevronRight, CircleHelp, Scale, ShieldCheck } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { breadcrumbSchema, pageSchema } from '@/lib/structured-data';
import { useSafeBack } from '@/lib/safe-back';

const TRANSPARENCY_LINKS = [
  {
    href: '/why-fair',
    icon: Scale,
    title: 'Why JeetoBaz is Fair',
    description: 'How entries are counted, how the draw runs, and how a winner is selected.',
  },
  {
    href: '/registered-verified',
    icon: BadgeCheck,
    title: 'Registered & Verified',
    description: 'Official business registration and verification documents.',
  },
  {
    href: '/faq',
    icon: CircleHelp,
    title: 'Frequently Asked Questions',
    description: 'Common questions about accounts, entries, payments, and draws.',
  },
] as const;

export default function TransparencyScreen() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const goBack = useSafeBack();

  const schema = pageSchema('WebPage', '/transparency', 'Transparency Center', 'JeetoBaz Transparency Center -- how draws are fair, how the platform is registered and verified, and answers to common questions.');
  const breadcrumb = breadcrumbSchema([{ name: 'Transparency Center', path: '/transparency' }]);

  return (
    <>
    <Head>
      <title>Transparency Center | JeetoBaz</title>
      <meta name="robots" content="index, follow" />
      <meta name="description" content="JeetoBaz Transparency Center -- how draws are fair, how the platform is registered and verified, and answers to common questions." />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Transparency Center | JeetoBaz" />
      <meta property="og:description" content="JeetoBaz Transparency Center -- how draws are fair, how the platform is registered and verified, and answers to common questions." />
      <meta property="og:url" content="https://jeetobaz.pk/transparency" />
      <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
      <meta property="og:image:alt" content="JeetoBaz -- Pakistan's trusted prize draw platform" />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta property="og:locale" content="en_PK" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content="Transparency Center | JeetoBaz" />
      <meta name="twitter:description" content="JeetoBaz Transparency Center -- how draws are fair, how the platform is registered and verified, and answers to common questions." />
      <meta name="twitter:image" content="https://jeetobaz.pk/twitter-image.png" />
      <link rel="canonical" href="https://jeetobaz.pk/transparency" />
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
    </Head>
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft color={theme.primary} size={20} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <ShieldCheck color={theme.gold} size={23} />
          <Text role="heading" aria-level={1} style={styles.headerTitle}>Transparency Center</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.introCard}>
          <ShieldCheck color={theme.primary} size={34} />
          <Text style={styles.introTitle}>Everything in one place</Text>
          <Text style={styles.introText}>How draws are fair, how JeetoBaz is registered and verified, and answers to common questions -- all in one place.</Text>
        </View>

        {TRANSPARENCY_LINKS.map((item) => (
          <Link key={item.href} href={item.href} asChild>
            <TouchableOpacity style={styles.linkCard} accessibilityRole="link">
              <View style={styles.linkIcon}><item.icon color={theme.gold} size={26} /></View>
              <View style={styles.linkTextBlock}>
                <Text style={styles.linkTitle}>{item.title}</Text>
                <Text style={styles.linkDescription}>{item.description}</Text>
              </View>
              <ChevronRight color={theme.subtle} size={20} />
            </TouchableOpacity>
          </Link>
        ))}
      </ScrollView>
    </View>
    </>
  );
}

type Theme = ReturnType<typeof useAppTheme>['theme'];

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { minHeight: 76, paddingHorizontal: 18, borderBottomWidth: 2, borderBottomColor: theme.gold, backgroundColor: theme.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 90, minHeight: 44 },
    backText: { color: theme.primary, fontSize: 15, fontWeight: '700' },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1 },
    headerTitle: { color: theme.gold, fontSize: 20, fontWeight: '800', textAlign: 'center' },
    headerSpacer: { minWidth: 90 },
    content: { padding: 18, paddingBottom: 90, gap: 14 },
    introCard: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.primary, borderRadius: 16, padding: 24, alignItems: 'center' },
    introTitle: { color: theme.gold, fontSize: 20, fontWeight: '800', marginTop: 10 },
    introText: { color: theme.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 7, maxWidth: 720 },
    linkCard: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
    linkIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' },
    linkTextBlock: { flex: 1 },
    linkTitle: { color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 4 },
    linkDescription: { color: theme.muted, fontSize: 13, lineHeight: 18 },
  });
}
