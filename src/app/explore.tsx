import { Image, View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/providers/AuthProvider';
import { DataErrorState } from '@/components/data-error-state';
import Head from 'expo-router/head';
import type { PublicWinnerListEntry } from '@/types/database';
import { useAppTheme } from '@/hooks/use-theme';
import { pageSchema } from '@/lib/structured-data';
import { BadgeCheck, Search, Ticket, Trophy, Users } from 'lucide-react-native';

type Tab = 'all' | 'mine';

export default function WinnersScreen() {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [winners, setWinners] = useState<PublicWinnerListEntry[]>([]);
  const [myWins, setMyWins] = useState<PublicWinnerListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => { fetchWinners(); }, []);
  useEffect(() => { if (user) fetchMyWins(); }, [user]);

  async function fetchWinners() {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase.rpc('get_public_winners_list');
    if (data) setWinners(data);
    if (error) setLoadError(true);
    setLoading(false);
  }

  async function fetchMyWins() {
    const { data } = await supabase.rpc('get_my_wins');
    if (data) setMyWins(data);
  }

  const activeList = tab === 'mine' ? myWins : winners;

  const filteredWinners = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return activeList;
    return activeList.filter((w) =>
      w.product_name.toLowerCase().includes(search) || w.winner_name.toLowerCase().includes(search)
    );
  }, [activeList, query]);

  const stats = useMemo(() => {
    const totalPrizeValue = winners.reduce((sum, w) => sum + (w.prize_value || 0), 0);
    const totalEntries = winners.reduce((sum, w) => sum + (w.total_entries || 0), 0);
    return { totalWinners: winners.length, totalPrizeValue, totalEntries };
  }, [winners]);

  function getLocation(w: PublicWinnerListEntry) {
    return [w.winner_city, w.winner_province].filter(Boolean).join(', ');
  }

  function formatDrawDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const exploreSchema = pageSchema('CollectionPage', '/explore', 'Explore Prize Campaigns', 'Explore JeetoBaz prize campaigns, review product and participation details, follow campaign progress, and discover verified winners across Pakistan.');

  const headTags = (
    <Head>
      <title>Hall of Winners | JeetoBaz</title>
      <meta name="robots" content="index, follow" />
      <meta name="description" content="Explore JeetoBaz prize campaigns, review product and participation details, follow campaign progress, and discover verified winners across Pakistan." />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Hall of Winners | JeetoBaz" />
      <meta property="og:description" content="Explore JeetoBaz prize campaigns, review product and participation details, follow campaign progress, and discover verified winners across Pakistan." />
      <meta property="og:url" content="https://jeetobaz.pk/explore" />
      <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
      <meta property="og:image:alt" content="JeetoBaz — Pakistan's trusted prize draw platform" />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content="Hall of Winners | JeetoBaz" />
      <meta name="twitter:description" content="Explore JeetoBaz prize campaigns, review product and participation details, follow campaign progress, and discover verified winners across Pakistan." />
      <meta name="twitter:image" content="https://jeetobaz.pk/twitter-image.png" />
      <link rel="canonical" href="https://jeetobaz.pk/explore" />
      <script type="application/ld+json">{JSON.stringify(exploreSchema)}</script>
    </Head>
  );

  const header = (
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
      <Trophy color="#FFD700" size={56} />
      <Text role="heading" aria-level={1} style={styles.title}>{t('pastWinners')}</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>Congratulations to All Lucky Winners!</Text>
    </View>
  );

  if (loading) return (
    <>
    {headTags}
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {header}
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} accessibilityLabel="Loading" />
        <Text style={[styles.loadingText, { color: theme.primary }]}>{t('loadingWinners')}</Text>
      </View>
    </View>
    </>
  );

  if (loadError) return (
    <>
    {headTags}
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {header}
      <DataErrorState onRetry={fetchWinners} />
    </View>
    </>
  );

  return (
    <>
    {headTags}
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {header}

      <View style={styles.statsRow}>
        <View style={[styles.statTile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Trophy color="#FFD700" size={20} />
          <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalWinners}</Text>
          <Text style={[styles.statLabel, { color: theme.subtle }]}>Total Winners</Text>
        </View>
        <View style={[styles.statTile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ticket color="#18a663" size={20} />
          <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalEntries.toLocaleString()}</Text>
          <Text style={[styles.statLabel, { color: theme.subtle }]}>Total Entries</Text>
        </View>
        <View style={[styles.statTile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Users color="#4a9eff" size={20} />
          <Text style={[styles.statValue, { color: theme.text }]}>Rs. {stats.totalPrizeValue.toLocaleString()}</Text>
          <Text style={[styles.statLabel, { color: theme.subtle }]}>Prizes Given</Text>
        </View>
      </View>

      <View style={[styles.tabRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'all' && { backgroundColor: theme.primary }]}
          onPress={() => setTab('all')}
        >
          <Text style={[styles.tabButtonText, { color: tab === 'all' ? '#000' : theme.text }]}>All Winners</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'mine' && { backgroundColor: theme.primary }]}
          onPress={() => setTab('mine')}
        >
          <Text style={[styles.tabButtonText, { color: tab === 'mine' ? '#000' : theme.text }]}>My Wins</Text>
        </TouchableOpacity>
      </View>

      {tab === 'mine' && !authLoading && !user ? (
        <View style={styles.emptyBox}>
          <Trophy color={theme.subtle} size={50} />
          <Text style={[styles.emptyText, { color: theme.text }]}>Sign in to see your wins</Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.clearSearchText}>Go to Login →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {activeList.length > 0 && (
            <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Search color={theme.subtle} size={20} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by winner or prize name..."
                placeholderTextColor={theme.subtle}
                style={[styles.searchInput, { color: theme.text }]}
              />
            </View>
          )}

          {activeList.length === 0 ? (
            <View style={styles.emptyBox}>
              <Trophy color={theme.subtle} size={60} />
              <Text style={[styles.emptyText, { color: theme.text }]}>
                {tab === 'mine' ? "You haven't won a draw yet" : t('noCompletedDraws')}
              </Text>
              <Text style={[styles.emptySubText, { color: theme.muted }]}>
                {tab === 'mine' ? 'Keep participating — your win could be next!' : 'Be the first winner — enter a draw now!'}
              </Text>
            </View>
          ) : filteredWinners.length === 0 ? (
            <View style={styles.emptyBox}>
              <Search color={theme.subtle} size={50} />
              <Text style={[styles.emptyText, { color: theme.text }]}>No matching winner found</Text>
              <TouchableOpacity onPress={() => setQuery('')}>
                <Text style={styles.clearSearchText}>Clear Search</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredWinners.map((w, index) => {
                const location = getLocation(w);
                return (
                  <TouchableOpacity
                    key={w.product_id}
                    style={[styles.winnerRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => router.push({ pathname: '/winner', params: { productId: w.product_id } })}
                  >
                    <Text style={[styles.rank, { color: theme.subtle }]}>#{index + 1}</Text>
                    {w.winner_avatar_url ? (
                      <Image source={{ uri: w.winner_avatar_url }} style={styles.avatar} resizeMode="cover" accessibilityLabel={`${w.winner_name || 'Winner'} photo`} />
                    ) : (
                      <View style={[styles.avatarFallback, { backgroundColor: theme.surfaceAlt }]}>
                        <Trophy color="#FFD700" size={20} />
                      </View>
                    )}
                    <View style={styles.winnerInfo}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.winnerRowName, { color: theme.text }]} numberOfLines={1}>{w.winner_name}</Text>
                        {w.winner_status === 'verified' && (
                          <View style={styles.verifiedBadge}>
                            <BadgeCheck color="#18a663" size={13} />
                            <Text style={styles.verifiedBadgeText}>Verified</Text>
                          </View>
                        )}
                      </View>
                      {location ? <Text style={[styles.locationText, { color: theme.subtle }]} numberOfLines={1}>{location}</Text> : null}
                      {w.product_slug ? (
                        <Link href={`/product/${w.product_slug}`} asChild>
                          <Text style={[styles.prizeText, styles.prizeTextLink]} numberOfLines={1}>{w.product_name}</Text>
                        </Link>
                      ) : (
                        <Text style={[styles.prizeText, { color: theme.primary }]} numberOfLines={1}>{w.product_name}</Text>
                      )}
                    </View>
                    <Text style={[styles.dateText, { color: theme.subtle }]}>{formatDrawDate(w.drawn_at)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('allDrawsFair')}</Text>
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  loading: { flex: 1, backgroundColor: '#020d09', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#18a663', marginTop: 10, fontSize: 16 },
  header: { backgroundColor: '#04140e', padding: 30, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FFD700', marginTop: 10 },
  subtitle: { fontSize: 14, color: '#aaa', marginTop: 5 },
  statsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 15, marginTop: 15 },
  statTile: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 15, fontWeight: 'bold' },
  statLabel: { fontSize: 11, textAlign: 'center' },
  tabRow: { flexDirection: 'row', marginHorizontal: 15, marginTop: 15, borderRadius: 12, borderWidth: 1, padding: 4, gap: 4 },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  tabButtonText: { fontSize: 14, fontWeight: 'bold' },
  searchBox: { marginHorizontal: 15, marginTop: 15, marginBottom: 5, borderWidth: 1, borderRadius: 12, minHeight: 52, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 12, outlineStyle: 'none' } as never,
  emptyBox: { alignItems: 'center', padding: 50 },
  emptyText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubText: { color: '#aaa', fontSize: 14, textAlign: 'center' },
  clearSearchText: { color: '#18a663', fontSize: 15, fontWeight: 'bold', marginTop: 12 },
  listContainer: { paddingHorizontal: 15, paddingTop: 10, gap: 10 },
  winnerRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, gap: 10 },
  rank: { fontSize: 13, fontWeight: 'bold', width: 26 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#FFD700' },
  avatarFallback: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  winnerInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  winnerRowName: { fontSize: 14, fontWeight: 'bold', flexShrink: 1 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(24,166,99,0.15)', borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2 },
  verifiedBadgeText: { color: '#18a663', fontSize: 10, fontWeight: 'bold' },
  locationText: { fontSize: 12, marginTop: 2 },
  prizeText: { fontSize: 13, marginTop: 3 },
  prizeTextLink: { color: '#18a663', textDecorationLine: 'underline' },
  dateText: { fontSize: 11, textAlign: 'right', flexShrink: 0 },
  footer: { padding: 20, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  footerText: { color: '#444', fontSize: 12 },
});
