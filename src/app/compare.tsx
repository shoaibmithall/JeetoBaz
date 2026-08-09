import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import { ArrowLeft, Scale } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/hooks/use-theme';
import { BrandedLoader } from '@/components/branded-loader';
import { DataErrorState } from '@/components/data-error-state';
import { breadcrumbSchema, pageSchema } from '@/lib/structured-data';
import type { Product } from '@/types/database';
import { useSafeBack } from '@/lib/safe-back';

const COMPARE_COLUMNS = 'id, name, price, entry_fee, current_entries, max_entries, slug';

export default function CompareScreen() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const goBack = useSafeBack();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase
      .from('products')
      .select(COMPARE_COLUMNS)
      .eq('status', 'active')
      .order('current_entries', { ascending: false });

    if (error) {
      setLoadError(true);
    } else {
      setProducts((data as Product[]) || []);
    }
    setLoading(false);
  }

  const schema = pageSchema('WebPage', '/compare', 'Compare Prize Draws', 'Compare all active JeetoBaz prize draws side by side -- entry fee, total entries, and spots left.');
  const breadcrumb = breadcrumbSchema([{ name: 'Compare Draws', path: '/compare' }]);

  return (
    <>
    <Head>
      <title>Compare Prize Draws | JeetoBaz</title>
      <meta name="robots" content="index, follow" />
      <meta name="description" content="Compare all active JeetoBaz prize draws side by side -- entry fee, total entries, and spots left." />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Compare Prize Draws | JeetoBaz" />
      <meta property="og:description" content="Compare all active JeetoBaz prize draws side by side -- entry fee, total entries, and spots left." />
      <meta property="og:url" content="https://jeetobaz.pk/compare" />
      <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta property="og:locale" content="en_PK" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content="Compare Prize Draws | JeetoBaz" />
      <meta name="twitter:description" content="Compare all active JeetoBaz prize draws side by side -- entry fee, total entries, and spots left." />
      <link rel="canonical" href="https://jeetobaz.pk/compare" />
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
    </Head>
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Back">
          <ArrowLeft color={theme.primary} size={20} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Scale color={theme.gold} size={22} />
          <Text role="heading" aria-level={1} style={styles.headerTitle}>Compare Draws</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.stateBox}><BrandedLoader message="Loading draws..." /></View>
      ) : loadError ? (
        <DataErrorState onRetry={fetchProducts} />
      ) : products.length === 0 ? (
        <View style={styles.stateBox}><Text style={styles.stateText}>No active draws to compare right now.</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.hint}>Scroll sideways to see all columns. Tap a prize to enter.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.tableWrap}>
            <View>
              <View style={[styles.row, styles.headerRow, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
                <Text style={[styles.cell, styles.prizeCell, styles.headerCell, { color: theme.gold }]}>Prize</Text>
                <Text style={[styles.cell, styles.headerCell, { color: theme.gold }]}>Entry Fee</Text>
                <Text style={[styles.cell, styles.headerCell, { color: theme.gold }]}>Total Entries</Text>
                <Text style={[styles.cell, styles.headerCell, { color: theme.gold }]}>Spots Left</Text>
                <Text style={[styles.cell, styles.actionCell, styles.headerCell, { color: theme.gold }]}>Action</Text>
              </View>
              {products.map((product) => {
                const current = product.current_entries || 0;
                const spotsLeft = Math.max((product.max_entries || 0) - current, 0);
                return (
                  <View key={product.id} style={[styles.row, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                    <Text numberOfLines={1} style={[styles.cell, styles.prizeCell, { color: theme.text }]}>{product.name}</Text>
                    <Text style={[styles.cell, { color: theme.gold }]}>Rs. {product.entry_fee || 1}</Text>
                    <Text style={[styles.cell, { color: theme.muted }]}>{current.toLocaleString()} / {(product.max_entries || 0).toLocaleString()}</Text>
                    <Text style={[styles.cell, { color: theme.primary }]}>{spotsLeft.toLocaleString()}</Text>
                    <View style={[styles.cell, styles.actionCell]}>
                      {product.slug ? (
                        <Link href={`/product/${product.slug}`} asChild>
                          <TouchableOpacity style={StyleSheet.flatten([styles.enterButton, { backgroundColor: theme.gold }])} accessibilityRole="link">
                            <Text style={styles.enterButtonText}>View</Text>
                          </TouchableOpacity>
                        </Link>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </ScrollView>
      )}
    </View>
    </>
  );
}

type Theme = ReturnType<typeof useAppTheme>['theme'];

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { minHeight: 76, paddingHorizontal: 18, borderBottomWidth: 2, borderBottomColor: theme.gold, backgroundColor: theme.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 90, minHeight: 44 },
    backText: { color: theme.primary, fontSize: 15, fontWeight: '700' },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1 },
    headerTitle: { color: theme.gold, fontSize: 20, fontWeight: '800', textAlign: 'center' },
    headerSpacer: { minWidth: 90 },
    stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    stateText: { color: theme.muted, fontSize: 15, textAlign: 'center' },
    content: { padding: 18, paddingBottom: 60 },
    hint: { color: theme.subtle, fontSize: 12, marginBottom: 12, textAlign: 'center' },
    tableWrap: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.border },
    row: { flexDirection: 'row', borderBottomWidth: 1, alignItems: 'center' },
    headerRow: { borderBottomWidth: 2 },
    headerCell: { fontWeight: '800', fontSize: 13 },
    cell: { width: 130, paddingVertical: 14, paddingHorizontal: 12, fontSize: 14 },
    prizeCell: { width: 200, fontWeight: '700' },
    actionCell: { width: 100, alignItems: 'center', justifyContent: 'center' },
    enterButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
    enterButtonText: { color: '#000', fontWeight: '800', fontSize: 13 },
  });
}
