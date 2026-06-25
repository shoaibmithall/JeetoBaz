import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { Entry, Product } from '@/types/database';

export default function WinnerScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams();
  const { t } = useLanguage();
  const productIdValue = Array.isArray(productId) ? productId[0] : productId;
  const [product, setProduct] = useState<Product | null>(null);
  const [winner, setWinner] = useState<Entry | null>(null);
  const [entryCount, setEntryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [productIdValue]);

  async function fetchResult() {
    if (!productIdValue) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: productData } = await supabase
      .from('products')
      .select('*')
      .eq('id', productIdValue)
      .maybeSingle();

    const { data: entriesData } = await supabase
      .from('entries')
      .select('*')
      .eq('product_id', productIdValue);

    setProduct(productData || null);
    setEntryCount(entriesData?.length || 0);
    setWinner(entriesData?.find((entry) => entry.phone === productData?.winner_phone) || null);
    setLoading(false);
  }

  function maskPhone(phone?: string | null) {
    if (!phone) return 'N/A';
    return phone.slice(0, 7) + '****' + phone.slice(-4);
  }

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#1DB954" />
      <Text style={styles.loadingText}>{t('loadingWinners')}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.congrats}>CONGRATULATIONS!</Text>
        <Text style={styles.subtitle}>{t('drawResultReady')}</Text>
      </View>

      <View style={styles.winnerCard}>
        <Text style={styles.winnerLabel}>🎯 {t('winnerOf')}</Text>
        <Text style={styles.winnerName}>{winner?.name || t('notProvided')}</Text>
        <Text style={styles.winnerPhone}>{maskPhone(product?.winner_phone)}</Text>
        <View style={styles.divider} />
        <Text style={styles.productLabel}>{t('prizeWon')}</Text>
        <Text style={styles.productName}>{product?.name || t('unknownProduct')}</Text>
        <Text style={styles.productPrice}>Price: Rs. {(product?.price || 0).toLocaleString()}</Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>📊 {t('drawDetails')}</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Entries</Text>
          <Text style={styles.detailValue}>{entryCount.toLocaleString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('drawDate')}</Text>
          <Text style={styles.detailValue}>{product?.draw_date || new Date(product?.created_at || Date.now()).toLocaleDateString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Draw Number</Text>
          <Text style={styles.detailValue}>#{product?.id?.slice(0, 8).toUpperCase() || 'JB'}</Text>
        </View>
      </View>

      <View style={styles.verifyCard}>
        <Text style={styles.verifyTitle}>✅ {t('verifiedFairDraw')}</Text>
        <Text style={styles.verifyText}>
          {t('winnerAlgorithmText')}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/')}>
        <Text style={styles.buttonText}>🎯 {t('newDrawJoin')}</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>JeetoBaz - {t('appTagline')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loading: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#1DB954', marginTop: 10, fontSize: 16 },
  header: { backgroundColor: '#1DB954', padding: 40, alignItems: 'center' },
  trophy: { fontSize: 80 },
  congrats: { fontSize: 32, fontWeight: 'bold', color: '#FFD700', marginTop: 10 },
  subtitle: { fontSize: 16, color: 'white', marginTop: 5 },
  winnerCard: { backgroundColor: '#1a1a1a', margin: 15, borderRadius: 15, padding: 25, borderWidth: 2, borderColor: '#FFD700', alignItems: 'center' },
  winnerLabel: { fontSize: 14, color: '#FFD700', marginBottom: 10 },
  winnerName: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  winnerPhone: { fontSize: 16, color: '#aaa', marginTop: 5 },
  divider: { height: 1, backgroundColor: '#333', width: '100%', marginVertical: 15 },
  productLabel: { fontSize: 14, color: '#aaa' },
  productName: { fontSize: 24, fontWeight: 'bold', color: '#1DB954', marginTop: 5 },
  productPrice: { fontSize: 16, color: '#FFD700', marginTop: 5 },
  detailCard: { backgroundColor: '#1a1a1a', margin: 15, borderRadius: 15, padding: 20 },
  detailTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 15 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { color: '#aaa', fontSize: 14 },
  detailValue: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  verifyCard: { backgroundColor: '#0d2b1a', margin: 15, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#1DB954' },
  verifyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1DB954', marginBottom: 8 },
  verifyText: { color: '#aaa', fontSize: 14, lineHeight: 22 },
  button: { backgroundColor: '#FFD700', margin: 15, padding: 18, borderRadius: 12, alignItems: 'center' },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  footer: { textAlign: 'center', color: '#444', fontSize: 12, marginBottom: 30 },
});
