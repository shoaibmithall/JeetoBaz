import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { ArrowLeft, BadgeCheck, FileCheck2 } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { getPublicVerificationDocuments } from '@/lib/verification-documents';
import type { VerificationDocument } from '@/types/database';
import { pageSchema } from '@/lib/structured-data';

export default function RegisteredVerifiedScreen() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDocuments = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    const { data, error: loadError } = await getPublicVerificationDocuments();
    if (loadError) setError('Documents could not be loaded. Please try again.');
    else setDocuments(data || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => {
    loadDocuments();
  }, [loadDocuments]));

  const regSchema = pageSchema('WebPage', '/registered-verified', 'Registered & Verified', 'View JeetoBaz business registration, taxpayer documentation, and verification information provided to support platform transparency and public trust.');
  return (
    <>
    <Head>
      <title>Registered &amp; Verified | JeetoBaz</title>
      <meta name="description" content="View JeetoBaz business registration, taxpayer documentation, and verification information provided to support platform transparency and public trust." />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Registered &amp; Verified | JeetoBaz" />
      <meta property="og:description" content="View JeetoBaz business registration, taxpayer documentation, and verification information provided to support platform transparency and public trust." />
      <meta property="og:url" content="https://jeetobaz.pk/registered-verified" />
      <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta name="twitter:image" content="https://jeetobaz.pk/twitter-image.png" />
      <link rel="canonical" href="https://jeetobaz.pk/registered-verified" />
      <script type="application/ld+json">{JSON.stringify(regSchema)}</script>
    </Head>
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back to Profile">
          <ArrowLeft color={theme.primary} size={20} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <BadgeCheck color={theme.gold} size={23} />
          <Text role="heading" aria-level={1} style={styles.headerTitle}>Registered &amp; Verified</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDocuments(true)} tintColor={theme.gold} />}
      >
        <View style={styles.introCard}>
          <FileCheck2 color={theme.primary} size={34} />
          <Text style={styles.introTitle}>Official Documents</Text>
          <Text style={styles.introText}>View JeetoBaz registration, verification and supporting documents published by the administration.</Text>
        </View>

        {loading ? (
          <View style={styles.stateBox}><ActivityIndicator color={theme.gold} /><Text style={styles.stateText}>Loading documents...</Text></View>
        ) : error ? (
          <View style={styles.stateBox}><Text style={styles.errorText}>{error}</Text><TouchableOpacity style={styles.retryButton} onPress={() => loadDocuments()}><Text style={styles.retryText}>Try Again</Text></TouchableOpacity></View>
        ) : documents.length === 0 ? (
          <View style={styles.stateBox}><FileCheck2 color={theme.subtle} size={30} /><Text style={styles.stateText}>No documents are currently published.</Text></View>
        ) : documents.map((document) => (
          <View key={document.id} style={styles.documentCard}>
            <Image source={{ uri: document.image_url }} style={styles.documentImage} resizeMode="contain" accessibilityLabel={`${document.title} document`} />
            <View style={styles.documentContent}>
              <Text style={styles.documentTitle}>{document.title}</Text>
              <Text style={styles.documentDescription}>{document.description}</Text>
            </View>
          </View>
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
    content: { padding: 18, paddingBottom: 90, gap: 16 },
    introCard: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.primary, borderRadius: 16, padding: 24, alignItems: 'center' },
    introTitle: { color: theme.gold, fontSize: 22, fontWeight: '800', marginTop: 10 },
    introText: { color: theme.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 7, maxWidth: 720 },
    documentCard: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, overflow: 'hidden' },
    documentImage: { width: '100%', height: 360, backgroundColor: theme.surfaceAlt },
    documentContent: { padding: 18 },
    documentTitle: { color: theme.gold, fontSize: 19, fontWeight: '800', marginBottom: 6 },
    documentDescription: { color: theme.muted, fontSize: 15, lineHeight: 22 },
    stateBox: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 24 },
    stateText: { color: theme.muted, fontSize: 15, textAlign: 'center' },
    errorText: { color: theme.danger, fontSize: 15, textAlign: 'center' },
    retryButton: { backgroundColor: theme.gold, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 10 },
    retryText: { color: theme.buttonText, fontWeight: '800' },
  });
}
