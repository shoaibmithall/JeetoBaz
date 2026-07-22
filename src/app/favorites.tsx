import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import { getStoredStringArray, removeStoredValues, setStoredValue } from '@/lib/storage';
import { DataErrorState } from '@/components/data-error-state';
import type { Product } from '@/types/database';
import { useAppTheme } from '@/hooks/use-theme';
import { Heart } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';

function favoritesStorageKey(userId: string) {
  return `favorites:${userId}`;
}

export default function FavoritesScreen() {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { user, loading: authLoading } = useAuth();
  const { width } = useWindowDimensions();
  const columnCount = width >= 1100 ? 3 : width >= 700 ? 2 : 1;
  const gridGap = 16;
  const gridPadding = 16;
  const cardWidth = columnCount > 1
    ? (width - (gridPadding * 2) - (gridGap * (columnCount - 1))) / columnCount
    : undefined;
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
        if (authLoading) return;
        if (!user) {
          if (active) {
            setProducts([]);
            setLoading(false);
          }
          return;
        }

        const accountKey = favoritesStorageKey(user.id);
        let favoriteIds = await getStoredStringArray(accountKey);
        if (favoriteIds.length === 0) {
          const legacyFavoriteIds = await getStoredStringArray('favorites');
          if (legacyFavoriteIds.length > 0) {
            favoriteIds = legacyFavoriteIds;
            await setStoredValue(accountKey, JSON.stringify(legacyFavoriteIds));
            await removeStoredValues(['favorites']);
          }
        }

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
    }, [authLoading, retryKey, user])
  );

  async function removeFavorite(productId: string) {
    if (!user) return;
    const accountKey = favoritesStorageKey(user.id);
    const favoriteIds = await getStoredStringArray(accountKey);
    await setStoredValue(accountKey, JSON.stringify(favoriteIds.filter((id) => id !== productId)));
    setProducts((current) => current.filter((product) => product.id !== productId));
  }

  if (loading || authLoading) {
    return (
      <>
      <Head>
        <title>My Favorites | JeetoBaz</title>
        <meta name="description" content="Access your saved JeetoBaz prize campaigns and quickly return to products and opportunities you marked for convenient viewing and participation." />
      </Head>
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.primary }]}>{t('loadingFavorites')}</Text>
      </View>
      </>
    );
  }

  if (loadError) {
    return (
      <>
      <Head>
        <title>My Favorites | JeetoBaz</title>
        <meta name="description" content="Access your saved JeetoBaz prize campaigns and quickly return to products and opportunities you marked for convenient viewing and participation." />
      </Head>
      <DataErrorState onRetry={() => setRetryKey((key) => key + 1)} />
      </>
    );
  }

  return (
    <>
    <Head>
      <title>My Favorites | JeetoBaz</title>
      <meta name="description" content="Access your saved JeetoBaz prize campaigns and quickly return to products and opportunities you marked for convenient viewing and participation." />
    </Head>
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <View style={styles.titleRow}><Heart color="#FFD700" size={27} /><Text style={styles.title}>{t('favorites')}</Text></View>
        <Text style={[styles.subtitle, { color: theme.muted }]}>{t('yourSavedDraws')}</Text>
      </View>

      {products.length === 0 ? (
        <View style={[styles.center, { backgroundColor: theme.background }]}>
          <Heart color={theme.subtle} size={56} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('noFavoritesYet')}</Text>
          <Text style={[styles.emptyText, { color: theme.muted }]}>Tap the heart on a draw to save it here.</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/')}>
            <Text style={styles.browseButtonText}>{t('browseActiveDraws')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.grid, columnCount > 1 && styles.gridMultiColumn]}>
        {products.map((product) => (
          <View key={product.id} style={[styles.card, columnCount > 1 && { width: cardWidth }, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {product.image_url && <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />}
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <Text style={[styles.productName, { color: theme.text }]}>{product.name}</Text>
                <TouchableOpacity onPress={() => removeFavorite(product.id)} accessibilityLabel={`${t('removeFavorite')}: ${product.name}`}>
                  <Heart color="#ff4d67" fill="#ff4d67" size={25} />
                </TouchableOpacity>
              </View>
              <Text style={styles.price}>Rs. {product.price?.toLocaleString()}</Text>
              <Text style={[styles.entries, { color: theme.muted }]}>{(product.current_entries || 0).toLocaleString()} / {product.max_entries.toLocaleString()} entries</Text>
              <TouchableOpacity
                style={styles.enterButton}
                onPress={() => router.push({ pathname: '/payment', params: { productId: product.id, productName: product.name, entryFee: product.entry_fee || 1 } })}
              >
                <Text style={styles.enterButtonText}>{t('enterFor')} Rs.{product.entry_fee || 1}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        </View>
      )}
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  header: { backgroundColor: '#04140e', padding: 30, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  title: { color: '#FFD700', fontSize: 28, fontWeight: 'bold' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subtitle: { color: '#aaa', fontSize: 14, marginTop: 5 },
  center: { flex: 1, minHeight: 420, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#020d09' },
  loadingText: { color: '#18a663', marginTop: 10, fontSize: 16 },
  emptyTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptyText: { color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  browseButton: { backgroundColor: '#18a663', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 14 },
  browseButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  grid: { width: '100%', padding: 15, gap: 16 },
  gridMultiColumn: { padding: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch' },
  card: { backgroundColor: '#071b13', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#174a35' },
  image: { width: '100%', height: 180 },
  cardBody: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productName: { color: 'white', fontSize: 19, fontWeight: 'bold', flex: 1 },
  price: { color: '#FFD700', fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  entries: { color: '#aaa', fontSize: 13, marginTop: 5, marginBottom: 14 },
  enterButton: { backgroundColor: '#FFD700', borderRadius: 8, padding: 14, alignItems: 'center' },
  enterButtonText: { color: '#000', fontSize: 15, fontWeight: 'bold' },
});
