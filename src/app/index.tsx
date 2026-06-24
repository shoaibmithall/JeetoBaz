import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput } from 'react-native';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';

const supabase = createClient(
  'https://jqjrfnhqqfymwfsdkwmv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxanJmbmhxcWZ5bXdmc2Rrd212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTcxNDIsImV4cCI6MjA5NzU5MzE0Mn0.yuX-9QGr3w-gUQ9brELnohwgLNMDg7mhJTkRDw0L8w0'
);

export default function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPhone, setUserPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
    if (typeof window !== 'undefined') {
      setUserPhone(localStorage.getItem('userPhone') || '');
      setUserName(localStorage.getItem('userName') || '');
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, sortBy, products]);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').eq('status', 'active');
    if (data) setProducts(data);
    setLoading(false);
  }

  function applyFilters() {
    let result = [...products];

    if (search.trim()) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (sortBy === 'popular') {
      result.sort((a, b) => (b.current_entries || 0) - (a.current_entries || 0));
    } else if (sortBy === 'price_low') {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price_high') {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'entry_low') {
      result.sort((a, b) => (a.entry_fee || 1) - (b.entry_fee || 1));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFiltered(result);
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

    router.push({
      pathname: '/payment',
      params: {
        productId: product.id,
        productName: product.name,
        entryFee: product.entry_fee || 1,
      }
    });
  }

  const sortOptions = [
    { key: 'popular', label: '🔥 Most Popular' },
    { key: 'newest', label: '🆕 Newest First' },
    { key: 'price_low', label: '💰 Price: Low to High' },
    { key: 'price_high', label: '💎 Price: High to Low' },
    { key: 'entry_low', label: '🎯 Entry Fee: Low to High' },
  ];

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#1DB954" />
      <Text style={styles.loadingText}>Loading JeetoBaz...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
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
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search prizes..."
            placeholderTextColor="#666"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterBtnText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {sortOptions.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortChip, sortBy === opt.key && styles.sortChipActive]}
                onPress={() => setSortBy(opt.key)}
              >
                <Text style={[styles.sortChipText, sortBy === opt.key && styles.sortChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {filtered.length} draw{filtered.length !== 1 ? 's' : ''} found
        </Text>
        <Text style={styles.sortedBy}>
          {sortOptions.find(s => s.key === sortBy)?.label}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {filtered.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>No draws found!</Text>
            <Text style={styles.emptySubText}>Try a different search term</Text>
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearSearch}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        )}

        {filtered.map((p: any) => (
          <View key={p.id} style={styles.card}>
            {p.image_url && (
              <Image source={{ uri: p.image_url }} style={styles.productImage} resizeMode="cover" />
            )}
            <View style={styles.cardBody}>
              <Text style={styles.productName}>{p.name}</Text>
              {p.description && <Text style={styles.description} numberOfLines={2}>{p.description}</Text>}
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
                <Text style={styles.spots}>
                  🔥 {Math.max(p.max_entries - (p.current_entries||0), 0).toLocaleString()} spots left!
                </Text>
                <Text style={styles.percent}>
                  {Math.min(Math.round(((p.current_entries||0)/p.max_entries)*100), 100)}%
                </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loading: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#1DB954', marginTop: 10, fontSize: 16 },
  header: { backgroundColor: '#1DB954', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  tagline: { fontSize: 12, color: 'white', marginTop: 2 },
  loginBtn: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  loginBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  userBadge: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  userText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  searchRow: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#111' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 10, borderWidth: 1, borderColor: '#333', paddingHorizontal: 12 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: 'white', fontSize: 14, padding: 10 },
  clearBtn: { color: '#666', fontSize: 16, padding: 5 },
  filterBtn: { backgroundColor: '#1a1a1a', borderRadius: 10, borderWidth: 1, borderColor: '#333', padding: 12, alignItems: 'center', justifyContent: 'center' },
  filterBtnActive: { borderColor: '#FFD700', backgroundColor: '#2b2200' },
  filterBtnText: { fontSize: 18 },
  sortContainer: { backgroundColor: '#111', paddingHorizontal: 12, paddingBottom: 12 },
  sortLabel: { color: '#aaa', fontSize: 12, marginBottom: 8 },
  sortChip: { backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#333' },
  sortChipActive: { backgroundColor: '#2b2200', borderColor: '#FFD700' },
  sortChipText: { color: '#aaa', fontSize: 12 },
  sortChipTextActive: { color: '#FFD700', fontWeight: 'bold' },
  resultsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#111' },
  resultsText: { color: '#aaa', fontSize: 12 },
  sortedBy: { color: '#1DB954', fontSize: 12 },
  emptyBox: { alignItems: 'center', padding: 50 },
  emptyEmoji: { fontSize: 50, marginBottom: 15 },
  emptyText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubText: { color: '#aaa', fontSize: 14, marginBottom: 15 },
  clearSearch: { color: '#1DB954', fontSize: 14, fontWeight: 'bold' },
  card: { backgroundColor: '#1a1a1a', margin: 15, marginBottom: 0, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  productImage: { width: '100%', height: 200 },
  cardBody: { padding: 15 },
  productName: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  description: { fontSize: 13, color: '#aaa', marginBottom: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  originalPrice: { fontSize: 18, color: '#FFD700', fontWeight: 'bold' },
  entryBadge: { backgroundColor: '#0d2b1a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  entryFee: { fontSize: 13, color: '#1DB954', fontWeight: 'bold' },
  participants: { fontSize: 13, color: '#aaa', marginBottom: 8 },
  progressBar: { backgroundColor: '#333', height: 8, borderRadius: 4, marginBottom: 6 },
  progress: { backgroundColor: '#1DB954', height: 8, borderRadius: 4 },
  spotsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  spots: { color: '#ff6b6b', fontSize: 12 },
  percent: { color: '#1DB954', fontSize: 12, fontWeight: 'bold' },
  button: { backgroundColor: '#FFD700', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  footer: { padding: 20, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  footerText: { color: '#444', fontSize: 12, marginBottom: 5 },
});
