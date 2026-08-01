import { ActivityIndicator, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { ArrowLeft, Award, Download, Share2 } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

const CERTIFICATES_BUCKET = 'winner-certificates';
const SIGNED_URL_EXPIRY_SECONDS = 300;

type Certificate = {
  certificate_id: string;
  product_name: string;
  storage_path: string;
  file_name: string | null;
  created_at: string;
};

export default function CertificatesScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { user, loading: authLoading } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    loadCertificates();
  }, [authLoading, user]);

  async function loadCertificates() {
    setLoading(true);
    const { data } = await supabase.rpc('get_my_certificates');
    setCertificates(data || []);
    setLoading(false);
  }

  async function getSignedUrl(storagePath: string) {
    const { data, error } = await supabase.storage
      .from(CERTIFICATES_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);
    if (error || !data?.signedUrl) throw error || new Error('Could not generate a download link.');
    return data.signedUrl;
  }

  async function handleDownload(cert: Certificate) {
    setBusyId(cert.certificate_id);
    try {
      const url = await getSignedUrl(cert.storage_path);
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await Share.share({ url, message: `My JeetoBaz winner certificate for ${cert.product_name}` });
      }
    } catch {
      alert('Could not open the certificate. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleShare(cert: Certificate) {
    setBusyId(cert.certificate_id);
    try {
      const url = await getSignedUrl(cert.storage_path);
      await Share.share({ url, message: `My JeetoBaz winner certificate for ${cert.product_name}: ${url}` });
    } catch {
      alert('Could not share the certificate. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
    <Head>
      <title>My Certificates | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
    </Head>
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/login')}>
          <ArrowLeft color={theme.primary} size={22} />
          <Text style={[styles.backText, { color: theme.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text role="heading" aria-level={1} style={[styles.headerTitle, { color: theme.gold }]}>My Certificates</Text>
        <View style={styles.headerSpacer} />
      </View>

      {authLoading || loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={theme.primary} size="large" accessibilityLabel="Loading certificates" />
          <Text style={[styles.loadingText, { color: theme.muted }]}>Loading your certificates...</Text>
        </View>
      ) : !user ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Award color={theme.subtle} size={50} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Sign in to view your certificates</Text>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.gold }]} onPress={() => router.push('/login')}>
            <Text style={styles.primaryButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      ) : certificates.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Award color={theme.subtle} size={50} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No certificates yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.muted }]}>Win a JeetoBaz draw and your official certificate will appear here.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {certificates.map((cert) => (
            <View key={cert.certificate_id} style={[styles.certCard, { backgroundColor: theme.surface, borderColor: theme.gold }]}>
              <View style={styles.certIconBox}>
                <Award color="#FFD700" size={28} />
              </View>
              <View style={styles.certInfo}>
                <Text style={[styles.certProduct, { color: theme.text }]} numberOfLines={2}>{cert.product_name}</Text>
                <Text style={[styles.certDate, { color: theme.subtle }]}>{new Date(cert.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.certActions}>
                <TouchableOpacity
                  style={[styles.certButton, { borderColor: theme.primary }]}
                  onPress={() => handleDownload(cert)}
                  disabled={busyId === cert.certificate_id}
                >
                  {busyId === cert.certificate_id ? (
                    <ActivityIndicator size="small" color={theme.primary} accessibilityLabel="Downloading certificate" />
                  ) : (
                    <Download color={theme.primary} size={17} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.certButton, { borderColor: theme.gold }]}
                  onPress={() => handleShare(cert)}
                  disabled={busyId === cert.certificate_id}
                >
                  <Share2 color={theme.gold} size={17} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 2 },
  backButton: { minWidth: 76, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5 },
  backText: { fontSize: 15, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSpacer: { minWidth: 76 },
  loadingBox: { alignItems: 'center', padding: 60, gap: 12 },
  loadingText: { fontSize: 14 },
  emptyCard: { margin: 15, borderRadius: 15, borderWidth: 1, padding: 40, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: 'bold', textAlign: 'center' },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  primaryButton: { marginTop: 10, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  primaryButtonText: { color: '#000', fontSize: 15, fontWeight: 'bold' },
  list: { padding: 15, gap: 12 },
  certCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 15, borderWidth: 1, padding: 16, gap: 12 },
  certIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,215,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  certInfo: { flex: 1, minWidth: 0 },
  certProduct: { fontSize: 15, fontWeight: 'bold' },
  certDate: { fontSize: 12, marginTop: 3 },
  certActions: { flexDirection: 'row', gap: 8 },
  certButton: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
