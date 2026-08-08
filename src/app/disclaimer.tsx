import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { AlertTriangle, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/hooks/use-theme';
import { breadcrumbSchema, pageSchema } from '@/lib/structured-data';

// Content is added phase by phase as the source copy is reviewed and confirmed against real
// platform facts (see other legal pages: terms.tsx, refund-policy.tsx, shipping-policy.tsx).
// `tone` marks a paragraph as an important callout: 'gold' for an advisory/read-this note,
// 'red' for a critical/legal-consequence statement. Plain paragraphs render as normal body text.
type DisclaimerBlock =
  | { type: 'paragraph'; text: string; tone?: 'gold' | 'red' }
  | { type: 'links'; items: { label: string; route: string; params?: Record<string, string> }[] };

type DisclaimerSection = {
  id: string;
  title: string;
  blocks: DisclaimerBlock[];
};

const LAST_UPDATED = 'August 8, 2026';

const DISCLAIMER_SECTIONS: DisclaimerSection[] = [
  {
    id: 'general-information',
    title: 'General Information',
    blocks: [
      {
        type: 'paragraph',
        text: 'This Disclaimer applies to the JeetoBaz website available at https://jeetobaz.pk (the "Website"), including the information, content, services, features, and other materials made available through the Website.',
      },
      {
        type: 'paragraph',
        text: 'JeetoBaz is operated from Hyderabad, Sindh, Pakistan. The Website is intended to provide users with general information about the JeetoBaz platform, its features, prize draw information, products, winners, support resources, and other related content.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'The information provided on the Website is made available for general informational and platform-related purposes. While JeetoBaz makes reasonable efforts to keep the Website updated and to provide information that is clear and accurate, users should read and understand the applicable Terms & Conditions and other relevant policies before using any feature or participating in any activity offered through the Website.',
      },
      {
        type: 'paragraph',
        text: 'This Disclaimer should be read together with the following documents, which govern different aspects of the Website and its services:',
      },
      {
        type: 'links',
        items: [
          { label: 'Terms & Conditions', route: '/terms' },
          { label: 'Refund Policy', route: '/refund-policy' },
          { label: 'Shipping Policy', route: '/shipping-policy' },
          { label: 'Responsible Use Policy', route: '/about', params: { section: 'legal' } },
          { label: 'Privacy Policy', route: '/privacy' },
        ],
      },
      {
        type: 'paragraph',
        text: 'Each of these documents addresses specific matters and forms part of the overall framework governing the use of the JeetoBaz Website.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'Nothing contained in this Disclaimer should be interpreted as replacing, modifying, or overriding the provisions of the applicable Terms & Conditions or other policies published on the Website. If there is any inconsistency between this Disclaimer and another applicable policy, the relevant policy will apply to the subject matter it specifically governs.',
      },
      {
        type: 'paragraph',
        text: 'Users are encouraged to review the latest version of this Disclaimer and the related policies before relying on information published on the Website or using the Website\'s features.',
      },
      {
        type: 'paragraph',
        text: 'JeetoBaz may update the information available on the Website from time to time to reflect operational changes, updates to services, or other relevant developments. The presence of information on the Website does not create any representation beyond what is expressly stated in the applicable policies and published materials.',
      },
    ],
  },
];

function DisclaimerParagraph({ block }: { block: Extract<DisclaimerBlock, { type: 'paragraph' }> }) {
  const { theme } = useAppTheme();

  if (!block.tone) {
    return <Text style={[styles.paragraph, { color: theme.text }]}>{block.text}</Text>;
  }

  const isRed = block.tone === 'red';
  return (
    <View
      style={[
        styles.calloutBox,
        {
          backgroundColor: isRed ? theme.dangerSoft : theme.goldSoft,
          borderLeftColor: isRed ? theme.danger : theme.gold,
        },
      ]}
    >
      <Text style={[styles.paragraph, styles.calloutText, { color: theme.text }]}>{block.text}</Text>
    </View>
  );
}

function DisclaimerLinks({ block }: { block: Extract<DisclaimerBlock, { type: 'links' }> }) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.linksBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {block.items.map((item, index) => (
        <Link
          key={item.label}
          href={(item.params ? { pathname: item.route, params: item.params } : item.route) as never}
          asChild
        >
          <TouchableOpacity
            accessibilityRole="link"
            style={StyleSheet.flatten([
              styles.linkRow,
              index < block.items.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 },
            ])}
          >
            <Text style={[styles.linkText, { color: theme.primary }]}>{item.label}</Text>
            <ChevronRight color={theme.subtle} size={17} />
          </TouchableOpacity>
        </Link>
      ))}
    </View>
  );
}

