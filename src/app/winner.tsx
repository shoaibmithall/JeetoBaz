import { ActivityIndicator, Image, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/database';
import { BarChart3, Medal, ShieldCheck, Target, Trophy } from 'lucide-react-native';

type PublicDrawResult = {
  winner_name: string;
  masked_phone: string;
  winner_ticket_number: string;
  total_entries: number;
  drawn_at: string;
};

export default function WinnerScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams();
  const { t } = useLanguage();
  const productIdValue = Array.isArray(productId) ? productId[0] : productId;
  const [product, setProduct] = useState<Product | null>(null);
  const [result, setResult] = useState<PublicDrawResult | null>(null);
  const [legacyWinnerName, setLegacyWinnerName] = useState('');
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

    const { data: resultData } = await supabase.rpc('get_public_draw_result', {
      requested_product_id: productIdValue,
    });

    setProduct(productData || null);

    if (resultData?.[0]) {
      setResult(resultData[0]);
      setEntryCount(resultData[0].total_entries);
    } else {
      const { data: entriesData } = await supabase
        .from('entries')
        .select('*')
        .eq('product_id', productIdValue);
      const legacyWinner = entriesData?.find((entry) => entry.phone === productData?.winner_phone);
      setLegacyWinnerName(legacyWinner?.name || '');
      setEntryCount(entriesData?.length || 0);
    }
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
        <Trophy color="#FFD700" size={80} />
        <Text style={styles.congrats}>CONGRATULATIONS!</Text>
        <Text style={styles.subtitle}>{t('drawResultReady')}</Text>
      </View>

      <View style={styles.winnerCard}>
        {product?.winner_photo ? (
          <Image source={{ uri: product.winner_photo }} style={styles.winnerPhoto} resizeMode="cover" />
        ) : null}
        <View style={styles.labelRow}><Target color="#FFD700" size={16} /><Text style={styles.winnerLabel}>{t('winnerOf')}</Text></View>
        <Text style={styles.winnerName}>{result?.winner_name || legacyWinnerName || t('notProvided')}</Text>
        <Text style={styles.winnerPhone}>{result?.masked_phone || maskPhone(product?.winner_phone)}</Text>
        {result?.winner_ticket_number && (
          <Text style={styles.winnerTicket}>Ticket: {result.winner_ticket_number}</Text>
        )}
        <View style={styles.divider} />
        <Text style={styles.productLabel}>{t('prizeWon')}</Text>
        <Text style={styles.productName}>{product?.name || t('unknownProduct')}</Text>
        <Text style={styles.productPrice}>Price: Rs. {(product?.price || 0).toLocaleString()}</Text>
      </View>

      <View style={styles.detailCard}>
        <View style={styles.detailTitleRow}><BarChart3 color="white" size={19} /><Text style={styles.detailTitle}>{t('drawDetails')}</Text></View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Entries</Text>
          <Text style={styles.detailValue}>{entryCount.toLocaleString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('drawDate')}</Text>
          <Text style={styles.detailValue}>
            {result?.drawn_at
              ? new Date(result.drawn_at).toLocaleString()
              : product?.draw_date || new Date(product?.created_at || Date.now()).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Draw Number</Text>
          <Text style={styles.detailValue}>#{product?.id?.slice(0, 8).toUpperCase() || 'JB'}</Text>
        </View>
      </View>

      <View style={styles.verifyCard}>
        <View style={styles.verifyTitleRow}><ShieldCheck color="#1DB954" size={18} /><Text style={styles.verifyTitle}>{t('verifiedFairDraw')}</Text></View>
        <Text style={styles.verifyText}>
          {t('winnerAlgorithmText')}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/')}>
        <Medal color="#000" size={19} /><Text style={styles.buttonText}>{t('newDrawJoin')}</Text>
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
  congrats: { fontSize: 32, fontWeight: 'bold', color: '#FFD700', marginTop: 10 },
  subtitle: { fontSize: 16, color: 'white', marginTop: 5 },
  winnerCard: { backgroundColor: '#1a1a1a', margin: 15, borderRadius: 15, padding: 25, borderWidth: 2, borderColor: '#FFD700', alignItems: 'center' },
  winnerPhoto: { width: 180, height: 180, borderRadius: 8, marginBottom: 16, borderWidth: 2, borderColor: '#FFD700' },
  winnerLabel: { fontSize: 14, color: '#FFD700', marginBottom: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  winnerName: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  winnerPhone: { fontSize: 16, color: '#aaa', marginTop: 5 },
  winnerTicket: { fontSize: 14, color: '#FFD700', marginTop: 6 },
  divider: { height: 1, backgroundColor: '#333', width: '100%', marginVertical: 15 },
  productLabel: { fontSize: 14, color: '#aaa' },
  productName: { fontSize: 24, fontWeight: 'bold', color: '#1DB954', marginTop: 5 },
  productPrice: { fontSize: 16, color: '#FFD700', marginTop: 5 },
  detailCard: { backgroundColor: '#1a1a1a', margin: 15, borderRadius: 15, padding: 20 },
  detailTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 15 },
  detailTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { color: '#aaa', fontSize: 14 },
  detailValue: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  verifyCard: { backgroundColor: '#0d2b1a', margin: 15, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#1DB954' },
  verifyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1DB954', marginBottom: 8 },
  verifyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  verifyText: { color: '#aaa', fontSize: 14, lineHeight: 22 },
  button: { backgroundColor: '#FFD700', margin: 15, padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  footer: { textAlign: 'center', color: '#444', fontSize: 12, marginBottom: 30 },
});
