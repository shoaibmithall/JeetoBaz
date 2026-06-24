import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Linking, TextInput } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ShareModal } from './share';
import { DataErrorState } from '@/components/data-error-state';
import { supabase } from '@/lib/supabase';
import { getStoredStringArray, getStoredValue, setStoredValue } from '@/lib/storage';
import type { Product } from '@/types/database';

type SortOption = 'popular' | 'newest' | 'price_low' | 'price_high' | 'entry_low';

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'popular', label: '🔥 Most Popular' },
  { key: 'newest', label: '🆕 Newest' },
  { key: 'price_low', label: '💰 Price: Low-High' },
  { key: 'price_high', label: '💎 Price: High-Low' },
  { key: 'entry_low', label: '🎯 Entry: Low-High' },
];

function getTimeLeft(drawDate?: string | null) {
  if (!drawDate) return null;
  const now = new Date();
  const draw = new Date(drawDate);
  const diff = draw.getTime() - now.getTime();
  if (diff <= 0) return 'Draw time aa gaya!';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [time, setTime] = useState(new Date());
  const router = useRouter();

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = products.filter((product) => !query || product.name.toLowerCase().includes(query));

    return result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'price_low') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_high') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'entry_low') return (a.entry_fee || 1) - (b.entry_fee || 1);
      return (b.current_entries || 0) - (a.current_entries || 0);
    });
  }, [products, search, sortBy]);

  useEffect(() => {
    fetchProducts();
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadStoredState() {
        const [storedPhone, storedName, storedFavorites] = await Promise.all([
          getStoredValue('userPhone'),
          getStoredValue('userName'),
          getStoredStringArray('favorites'),
        ]);
        if (!active) return;
        setUserPhone(storedPhone || '');
        setUserName(storedName || '');
        setFavorites(storedFavorites);
      }

      loadStoredState();
      return () => { active = false; };
    }, [])
  );

  async function fetchProducts() {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase.from('products').select('*').eq('status', 'active').order('created_at', { ascending: false });
    if (data) setProducts(data);
    if (error) setLoadError(true);
    setLoading(false);
  }

  async function handleEnter(product: Product) {
    if (!userPhone) { router.push('/login'); return; }
    const { data: existing } = await supabase
      .from('entries')
      .select('id')
      .eq('product_id', product.id)
      .eq('phone', userPhone)
      .maybeSingle();
    if (existing) { alert('Already entered! Good luck 🤞'); return; }
    router.push({
      pathname: '/payment',
      params: {
        productId: product.id,
        productName: product.name,
        entryFee: product.entry_fee || 1,
      },
    });
  }

  async function toggleFavorite(productId: string) {
    const updated = favorites.includes(productId)
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];
    await setStoredValue('favorites', JSON.stringify(updated));
    setFavorites(updated);
  }

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#1DB954" />
      <Text style={styles.loadingText}>Loading JeetoBaz...</Text>
    </View>
  );

  if (loadError) return <DataErrorState onRetry={fetchProducts} />;

  return (
    <ScrollView style={styles.container}>
      <ShareModal visible={showShare} onClose={() => setShowShare(false)} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🏆 JeetoBaz</Text>
          <Text style={styles.tagline}>Win Big for Just Rs.1!</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.shareBtn} onPress={() => setShowShare(true)}>
            <Text style={styles.shareBtnText}>📤 Share</Text>
          </TouchableOpacity>
          {userPhone ? (
            <TouchableOpacity style={styles.userBadge} onPress={() => router.push('/login')}>
              <Text style={styles.userText}>👤 {userName || 'User'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
              <Text style={styles.loginBtnText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.trustBar}>
        <Text style={styles.trustItem}>✅ 100% Fair</Text>
        <Text style={styles.trustDot}>•</Text>
        <Text style={styles.trustItem}>🔒 Transparent</Text>
        <Text style={styles.trustDot}>•</Text>
        <Text style={styles.trustItem}>🇵🇰 Pakistan</Text>
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
            <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Clear search">
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
          onPress={() => setShowFilters((visible) => !visible)}
          accessibilityLabel="Show sort options"
        >
          <Text style={styles.filterBtnText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.sortChip, sortBy === option.key && styles.sortChipActive]}
                onPress={() => setSortBy(option.key)}
              >
                <Text style={[styles.sortChipText, sortBy === option.key && styles.sortChipTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.howItWorks}>
        <Text style={styles.howTitle}>🤔 Kaise Kaam Karta Hai?</Text>
        <View style={styles.steps}>
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>1️⃣</Text>
            <Text style={styles.stepTitle}>Entry Lo</Text>
            <Text style={styles.stepDesc}>Sirf Rs.1 mein lucky draw mein shamil ho</Text>
          </View>
          <View style={styles.stepArrow}><Text style={styles.arrow}>→</Text></View>
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>2️⃣</Text>
            <Text style={styles.stepTitle}>Live Draw</Text>
            <Text style={styles.stepDesc}>Raat 10 baje LIVE draw hota hai sab ke saamne</Text>
          </View>
          <View style={styles.stepArrow}><Text style={styles.arrow}>→</Text></View>
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>3️⃣</Text>
            <Text style={styles.stepTitle}>Prize Lo</Text>
            <Text style={styles.stepDesc}>Lucky winner ko ghar pe prize deliver hota hai</Text>
          </View>
        </View>
      </View>

      <View style={styles.algorithmBox}>
        <Text style={styles.algoTitle}>🔐 Winner Selection Algorithm</Text>
        <Text style={styles.algoText}>
          Jab participants poore hojate hain, hamara system automatically random number generate karta hai.
          Koi bhi — admin bhi — is process ko change nahi kar sakta.
          Draw LIVE hota hai taake sab dekh sakein. 100% fair!
        </Text>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✅ Verified Fair Draw System</Text>
        </View>
      </View>

      <View style={styles.resultsRow}>
        <Text style={styles.sectionTitle}>🔥 Active Draws</Text>
        <View style={styles.resultsMeta}>
          <Text style={styles.resultsText}>{filteredProducts.length} found</Text>
          <Text style={styles.sortedBy}>{SORT_OPTIONS.find((option) => option.key === sortBy)?.label}</Text>
        </View>
      </View>

      {filteredProducts.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyText}>No draws found</Text>
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearSearch}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      )}

      {filteredProducts.map((p) => {
        const timeLeft = getTimeLeft(p.draw_date);
        const liveLink = p.live_link;
        return (
          <View key={p.id} style={styles.card}>
            <View style={styles.verifiedBanner}>
              <Text style={styles.verifiedBannerText}>✅ Verified Draw</Text>
              {liveLink && (
                <TouchableOpacity onPress={() => Linking.openURL(liveLink)}>
                  <Text style={styles.liveBtn}>🔴 Watch Live</Text>
                </TouchableOpacity>
              )}
            </View>

            {p.image_url && <Image source={{ uri: p.image_url }} style={styles.productImage} resizeMode="cover" />}

            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <Text style={styles.productName}>{p.name}</Text>
                <TouchableOpacity onPress={() => toggleFavorite(p.id)} accessibilityLabel={`${favorites.includes(p.id) ? 'Remove' : 'Add'} ${p.name} ${favorites.includes(p.id) ? 'from' : 'to'} favorites`}>
                  <Text style={styles.heartBtn}>{favorites.includes(p.id) ? '❤️' : '🤍'}</Text>
                </TouchableOpacity>
              </View>
              {p.description && <Text style={styles.description}>{p.description}</Text>}

              {timeLeft && (
                <View style={styles.countdownBox}>
                  <Text style={styles.countdownLabel}>⏰ Draw mein:</Text>
                  <Text style={styles.countdownTime}>{timeLeft}</Text>
                </View>
              )}

              {p.draw_date && (
                <Text style={styles.drawDate}>📅 Draw: {p.draw_date}</Text>
              )}

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
                <Text style={styles.buttonText}>🎯 Enter for Rs.{p.entry_fee || 1}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

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
  header: { backgroundColor: '#1DB954', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  tagline: { fontSize: 12, color: 'white', marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  shareBtn: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 15 },
  shareBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  loginBtn: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  loginBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  userBadge: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  userText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  trustBar: { backgroundColor: '#0d2b1a', padding: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  trustItem: { color: '#1DB954', fontSize: 12, fontWeight: 'bold' },
  trustDot: { color: '#1DB954', fontSize: 12 },
  searchRow: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#111' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 8, borderWidth: 1, borderColor: '#333', paddingHorizontal: 12 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: 'white', fontSize: 14, paddingVertical: 10 },
  clearBtn: { color: '#aaa', fontSize: 16, padding: 5 },
  filterBtn: { width: 46, height: 46, backgroundColor: '#1a1a1a', borderRadius: 8, borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  filterBtnActive: { borderColor: '#FFD700', backgroundColor: '#2b2200' },
  filterBtnText: { fontSize: 18 },
  sortContainer: { backgroundColor: '#111', paddingHorizontal: 12, paddingBottom: 12 },
  sortLabel: { color: '#aaa', fontSize: 12, marginBottom: 8 },
  sortChip: { backgroundColor: '#1a1a1a', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#333' },
  sortChipActive: { backgroundColor: '#2b2200', borderColor: '#FFD700' },
  sortChipText: { color: '#aaa', fontSize: 12 },
  sortChipTextActive: { color: '#FFD700', fontWeight: 'bold' },
  howItWorks: { backgroundColor: '#1a1a1a', margin: 15, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#333' },
  howTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  step: { flex: 1, alignItems: 'center' },
  stepEmoji: { fontSize: 28, marginBottom: 6 },
  stepTitle: { color: '#FFD700', fontSize: 13, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  stepDesc: { color: '#aaa', fontSize: 11, textAlign: 'center', lineHeight: 16 },
  stepArrow: { paddingHorizontal: 5 },
  arrow: { color: '#1DB954', fontSize: 20 },
  algorithmBox: { backgroundColor: '#0d1a0d', margin: 15, marginTop: 0, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#1DB954' },
  algoTitle: { color: '#1DB954', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  algoText: { color: '#aaa', fontSize: 13, lineHeight: 20, marginBottom: 12 },
  verifiedBadge: { backgroundColor: '#1DB954', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  verifiedText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  resultsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  sectionTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', flex: 1 },
  resultsMeta: { alignItems: 'flex-end', marginLeft: 12 },
  resultsText: { color: '#aaa', fontSize: 12 },
  sortedBy: { color: '#1DB954', fontSize: 11, marginTop: 2 },
  emptyBox: { alignItems: 'center', padding: 50 },
  emptyEmoji: { fontSize: 50, marginBottom: 15 },
  emptyText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  clearSearch: { color: '#1DB954', fontSize: 14, fontWeight: 'bold' },
  card: { backgroundColor: '#1a1a1a', margin: 15, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  verifiedBanner: { backgroundColor: '#0d2b1a', padding: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verifiedBannerText: { color: '#1DB954', fontSize: 12, fontWeight: 'bold' },
  liveBtn: { color: '#ff4444', fontSize: 12, fontWeight: 'bold', backgroundColor: '#2b0d0d', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  productImage: { width: '100%', height: 200 },
  cardBody: { padding: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  productName: { fontSize: 20, fontWeight: 'bold', color: 'white', flex: 1 },
  heartBtn: { fontSize: 24, marginLeft: 10 },
  description: { fontSize: 13, color: '#aaa', marginBottom: 10 },
  countdownBox: { backgroundColor: '#2b2200', borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, borderWidth: 1, borderColor: '#FFD700' },
  countdownLabel: { color: '#FFD700', fontSize: 13 },
  countdownTime: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' },
  drawDate: { color: '#4a9eff', fontSize: 12, marginBottom: 8 },
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
