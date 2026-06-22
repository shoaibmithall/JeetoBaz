import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';

const supabase = createClient(
  'https://jqjrfnhqqfymwfsdkwmv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxanJmbmhxcWZ5bXdmc2Rrd212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTcxNDIsImV4cCI6MjA5NzU5MzE0Mn0.yuX-9QGr3w-gUQ9brELnohwgLNMDg7mhJTkRDw0L8w0'
);

export default function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPhone, setUserPhone] = useState('');
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
    if (typeof window !== 'undefined') {
      const phone = localStorage.getItem('userPhone') || '';
      const name = localStorage.getItem('userName') || '';
      setUserPhone(phone);
      setUserName(name);
    }
  }, []);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').eq('status', 'active').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  }

  async function handleEnter(product: any) {
    if (!userPhone) {
      router.push('/login');
      return;
    }

    const { data: existing } = await supabase
      .from('entries')
      .select('*')
      .eq('product_id', product.id)
      .eq('phone', userPhone)
      .single();

    if (existing) {
      alert('You have already entered this draw! Good luck 🤞');
      return;
    }

    const { error } = await supabase.from('entries').insert({
      product_id: product.id,
      phone: userPhone,
      name: userName,
    });

    if (!error) {
      await supabase
        .from('products')
        .update({ current_entries: (product.current_entries || 0) + 1 })
        .eq('id', product.id);
      alert('🎉 Entry confirmed! Good luck ' + userName + '!');
      fetchProducts();
    } else {
      alert('Error: ' + error.message);
    }
  }

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#1DB954" />
      <Text style={styles.loadingText}>Loading JeetoBaz...</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🏆 JeetoBaz</Text>
          <Text style={styles.tagline}>Win Big for Just Rs.1!</Text>
        </View>
        {userPhone ? (
          <View style={styles.userBadge}>
            <Text style={styles.userText}>👤 {userName || 'User'}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
            <Text style={styles.loginBtnText}>Login / Sign Up</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>🔥 Active Draws</Text>

      {products.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No active draws right now.</Text>
          <Text style={styles.emptySubText}>Check back soon!</Text>
        </View>
      )}

      {products.map((p: any) => (
        <View key={p.id} style={styles.card}>
          {p.image_url && (
            <Image source={{ uri: p.image_url }} style={styles.productImage} resizeMode="cover" />
          )}
          <View style={styles.cardBody}>
            <Text style={styles.productName}>{p.name}</Text>
            {p.description && <Text style={styles.description}>{p.description}</Text>}
            <View style={styles.priceRow}>
              <Text style={styles.originalPrice}>Rs. {p.price?.toLocaleString()}</Text>
              <View style={styles.entryBadge}>
                <Text style={styles.entryFee}>Entry: Rs. {p.entry_fee || 1}</Text>
              </View>
            </View>
            <Text style={styles.participants}>👥 {(p.current_entries || 0).toLocaleString()} participants</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progress, { width: `${Math.min(((p.current_entries||0)/p.max_entries)*100, 100)}%` }]} />
            </View>
            <View style={styles.spotsRow}>
              <Text style={styles.spots}>🔥 {(p.max_entries - (p.current_entries||0)).toLocaleString()} spots left!</Text>
              <Text style={styles.percent}>{Math.round(((p.current_entries||0)/p.max_entries)*100)}%</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={() => handleEnter(p)}>
              <Text style={styles.buttonText}>Enter for Rs.{p.entry_fee || 1} 🎯</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>🔒 100% Fair & Transparent Draws</Text>
        <Text style={styles.footerText}>🇵🇰 Made in Pakistan</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loading: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#1DB954', marginTop: 10, fontSize: 16 },
  header: { backgroundColor: '#1DB954', padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  tagline: { fontSize: 13, color: 'white', marginTop: 3 },
  loginBtn: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  loginBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  userBadge: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  userText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  sectionTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', padding: 15 },
  emptyBox: { alignItems: 'center', padding: 40 },
  emptyText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  emptySubText: { color: '#aaa', fontSize: 14, marginTop: 8 },
  card: { backgroundColor: '#1a1a1a', margin: 15, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  productImage: { width: '100%', height: 200 },
  cardBody: { padding: 15 },
  productName: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  description: { fontSize: 14, color: '#aaa', marginBottom: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  originalPrice: { fontSize: 18, color: '#FFD700', fontWeight: 'bold' },
  entryBadge: { backgroundColor: '#0d2b1a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  entryFee: { fontSize: 14, color: '#1DB954', fontWeight: 'bold' },
  participants: { fontSize: 14, color: '#aaa', marginBottom: 8 },
  progressBar: { backgroundColor: '#333', height: 8, borderRadius: 4, marginBottom: 6 },
  progress: { backgroundColor: '#1DB954', height: 8, borderRadius: 4 },
  spotsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  spots: { color: '#ff6b6b', fontSize: 13 },
  percent: { color: '#1DB954', fontSize: 13, fontWeight: 'bold' },
  button: { backgroundColor: '#FFD700', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  footer: { padding: 20, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  footerText: { color: '#444', fontSize: 12, marginBottom: 5 },
});
