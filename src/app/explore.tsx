import { Image, Linking, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import { DataErrorState } from '@/components/data-error-state';
import type { Entry, Product } from '@/types/database';
import { useAppTheme } from '@/hooks/use-theme';

export default function WinnersScreen() {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const [winners, setWinners] = useState<Product[]>([]);
  const [winnerEntries, setWinnerEntries] = useState<Record<string, Entry>>({});
  const [entryCounts, setEntryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => { fetchWinners(); }, []);

  async function fetchWinners() {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    if (data) {
      setWinners(data);
      await fetchWinnerEntries(data);
    }
    if (error) setLoadError(true);
    setLoading(false);
  }

  async function fetchWinnerEntries(products: Product[]) {
    const productIds = products.map((product) => product.id);
    if (productIds.length === 0) {
      setWinnerEntries({});
      return;
    }

    const { data } = await supabase
      .from('entries')
      .select('*')
      .in('product_id', productIds);

    const nextEntries: Record<string, Entry> = {};
    const nextCounts: Record<string, number> = {};
    data?.forEach((entry) => {
      nextCounts[entry.product_id] = (nextCounts[entry.product_id] || 0) + 1;
      const matchingProduct = products.find((product) => product.id === entry.product_id && product.winner_phone === entry.phone);
      if (matchingProduct) nextEntries[matchingProduct.id] = entry;
    });
    setWinnerEntries(nextEntries);
    setEntryCounts(nextCounts);
  }

  function maskPhone(phone?: string | null) {
    if (!phone) return 'N/A';
    return phone.slice(0, 6) + '****' + phone.slice(-4);
  }

  function getTicketNumber(entry?: Entry) {
    if (!entry) return 'Not available';
    return entry.ticket_number || `JB-${entry.id.slice(0, 8).toUpperCase()}`;
  }

  function getDrawDate(product: Product) {
    return product.draw_date || new Date(product.created_at).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  if (loading) return (
    <View style={[styles.loading, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.primary }]}>{t('loadingWinners')}</Text>
    </View>
  );

  if (loadError) return <DataErrorState onRetry={fetchWinners} />;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <Text style={styles.title}>🏆 {t('pastWinners')}</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>100% Real and Verified</Text>
      </View>

      <View style={[styles.trustBox, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
        <Text style={[styles.trustTitle, { color: theme.primary }]}>{t('trustTitle')}</Text>
        <Text style={[styles.trustText, { color: theme.muted }]}>{t('trustLine1')}</Text>
        <Text style={[styles.trustText, { color: theme.muted }]}>{t('trustLine2')}</Text>
        <Text style={[styles.trustText, { color: theme.muted }]}>{t('trustLine3')}</Text>
      </View>

      {winners.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={[styles.emptyText, { color: theme.text }]}>{t('noCompletedDraws')}</Text>
          <Text style={[styles.emptySubText, { color: theme.muted }]}>Be the first winner — enter a draw now!</Text>
        </View>
      ) : (
        winners.map((product) => {
          const winnerEntry = winnerEntries[product.id];
          const totalEntries = entryCounts[product.id] || product.current_entries || 0;
          return (
            <View key={product.id} style={[styles.winnerCard, { backgroundColor: theme.surface }]}>
              {product.winner_photo ? (
                <Image source={{ uri: product.winner_photo }} style={styles.winnerPhoto} resizeMode="cover" />
              ) : (
                <Text style={styles.trophy}>🏆</Text>
              )}
              <Text style={styles.verifiedRecord}>Verified Draw Record</Text>
              <Text style={[styles.winnerName, { color: theme.text }]}>{winnerEntry?.name || t('notProvided')}</Text>
              <Text style={[styles.winnerPhone, { color: theme.text }]}>{maskPhone(product.winner_phone)}</Text>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>Prize Value: Rs. {product.price?.toLocaleString()}</Text>

              <View style={styles.recordGrid}>
                <View style={[styles.recordItem, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <Text style={[styles.recordLabel, { color: theme.subtle }]}>Draw Date</Text>
                  <Text style={[styles.recordValue, { color: theme.text }]}>{getDrawDate(product)}</Text>
                </View>
                <View style={[styles.recordItem, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <Text style={[styles.recordLabel, { color: theme.subtle }]}>Total Entries</Text>
                  <Text style={[styles.recordValue, { color: theme.text }]}>{totalEntries.toLocaleString()}</Text>
                </View>
                <View style={[styles.recordItem, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <Text style={[styles.recordLabel, { color: theme.subtle }]}>Winner Ticket</Text>
                  <Text style={[styles.recordValue, { color: theme.text }]}>{getTicketNumber(winnerEntry)}</Text>
                </View>
                <View style={[styles.recordItem, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <Text style={[styles.recordLabel, { color: theme.subtle }]}>Selection</Text>
                  <Text style={[styles.recordValue, { color: theme.text }]}>Random system draw</Text>
                </View>
              </View>

              {product.live_link && (
                <TouchableOpacity style={styles.liveLinkButton} onPress={() => Linking.openURL(product.live_link || '')}>
                  <Text style={styles.liveLinkText}>Watch Draw Record</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('allDrawsFair')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loading: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#1DB954', marginTop: 10, fontSize: 16 },
  header: { backgroundColor: '#1a1a1a', padding: 30, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFD700' },
  subtitle: { fontSize: 14, color: '#aaa', marginTop: 5 },
  trustBox: { backgroundColor: '#0d2b1a', margin: 15, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#1DB954' },
  trustTitle: { fontSize: 16, fontWeight: 'bold', color: '#1DB954', marginBottom: 12 },
  trustText: { color: '#aaa', fontSize: 14, marginBottom: 6 },
  emptyBox: { alignItems: 'center', padding: 50 },
  emptyEmoji: { fontSize: 60, marginBottom: 15 },
  emptyText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubText: { color: '#aaa', fontSize: 14, textAlign: 'center' },
  winnerCard: { backgroundColor: '#1a1a1a', margin: 15, marginBottom: 0, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#FFD700', alignItems: 'center' },
  trophy: { fontSize: 40, marginBottom: 10 },
  winnerPhoto: { width: 86, height: 86, borderRadius: 43, marginBottom: 12, borderWidth: 2, borderColor: '#FFD700' },
  verifiedRecord: { color: '#1DB954', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  winnerName: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  winnerPhone: { color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace', marginBottom: 8 },
  productName: { color: '#1DB954', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  productPrice: { color: '#FFD700', fontSize: 16, marginBottom: 4 },
  date: { color: '#aaa', fontSize: 12 },
  recordGrid: { width: '100%', marginTop: 14, gap: 8 },
  recordItem: { backgroundColor: '#111', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#333' },
  recordLabel: { color: '#777', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 },
  recordValue: { color: '#ddd', fontSize: 13, fontWeight: 'bold', lineHeight: 18 },
  liveLinkButton: { backgroundColor: '#2b0d0d', borderColor: '#ff4444', borderWidth: 1, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, marginTop: 14, width: '100%', alignItems: 'center' },
  liveLinkText: { color: '#ff4444', fontSize: 14, fontWeight: 'bold' },
  footer: { padding: 20, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  footerText: { color: '#444', fontSize: 12 },
});
