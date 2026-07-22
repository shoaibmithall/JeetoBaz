import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  Gift,
  Share2,
  ShieldCheck,
  Ticket,
  UserPlus,
  UsersRound,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { getStoredValue } from '@/lib/storage';
import {
  getReferralDeviceToken,
  normalizeReferralCode,
  savePendingReferralCode,
} from '@/lib/referrals';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/database';

const APP_URL = 'https://jeetobaz.pk';

function StatCard({ label, value, icon, theme }: { label: string; value: number; icon: React.ReactNode; theme: ReturnType<typeof useAppTheme>['theme'] }) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {icon}
      <Text selectable style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

type Dashboard = {
  referral_code: string;
  successful_referrals: number;
  available_rewards: number;
  redeemed_rewards: number;
};

type Reward = {
  reward_id: string;
  expires_at: string;
};

export default function ReferralScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ref?: string; source?: string }>();
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const [phone, setPhone] = useState('');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [codeInput, setCodeInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [redeemingId, setRedeemingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const contentWidth = Math.min(width - 30, 920);

  useEffect(() => {
    const incomingCode = typeof params.ref === 'string' ? normalizeReferralCode(params.ref) : '';
    if (incomingCode) {
      setCodeInput(incomingCode);
      savePendingReferralCode(incomingCode);
    }
    loadReferralData();
  }, [params.ref]);

  async function loadReferralData() {
    setLoading(true);
    setErrorMessage('');
    const savedPhone = await getStoredValue('userPhone');
    setPhone(savedPhone || '');

    if (!savedPhone) {
      setLoading(false);
      return;
    }

    const deviceToken = await getReferralDeviceToken();
    const [dashboardResult, rewardsResult, productsResult] = await Promise.all([
      supabase.rpc('get_referral_dashboard', {
        requested_phone: savedPhone,
        requested_device_token: deviceToken,
      }),
      supabase.rpc('get_available_referral_rewards', {
        requested_phone: savedPhone,
        requested_device_token: deviceToken,
      }),
      supabase.rpc('get_referral_eligible_products', {}),
    ]);

    if (dashboardResult.error) {
      setErrorMessage(
        dashboardResult.error.message.includes('function')
          ? 'Referral database setup is pending. Apply the referral migration before using this feature.'
          : dashboardResult.error.message
      );
    } else {
      const row = dashboardResult.data?.[0];
      setDashboard(row ? {
        referral_code: row.referral_code,
        successful_referrals: Number(row.successful_referrals),
        available_rewards: Number(row.available_rewards),
        redeemed_rewards: Number(row.redeemed_rewards),
      } : null);
    }

    setRewards((rewardsResult.data || []) as Reward[]);
    setProducts(productsResult.data || []);
    setLoading(false);
  }

  async function copyReferralLink() {
    if (!dashboard?.referral_code) return;
    await Clipboard.setStringAsync(`${APP_URL}/referral?ref=${dashboard.referral_code}`);
    Alert.alert('Copied', 'Your referral link has been copied.');
  }

  async function shareReferral() {
    if (!dashboard?.referral_code) return;
    const link = `${APP_URL}/referral?ref=${dashboard.referral_code}`;
    await Share.share({
      title: 'Join JeetoBaz',
      message: `Join JeetoBaz with my referral code ${dashboard.referral_code}. Verify your new account and we can each unlock one free entry for an eligible Rs.1 campaign.\n${link}`,
      url: link,
    });
  }

  async function claimCode() {
    const code = normalizeReferralCode(codeInput);
    if (!code) {
      Alert.alert('Referral code required', 'Enter a valid JeetoBaz referral code.');
      return;
    }

    if (!phone) {
      await savePendingReferralCode(code);
      router.push('/login');
      return;
    }

    setClaiming(true);
    const deviceToken = await getReferralDeviceToken();
    const { data, error } = await supabase.rpc('claim_referral_code', {
      requested_phone: phone,
      requested_code: code,
      requested_device_token: deviceToken,
    });
    setClaiming(false);

    if (error) {
      Alert.alert('Referral not applied', error.message);
      return;
    }

    Alert.alert('Referral verified', data);
    setCodeInput('');
    await loadReferralData();
  }

  async function redeemReward(rewardId: string, productId: string) {
    setRedeemingId(`${rewardId}:${productId}`);
    try {
      const deviceToken = await getReferralDeviceToken();
      const { data, error } = await supabase.rpc('redeem_referral_reward', {
        requested_phone: phone,
        requested_device_token: deviceToken,
        requested_reward_id: rewardId,
        requested_product_id: productId,
      });

      if (error) {
        Alert.alert('Entry not added', error.message);
        return;
      }

      Alert.alert('Free entry confirmed', `Your ticket is ${data}.`);
      await loadReferralData();
    } finally {
      setRedeemingId('');
    }
  }

  return (
    <>
    <Head>
      <title>Refer &amp; Earn | JeetoBaz</title>
    </Head>
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => params.source === 'profile' ? router.replace('/login') : router.back()}>
          <ArrowLeft color={theme.primary} size={22} />
          <Text style={[styles.backText, { color: theme.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.gold }]}>Refer & Earn</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.content, { width: contentWidth }]}>
        <View style={[styles.hero, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
          <Gift color={theme.gold} size={42} />
          <Text selectable style={[styles.heroTitle, { color: theme.text }]}>Share JeetoBaz. Unlock Rs.1 Entries.</Text>
          <Text selectable style={[styles.heroText, { color: theme.muted }]}>
            When a new user applies your code on a different device and completes account verification, both users receive one free entry reward for an eligible Rs.1 campaign.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={theme.primary} size="large" />
            <Text style={[styles.loadingText, { color: theme.muted }]}>Loading referral account...</Text>
          </View>
        ) : !phone ? (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <UserPlus color={theme.gold} size={30} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Create or open your account</Text>
            <Text style={[styles.bodyText, { color: theme.muted }]}>
              Log in first. If you opened a referral link, its code will be saved and can be applied after signup.
            </Text>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.gold }]} onPress={() => router.push('/login')}>
              <Text style={styles.primaryButtonText}>Continue to Login</Text>
            </TouchableOpacity>
          </View>
        ) : errorMessage ? (
          <View style={[styles.card, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
            <ShieldCheck color={theme.danger} size={28} />
            <Text selectable style={[styles.errorText, { color: theme.danger }]}>{errorMessage}</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatCard label="Successful" value={dashboard?.successful_referrals || 0} icon={<UsersRound color={theme.primary} size={21} />} theme={theme} />
              <StatCard label="Available" value={dashboard?.available_rewards || 0} icon={<Gift color={theme.gold} size={21} />} theme={theme} />
              <StatCard label="Redeemed" value={dashboard?.redeemed_rewards || 0} icon={<Ticket color={theme.info} size={21} />} theme={theme} />
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text selectable style={[styles.cardLabel, { color: theme.muted }]}>YOUR REFERRAL CODE</Text>
              <Text selectable style={[styles.referralCode, { color: theme.gold }]}>{dashboard?.referral_code}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.primary }]} onPress={copyReferralLink}>
                  <Copy color={theme.primary} size={18} />
                  <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Copy Link</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton, styles.shareButton, { backgroundColor: theme.gold }]} onPress={shareReferral}>
                  <Share2 color="#000" size={18} />
                  <Text style={styles.primaryButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Have a referral code?</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
                placeholder="JB-XXXXXXXX"
                placeholderTextColor={theme.subtle}
                autoCapitalize="characters"
                value={codeInput}
                onChangeText={(value) => setCodeInput(normalizeReferralCode(value))}
                maxLength={20}
              />
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.gold }, claiming && styles.disabledButton]}
                onPress={claimCode}
                disabled={claiming}
              >
                <Text style={styles.primaryButtonText}>{claiming ? 'Checking...' : 'Apply Referral Code'}</Text>
              </TouchableOpacity>
            </View>

            {rewards.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Choose an Rs.1 Campaign</Text>
                <Text style={[styles.bodyText, { color: theme.muted }]}>
                  Each reward can add one free entry. Rewards expire after 30 days and cannot be converted to cash.
                </Text>
                {products.length === 0 ? (
                  <Text style={[styles.emptyText, { color: theme.muted }]}>No eligible Rs.1 campaign is available right now.</Text>
                ) : rewards.map((reward, rewardIndex) => (
                  <View key={reward.reward_id} style={styles.rewardBlock}>
                    <View style={styles.rewardHeading}>
                      <Gift color={theme.gold} size={20} />
                      <Text style={[styles.rewardTitle, { color: theme.text }]}>Free Entry {rewardIndex + 1}</Text>
                      <View style={styles.expiryRow}>
                        <Clock3 color={theme.muted} size={14} />
                        <Text style={[styles.expiryText, { color: theme.muted }]}>
                          {new Date(reward.expires_at).toLocaleDateString('en-PK')}
                        </Text>
                      </View>
                    </View>
                    {products.map((product) => {
                      const redeeming = redeemingId === `${reward.reward_id}:${product.id}`;
                      return (
                        <TouchableOpacity
                          key={`${reward.reward_id}:${product.id}`}
                          style={[styles.productRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                          onPress={() => redeemReward(reward.reward_id, product.id)}
                          disabled={Boolean(redeemingId)}
                        >
                          <View style={styles.productText}>
                            <Text style={[styles.productName, { color: theme.text }]}>{product.name}</Text>
                            <Text style={[styles.productMeta, { color: theme.muted }]}>
                              Rs.1 campaign · {Math.max(product.max_entries - (product.current_entries || 0), 0)} spots left
                            </Text>
                          </View>
                          <Text style={[styles.useRewardText, { color: theme.primary }]}>{redeeming ? 'Adding...' : 'Use Entry'}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}

            <View style={[styles.rulesCard, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
              {[
                'A referral qualifies only after a new account is verified.',
                'Self-referrals, same-device referrals and duplicate accounts are blocked.',
                'Each reward gives one entry in an eligible Rs.1 campaign only.',
                'A campaign can use referral entries for up to 10% of its total spots.',
              ].map((rule) => (
                <View key={rule} style={styles.ruleRow}>
                  <CheckCircle2 color={theme.primary} size={18} />
                  <Text selectable style={[styles.ruleText, { color: theme.text }]}>{rule}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 60 },
  header: { minHeight: 68, borderBottomWidth: 2, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' },
  backButton: { minWidth: 76, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5 },
  backText: { fontSize: 15, fontWeight: '700' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800' },
  headerSpacer: { width: 76 },
  content: { alignSelf: 'center', paddingTop: 18, gap: 15 },
  hero: { borderWidth: 1, borderRadius: 20, padding: 24, alignItems: 'center' },
  heroTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 10 },
  heroText: { maxWidth: 650, fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 8 },
  loadingBox: { padding: 40, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  card: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 12 },
  cardTitle: { fontSize: 19, fontWeight: '800' },
  cardLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  bodyText: { fontSize: 14, lineHeight: 21 },
  errorText: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  referralCode: { fontSize: 27, fontWeight: '900', letterSpacing: 1.2 },
  actionRow: { flexDirection: 'row', gap: 10 },
  primaryButton: { minHeight: 50, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, flexDirection: 'row', gap: 7 },
  shareButton: { flex: 1 },
  primaryButtonText: { color: '#000', fontSize: 15, fontWeight: '800' },
  secondaryButton: { minHeight: 50, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, flexDirection: 'row', gap: 7, flex: 1 },
  secondaryButtonText: { fontSize: 15, fontWeight: '800' },
  disabledButton: { opacity: 0.55 },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 17, fontWeight: '700', letterSpacing: 0.8 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 15, padding: 13, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 23, fontWeight: '900', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11, textAlign: 'center' },
  rewardBlock: { paddingTop: 8, gap: 8 },
  rewardHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rewardTitle: { flex: 1, fontSize: 16, fontWeight: '800' },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expiryText: { fontSize: 11 },
  productRow: { minHeight: 68, borderWidth: 1, borderRadius: 13, padding: 12, flexDirection: 'row', alignItems: 'center' },
  productText: { flex: 1, paddingRight: 10 },
  productName: { fontSize: 15, fontWeight: '700' },
  productMeta: { fontSize: 12, marginTop: 4 },
  useRewardText: { fontSize: 13, fontWeight: '800' },
  emptyText: { fontSize: 14, paddingVertical: 12 },
  rulesCard: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 12 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  ruleText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
