import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { ArrowLeft, BookOpen, Clock3, Search } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { BrandedLoader } from '@/components/branded-loader';
import { DataErrorState } from '@/components/data-error-state';
import { BLOG_CATEGORIES, getBlogCategoryLabel, getPublicBlogPosts, resolveBlogCover } from '@/lib/blog';
import { breadcrumbSchema, pageSchema } from '@/lib/structured-data';
import type { BlogCategory, BlogPost } from '@/types/database';
import { useSafeBack } from '@/lib/safe-back';

type CategoryFilter = 'all' | BlogCategory;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BlogIndexScreen() {
  const router = useRouter();
  const goBack = useSafeBack();
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const columnCount = width >= 1100 ? 3 : width >= 700 ? 2 : 1;
  const gridGap = 16;
  const gridPadding = 16;
  const cardWidth = columnCount > 1
    ? (width - (gridPadding * 2) - (gridGap * (columnCount - 1))) / columnCount
    : undefined;

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await getPublicBlogPosts();
    if (error) setLoadError(true);
    else setPosts(data || []);
    setLoading(false);
  }

  const filteredPosts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = category === 'all' || post.category === category;
      const matchesSearch = !search
        || post.title.toLowerCase().includes(search)
        || post.excerpt.toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [posts, query, category]);

  const [featured, ...rest] = filteredPosts;

  const schema = pageSchema('CollectionPage', '/blog', 'JeetoBaz Blog', 'Guides on how JeetoBaz draws work, winner verification, payments, and platform transparency.');
  const breadcrumb = breadcrumbSchema([{ name: 'Blog', path: '/blog' }]);

  return (
    <>
    <Head>
      <title>Blog | JeetoBaz</title>
      <meta name="robots" content="index, follow" />
      <meta name="description" content="Guides on how JeetoBaz draws work, winner verification, payments, and platform transparency." />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Blog | JeetoBaz" />
      <meta property="og:description" content="Guides on how JeetoBaz draws work, winner verification, payments, and platform transparency." />
      <meta property="og:url" content="https://jeetobaz.pk/blog" />
      <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta property="og:locale" content="en_PK" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content="Blog | JeetoBaz" />
      <meta name="twitter:description" content="Guides on how JeetoBaz draws work, winner verification, payments, and platform transparency." />
      <link rel="canonical" href="https://jeetobaz.pk/blog" />
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
    </Head>
    <ScrollView style={[styles.screen, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <TouchableOpacity style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Back">
          <ArrowLeft color={theme.primary} size={20} />
          <Text style={[styles.backText, { color: theme.primary }]}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <BookOpen color={theme.gold} size={22} />
          <Text role="heading" aria-level={1} style={[styles.headerTitle, { color: theme.gold }]}>JeetoBaz Blog</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={[styles.subtitle, { color: theme.muted }]}>
        How draws work, winner verification, payments, and everything else -- explained.
      </Text>

      <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Search color={theme.subtle} size={18} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search articles..."
          placeholderTextColor={theme.subtle}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <TouchableOpacity
          style={[styles.chip, { backgroundColor: category === 'all' ? theme.goldSoft : theme.surfaceAlt, borderColor: category === 'all' ? theme.gold : theme.border }]}
          onPress={() => setCategory('all')}
        >
          <Text style={[styles.chipText, { color: category === 'all' ? theme.gold : theme.muted }]}>All</Text>
        </TouchableOpacity>
        {BLOG_CATEGORIES.map((entry) => {
          const selected = category === entry.key;
          const Icon = entry.icon;
          return (
            <TouchableOpacity
              key={entry.key}
              style={[styles.chip, { backgroundColor: selected ? theme.goldSoft : theme.surfaceAlt, borderColor: selected ? theme.gold : theme.border }]}
              onPress={() => setCategory(entry.key)}
            >
              <Icon color={selected ? theme.gold : theme.muted} size={15} />
              <Text style={[styles.chipText, { color: selected ? theme.gold : theme.muted }]}>{entry.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.stateBox}><BrandedLoader message="Loading articles..." /></View>
      ) : loadError ? (
        <DataErrorState onRetry={fetchPosts} />
      ) : filteredPosts.length === 0 ? (
        <View style={styles.stateBox}><Text style={[styles.stateText, { color: theme.muted }]}>No matching articles found.</Text></View>
      ) : (
        <>
          {featured ? (
            <TouchableOpacity
              style={[styles.featuredCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push(`/blog/${featured.slug}` as never)}
              accessibilityRole="link"
            >
              <Image source={resolveBlogCover(featured.cover_image)} style={styles.featuredImage} resizeMode="cover" accessibilityLabel={featured.title} />
              <View style={styles.featuredBody}>
                <View style={[styles.categoryBadge, { backgroundColor: theme.primarySoft }]}>
                  <Text style={[styles.categoryBadgeText, { color: theme.primary }]}>{getBlogCategoryLabel(featured.category)}</Text>
                </View>
                <Text style={[styles.featuredTitle, { color: theme.text }]}>{featured.title}</Text>
                <Text style={[styles.excerpt, { color: theme.muted }]} numberOfLines={2}>{featured.excerpt}</Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaText, { color: theme.subtle }]}>{formatDate(featured.published_at)}</Text>
                  <View style={styles.metaDivider} />
                  <Clock3 color={theme.subtle} size={13} />
                  <Text style={[styles.metaText, { color: theme.subtle }]}>{featured.read_minutes} min read</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : null}

          <View style={[styles.grid, columnCount > 1 && styles.gridMultiColumn]}>
            {rest.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={[styles.card, columnCount > 1 && { width: cardWidth }, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.push(`/blog/${post.slug}` as never)}
                accessibilityRole="link"
              >
                <Image source={resolveBlogCover(post.cover_image)} style={styles.cardImage} resizeMode="cover" accessibilityLabel={post.title} />
                <View style={styles.cardBody}>
                  <View style={[styles.categoryBadge, { backgroundColor: theme.primarySoft }]}>
                    <Text style={[styles.categoryBadgeText, { color: theme.primary }]}>{getBlogCategoryLabel(post.category)}</Text>
                  </View>
                  <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>{post.title}</Text>
                  <Text style={[styles.excerpt, { color: theme.muted }]} numberOfLines={2}>{post.excerpt}</Text>
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaText, { color: theme.subtle }]}>{formatDate(post.published_at)}</Text>
                    <View style={styles.metaDivider} />
                    <Clock3 color={theme.subtle} size={13} />
                    <Text style={[styles.metaText, { color: theme.subtle }]}>{post.read_minutes} min read</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 50 },
  header: { minHeight: 68, borderBottomWidth: 2, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' },
  backButton: { minWidth: 76, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5 },
  backText: { fontSize: 15, fontWeight: '700' },
  headerTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSpacer: { width: 76 },
  subtitle: { fontSize: 14, lineHeight: 21, textAlign: 'center', paddingHorizontal: 24, marginTop: 16 },
  searchBox: { marginHorizontal: 16, marginTop: 16, borderWidth: 1, borderRadius: 12, minHeight: 50, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 12, outlineStyle: 'none' } as never,
  chipRow: { paddingHorizontal: 16, paddingTop: 14, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontSize: 13, fontWeight: '700' },
  stateBox: { paddingVertical: 60, alignItems: 'center' },
  stateText: { fontSize: 15 },
  featuredCard: { marginHorizontal: 16, marginTop: 20, borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  featuredImage: { width: '100%', height: 220 },
  featuredBody: { padding: 18, gap: 8 },
  featuredTitle: { fontSize: 21, fontWeight: '800', lineHeight: 27 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  excerpt: { fontSize: 14, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  metaText: { fontSize: 12 },
  metaDivider: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#71857a' },
  grid: { paddingHorizontal: 16, paddingTop: 18, gap: 16 },
  gridMultiColumn: { flexDirection: 'row', flexWrap: 'wrap' },
  card: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  cardImage: { width: '100%', height: 160 },
  cardBody: { padding: 14, gap: 7 },
  cardTitle: { fontSize: 16, fontWeight: '800', lineHeight: 21 },
});
