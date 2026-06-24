import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getStoredValue } from '@/lib/storage';

export default function MyEntriesScreen() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    const { data } = await supabase
      .from('entries')
      .select('*, products(*)')
      .eq('phone', phone)
      .order('created_at', { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  }

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#1DB954" />
      <Text style={styles.loadingText}>Loading your entries...</Text>
    </View>
  );

  if (!userPhone) return (
    <View style={styles.notLoggedIn}>
      <Text style={styles.notLoggedInEmoji}>🔐</Text>
      <Text style={styles.notLoggedInText}>Please login to see your entries</Text>
      <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
        <Text style={styles.loginBtnText}>Login / Sign Up</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 My Entries</Text>
        <Text style={styles.subtitle}>Welcome, {userName}!</Text>
      </View>

      <View style={styles.statsBox}>
        <Text style={styles.statsNumber}>{entries.length}</Text>
        <Text style={styles.statsLabel}>Total Draws Entered</Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyText}>No entries yet!</Text>
          <Text style={styles.emptySubText}>Enter a draw to see it here</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/')}>
            <Text style={styles.browseBtnText}>Browse Active Draws</Text>
          </TouchableOpacity>
        </View>
      ) : (
        entries.map((entry: any) => (
          <View key={entry.id} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.productName}>{entry.products?.name || 'Unknown Product'}</Text>
              <View style={[styles.statusBadge, entry.products?.status === 'active' ? styles.activeBadge : styles.completedBadge]}>
                <Text style={styles.statusText}>
                  {entry.products?.status === 'active' ? '🟢 Active' : '🏆 Completed'}
                </Text>
              </View>
            </View>
            <Text style={styles.productPrice}>Rs. {entry.products?.price?.toLocaleString()}</Text>
            <Text style={styles.entryDate}>
              Entered: {new Date(entry.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            {entry.products?.winner_phone === entry.phone && (
              <View style={styles.winnerBanner}>
                <Text style={styles.winnerText}>🏆 YOU WON THIS DRAW!</Text>
              </View>
            )}
          </View>
        ))
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/')}>
        <Text style={styles.backBtnText}>← Back to Draws</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loading: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#1DB954', marginTop: 10, fontSize: 16 },
  notLoggedIn: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 30 },
  notLoggedInEmoji: { fontSize: 60, marginBottom: 20 },
  notLoggedInText: { color: 'white', fontSize: 18, marginBottom: 20, textAlign: 'center' },
  loginBtn: { backgroundColor: '#FFD700', padding: 15, borderRadius: 12, alignItems: 'center', width: '100%' },
  loginBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  header: { backgroundColor: '#1DB954', padding: 30, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 14, color: 'white', marginTop: 5 },
  statsBox: { backgroundColor: '#1a1a1a', margin: 15, borderRadius: 15, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  statsNumber: { fontSize: 48, fontWeight: 'bold', color: '#FFD700' },
  statsLabel: { fontSize: 14, color: '#aaa', marginTop: 5 },
  emptyBox: { alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 60, marginBottom: 15 },
  emptyText: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptySubText: { color: '#aaa', fontSize: 14, marginBottom: 25 },
  browseBtn: { backgroundColor: '#1DB954', padding: 15, borderRadius: 12, alignItems: 'center', width: '100%' },
  browseBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  entryCard: { backgroundColor: '#1a1a1a', margin: 15, marginBottom: 0, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#333' },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 18, fontWeight: 'bold', color: 'white', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activeBadge: { backgroundColor: '#0d2b1a' },
  completedBadge: { backgroundColor: '#2b2b0d' },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#1DB954' },
  productPrice: { color: '#FFD700', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  entryDate: { color: '#aaa', fontSize: 13 },
  winnerBanner: { backgroundColor: '#2b2200', borderWidth: 1, borderColor: '#FFD700', borderRadius: 8, padding: 10, marginTop: 10, alignItems: 'center' },
  winnerText: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },
  backBtn: { margin: 15, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333', marginTop: 20, marginBottom: 40 },
  backBtnText: { color: '#aaa', fontSize: 16 },
});
