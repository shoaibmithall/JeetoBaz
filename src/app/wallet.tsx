import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/providers/AuthProvider';
import { getStoredValue, setStoredValue } from '@/lib/storage';
import { loadOfflineCache, saveOfflineCache } from '@/lib/offline-cache';
import { BrandedLoader } from '@/components/branded-loader';
import { DataErrorState } from '@/components/data-error-state';
import type { WalletTransactionRow, WalletTransactionType } from '@/types/database';
import { useAppTheme } from '@/hooks/use-theme';
import { ArrowDownLeft, ArrowUpRight, CircleAlert, LockKeyhole, Plus, Wallet as WalletIcon } from 'lucide-react-native';

type WalletCache = {
  balance: number;
  transactions: WalletTransactionRow[];
};

function getWalletCacheKey(phone: string) {
  return `offlineCache:wallet:${phone}`;
}

const TRANSACTION_LABELS: Record<WalletTransactionType, string> = {
  topup: 'Wallet Top-Up',
  entry: 'Draw Entry',
  refund: 'Refund',
  bonus: 'Bonus',
  adjustment: 'Adjustment',
};

export default function WalletScreen() {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { user, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransactionRow[]>([]);
  const [pendingTopupAmount, setPendingTopupAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadErrorDetail, setLoadErrorDetail] = useState('');
  const [cacheInfo, setCacheInfo] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const { width } = useWindowDimensions();
  const isCompact = width < 640;

  const fetchWallet = useCallback(async (phone: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(false);
    setLoadErrorDetail('');
    setCacheInfo('');

    const [
      { data: walletRow, error: walletError },
      { data: txnRows, error: txnError },
      { data: pendingRows },
    ] = await Promise.all([
      supabase.from('wallets').select('*').eq('phone', phone).maybeSingle(),
      supabase.from('wallet_transactions').select('*').eq('phone', phone).order('created_at', { ascending: false }).limit(100),
      supabase.rpc('get_my_pending_wallet_topup_requests', { p_phone: phone }),
    ]);

    if (!walletError && !txnError) {
      const nextBalance = walletRow?.balance || 0;
      const nextTransactions = txnRows || [];
      setBalance(nextBalance);
      setTransactions(nextTransactions);
      setPendingTopupAmount(pendingRows?.[0]?.amount ?? null);
      await saveOfflineCache(getWalletCacheKey(phone), [{ balance: nextBalance, transactions: nextTransactions }]);
    } else {
      const cached = await loadOfflineCache<WalletCache[]>(getWalletCacheKey(phone));
      const cachedData = cached?.data[0];
      if (cachedData) {
        setBalance(cachedData.balance || 0);
        setTransactions(cachedData.transactions || []);
        setCacheInfo(`Showing saved balance from ${new Date(cached.savedAt).toLocaleString()}.`);
      } else {
        setLoadError(true);
        setLoadErrorDetail(walletError?.message || txnError?.message || '');
      }
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    let active = true;
    if (authLoading) return;

    async function loadWallet() {
      const cachedPhone = await getStoredValue('userPhone');
      if (!active) return;

      let resolvedPhone = cachedPhone || '';

      if (user?.id) {
        const { data: profile } = await supabase
          .from('users')
          .select('phone')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        if (!active) return;
        if (profile?.phone) {
          resolvedPhone = profile.phone;
          void setStoredValue('userPhone', profile.phone);
        }
      }

      setUserPhone(resolvedPhone);
      if (resolvedPhone) fetchWallet(resolvedPhone);
      else setLoading(false);
    }

    loadWallet();
    return () => { active = false; };
  }, [authLoading, user, fetchWallet]);

  if (loading) return (
    <>
    <Head>
      <title>My Wallet | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="View your JeetoBaz wallet balance and transaction history." />
    </Head>
    <View style={[styles.loading, { backgroundColor: theme.background }]}>
      <BrandedLoader message="Loading wallet..." />
    </View>
    </>
  );

  if (loadError) return (
    <>
    <Head>
      <title>My Wallet | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="View your JeetoBaz wallet balance and transaction history." />
    </Head>
    <DataErrorState
      message={loadErrorDetail ? `Something went wrong. Please try again.\n\n(${loadErrorDetail})` : undefined}
      onRetry={() => fetchWallet(userPhone)}
    />
    </>
  );

  if (!userPhone) return (
    <>
    <Head>
      <title>My Wallet | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="View your JeetoBaz wallet balance and transaction history." />
    </Head>
    <View style={[styles.notLoggedIn, { backgroundColor: theme.background }]}>
      <LockKeyhole color={theme.gold} size={60} />
      <Text style={[styles.notLoggedInText, { color: theme.text }]}>Please login to see your wallet</Text>
      <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
        <Text style={styles.loginBtnText}>{t('loginSignUp')}</Text>
      </TouchableOpacity>
    </View>
    </>
  );

  return (
    <>
    <Head>
      <title>My Wallet | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="View your JeetoBaz wallet balance and transaction history." />
    </Head>
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchWallet(userPhone, true)} tintColor={theme.gold} />}
    >
      <View style={[styles.header, isCompact && styles.headerCompact, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <View style={styles.titleRow}><WalletIcon color={theme.gold} size={28} /><Text style={[styles.title, { color: theme.gold }]}>My Wallet</Text></View>
      </View>

      {cacheInfo ? (
        <View style={[styles.cacheBanner, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}>
          <CircleAlert color={theme.gold} size={17} /><Text style={[styles.cacheText, { color: theme.gold }]}>{cacheInfo}</Text>
          <TouchableOpacity onPress={() => fetchWallet(userPhone)}>
            <Text style={[styles.cacheRetry, { color: theme.primary }]}>{t('tryAgain')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={[styles.balanceBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.balanceLabel, { color: theme.muted }]}>Available Balance</Text>
        <Text style={[styles.balanceNumber, { color: theme.gold }]}>Rs. {balance.toLocaleString()}</Text>
        <TouchableOpacity style={styles.topupBtn} onPress={() => router.push('/wallet-topup')}>
          <Plus color="#000" size={18} /><Text style={styles.topupBtnText}>Top Up</Text>
        </TouchableOpacity>
        {pendingTopupAmount != null ? (
          <Text style={[styles.pendingText, { color: theme.gold }]}>Rs. {pendingTopupAmount.toLocaleString()} top-up pending admin approval</Text>
        ) : null}
      </View>

      <Text style={[styles.historyTitle, { color: theme.text }]}>Transaction History</Text>

      {transactions.length === 0 ? (
        <View style={styles.emptyBox}>
          <WalletIcon color={theme.subtle} size={60} />
          <Text style={[styles.emptyText, { color: theme.text }]}>No transactions yet</Text>
          <Text style={[styles.emptySubText, { color: theme.muted }]}>Top up your wallet to enter draws instantly.</Text>
        </View>
      ) : (
        transactions.map((txn) => {
          const isCredit = txn.amount >= 0;
          return (
            <View key={txn.id} style={[styles.txnCard, isCompact && styles.txnCardCompact, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.txnIconBox, { backgroundColor: isCredit ? theme.primarySoft : theme.dangerSoft }]}>
                {isCredit
                  ? <ArrowDownLeft color={theme.primary} size={18} />
                  : <ArrowUpRight color={theme.danger} size={18} />}
              </View>
              <View style={styles.txnInfo}>
                <Text style={[styles.txnLabel, { color: theme.text }]}>{TRANSACTION_LABELS[txn.type]}</Text>
                <Text style={[styles.txnDate, { color: theme.muted }]}>
                  {new Date(txn.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.txnAmountBox}>
                <Text style={[styles.txnAmount, { color: isCredit ? theme.primary : theme.danger }]}>
                  {isCredit ? '+' : ''}Rs. {txn.amount.toLocaleString()}
                </Text>
                <Text style={[styles.txnBalanceAfter, { color: theme.subtle }]}>Bal: Rs. {txn.balance_after.toLocaleString()}</Text>
              </View>
            </View>
          );
        })
      )}

      <TouchableOpacity style={[styles.backBtn, { borderColor: theme.border }]} onPress={() => params.source === 'profile' ? router.replace('/login') : router.push('/')}>
        <Text style={[styles.backBtnText, { color: theme.muted }]}>← {params.source === 'profile' ? 'Back to Profile' : t('backToDraws')}</Text>
      </TouchableOpacity>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  loading: { flex: 1, backgroundColor: '#020d09', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#18a663', marginTop: 10, fontSize: 16 },
  notLoggedIn: { flex: 1, backgroundColor: '#020d09', justifyContent: 'center', alignItems: 'center', padding: 30 },
  notLoggedInText: { color: 'white', fontSize: 18, marginBottom: 20, textAlign: 'center' },
  loginBtn: { backgroundColor: '#FFD700', padding: 15, borderRadius: 12, alignItems: 'center', width: '100%' },
  loginBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  header: { backgroundColor: '#04140e', borderBottomColor: '#FFD700', borderBottomWidth: 2, padding: 30, alignItems: 'center' },
  headerCompact: { paddingVertical: 22, paddingHorizontal: 18 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cacheBanner: { marginHorizontal: 15, marginTop: 15, borderWidth: 1, borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cacheText: { flex: 1, fontSize: 12, lineHeight: 17 },
  cacheRetry: { fontSize: 12, fontWeight: 'bold' },
  balanceBox: { backgroundColor: '#071b13', margin: 15, borderRadius: 15, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#174a35' },
  balanceLabel: { fontSize: 14, color: '#aaa', marginBottom: 6 },
  balanceNumber: { fontSize: 40, fontWeight: 'bold', color: '#FFD700', marginBottom: 16 },
  topupBtn: { backgroundColor: '#FFD700', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  topupBtnText: { color: '#000', fontWeight: 'bold', fontSize: 15 },
  pendingText: { fontSize: 12, marginTop: 14, textAlign: 'center' },
  historyTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginHorizontal: 15, marginTop: 5, marginBottom: 10 },
  emptyBox: { alignItems: 'center', padding: 40 },
  emptyText: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptySubText: { color: '#aaa', fontSize: 14, marginBottom: 10, textAlign: 'center' },
  txnCard: { backgroundColor: '#071b13', marginHorizontal: 15, marginBottom: 10, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#174a35', flexDirection: 'row', alignItems: 'center', gap: 12 },
  txnCardCompact: { padding: 12, gap: 10 },
  txnIconBox: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  txnInfo: { flex: 1 },
  txnLabel: { fontSize: 15, fontWeight: 'bold', color: 'white' },
  txnDate: { fontSize: 12, color: '#aaa', marginTop: 2 },
  txnAmountBox: { alignItems: 'flex-end' },
  txnAmount: { fontSize: 15, fontWeight: 'bold' },
  txnBalanceAfter: { fontSize: 11, marginTop: 2 },
  backBtn: { margin: 15, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#174a35', marginTop: 20, marginBottom: 40 },
  backBtnText: { color: '#aaa', fontSize: 16 },
});
