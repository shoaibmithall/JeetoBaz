import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DataErrorState } from '@/components/data-error-state';
import type { Product } from '@/types/database';

export default function WinnersScreen() {
  const [winners, setWinners] = useState<Product[]>([]);
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
    if (data) setWinners(data);
    if (error) setLoadError(true);
    setLoading(false);
  }

  function maskPhone(phone?: string | null) {
    if (!phone) return 'N/A';
    return phone.slice(0, 6) + '****' + phone.slice(-4);
  }

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#1DB954" />
      <Text style={styles.loadingText}>Loading Winners...</Text>
    </View>
  );

  if (loadError) return <DataErrorState onRetry={fetchWinners} />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Past Winners</Text>
        <Text style={styles.subtitle}>100% Real and Verified</Text>
      </View>

      <View style={styles.trustBox}>
        <Text style={styles.trustTitle}>Why Trust JeetoBaz?</Text>
        <Text style={styles.trustText}>All draws are 100% random and transparent</Text>
        <Text style={styles.trustText}>Winners verified via phone number</Text>
        <Text style={styles.trustText}>Made in Pakistan for Pakistan</Text>
      </View>

      {winners.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyText}>No completed draws yet!</Text>
          <Text style={styles.emptySubText}>Be the first winner — enter a draw now!</Text>
        </View>
      ) : (
        winners.map((product) => (
          <View key={product.id} style={styles.winnerCard}>
            <Text style={styles.trophy}>🏆</Text>
            <Text style={styles.winnerPhone}>{maskPhone(product.winner_phone)}</Text>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productPrice}>Rs. {product.price?.toLocaleString()}</Text>
            <Text style={styles.date}>{new Date(product.created_at).toLocaleDateString()}</Text>
          </View>
        ))
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>All draws are fair and transparent</Text>
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
  winnerPhone: { color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace', marginBottom: 8 },
  productName: { color: '#1DB954', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  productPrice: { color: '#FFD700', fontSize: 16, marginBottom: 4 },
  date: { color: '#aaa', fontSize: 12 },
  footer: { padding: 20, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  footerText: { color: '#444', fontSize: 12 },
});
