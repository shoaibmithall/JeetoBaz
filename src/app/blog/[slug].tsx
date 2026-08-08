import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { ArrowLeft, Clock3, Ticket } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { BrandedLoader } from '@/components/branded-loader';
import { DataErrorState } from '@/components/data-error-state';
import { BlogContent } from '@/components/blog-content';
import { getBlogCategoryLabel, getPublicBlogPost, getPublicBlogPosts, resolveBlogCover } from '@/lib/blog';
import { ORG_ID, SITE_ID, pageSchema } from '@/lib/structured-data';
import type { BlogPost } from '@/types/database';

const BASE_URL = 'https://jeetobaz.pk';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BlogPostScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) fetchPost(slug);
  }, [slug]);

  async function fetchPost(postSlug: string) {
    setLoading(true);
    setLoadError(false);
    setNotFound(false);
    const { data, error } = await getPublicBlogPost(postSlug);
    if (error) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setPost(data);
    const { data: allPosts } = await getPublicBlogPosts();
    setRelated((allPosts || []).filter((entry) => entry.category === data.category && entry.id !== data.id).slice(0, 3));
    setLoading(false);
  }

  const pageUrl = `${BASE_URL}/blog/${slug}`;
  const coverUrl = post?.cover_image.startsWith('http') ? post.cover_image : `${BASE_URL}/og-image.png`;

  const webPageSchema = useMemo(() => {
    if (!post) return null;
    return pageSchema('WebPage', `/blog/${post.slug}`, post.title, post.excerpt);
  }, [post]);

  const articleSchema = useMemo(() => {
    if (!post) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt,
      image: coverUrl,
      datePublished: post.published_at,
      dateModified: post.updated_at,
      author: { '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
      mainEntityOfPage: { '@id': `${pageUrl}#webpage` },
      isPartOf: { '@id': SITE_ID },
    };
  }, [post, coverUrl, pageUrl]);

  const breadcrumbSchemaJson = useMemo(() => {
    if (!post) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: pageUrl },
      ],
    };
  }, [post, pageUrl]);

  if (loading) return (
    <View style={[styles.stateScreen, { backgroundColor: theme.background }]}>
      <BrandedLoader message="Loading article..." />
    </View>
  );

  if (notFound) return (
    <View style={[styles.stateScreen, { backgroundColor: theme.background }]}>
      <Text style={[styles.notFoundTitle, { color: theme.text }]}>Article not found</Text>
      <TouchableOpacity onPress={() => router.push('/blog' as never)}>
        <Text style={[styles.notFoundLink, { color: theme.primary }]}>Back to Blog</Text>
      </TouchableOpacity>
    </View>
  );

  if (loadError || !post) return (
    <View style={[styles.stateScreen, { backgroundColor: theme.background }]}>
      <DataErrorState onRetry={() => slug && fetchPost(slug)} />
    </View>
  );

  return (
    <>
    <Head>
      <title>{post.title} | JeetoBaz Blog</title>
      <meta name="robots" content="index, follow" />
      <meta name="description" content={post.excerpt} />
      <link rel="canonical" href={pageUrl} />
      <meta property="og:type" content="article" />
      <meta property="og:title" content={post.title} />
      <meta property="og:description" content={post.excerpt} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta property="og:locale" content="en_PK" />
      <meta property="og:image" content={coverUrl} />
      <meta property="og:image:alt" content={post.title} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content={post.title} />
      <meta name="twitter:description" content={post.excerpt} />
      <meta name="twitter:image" content={coverUrl} />
      {webPageSchema ? <script type="application/ld+json">{JSON.stringify(webPageSchema)}</script> : null}
      {articleSchema ? <script type="application/ld+json">{JSON.stringify(articleSchema)}</script> : null}
      {breadcrumbSchemaJson ? <script type="application/ld+json">{JSON.stringify(breadcrumbSchemaJson)}</script> : null}
    </Head>
    <ScrollView style={[styles.screen, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/blog' as never)} accessibilityRole="button" accessibilityLabel="Back to blog">
          <ArrowLeft color={theme.primary} size={20} />
          <Text style={[styles.backText, { color: theme.primary }]}>Blog</Text>
        </TouchableOpacity>
      </View>

      <Image source={resolveBlogCover(post.cover_image)} style={styles.cover} resizeMode="cover" accessibilityLabel={post.title} />

      <View style={styles.articleHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: theme.primarySoft }]}>
          <Text style={[styles.categoryBadgeText, { color: theme.primary }]}>{getBlogCategoryLabel(post.category)}</Text>
        </View>
        <Text role="heading" aria-level={1} style={[styles.title, { color: theme.text }]}>{post.title}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: theme.subtle }]}>{formatDate(post.published_at)}</Text>
          <View style={[styles.metaDivider, { backgroundColor: theme.subtle }]} />
          <Clock3 color={theme.subtle} size={13} />
          <Text style={[styles.metaText, { color: theme.subtle }]}>{post.read_minutes} min read</Text>
        </View>
      </View>

      <View style={styles.body}>
        <BlogContent content={post.content} />
      </View>

      <View style={[styles.ctaBox, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
        <Ticket color={theme.gold} size={22} />
        <Text style={[styles.ctaTitle, { color: theme.text }]}>Ready to enter a draw?</Text>
        <Link href="/" asChild>
          <TouchableOpacity style={StyleSheet.flatten([styles.ctaButton, { backgroundColor: theme.gold }])}>
            <Text style={styles.ctaButtonText}>Browse Active Draws</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {related.length > 0 ? (
        <View style={styles.relatedSection}>
          <Text style={[styles.relatedTitle, { color: theme.gold }]}>Related Articles</Text>
          {related.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={[styles.relatedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push(`/blog/${entry.slug}` as never)}
            >
              <Image source={resolveBlogCover(entry.cover_image)} style={styles.relatedImage} resizeMode="cover" accessibilityLabel={entry.title} />
              <View style={styles.relatedBody}>
                <Text style={[styles.relatedCardTitle, { color: theme.text }]} numberOfLines={2}>{entry.title}</Text>
                <Text style={[styles.metaText, { color: theme.subtle }]}>{entry.read_minutes} min read</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 50 },
  stateScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  notFoundTitle: { fontSize: 18, fontWeight: '800' },
  notFoundLink: { fontSize: 15, fontWeight: '700' },
  header: { minHeight: 60, borderBottomWidth: 2, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' },
  backButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5 },
  backText: { fontSize: 15, fontWeight: '700' },
  cover: { width: '100%', height: 260 },
  articleHeader: { paddingHorizontal: 20, paddingTop: 20, gap: 10 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  title: { fontSize: 26, fontWeight: '800', lineHeight: 33 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13 },
  metaDivider: { width: 3, height: 3, borderRadius: 1.5 },
  body: { paddingHorizontal: 20, paddingTop: 18 },
  ctaBox: { marginHorizontal: 20, marginTop: 28, borderWidth: 1, borderRadius: 16, padding: 20, alignItems: 'center', gap: 10 },
  ctaTitle: { fontSize: 17, fontWeight: '800' },
  ctaButton: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 13 },
  ctaButtonText: { color: '#000', fontSize: 15, fontWeight: '800' },
  relatedSection: { paddingHorizontal: 20, marginTop: 28, gap: 12 },
  relatedTitle: { fontSize: 17, fontWeight: '800' },
  relatedCard: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  relatedImage: { width: 96, height: 96 },
  relatedBody: { flex: 1, padding: 12, justifyContent: 'center', gap: 6 },
  relatedCardTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
});
