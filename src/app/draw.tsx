import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { Entry } from '@/types/database';
import { useLanguage } from '@/lib/i18n';
import { createUserNotification } from '@/lib/notifications';
import { Dices, House, List, LockKeyhole, MousePointer2, Radio, Target, Trophy, UsersRound } from 'lucide-react-native';

const ADMIN_EMAIL = 'shoaibmithall@gmail.com';

export default function DrawScreen() {
  const router = useRouter();
  const { productId, productName } = useLocalSearchParams();
  const { t } = useLanguage();
  const productIdValue = Array.isArray(productId) ? productId[0] : productId;
  const productNameValue = Array.isArray(productName) ? productName[0] : productName;
  const [phase, setPhase] = useState('ready');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [highlighted, setHighlighted] = useState(-1);
  const [winner, setWinner] = useState<Entry | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setIsAdmin(data.session?.user.email?.toLowerCase() === ADMIN_EMAIL);
      setAuthLoading(false);
    });

    return () => { active = false; };
  }, []);

  async function loadEntries() {
    if (!productIdValue) {
      alert('Missing product for this draw!');
      return;
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, status, winner_phone')
      .eq('id', productIdValue)
      .maybeSingle();

    if (productError || !product) {
      alert('This draw could not be verified.');
      return;
    }

    if (product.status === 'completed' && product.winner_phone) {
      router.push({ pathname: '/winner', params: { productId: productIdValue } });
      return;
    }

    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('product_id', productIdValue);
    if (data && data.length > 0) {
      setEntries(data);
      setPhase('showing');
    } else {
      alert('No entries found for this draw!');
    }
  }

  async function startSpin() {
    if (entries.length === 0) {
      alert('No approved entries found for this draw.');
      return;
    }

    setPhase('spinning');
    const { data, error } = await supabase.rpc('run_jeetobaz_draw', {
      requested_product_id: productIdValue!,
    });

    if (error || !data?.[0]) {
      setPhase('showing');
      alert('Draw could not run: ' + (error?.message || 'No locked result was returned.'));
      return;
    }

    const result = data[0];
    const selectedWinner = entries.find((entry) => entry.id === result.winner_entry_id) || {
      id: result.winner_entry_id,
      product_id: productIdValue!,
      phone: result.winner_phone,
      name: result.winner_name,
      ticket_number: result.winner_ticket_number,
      created_at: result.drawn_at,
    };

    let count = 0;
    const interval = setInterval(() => {
      setHighlighted(Math.floor(Math.random() * entries.length));
      count++;
      if (count > 40) {
        clearInterval(interval);
        const winnerIndex = entries.findIndex((entry) => entry.id === selectedWinner.id);
        setHighlighted(winnerIndex);
        setWinner(selectedWinner);
        setPhase('winner');
        sendWinnerNotifications(selectedWinner);
      }
    }, 100);
  }

  async function sendWinnerNotifications(w: Entry) {
    const productTitle = productNameValue || 'JeetoBaz draw';
    await createUserNotification({
      title: 'You won!',
      body: `Congratulations! Aap ${productTitle} ke lucky winner select hue hain. JeetoBaz support aap se contact karega.`,
      targetPhone: w.phone,
      kind: 'winner-alert',
      link: '/entries',
    });
    await createUserNotification({
      title: 'Winner announced',
      body: `${productTitle} ka winner announce ho gaya hai. Past Winners page par result check karein.`,
      kind: 'winner-announced',
      link: '/explore',
    });
  }

  function maskPhone(phone?: string | null) {
    if (!phone) return '';
    return phone.slice(0, 4) + '****' + phone.slice(-3);
  }

  function maskName(name?: string | null) {
    if (!name) return t('notProvided');
    const parts = name.split(' ');
    return parts.map((p: string) => p[0] + '***').join(' ');
  }

  if (authLoading) return (
    <View style={[styles.container, styles.center]}>
      <Text style={styles.readyTitle}>Verifying admin access...</Text>
    </View>
  );

  if (!isAdmin) return (
    <View style={[styles.container, styles.center]}>
      <LockKeyhole color="#FFD700" size={80} />
      <Text style={styles.readyTitle}>Admin access required</Text>
      <TouchableOpacity style={styles.loadButton} onPress={() => router.replace('/admin')}>
        <Text style={styles.loadButtonText}>Go to Admin Login</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← {t('back')}</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}><Dices color="#FFD700" size={20} /><Text style={styles.title}>{t('liveDrawTitle')}</Text></View>
        <View style={styles.liveBox}>
          <Radio color="#ff4444" size={14} /><Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <Text style={styles.productTitle}>{productNameValue || t('liveDrawTitle')}</Text>

      {phase === 'ready' && (
        <View style={styles.center}>
          <Target color="#FFD700" size={80} />
          <Text style={styles.readyTitle}>{t('readyToDraw')}</Text>
          <Text style={styles.readySubtitle}>{t('allDrawsLive')}</Text>
          <TouchableOpacity style={styles.loadButton} onPress={loadEntries}>
            <List color="white" size={19} /><Text style={styles.loadButtonText}>{t('showParticipants')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {(phase === 'showing' || phase === 'spinning') && (
        <View style={styles.flex}>
          <View style={styles.listTitleRow}>
            {phase === 'showing' ? <UsersRound color="#FFD700" size={18} /> : <Dices color="#FFD700" size={18} />}
            <Text style={styles.listTitle}>{phase === 'showing' ? `${entries.length} ${t('participants')}:` : t('selectingWinner')}</Text>
          </View>
          <ScrollView style={styles.list}>
            {entries.map((entry, index) => (
              <View key={entry.id} style={[
                styles.entryRow,
                highlighted === index && styles.entryHighlighted
              ]}>
                <Text style={[styles.entryNum, highlighted === index && styles.whiteText]}>
                  #{index + 1}
                </Text>
                <View style={styles.entryInfo}>
                  <Text style={[styles.entryName, highlighted === index && styles.whiteText]}>
                    {entry.name ? maskName(entry.name) : t('notProvided')}
                  </Text>
                  <Text style={[styles.entryPhone, highlighted === index && styles.whiteText]}>
                    {maskPhone(entry.phone)}
                  </Text>
                </View>
                {highlighted === index && <MousePointer2 color="white" size={18} />}
              </View>
            ))}
          </ScrollView>
          {phase === 'showing' && (
            <TouchableOpacity style={styles.spinButton} onPress={startSpin}>
              <Dices color="#000" size={20} /><Text style={styles.spinButtonText}>{t('pickWinner')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {phase === 'winner' && winner && (
        <ScrollView>
          <View style={styles.winnerCard}>
            <Trophy color="#FFD700" size={80} />
            <Text style={styles.congratsText}>CONGRATULATIONS!</Text>
            <Text style={styles.winnerName}>{winner.name || t('winnerOf')}</Text>
            <Text style={styles.winnerPhone}>{maskPhone(winner.phone)}</Text>
            <Text style={styles.winnerSub}>{t('winnerOf')} {productNameValue}!</Text>
          </View>
          <View style={styles.allTitleRow}><List color="white" size={18} /><Text style={styles.allTitle}>{t('showParticipants')}:</Text></View>
          {entries.map((entry, index) => (
            <View key={entry.id} style={[
              styles.entryRow,
              entry.id === winner.id && styles.winnerRow
            ]}>
              <Text style={[styles.entryNum, entry.id === winner.id && styles.goldText]}>
                #{index + 1}
              </Text>
              <View style={styles.entryInfo}>
                <Text style={[styles.entryName, entry.id === winner.id && styles.goldText]}>
                  {entry.name ? maskName(entry.name) : t('notProvided')}
                </Text>
                <Text style={[styles.entryPhone, entry.id === winner.id && styles.goldText]}>
                  {maskPhone(entry.phone)}
                </Text>
              </View>
              {entry.id === winner.id && <View style={styles.winnerBadge}><Trophy color="#FFD700" size={14} /><Text style={styles.winnerBadgeText}>WINNER</Text></View>}
            </View>
          ))}
          <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/')}>
            <House color="white" size={18} /><Text style={styles.homeButtonText}>{t('backToHome')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resultButton} onPress={() => router.push({ pathname: '/winner', params: { productId: productIdValue } })}>
            <Trophy color="#000" size={18} /><Text style={styles.resultButtonText}>View Result</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  flex: { flex: 1 },
  header: { backgroundColor: '#04140e', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  backBtn: { color: '#18a663', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveBox: { backgroundColor: '#2b0d0d', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveText: { color: '#ff4444', fontWeight: 'bold', fontSize: 12 },
  productTitle: { color: 'white', fontSize: 16, textAlign: 'center', padding: 12, backgroundColor: '#04140e', borderBottomWidth: 1, borderBottomColor: '#174a35' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  readyTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 10 },
  readySubtitle: { fontSize: 14, color: '#aaa', marginBottom: 30 },
  loadButton: { backgroundColor: '#18a663', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: '100%', flexDirection: 'row', gap: 7 },
  loadButtonText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  listTitle: { color: '#FFD700', fontSize: 16, fontWeight: 'bold', padding: 15 },
  listTitleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  list: { flex: 1 },
  entryRow: { flexDirection: 'row', alignItems: 'center', padding: 14, marginHorizontal: 15, marginBottom: 6, backgroundColor: '#071b13', borderRadius: 10, borderWidth: 1, borderColor: '#174a35' },
  entryHighlighted: { backgroundColor: '#18a663', borderColor: '#18a663' },
  entryNum: { color: '#aaa', fontSize: 13, width: 40 },
  entryInfo: { flex: 1 },
  entryName: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  entryPhone: { color: '#aaa', fontSize: 13, fontFamily: 'monospace', marginTop: 2 },
  whiteText: { color: 'white', fontWeight: 'bold' },
  spinButton: { backgroundColor: '#FFD700', margin: 15, padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  spinButtonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  winnerCard: { backgroundColor: '#071b13', margin: 15, borderRadius: 15, padding: 30, alignItems: 'center', borderWidth: 2, borderColor: '#FFD700' },
  congratsText: { fontSize: 26, fontWeight: 'bold', color: '#FFD700', marginBottom: 10 },
  winnerName: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  winnerPhone: { fontSize: 18, color: '#aaa', fontFamily: 'monospace', marginBottom: 8 },
  winnerSub: { fontSize: 14, color: '#18a663' },
  allTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', padding: 15 },
  allTitleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  winnerRow: { backgroundColor: '#2a2105', borderColor: '#FFD700' },
  goldText: { color: '#FFD700', fontWeight: 'bold' },
  winnerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  winnerBadgeText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold' },
  homeButton: { backgroundColor: '#18a663', margin: 15, padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 40, flexDirection: 'row', gap: 7 },
  homeButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  resultButton: { backgroundColor: '#FFD700', marginHorizontal: 15, marginBottom: 40, padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  resultButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});
