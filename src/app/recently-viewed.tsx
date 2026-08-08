import { useCallback, useRef, useState, type ElementRef } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import { getRecentlyViewedProductIds, pruneRecentlyViewedProductIds } from '@/lib/recently-viewed';
import { BrandedLoader } from '@/components/branded-loader';
import { ButtonSheen } from '@/components/motion';
import { DataErrorState } from '@/components/data-error-state';
import type { Product } from '@/types/database';
import { useAppTheme } from '@/hooks/use-theme';
import { History } from 'lucide-react-native';

export default function RecentlyViewedScreen() {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
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
  const scrollViewRef = useRef<ElementRef<typeof ScrollView>>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadRecentlyViewed() {
        setLoading(true);
        setLoadError(false);

        const ids = await getRecentlyViewedProductIds();
        if (ids.length === 0) {
          if (active) {
            setProducts([]);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase.from('products').select('*').in('id', ids);
        if (!active) return;

        if (error) {
          setLoadError(true);
          setLoading(false);
          return;
        }

        const byId = new Map((data || []).map((product) => [product.id, product]));
        const ordered = ids
          .map((id) => byId.get(id))
          .filter((product): product is Product => Boolean(product));

        // A viewed product can be deleted by the admin later -- prune dead ids from storage here
        // so they don't keep getting requested on every visit.
        if (ordered.length !== ids.length) {
          void pruneRecentlyViewedProductIds(ordered.map((product) => product.id));
        }

        setProducts(ordered);
        setLoading(false);
      }

      loadRecentlyViewed();
      return () => { active = false; };
    }, [retryKey])
  );

  if (loading) {
    return (
      <>
      <Head>
        <title>Recently Viewed | JeetoBaz</title>
        <meta name="robots" content="noindex, follow" />
        <meta name="description" content="Products you recently viewed on JeetoBaz." />
      </Head>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
          <View style={styles.titleRow}><History color="#FFD700" size={27} /><Text role="heading" aria-level={1} style={styles.title}>Recently Viewed</Text></View>
          <Text style={[styles.subtitle, { color: theme.muted }]}>Draws you've recently looked at</Text>
        </View>
        <View style={[styles.center, { backgroundColor: theme.background }]}>
          <BrandedLoader message="Loading recently viewed..." />
        </View>
      </View>
      </>
    );
  }

  if (loadError) {
    return (
      <>
      <Head>
        <title>Recently Viewed | JeetoBaz</title>
        <meta name="robots" content="noindex, follow" />
        <meta name="description" content="Products you recently viewed on JeetoBaz." />
      </Head>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
          <View style={styles.titleRow}><History color="#FFD700" size={27} /><Text role="heading" aria-level={1} style={styles.title}>Recently Viewed</Text></View>
          <Text style={[styles.subtitle, { color: theme.muted }]}>Draws you've recently looked at</Text>
        </View>
        <DataErrorState onRetry={() => setRetryKey((key) => key + 1)} />
      </View>
      </>
    );
  }

  return (
    <>
    <Head>
      <title>Recently Viewed | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="Products you recently viewed on JeetoBaz." />
    </Head>
    <ScrollView ref={scrollViewRef} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <View style={styles.titleRow}><History color="#FFD700" size={27} /><Text role="heading" aria-level={1} style={styles.title}>Recently Viewed</Text></View>
        <Text style={[styles.subtitle, { color: theme.muted }]}>Draws you've recently looked at</Text>
      </View>

      {products.length === 0 ? (
        <View style={[styles.center, { backgroundColor: theme.background }]}>
          <History color={theme.subtle} size={56} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No recently viewed draws</Text>
          <Text style={[styles.emptyText, { color: theme.muted }]}>Draws you open will show up here.</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/')}>
            <Text style={styles.browseButtonText}>{t('browseActiveDraws')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.grid, columnCount > 1 && styles.gridMultiColumn]}>
        {products.map((product, index) => (
          <View key={product.id} style={[styles.card, columnCount > 1 && { width: cardWidth }, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {product.slug ? (
              <Link href={`/product/${product.slug}`} asChild>
                <TouchableOpacity accessibilityRole="link" accessibilityLabel={`View prize details: ${product.name}`}>
                  {product.image_url && <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" accessibilityLabel={`${product.name} prize`} />}
                  <Text style={[styles.productName, styles.productNameInLink, { color: theme.text }]}>{product.name}</Text>
                </TouchableOpacity>
              </Link>
            ) : (
              <>
                {product.image_url && <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" accessibilityLabel={`${product.name} prize`} />}
                <Text style={[styles.productName, styles.productNameInLink, { color: theme.text }]}>{product.name}</Text>
              </>
            )}
            <View style={styles.cardBody}>
              <Text style={styles.price}>Rs. {product.price?.toLocaleString()}</Text>
              <Text style={[styles.entries, { color: theme.muted }]}>{(product.current_entries || 0).toLocaleString()} / {product.max_entries.toLocaleString()} entries</Text>
              <TouchableOpacity
                style={styles.enterButton}
                onPress={() => router.push({ pathname: '/payment', params: { productId: product.id, productName: product.name, entryFee: product.entry_fee || 1 } })}
              >
                <ButtonSheen delay={(index % 5) * 400} />
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
  emptyTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8, marginTop: 16 },
  emptyText: { color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  browseButton: { backgroundColor: '#18a663', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 14 },
  browseButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  grid: { width: '100%', padding: 15, gap: 16 },
  gridMultiColumn: { padding: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch' },
  card: { backgroundColor: '#071b13', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#174a35', position: 'relative' },
  image: { width: '100%', height: 180 },
  cardBody: { padding: 16, paddingTop: 0 },
  productName: { color: 'white', fontSize: 19, fontWeight: 'bold' },
  productNameInLink: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  price: { color: '#FFD700', fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  entries: { color: '#aaa', fontSize: 13, marginTop: 5, marginBottom: 14 },
  enterButton: { backgroundColor: '#FFD700', borderRadius: 8, padding: 14, alignItems: 'center', overflow: 'hidden' },
  enterButtonText: { color: '#000', fontSize: 15, fontWeight: 'bold' },
});
