import { ActivityIndicator, AppState, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { CheckCircle2, Clock, ShieldCheck, Ticket, Trophy, Users } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { getStoredValue } from '@/lib/storage';
import type { DrawSessionState, Product } from '@/types/database';
import { DrawAnimationSequence, RESULT_STATES } from '@/components/draw-animation/DrawAnimationSequence';

const TIMELINE_STEPS = ['Waiting', 'Entries Locked', 'Verification', 'Live Draw', 'Winner Reveal'] as const;

const STATUS_LABEL: Record<DrawSessionState, string> = {
  created: 'Waiting',
  waiting: 'Waiting',
  locked: 'Entries Locked',
  verifying: 'Verification',
  ready: 'Ready',
  running: 'Live Soon',
  winner_selected: 'Winner Reveal',
  result_published: 'Winner Reveal',
  completed: 'Winner Reveal',
};

// Maps a session state onto the 5-step timeline (0-indexed).
function timelineStepIndex(state: DrawSessionState): number {
  switch (state) {
    case 'created':
    case 'waiting':
      return 0;
    case 'locked':
      return 1;
    case 'verifying':
      return 2;
    case 'ready':
    case 'running':
      return 3;
    default:
      return 4;
  }
}

// Polling cadence for live updates. Slower while the tab/app is backgrounded
// so we're not hammering Supabase for a view nobody's looking at. This is
// the fallback path — it only runs while the Realtime channel below isn't
// connected (initial connect delay, or a dropped websocket).
const POLL_INTERVAL_ACTIVE_MS = 4000;
const POLL_INTERVAL_BACKGROUND_MS = 15000;

export default function DrawLobbyScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { productId } = useLocalSearchParams();
  const productIdValue = Array.isArray(productId) ? productId[0] : productId;

  const [product, setProduct] = useState<Product | null>(null);
  const [sessionState, setSessionState] = useState<DrawSessionState | null>(null);
  const [sessionUpdatedAt, setSessionUpdatedAt] = useState<string | null>(null);
  const [myTicket, setMyTicket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    fetchLobbyData();
  }, [productIdValue]);

  // Tracks foreground/background so polling can slow down when nobody's
  // looking (react-native-web maps this to document visibility on web).
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setIsAppActive(nextState === 'active');
    });
    return () => subscription.remove();
  }, []);

  // Realtime: pushes draw_sessions/products changes to every open Lobby the
  // instant an admin (or the draw run) writes them, instead of waiting for
  // the next poll tick. Connection state drives the polling fallback below.
  useEffect(() => {
    if (!productIdValue) return;

    const channel = supabase
      .channel(`draw-lobby:${productIdValue}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'draw_sessions', filter: `product_id=eq.${productIdValue}` },
        (payload) => {
          const row = payload.new as { state: DrawSessionState; state_updated_at: string };
          applySessionState(row.state, row.state_updated_at);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products', filter: `id=eq.${productIdValue}` },
        (payload) => {
          const row = payload.new as { current_entries: number | null; max_entries: number };
          setProduct((prev) => (prev ? { ...prev, current_entries: row.current_entries, max_entries: row.max_entries } : prev));
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsRealtimeConnected(false);
    };
  }, [productIdValue]);

  // Live polling fallback: only runs while Realtime isn't connected yet
  // (initial connect delay) or has dropped (websocket error/timeout/close).
  // Stops entirely once the draw has a result (redirect below) or the
  // lobby failed to load in the first place.
  useEffect(() => {
    if (loading || notFound || !sessionState || RESULT_STATES.includes(sessionState)) return;
    if (isRealtimeConnected) return;

    const intervalMs = isAppActive ? POLL_INTERVAL_ACTIVE_MS : POLL_INTERVAL_BACKGROUND_MS;
    const timer = setInterval(pollLobbyData, intervalMs);
    return () => clearInterval(timer);
  }, [loading, notFound, sessionState, isAppActive, isRealtimeConnected, productIdValue]);

  // Applies a freshly-fetched session state. The redirect to /winner used to
  // happen here immediately; now the full-screen DrawAnimationSequence takes
  // over once a result exists and calls onRevealComplete when it's done.
  function applySessionState(state: DrawSessionState, updatedAt: string | null) {
    setSessionState(state);
    setSessionUpdatedAt(updatedAt);
  }

  function goToResultPage() {
    router.replace({ pathname: '/winner', params: { productId: productIdValue } });
  }

  async function fetchLobbyData() {
    if (!productIdValue) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    setLoading(true);
    const { data: productData } = await supabase
      .from('products')
      .select('*')
      .eq('id', productIdValue)
      .maybeSingle();

    if (!productData) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setProduct(productData);

    const { data: sessionData } = await supabase
      .from('draw_sessions')
      .select('state, state_updated_at')
      .eq('product_id', productIdValue)
      .maybeSingle();

    const state = (sessionData?.state as DrawSessionState) || 'waiting';
    applySessionState(state, sessionData?.state_updated_at || null);

    const storedPhone = await getStoredValue('userPhone');
    if (storedPhone) {
      const { data: ticket } = await supabase.rpc('get_my_ticket_for_draw', {
        p_product_id: productIdValue,
        p_phone: storedPhone,
      });
      setMyTicket(ticket || null);
    }

    setLoading(false);
  }

  // Lightweight refetch used by the polling interval — only the fields that
  // can actually change while the lobby is open (session state + entries
  // count), not the full product row or the viewer's own ticket.
  async function pollLobbyData() {
    if (!productIdValue) return;

    const [{ data: sessionData }, { data: productData }] = await Promise.all([
      supabase.from('draw_sessions').select('state, state_updated_at').eq('product_id', productIdValue).maybeSingle(),
      supabase.from('products').select('current_entries, max_entries').eq('id', productIdValue).maybeSingle(),
    ]);

    if (sessionData) {
      const state = sessionData.state as DrawSessionState;
      applySessionState(state, sessionData.state_updated_at || null);
    }

    if (productData) {
      setProduct((prev) => (prev ? { ...prev, current_entries: productData.current_entries, max_entries: productData.max_entries } : prev));
    }
  }

  const totalTickets = product?.max_entries || 0;
  const soldTickets = product?.current_entries || 0;
  const remainingTickets = Math.max(0, totalTickets - soldTickets);
  const progressPercent = totalTickets > 0 ? Math.min((soldTickets / totalTickets) * 100, 100) : 0;
  const currentStep = useMemo(() => timelineStepIndex(sessionState || 'waiting'), [sessionState]);

  function formatUpdatedAt(iso: string | null) {
    if (!iso) return 'Just now';
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMinutes = Math.round(diffMs / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.round(diffMinutes / 60);
    return `${diffHours} hr ago`;
  }

  if (loading) return (
    <>
    <Head><title>Draw Lobby | JeetoBaz</title><meta name="robots" content="noindex, follow" /></Head>
    <View style={[styles.loading, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.primary }]}>Loading draw lobby...</Text>
    </View>
    </>
  );

  if (notFound || !product) return (
    <>
    <Head><title>Draw Lobby | JeetoBaz</title><meta name="robots" content="noindex, follow" /></Head>
    <View style={[styles.loading, { backgroundColor: theme.background }]}>
      <Text style={[styles.loadingText, { color: theme.text }]}>Draw not found.</Text>
    </View>
    </>
  );

  const activeState = sessionState || 'waiting';
  const showAnimationSequence = activeState !== 'created' && activeState !== 'waiting';

  if (showAnimationSequence) return (
    <>
    <Head>
      <title>{product.name} — Draw Lobby | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
    </Head>
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <DrawAnimationSequence
        theme={theme}
        product={product}
        sessionState={activeState}
        myTicket={myTicket}
        onRevealComplete={goToResultPage}
      />
    </View>
    </>
  );

  return (
    <>
    <Head>
      <title>{product.name} — Draw Lobby | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
    </Head>
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Section 1 — Hero Banner */}
      <View style={[styles.hero, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.heroImage} resizeMode="cover" />
        ) : null}
        <View style={styles.verifiedBadge}>
          <ShieldCheck color="#18a663" size={14} />
          <Text style={styles.verifiedBadgeText}>Verified Draw</Text>
        </View>
        <Text style={[styles.heroTitle, { color: theme.text }]}>{product.name}</Text>
        <Text style={[styles.heroPrice, { color: theme.gold }]}>Rs. {(product.price || 0).toLocaleString()}</Text>
        <Text style={[styles.heroDrawId, { color: theme.subtle }]}>Draw #{product.id.slice(0, 8).toUpperCase()}</Text>
      </View>

      {/* Section 2 — Progress */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardTitleRow}><Ticket color={theme.primary} size={18} /><Text style={[styles.cardTitle, { color: theme.text }]}>Entries Progress</Text></View>
        <View style={styles.progressStatsRow}>
          <View style={styles.progressStat}>
            <Text style={[styles.progressStatValue, { color: theme.text }]}>{totalTickets.toLocaleString()}</Text>
            <Text style={[styles.progressStatLabel, { color: theme.subtle }]}>Total Tickets</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={[styles.progressStatValue, { color: theme.text }]}>{soldTickets.toLocaleString()}</Text>
            <Text style={[styles.progressStatLabel, { color: theme.subtle }]}>Sold</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={[styles.progressStatValue, { color: theme.text }]}>{remainingTickets.toLocaleString()}</Text>
            <Text style={[styles.progressStatLabel, { color: theme.subtle }]}>Remaining</Text>
          </View>
        </View>
        <View style={[styles.progressBar, { backgroundColor: theme.surfaceAlt }]}>
          <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: theme.primary }]} />
        </View>
      </View>

      {/* Section 3 — Your Entry */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: myTicket ? theme.gold : theme.border }]}>
        <View style={styles.cardTitleRow}><Trophy color={theme.gold} size={18} /><Text style={[styles.cardTitle, { color: theme.text }]}>Your Entry</Text></View>
        {myTicket ? (
          <View style={styles.yourTicketRow}>
            <View style={styles.yourTicketBadge}>
              <Text style={styles.yourTicketBadgeText}>Your Ticket</Text>
            </View>
            <Text style={[styles.yourTicketNumber, { color: theme.text }]}>{myTicket}</Text>
          </View>
        ) : (
          <Text style={[styles.noEntryText, { color: theme.muted }]}>You have not joined this draw yet.</Text>
        )}
      </View>

      {/* Section 4 — Draw Status */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardTitleRow}><Clock color={theme.primary} size={18} /><Text style={[styles.cardTitle, { color: theme.text }]}>Draw Status</Text></View>
        <Text style={[styles.statusValue, { color: theme.gold }]}>{STATUS_LABEL[sessionState || 'waiting']}</Text>
      </View>

      {/* Section 5 — Timeline */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardTitleRow}><Text style={[styles.cardTitle, { color: theme.text }]}>Draw Timeline</Text></View>
        {TIMELINE_STEPS.map((step, index) => (
          <View key={step} style={styles.timelineRow}>
            <View style={[styles.timelineDot, index <= currentStep ? { backgroundColor: theme.primary } : { backgroundColor: theme.surfaceAlt, borderColor: theme.border, borderWidth: 1 }]} />
            <Text style={[styles.timelineLabel, index === currentStep ? { color: theme.gold, fontWeight: 'bold' } : { color: index < currentStep ? theme.text : theme.subtle }]}>
              {step}
            </Text>
          </View>
        ))}
      </View>

      {/* Section 6 — Fairness */}
      <View style={[styles.card, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
        <View style={styles.cardTitleRow}><ShieldCheck color={theme.primary} size={18} /><Text style={[styles.cardTitle, { color: theme.text }]}>Fairness Guarantee</Text></View>
        {['Every ticket included', 'Draw audit logged', 'Winner publicly verifiable', 'Animation never decides the winner'].map((line) => (
          <View key={line} style={styles.fairnessRow}>
            <CheckCircle2 color={theme.primary} size={16} />
            <Text style={[styles.fairnessText, { color: theme.text }]}>{line}</Text>
          </View>
        ))}
      </View>

      {/* Section 7 — Estimated Duration */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardTitleRow}><Clock color={theme.primary} size={18} /><Text style={[styles.cardTitle, { color: theme.text }]}>Estimated Duration</Text></View>
        <Text style={[styles.durationValue, { color: theme.text }]}>Live Draw ≈ 10–15 minutes</Text>
        <Text style={[styles.durationNote, { color: theme.muted }]}>Once started, everyone watches the same draw.</Text>
      </View>

      {/* Section 8 — Live Statistics */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardTitleRow}><Users color={theme.primary} size={18} /><Text style={[styles.cardTitle, { color: theme.text }]}>Live Statistics</Text></View>
        <View style={styles.statsGrid}>
          <View style={styles.statsGridItem}>
            <Text style={[styles.progressStatValue, { color: theme.text }]}>{soldTickets.toLocaleString()}</Text>
            <Text style={[styles.progressStatLabel, { color: theme.subtle }]}>Participants</Text>
          </View>
          <View style={styles.statsGridItem}>
            <Text style={[styles.progressStatValue, { color: theme.text }]}>{soldTickets.toLocaleString()}</Text>
            <Text style={[styles.progressStatLabel, { color: theme.subtle }]}>Tickets Sold</Text>
          </View>
          <View style={styles.statsGridItem}>
            <Text style={[styles.progressStatValue, { color: theme.text }]}>{formatUpdatedAt(sessionUpdatedAt)}</Text>
            <Text style={[styles.progressStatLabel, { color: theme.subtle }]}>Last Updated</Text>
          </View>
        </View>
      </View>

      {product.slug ? (
        <Link href={`/product/${product.slug}`} asChild>
          <TouchableOpacity style={[styles.viewPrizeButton, { borderColor: theme.primary }]}>
            <Text style={[styles.viewPrizeButtonText, { color: theme.primary }]}>View Prize Details</Text>
          </TouchableOpacity>
        </Link>
      ) : null}

    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 15 },
  hero: { padding: 24, alignItems: 'center', borderBottomWidth: 2 },
  heroImage: { width: 140, height: 140, borderRadius: 16, marginBottom: 14 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(24,166,99,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  verifiedBadgeText: { color: '#18a663', fontSize: 11, fontWeight: 'bold' },
  heroTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  heroPrice: { fontSize: 22, fontWeight: 'bold', marginTop: 6 },
  heroDrawId: { fontSize: 12, marginTop: 6 },
  card: { marginHorizontal: 15, marginTop: 15, borderRadius: 15, borderWidth: 1, padding: 18 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: 'bold' },
  progressStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressStat: { alignItems: 'center', flex: 1 },
  progressStatValue: { fontSize: 16, fontWeight: 'bold' },
  progressStatLabel: { fontSize: 11, marginTop: 3 },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  yourTicketRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  yourTicketBadge: { backgroundColor: '#FFD700', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  yourTicketBadgeText: { color: '#000', fontSize: 11, fontWeight: 'bold' },
  yourTicketNumber: { fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' },
  noEntryText: { fontSize: 14 },
  statusValue: { fontSize: 18, fontWeight: 'bold' },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  timelineDot: { width: 12, height: 12, borderRadius: 6 },
  timelineLabel: { fontSize: 14 },
  fairnessRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  fairnessText: { fontSize: 13, flexShrink: 1 },
  durationValue: { fontSize: 16, fontWeight: 'bold' },
  durationNote: { fontSize: 12, marginTop: 6 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statsGridItem: { alignItems: 'center', flex: 1 },
  viewPrizeButton: { marginHorizontal: 15, marginTop: 20, marginBottom: 40, borderRadius: 12, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  viewPrizeButtonText: { fontSize: 14, fontWeight: 'bold' },
});
