import { ActivityIndicator, Alert, FlatList, Image, View, Text, StyleSheet, TouchableOpacity, ScrollView, Share } from 'react-native';
import { useEffect, useState } from 'react';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import * as Clipboard from 'expo-clipboard';
import { useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { getStoredValue } from '@/lib/storage';
import { useAppTheme } from '@/hooks/use-theme';
import { DrawReplayOverlay } from '@/components/draw-animation/DrawReplayOverlay';
import type { Product } from '@/types/database';
import { BarChart3, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, Copy, Medal, PackageCheck, RotateCcw, Share2, ShieldCheck, Target, Ticket, TriangleAlert, Trophy, Truck, Users } from 'lucide-react-native';
import type { PrizeStatus, WinnerStatus } from '@/types/database';

const APP_URL = 'https://jeetobaz.pk';

type PublicDrawResult = {
  winner_name: string;
  masked_phone: string;
  winner_ticket_number: string;
  total_entries: number;
  drawn_at: string;
  prize_status: PrizeStatus;
  prize_tracking_note: string | null;
  winner_status: WinnerStatus;
};

const PRIZE_STATUS_LABEL: Record<PrizeStatus, string> = {
  pending: 'Preparing Your Prize',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

const WINNER_STATUS_LABEL: Record<WinnerStatus, string> = {
  selected: 'Winner Selected — Verification in Progress',
  under_verification: 'Verification in Progress',
  verified: 'Winner Verified',
  disqualified: 'Did Not Pass Verification',
  re_draw_required: 'Under Review — Re-Draw in Progress',
};

export default function WinnerScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams();
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const productIdValue = Array.isArray(productId) ? productId[0] : productId;
  const [product, setProduct] = useState<Product | null>(null);
  const [result, setResult] = useState<PublicDrawResult | null>(null);
  const [entryCount, setEntryCount] = useState(0);
  const [myTicket, setMyTicket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState<string[] | null>(null);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [prevDraw, setPrevDraw] = useState<{ product_id: string; product_name: string } | null>(null);
  const [nextDraw, setNextDraw] = useState<{ product_id: string; product_name: string } | null>(null);
  const [showReplay, setShowReplay] = useState(false);
  const [replayLoading, setReplayLoading] = useState(false);

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

    const storedPhone = await getStoredValue('userPhone');
    if (storedPhone) {
      const { data: ticket } = await supabase.rpc('get_my_ticket_for_draw', {
        p_product_id: productIdValue,
        p_phone: storedPhone,
      });
      setMyTicket(ticket || null);
    }

    await fetchNeighborDraws(productIdValue);
    setLoading(false);
  }

  async function fetchNeighborDraws(currentProductId: string) {
    const { data } = await supabase.rpc('get_public_winners_list');
    if (!data) { setPrevDraw(null); setNextDraw(null); return; }
    const index = data.findIndex((w) => w.product_id === currentProductId);
    if (index === -1) { setPrevDraw(null); setNextDraw(null); return; }
    // List is ordered newest-first: the item after this one (higher index) is older ("Previous"),
    // the item before this one (lower index) is newer ("Next").
    const older = data[index + 1];
    const newer = data[index - 1];
    setPrevDraw(older ? { product_id: older.product_id, product_name: older.product_name } : null);
    setNextDraw(newer ? { product_id: newer.product_id, product_name: newer.product_name } : null);
  }

  async function ensureParticipantsLoaded() {
    if (participants !== null || !productIdValue) return;
    setParticipantsLoading(true);
    const { data } = await supabase.rpc('get_draw_ticket_numbers', { p_product_id: productIdValue });
    setParticipants((data || []).map((row) => row.ticket_number));
    setParticipantsLoading(false);
  }

  async function toggleParticipants() {
    if (showParticipants) {
      setShowParticipants(false);
      return;
    }
    setShowParticipants(true);
    await ensureParticipantsLoaded();
  }

  async function openReplay() {
    if (!result) return;
    setReplayLoading(true);
    await ensureParticipantsLoaded();
    setReplayLoading(false);
    setShowReplay(true);
  }

  function maskPhone(phone?: string | null) {
    if (!phone) return 'N/A';
    return phone.slice(0, 4) + '****' + phone.slice(-3);
  }

  const resultUrl = `${APP_URL}/winner?productId=${productIdValue}`;

  async function copyResultLink() {
    await Clipboard.setStringAsync(resultUrl);
    Alert.alert('Copied', 'Draw result link has been copied.');
  }

  async function shareResult() {
    const winnerLabel = result?.winner_name || 'A lucky winner';
    const prizeLabel = product?.name || 'a prize';
    await Share.share({
      title: 'JeetoBaz Draw Result',
      message: `${winnerLabel} won ${prizeLabel} on JeetoBaz! Verified fair draw, no exceptions.\n${resultUrl}`,
      url: resultUrl,
    });
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

      <View style={styles.shareRow}>
        <TouchableOpacity style={styles.copyLinkButton} onPress={copyResultLink}>
          <Copy color="#18a663" size={18} />
          <Text style={styles.copyLinkText}>Copy Link</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareResultButton} onPress={shareResult}>
          <Share2 color="#000" size={18} />
          <Text style={styles.shareResultText}>Share Result</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <TouchableOpacity
          style={styles.replayButton}
          onPress={openReplay}
          disabled={replayLoading}
          accessibilityRole="button"
          accessibilityLabel="Watch draw again"
        >
          {replayLoading ? <ActivityIndicator size="small" color="#18a663" /> : <RotateCcw color="#18a663" size={18} />}
          <Text style={styles.replayButtonText}>Watch Draw Again</Text>
        </TouchableOpacity>
      )}

      {myTicket && (
        <View style={styles.myTicketCard}>
          <View style={styles.myTicketTitleRow}><Ticket color="#ff4444" size={18} /><Text style={styles.myTicketTitle}>Your Ticket</Text></View>
          <Text style={styles.myTicketNumber}>{myTicket}</Text>
          <Text style={styles.myTicketStatus}>
            {result?.winner_ticket_number === myTicket
              ? '🎉 This is the winning ticket — congratulations!'
              : "Not the winning ticket this time — better luck next draw!"}
          </Text>
        </View>
      )}

      {result?.winner_status && (
        <View style={styles.statusCard}>
          <View style={styles.statusTitleRow}>
            {result.winner_status === 'verified' ? (
              <ShieldCheck color="#18a663" size={18} />
            ) : result.winner_status === 'disqualified' || result.winner_status === 're_draw_required' ? (
              <TriangleAlert color="#ff4444" size={18} />
            ) : (
              <Clock color="#FFD700" size={18} />
            )}
            <Text style={styles.statusTitle}>Winner Verification Status</Text>
          </View>
          <Text style={styles.statusValue}>{WINNER_STATUS_LABEL[result.winner_status]}</Text>
        </View>
      )}

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
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Prize Value</Text>
          <Text style={styles.detailValue}>Rs. {(product?.price || 0).toLocaleString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Entry Fee</Text>
          <Text style={styles.detailValue}>Rs. {(product?.entry_fee || 1).toLocaleString()}</Text>
        </View>
        {product?.created_at && result?.drawn_at && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Draw Duration</Text>
            <Text style={styles.detailValue}>
              {Math.max(1, Math.round((new Date(result.drawn_at).getTime() - new Date(product.created_at).getTime()) / 86400000))} days
            </Text>
          </View>
        )}
      </View>

      {(prevDraw || nextDraw) && (
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navButton, !prevDraw && styles.navButtonDisabled]}
            onPress={() => prevDraw && router.push({ pathname: '/winner', params: { productId: prevDraw.product_id } })}
            disabled={!prevDraw}
          >
            <ChevronLeft color={prevDraw ? '#18a663' : '#444'} size={18} />
            <Text style={[styles.navButtonText, !prevDraw && styles.navButtonTextDisabled]} numberOfLines={1}>
              {prevDraw ? prevDraw.product_name : 'No Earlier Draw'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, !nextDraw && styles.navButtonDisabled]}
            onPress={() => nextDraw && router.push({ pathname: '/winner', params: { productId: nextDraw.product_id } })}
            disabled={!nextDraw}
          >
            <Text style={[styles.navButtonText, !nextDraw && styles.navButtonTextDisabled]} numberOfLines={1}>
              {nextDraw ? nextDraw.product_name : 'No Later Draw'}
            </Text>
            <ChevronRight color={nextDraw ? '#18a663' : '#444'} size={18} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.participantsCard}>
        <TouchableOpacity style={styles.participantsHeader} onPress={toggleParticipants}>
          <View style={styles.participantsTitleRow}>
            <Users color="#18a663" size={18} />
            <Text style={styles.participantsTitle}>All Participant Tickets ({entryCount.toLocaleString()})</Text>
          </View>
          {showParticipants ? <ChevronUp color="#18a663" size={20} /> : <ChevronDown color="#18a663" size={20} />}
        </TouchableOpacity>
        {showParticipants && (
          participantsLoading ? (
            <ActivityIndicator size="small" color="#18a663" style={styles.participantsLoading} />
          ) : (
            <FlatList
              data={participants || []}
              keyExtractor={(item) => item}
              style={styles.participantsList}
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={5}
              renderItem={({ item }) => (
                <View style={[styles.participantRow, item === myTicket && styles.participantRowMine]}>
                  <Text style={[styles.participantTicket, item === myTicket && styles.participantTicketMine]}>{item}</Text>
                  {item === myTicket && <Text style={styles.participantYou}>YOU</Text>}
                </View>
              )}
            />
          )
        )}
      </View>

      <View style={styles.verifyCard}>
        <View style={styles.verifyTitleRow}><ShieldCheck color="#18a663" size={18} /><Text style={styles.verifyTitle}>{t('verifiedFairDraw')}</Text></View>
        <Text style={styles.verifyText}>
          {t('winnerAlgorithmText')}
        </Text>
        <TouchableOpacity onPress={() => router.push('/why-fair')}>
          <Text style={styles.verifyLink}>Why JeetoBaz is Fair →</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/')}>
        <Medal color="#000" size={19} /><Text style={styles.buttonText}>{t('newDrawJoin')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/explore')}>
        <Trophy color="#FFD700" size={19} /><Text style={styles.secondaryButtonText}>{t('pastWinners')}</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>JeetoBaz - {t('appTagline')}</Text>
    </ScrollView>
    {showReplay && result && productIdValue ? (
      <DrawReplayOverlay
        theme={theme}
        result={result}
        ticketNumbers={participants || []}
        productId={productIdValue}
        myTicket={myTicket}
        onClose={() => setShowReplay(false)}
      />
    ) : null}
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
  shareRow: { flexDirection: 'row', gap: 10, marginHorizontal: 15, marginTop: 15 },
  copyLinkButton: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: '#18a663', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  copyLinkText: { color: '#18a663', fontSize: 14, fontWeight: 'bold' },
  shareResultButton: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  shareResultText: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  replayButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 15, marginTop: 12, minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: '#18a663' },
  replayButtonText: { color: '#18a663', fontSize: 14, fontWeight: 'bold' },
  myTicketCard: { backgroundColor: '#2b0d0d', marginHorizontal: 15, marginTop: 15, borderRadius: 15, padding: 20, borderWidth: 2, borderColor: '#ff4444', alignItems: 'center' },
  myTicketTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  myTicketTitle: { fontSize: 14, fontWeight: 'bold', color: '#ff4444', textTransform: 'uppercase' },
  myTicketNumber: { fontSize: 24, fontWeight: 'bold', color: '#ff4444', fontFamily: 'monospace' },
  myTicketStatus: { fontSize: 13, color: '#ddd', marginTop: 8, textAlign: 'center' },
  statusCard: { backgroundColor: '#071b13', marginHorizontal: 15, marginTop: 15, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#174a35' },
  statusTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  statusTitle: { fontSize: 15, fontWeight: 'bold', color: 'white' },
  statusValue: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  statusNote: { fontSize: 13, color: '#aaa', marginTop: 6, lineHeight: 18 },
  detailCard: { backgroundColor: '#071b13', margin: 15, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#174a35' },
  navRow: { flexDirection: 'row', gap: 10, marginHorizontal: 15, marginBottom: 15 },
  navButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#071b13', borderRadius: 12, borderWidth: 1, borderColor: '#174a35', paddingVertical: 12, paddingHorizontal: 10 },
  navButtonDisabled: { opacity: 0.4 },
  navButtonText: { color: '#18a663', fontSize: 12, fontWeight: 'bold', flexShrink: 1 },
  navButtonTextDisabled: { color: '#666' },
  detailTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 15 },
  detailTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { color: '#aaa', fontSize: 14 },
  detailValue: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  participantsCard: { backgroundColor: '#071b13', marginHorizontal: 15, marginBottom: 15, borderRadius: 15, borderWidth: 1, borderColor: '#174a35', overflow: 'hidden' },
  participantsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  participantsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  participantsTitle: { fontSize: 15, fontWeight: 'bold', color: 'white' },
  participantsLoading: { paddingBottom: 20 },
  participantsList: { maxHeight: 320, paddingHorizontal: 18 },
  participantRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#0e2a1c' },
  participantRowMine: { backgroundColor: 'rgba(255,68,68,0.08)', marginHorizontal: -18, paddingHorizontal: 18, borderRadius: 6 },
  participantTicket: { color: '#aaa', fontSize: 13, fontFamily: 'monospace' },
  participantTicketMine: { color: '#ff4444', fontWeight: 'bold' },
  participantYou: { color: '#ff4444', fontSize: 11, fontWeight: 'bold' },
  verifyCard: { backgroundColor: '#082d1e', margin: 15, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#18a663' },
  verifyTitle: { fontSize: 16, fontWeight: 'bold', color: '#18a663', marginBottom: 8 },
  verifyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  verifyText: { color: '#aaa', fontSize: 14, lineHeight: 22 },
  verifyLink: { color: '#18a663', fontSize: 14, fontWeight: 'bold', marginTop: 12 },
  button: { backgroundColor: '#FFD700', margin: 15, padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  secondaryButton: { backgroundColor: '#071b13', marginHorizontal: 15, marginBottom: 15, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, borderWidth: 1, borderColor: '#FFD700' },
  secondaryButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFD700' },
  footer: { textAlign: 'center', color: '#444', fontSize: 12, marginBottom: 30 },
});
