import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useLocalSearchParams } from 'expo-router';

const supabase = createClient(
  'https://jqjrfnhqqfymwfsdkwmv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxanJmbmhxcWZ5bXdmc2Rrd212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTcxNDIsImV4cCI6MjA5NzU5MzE0Mn0.yuX-9QGr3w-gUQ9brELnohwgLNMDg7mhJTkRDw0L8w0'
);

export default function DrawScreen() {
  const router = useRouter();
  const { productId, productName } = useLocalSearchParams();
  const [phase, setPhase] = useState('ready');
  const [entries, setEntries] = useState([]);
  const [highlighted, setHighlighted] = useState(-1);
  const [winner, setWinner] = useState(null);

  async function loadEntries() {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('product_id', productId);
    if (data && data.length > 0) {
      setEntries(data);
      setPhase('showing');
    } else {
      alert('No entries found for this draw!');
    }
  }

  function startSpin() {
    setPhase('spinning');
    let count = 0;
    const interval = setInterval(() => {
      setHighlighted(Math.floor(Math.random() * entries.length));
      count++;
      if (count > 40) {
        clearInterval(interval);
        const winnerIndex = Math.floor(Math.random() * entries.length);
        setHighlighted(winnerIndex);
        setWinner(entries[winnerIndex]);
        setPhase('winner');
        saveWinner(entries[winnerIndex]);
      }
    }, 100);
  }

  async function saveWinner(w) {
    await supabase
      .from('products')
      .update({ status: 'completed', winner_phone: w.phone })
      .eq('id', productId);
  }

  function maskPhone(phone) {
    if (!phone) return '';
    return phone.slice(0, 7) + '****' + phone.slice(-4);
  }

  function maskName(name) {
    if (!name) return 'Unknown';
    const parts = name.split(' ');
    return parts.map(p => p[0] + '***').join(' ');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎰 Live Draw</Text>
        <View style={styles.liveBox}>
          <Text style={styles.liveText}>🔴 LIVE</Text>
        </View>
      </View>

      <Text style={styles.productTitle}>{productName || 'Lucky Draw'}</Text>

      {phase === 'ready' && (
        <View style={styles.center}>
          <Text style={styles.readyEmoji}>🎯</Text>
          <Text style={styles.readyTitle}>Ready to Draw!</Text>
          <Text style={styles.readySubtitle}>All participants are watching live</Text>
          <TouchableOpacity style={styles.loadButton} onPress={loadEntries}>
            <Text style={styles.loadButtonText}>📋 Show All Participants</Text>
          </TouchableOpacity>
        </View>
      )}

      {(phase === 'showing' || phase === 'spinning') && (
        <View style={styles.flex}>
          <Text style={styles.listTitle}>
            {phase === 'showing'
              ? `👥 ${entries.length} Participants:`
              : '🎰 Selecting Lucky Winner...'}
          </Text>
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
                    {entry.name ? maskName(entry.name) : 'Unknown'}
                  </Text>
                  <Text style={[styles.entryPhone, highlighted === index && styles.whiteText]}>
                    {maskPhone(entry.phone)}
                  </Text>
                </View>
                {highlighted === index && <Text>👈</Text>}
              </View>
            ))}
          </ScrollView>
          {phase === 'showing' && (
            <TouchableOpacity style={styles.spinButton} onPress={startSpin}>
              <Text style={styles.spinButtonText}>🎰 Pick Lucky Winner!</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {phase === 'winner' && winner && (
        <ScrollView>
          <View style={styles.winnerCard}>
            <Text style={styles.trophyEmoji}>🏆</Text>
            <Text style={styles.congratsText}>CONGRATULATIONS!</Text>
            <Text style={styles.winnerName}>{winner.name || 'Lucky Winner'}</Text>
            <Text style={styles.winnerPhone}>{maskPhone(winner.phone)}</Text>
            <Text style={styles.winnerSub}>Lucky Winner of {productName}!</Text>
          </View>
          <Text style={styles.allTitle}>📋 All Participants:</Text>
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
                  {entry.name ? maskName(entry.name) : 'Unknown'}
                </Text>
                <Text style={[styles.entryPhone, entry.id === winner.id && styles.goldText]}>
                  {maskPhone(entry.phone)}
                </Text>
              </View>
              {entry.id === winner.id && <Text style={styles.winnerBadge}>🏆 WINNER</Text>}
            </View>
          ))}
          <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/')}>
            <Text style={styles.homeButtonText}>🏠 Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  flex: { flex: 1 },
  header: { backgroundColor: '#1a1a1a', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  backBtn: { color: '#1DB954', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  liveBox: { backgroundColor: '#2b0d0d', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  liveText: { color: '#ff4444', fontWeight: 'bold', fontSize: 12 },
  productTitle: { color: 'white', fontSize: 16, textAlign: 'center', padding: 12, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#333' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  readyEmoji: { fontSize: 80, marginBottom: 20 },
  readyTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 10 },
  readySubtitle: { fontSize: 14, color: '#aaa', marginBottom: 30 },
  loadButton: { backgroundColor: '#1DB954', padding: 18, borderRadius: 12, alignItems: 'center', width: '100%' },
  loadButtonText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  listTitle: { color: '#FFD700', fontSize: 16, fontWeight: 'bold', padding: 15 },
  list: { flex: 1 },
  entryRow: { flexDirection: 'row', alignItems: 'center', padding: 14, marginHorizontal: 15, marginBottom: 6, backgroundColor: '#1a1a1a', borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  entryHighlighted: { backgroundColor: '#1DB954', borderColor: '#1DB954' },
  entryNum: { color: '#aaa', fontSize: 13, width: 40 },
  entryInfo: { flex: 1 },
  entryName: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  entryPhone: { color: '#aaa', fontSize: 13, fontFamily: 'monospace', marginTop: 2 },
  whiteText: { color: 'white', fontWeight: 'bold' },
  spinButton: { backgroundColor: '#FFD700', margin: 15, padding: 18, borderRadius: 12, alignItems: 'center' },
  spinButtonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  winnerCard: { backgroundColor: '#1a1a1a', margin: 15, borderRadius: 15, padding: 30, alignItems: 'center', borderWidth: 2, borderColor: '#FFD700' },
  trophyEmoji: { fontSize: 80, marginBottom: 10 },
  congratsText: { fontSize: 26, fontWeight: 'bold', color: '#FFD700', marginBottom: 10 },
  winnerName: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  winnerPhone: { fontSize: 18, color: '#aaa', fontFamily: 'monospace', marginBottom: 8 },
  winnerSub: { fontSize: 14, color: '#1DB954' },
  allTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', padding: 15 },
  winnerRow: { backgroundColor: '#2b2200', borderColor: '#FFD700' },
  goldText: { color: '#FFD700', fontWeight: 'bold' },
  winnerBadge: { color: '#FFD700', fontSize: 12, fontWeight: 'bold' },
  homeButton: { backgroundColor: '#1DB954', margin: 15, padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 40 },
  homeButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
