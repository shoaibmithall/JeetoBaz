import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import { getStoredValue } from '@/lib/storage';
import { loadOfflineCache, saveOfflineCache } from '@/lib/offline-cache';
import { DataErrorState } from '@/components/data-error-state';
import type { Entry, Product, Transaction } from '@/types/database';
import { useAppTheme } from '@/hooks/use-theme';
import { CircleAlert, LockKeyhole, Target, Trophy } from 'lucide-react-native';

type EntryWithProduct = Entry & { products?: Product | null };
type PendingPaymentWithProduct = Transaction & { products?: Product | null };
type EntriesCache = {
  entries: EntryWithProduct[];
  pendingPayments: PendingPaymentWithProduct[];
};

function getEntriesCacheKey(phone: string) {
  return `offlineCache:entries:${phone}`;
}

export default function MyEntriesScreen() {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const [entries, setEntries] = useState<EntryWithProduct[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPaymentWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [cacheInfo, setCacheInfo] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function loadEntries() {
      const [phone, name] = await Promise.all([
        getStoredValue('userPhone'),
        getStoredValue('userName'),
      ]);
      if (!active) return;
      setUserPhone(phone || '');
      setUserName(name || '');
      if (phone) fetchEntries(phone);
      else setLoading(false);
    }

    loadEntries();
    return () => { active = false; };
  }, []);

  async function fetchEntries(phone: string) {
    setLoading(true);
    setLoadError(false);
    setCacheInfo('');
    const [{ data: entryData, error: entryError }, { data: paymentData, error: paymentError }] = await Promise.all([
      supabase
      .from('entries')
      .select('*, products(*)')
      .eq('phone', phone)
        .order('created_at', { ascending: false }),
      supabase
        .from('transactions')
        .select('*, products(*)')
        .eq('phone', phone)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ]);

    if (entryData || paymentData) {
      const nextEntries = (entryData || []) as unknown as EntryWithProduct[];
      const nextPendingPayments = (paymentData || []) as unknown as PendingPaymentWithProduct[];
      setEntries(nextEntries);
      setPendingPayments(nextPendingPayments);
      await saveOfflineCache(getEntriesCacheKey(phone), [{ entries: nextEntries, pendingPayments: nextPendingPayments }]);
    }
    if (entryError || paymentError) {
      const cached = await loadOfflineCache<EntriesCache[]>(getEntriesCacheKey(phone));
      const cachedData = cached?.data[0];
      if (cachedData) {
        setEntries(cachedData.entries || []);
        setPendingPayments(cachedData.pendingPayments || []);
        setCacheInfo(`Showing saved entries from ${new Date(cached.savedAt).toLocaleString()}.`);
      } else {
        setLoadError(true);
      }
    }
    setLoading(false);
  }

  function getTicketNumber(entry: EntryWithProduct) {
    return entry.ticket_number || `JB-${entry.id.slice(0, 8).toUpperCase()}`;
  }

  function getEntryStatus(entry: EntryWithProduct) {
    const product = entry.products;
    if (!product) return { label: 'Entry Approved', color: '#1DB954', background: '#0d2b1a' };
    if (product.status === 'completed') {
      if (product.winner_phone === entry.phone) return { label: 'Winner', color: '#FFD700', background: '#2b2200' };
      return { label: 'Draw Completed', color: '#aaa', background: '#222' };
    }
    if ((product.current_entries || 0) >= product.max_entries) {
      return { label: product.draw_date ? 'Draw Scheduled' : 'Ready to Schedule', color: '#FFD700', background: '#2b2200' };
    }
    return { label: 'Waiting for Participants', color: '#1DB954', background: '#0d2b1a' };
  }

  function getDrawStatusText(product?: Product | null) {
    if (!product) return 'Draw details unavailable';
    if (product.status === 'completed') return 'Draw completed';
    const spotsLeft = Math.max(product.max_entries - (product.current_entries || 0), 0);
    if (spotsLeft > 0) return `${spotsLeft.toLocaleString()} spots left before draw scheduling`;
    if (product.draw_date) return `Draw scheduled: ${product.draw_date}`;
    return 'Participants complete. JeetoBaz will announce the date, usually within about 1 week at 10:00 PM PKT.';
  }

  if (loading) return (
    <View style={[styles.loading, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.primary }]}>{t('loadingEntries')}</Text>
    </View>
  );

  if (loadError) return <DataErrorState onRetry={() => fetchEntries(userPhone)} />;

  if (!userPhone) return (
    <View style={[styles.notLoggedIn, { backgroundColor: theme.background }]}>
      <LockKeyhole color={theme.gold} size={60} />
      <Text style={[styles.notLoggedInText, { color: theme.text }]}>Please login to see your entries</Text>
      <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
        <Text style={styles.loginBtnText}>{t('loginSignUp')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}><Target color="white" size={28} /><Text style={styles.title}>{t('myEntries')}</Text></View>
        <Text style={styles.subtitle}>{t('welcome')}, {userName}!</Text>
      </View>

      {cacheInfo ? (
        <View style={[styles.cacheBanner, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}>
          <CircleAlert color={theme.gold} size={17} /><Text style={[styles.cacheText, { color: theme.gold }]}>{cacheInfo}</Text>
          <TouchableOpacity onPress={() => fetchEntries(userPhone)}>
            <Text style={[styles.cacheRetry, { color: theme.primary }]}>{t('tryAgain')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={[styles.statsBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.statColumn}>
          <Text style={styles.statsNumber}>{entries.length}</Text>
          <Text style={[styles.statsLabel, { color: theme.muted }]}>Approved Tickets</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statColumn}>
          <Text style={styles.statsNumber}>{pendingPayments.length}</Text>
          <Text style={[styles.statsLabel, { color: theme.muted }]}>Pending Payments</Text>
        </View>
      </View>

      {entries.length === 0 && pendingPayments.length === 0 ? (
        <View style={styles.emptyBox}>
          <Target color={theme.subtle} size={60} />
          <Text style={[styles.emptyText, { color: theme.text }]}>{t('noEntriesYet')}</Text>
          <Text style={[styles.emptySubText, { color: theme.muted }]}>{t('enterDrawHere')}</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/')}>
            <Text style={styles.browseBtnText}>{t('browseActiveDraws')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {pendingPayments.map((payment) => (
            <View key={payment.id} style={[styles.entryCard, styles.pendingCard, { backgroundColor: theme.surface }]}>
              <View style={styles.entryHeader}>
                <Text style={[styles.productName, { color: theme.text }]}>{payment.products?.name || t('unknownProduct')}</Text>
                <View style={[styles.statusBadge, styles.pendingBadge]}>
                  <Text style={styles.pendingStatusText}>Payment Pending</Text>
                </View>
              </View>
              <Text style={styles.ticketNumber}>Ticket: Pending admin approval</Text>
              <Text style={styles.productPrice}>Rs. {payment.products?.price?.toLocaleString() || payment.amount}</Text>
              <Text style={[styles.entryDate, { color: theme.muted }]}>
                Submitted: {new Date(payment.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
              <View style={[styles.infoRow, { backgroundColor: theme.surfaceAlt }]}>
                <Text style={[styles.infoLabel, { color: theme.subtle }]}>Payment method</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{payment.payment_method || t('notProvided')}</Text>
              </View>
              <Text style={[styles.drawStatus, { color: theme.text }]}>{getDrawStatusText(payment.products)}</Text>
              <Text style={styles.pendingNote}>Your ticket will appear here after admin approval.</Text>
            </View>
          ))}

          {entries.map((entry) => {
            const entryStatus = getEntryStatus(entry);
            return (
              <View key={entry.id} style={[styles.entryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.entryHeader}>
                  <Text style={[styles.productName, { color: theme.text }]}>{entry.products?.name || t('unknownProduct')}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: entryStatus.background }]}>
                    <Text style={[styles.statusText, { color: entryStatus.color }]}>{entryStatus.label}</Text>
                  </View>
                </View>
                <Text style={styles.ticketNumber}>Ticket: {getTicketNumber(entry)}</Text>
                <Text style={styles.productPrice}>Rs. {entry.products?.price?.toLocaleString()}</Text>
                <Text style={[styles.entryDate, { color: theme.muted }]}>
                  Approved: {new Date(entry.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
                <View style={[styles.infoRow, { backgroundColor: theme.surfaceAlt }]}>
                  <Text style={[styles.infoLabel, { color: theme.subtle }]}>Draw status</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>{getDrawStatusText(entry.products)}</Text>
                </View>
                {entry.transaction_id && (
                  <View style={[styles.infoRow, { backgroundColor: theme.surfaceAlt }]}>
                    <Text style={[styles.infoLabel, { color: theme.subtle }]}>Payment ref</Text>
                    <Text style={[styles.infoValue, { color: theme.text }]}>{entry.transaction_id}</Text>
                  </View>
                )}
                {entry.products?.winner_phone === entry.phone && (
                  <View style={styles.winnerBanner}>
                    <Trophy color="#FFD700" size={17} /><Text style={styles.winnerText}>{t('wonThisDraw')}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/')}>
        <Text style={styles.backBtnText}>← {t('backToDraws')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loading: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#1DB954', marginTop: 10, fontSize: 16 },
  notLoggedIn: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 30 },
  notLoggedInText: { color: 'white', fontSize: 18, marginBottom: 20, textAlign: 'center' },
  loginBtn: { backgroundColor: '#FFD700', padding: 15, borderRadius: 12, alignItems: 'center', width: '100%' },
  loginBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  header: { backgroundColor: '#1DB954', padding: 30, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subtitle: { fontSize: 14, color: 'white', marginTop: 5 },
  cacheBanner: { marginHorizontal: 15, marginTop: 15, borderWidth: 1, borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cacheText: { flex: 1, fontSize: 12, lineHeight: 17 },
  cacheRetry: { fontSize: 12, fontWeight: 'bold' },
  statsBox: { backgroundColor: '#1a1a1a', margin: 15, borderRadius: 15, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#333', flexDirection: 'row' },
  statColumn: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 48, backgroundColor: '#333', marginHorizontal: 12 },
  statsNumber: { fontSize: 38, fontWeight: 'bold', color: '#FFD700' },
  statsLabel: { fontSize: 14, color: '#aaa', marginTop: 5 },
  emptyBox: { alignItems: 'center', padding: 40 },
  emptyText: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptySubText: { color: '#aaa', fontSize: 14, marginBottom: 25 },
  browseBtn: { backgroundColor: '#1DB954', padding: 15, borderRadius: 12, alignItems: 'center', width: '100%' },
  browseBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  entryCard: { backgroundColor: '#1a1a1a', margin: 15, marginBottom: 0, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#333' },
  pendingCard: { borderColor: '#FFD700' },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 18, fontWeight: 'bold', color: 'white', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activeBadge: { backgroundColor: '#0d2b1a' },
  completedBadge: { backgroundColor: '#2b2b0d' },
  pendingBadge: { backgroundColor: '#2b2200' },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#1DB954' },
  pendingStatusText: { fontSize: 12, fontWeight: 'bold', color: '#FFD700' },
  ticketNumber: { color: '#4a9eff', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  productPrice: { color: '#FFD700', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  entryDate: { color: '#aaa', fontSize: 13 },
  infoRow: { backgroundColor: '#111', borderRadius: 8, padding: 10, marginTop: 10 },
  infoLabel: { color: '#777', fontSize: 11, marginBottom: 3, textTransform: 'uppercase' },
  infoValue: { color: '#ddd', fontSize: 13, lineHeight: 18 },
  drawStatus: { color: '#ddd', fontSize: 13, lineHeight: 18, marginTop: 10 },
  pendingNote: { color: '#FFD700', fontSize: 12, marginTop: 10 },
  winnerBanner: { backgroundColor: '#2b2200', borderWidth: 1, borderColor: '#FFD700', borderRadius: 8, padding: 10, marginTop: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  winnerText: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },
  backBtn: { margin: 15, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333', marginTop: 20, marginBottom: 40 },
  backBtnText: { color: '#aaa', fontSize: 16 },
});
