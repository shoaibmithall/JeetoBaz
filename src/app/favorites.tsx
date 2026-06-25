import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import { getStoredStringArray, setStoredValue } from '@/lib/storage';
import { DataErrorState } from '@/components/data-error-state';
import type { Product } from '@/types/database';

export default function FavoritesScreen() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadFavorites() {
        setLoading(true);
        setLoadError(false);
        const favoriteIds = await getStoredStringArray('favorites');

        if (favoriteIds.length === 0) {
          if (active) {
            setProducts([]);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('id', favoriteIds)
          .order('created_at', { ascending: false });

        if (active) {
          setProducts(data || []);
          setLoadError(Boolean(error));
          setLoading(false);
        }
      }

      loadFavorites();
      return () => { active = false; };
    }, [retryKey])
  );

  async function removeFavorite(productId: string) {
    const favoriteIds = await getStoredStringArray('favorites');
    await setStoredValue('favorites', JSON.stringify(favoriteIds.filter((id) => id !== productId)));
    setProducts((current) => current.filter((product) => product.id !== productId));
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>{t('loadingFavorites')}</Text>
      </View>
    );
  }

  if (loadError) {
    return <DataErrorState onRetry={() => setRetryKey((key) => key + 1)} />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>❤️ {t('favorites')}</Text>
        <Text style={styles.subtitle}>{t('yourSavedDraws')}</Text>
      </View>

      {products.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🤍</Text>
          <Text style={styles.emptyTitle}>{t('noFavoritesYet')}</Text>
          <Text style={styles.emptyText}>Tap the heart on a draw to save it here.</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/')}>
            <Text style={styles.browseButtonText}>{t('browseActiveDraws')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        products.map((product) => (
          <View key={product.id} style={styles.card}>
            {product.image_url && <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />}
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <Text style={styles.productName}>{product.name}</Text>
                <TouchableOpacity onPress={() => removeFavorite(product.id)} accessibilityLabel={`${t('removeFavorite')}: ${product.name}`}>
                  <Text style={styles.heart}>❤️</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.price}>Rs. {product.price?.toLocaleString()}</Text>
              <Text style={styles.entries}>{(product.current_entries || 0).toLocaleString()} / {product.max_entries.toLocaleString()} entries</Text>
              <TouchableOpacity
                style={styles.enterButton}
                onPress={() => router.push({ pathname: '/payment', params: { productId: product.id, productName: product.name, entryFee: product.entry_fee || 1 } })}
              >
                <Text style={styles.enterButtonText}>{t('enterFor')} Rs.{product.entry_fee || 1}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { backgroundColor: '#1a1a1a', padding: 30, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  title: { color: '#FFD700', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#aaa', fontSize: 14, marginTop: 5 },
  center: { flex: 1, minHeight: 420, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#0a0a0a' },
  loadingText: { color: '#1DB954', marginTop: 10, fontSize: 16 },
  emptyIcon: { fontSize: 56, marginBottom: 15 },
  emptyTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptyText: { color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  browseButton: { backgroundColor: '#1DB954', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 14 },
  browseButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  card: { backgroundColor: '#1a1a1a', margin: 15, marginBottom: 0, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  image: { width: '100%', height: 180 },
  cardBody: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productName: { color: 'white', fontSize: 19, fontWeight: 'bold', flex: 1 },
  heart: { fontSize: 24, marginLeft: 12 },
  price: { color: '#FFD700', fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  entries: { color: '#aaa', fontSize: 13, marginTop: 5, marginBottom: 14 },
  enterButton: { backgroundColor: '#FFD700', borderRadius: 8, padding: 14, alignItems: 'center' },
  enterButtonText: { color: '#000', fontSize: 15, fontWeight: 'bold' },
});
