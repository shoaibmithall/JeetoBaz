import { ActivityIndicator, Image, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/database';
import { BarChart3, Medal, PackageCheck, ShieldCheck, Target, Trophy, Truck } from 'lucide-react-native';
import type { PrizeStatus } from '@/types/database';

type PublicDrawResult = {
  winner_name: string;
  masked_phone: string;
  winner_ticket_number: string;
  total_entries: number;
  drawn_at: string;
  prize_status: PrizeStatus;
  prize_tracking_note: string | null;
};

const PRIZE_STATUS_LABEL: Record<PrizeStatus, string> = {
  pending: 'Preparing Your Prize',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

export default function WinnerScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams();
  const { t } = useLanguage();
  const productIdValue = Array.isArray(productId) ? productId[0] : productId;
  const [product, setProduct] = useState<Product | null>(null);
  const [result, setResult] = useState<PublicDrawResult | null>(null);
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
      setEntryCount(productData?.current_entries || 0);
    }
    setLoading(false);
  }

  function maskPhone(phone?: string | null) {
    if (!phone) return 'N/A';
    return phone.slice(0, 4) + '****' + phone.slice(-3);
  }

  if (loading) return (
    <>
    <Head>
      <title>Winner Result | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="View verified JeetoBaz draw winner result with complete draw details and prize information." />
    </Head>
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#18a663" />
      <Text style={styles.loadingText}>{t('loadingWinners')}</Text>
    </View>
    </>
  );

  return (
    <>
    <Head>
      <title>Winner Result | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="View verified JeetoBaz draw winner result with complete draw details and prize information." />
      <link rel="canonical" href="https://jeetobaz.pk/winner" />
    </Head>
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
        <Text style={styles.winnerName}>{result?.winner_name || t('notProvided')}</Text>
        <Text style={styles.winnerPhone}>{result?.masked_phone || maskPhone(product?.winner_phone)}</Text>
        {result?.winner_ticket_number && (
          <Text style={styles.winnerTicket}>Ticket: {result.winner_ticket_number}</Text>
        )}
        <View style={styles.divider} />
        <Text style={styles.productLabel}>{t('prizeWon')}</Text>
        <Text style={styles.productName}>{product?.name || t('unknownProduct')}</Text>
        <Text style={styles.productPrice}>Price: Rs. {(product?.price || 0).toLocaleString()}</Text>
        {product?.slug ? (
          <Link href={`/product/${product.slug}`} asChild>
            <TouchableOpacity accessibilityRole="link" accessibilityLabel={`View prize details: ${product.name}`}>
              <Text style={styles.productDetailLink}>View Prize Details →</Text>
            </TouchableOpacity>
          </Link>
        ) : null}
      </View>

      {result?.prize_status && (
        <View style={styles.statusCard}>
          <View style={styles.statusTitleRow}>
            {result.prize_status === 'delivered' ? <PackageCheck color="#18a663" size={18} /> : <Truck color="#FFD700" size={18} />}
            <Text style={styles.statusTitle}>Prize Delivery Status</Text>
          </View>
          <Text style={styles.statusValue}>{PRIZE_STATUS_LABEL[result.prize_status]}</Text>
          {result.prize_tracking_note ? (
            <Text style={styles.statusNote}>{result.prize_tracking_note}</Text>
          ) : null}
        </View>
      )}

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
        <View style={styles.verifyTitleRow}><ShieldCheck color="#18a663" size={18} /><Text style={styles.verifyTitle}>{t('verifiedFairDraw')}</Text></View>
        <Text style={styles.verifyText}>
          {t('winnerAlgorithmText')}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/')}>
        <Medal color="#000" size={19} /><Text style={styles.buttonText}>{t('newDrawJoin')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/explore')}>
        <Trophy color="#FFD700" size={19} /><Text style={styles.secondaryButtonText}>{t('pastWinners')}</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>JeetoBaz - {t('appTagline')}</Text>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  loading: { flex: 1, backgroundColor: '#020d09', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#18a663', marginTop: 10, fontSize: 16 },
  header: { backgroundColor: '#04140e', borderBottomColor: '#FFD700', borderBottomWidth: 2, padding: 40, alignItems: 'center' },
  congrats: { fontSize: 32, fontWeight: 'bold', color: '#FFD700', marginTop: 10 },
  subtitle: { fontSize: 16, color: 'white', marginTop: 5 },
  winnerCard: { backgroundColor: '#071b13', margin: 15, borderRadius: 15, padding: 25, borderWidth: 2, borderColor: '#FFD700', alignItems: 'center' },
  winnerPhoto: { width: 180, height: 180, borderRadius: 8, marginBottom: 16, borderWidth: 2, borderColor: '#FFD700' },
  winnerLabel: { fontSize: 14, color: '#FFD700', marginBottom: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  winnerName: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  winnerPhone: { fontSize: 16, color: '#aaa', marginTop: 5 },
  winnerTicket: { fontSize: 14, color: '#FFD700', marginTop: 6 },
  divider: { height: 1, backgroundColor: '#174a35', width: '100%', marginVertical: 15 },
  productLabel: { fontSize: 14, color: '#aaa' },
  productName: { fontSize: 24, fontWeight: 'bold', color: '#18a663', marginTop: 5 },
  productPrice: { fontSize: 16, color: '#FFD700', marginTop: 5 },
  productDetailLink: { color: '#18a663', fontSize: 14, fontWeight: 'bold', marginTop: 12 },
  statusCard: { backgroundColor: '#071b13', marginHorizontal: 15, marginTop: 15, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#174a35' },
  statusTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  statusTitle: { fontSize: 15, fontWeight: 'bold', color: 'white' },
  statusValue: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  statusNote: { fontSize: 13, color: '#aaa', marginTop: 6, lineHeight: 18 },
  detailCard: { backgroundColor: '#071b13', margin: 15, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#174a35' },
  detailTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 15 },
  detailTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { color: '#aaa', fontSize: 14 },
  detailValue: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  verifyCard: { backgroundColor: '#082d1e', margin: 15, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#18a663' },
  verifyTitle: { fontSize: 16, fontWeight: 'bold', color: '#18a663', marginBottom: 8 },
  verifyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  verifyText: { color: '#aaa', fontSize: 14, lineHeight: 22 },
  button: { backgroundColor: '#FFD700', margin: 15, padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  secondaryButton: { backgroundColor: '#071b13', marginHorizontal: 15, marginBottom: 15, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, borderWidth: 1, borderColor: '#FFD700' },
  secondaryButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFD700' },
  footer: { textAlign: 'center', color: '#444', fontSize: 12, marginBottom: 30 },
});