export default function DisclaimerScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const schema = pageSchema(
    'WebPage',
    '/disclaimer',
    'Disclaimer',
    'Important information about how to use the JeetoBaz website and platform, and how this Disclaimer relates to the Terms & Conditions, Refund Policy, Shipping Policy, Responsible Use Policy, and Privacy Policy.',
  );
  const breadcrumb = breadcrumbSchema([{ name: 'Disclaimer', path: '/disclaimer' }]);

  return (
    <>
      <Head>
        <title>Disclaimer | JeetoBaz</title>
        <meta name="robots" content="index, follow" />
        <meta
          name="description"
          content="Important information about how to use the JeetoBaz website and platform, and how this Disclaimer relates to our other policies."
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Disclaimer | JeetoBaz" />
        <meta
          property="og:description"
          content="Important information about how to use the JeetoBaz website and platform, and how this Disclaimer relates to our other policies."
        />
        <meta property="og:url" content="https://jeetobaz.pk/disclaimer" />
        <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
        <meta property="og:image:alt" content="JeetoBaz — Pakistan's trusted prize draw platform" />
        <meta property="og:site_name" content="JeetoBaz" />
        <meta property="og:locale" content="en_PK" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@jeetobaz" />
        <meta name="twitter:title" content="Disclaimer | JeetoBaz" />
        <meta
          name="twitter:description"
          content="Important information about how to use the JeetoBaz website and platform, and how this Disclaimer relates to our other policies."
        />
        <meta name="twitter:image" content="https://jeetobaz.pk/twitter-image.png" />
        <link rel="canonical" href="https://jeetobaz.pk/disclaimer" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
      </Head>
      <ScrollView
        style={[styles.screen, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: theme.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.gold }]}>Disclaimer</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.hero}>
          <LinearGradient
            colors={[theme.gold, theme.danger]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroBadge}
          >
            <AlertTriangle color="#ffffff" size={22} strokeWidth={2.4} />
            <Text style={styles.heroBadgeText}>DISCLAIMER</Text>
          </LinearGradient>
          <Text style={[styles.heroUpdated, { color: theme.subtle }]}>Last Updated: {LAST_UPDATED}</Text>
        </View>

        <View style={styles.sections}>
          {DISCLAIMER_SECTIONS.map((section) => (
            <View key={section.id} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.gold }]}>{section.title}</Text>
              <View style={styles.blockList}>
                {section.blocks.map((block, index) =>
                  block.type === 'paragraph' ? (
                    <DisclaimerParagraph key={index} block={block} />
                  ) : (
                    <DisclaimerLinks key={index} block={block} />
                  ),
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 40 },
  header: {
    borderBottomWidth: 2,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { fontSize: 16, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSpacer: { width: 48 },
  hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 12, gap: 10 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  heroBadgeText: { fontSize: 17, fontWeight: '900', letterSpacing: 1, color: '#ffffff' },
  heroUpdated: { fontSize: 13, fontWeight: '600' },
  sections: { paddingHorizontal: 18, paddingTop: 18, gap: 26, maxWidth: 760, width: '100%', alignSelf: 'center' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 19, fontWeight: '800' },
  blockList: { gap: 12 },
  paragraph: { fontSize: 14.5, lineHeight: 23 },
  calloutBox: { borderLeftWidth: 3, borderRadius: 8, padding: 14 },
  calloutText: { fontWeight: '500' },
  linksBox: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  linkText: { fontSize: 14.5, fontWeight: '700' },
});
