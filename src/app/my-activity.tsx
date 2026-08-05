import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { useAppTheme } from '@/hooks/use-theme';
import { ChevronRight, Heart, History, Target, Ticket, Trophy } from 'lucide-react-native';

export default function MyActivityScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();

  return (
    <>
    <Head>
      <title>My Activity | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="View your JeetoBaz entries, wins, and wishlist." />
    </Head>
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surfaceAlt, borderBottomColor: theme.gold }]}>
        <TouchableOpacity onPress={() => (params.source === 'profile' ? router.replace('/login') : router.back())}>
          <Text style={[styles.backBtn, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}><Ticket color={theme.gold} size={20} /><Text style={[styles.title, { color: theme.gold }]}>My Activity</Text></View>
        <Text style={styles.dummy}></Text>
      </View>

      <View style={[styles.menuBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/entries', params: { source: 'activity' } })}>
          <Target color="#FF6B6B" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>My Entries</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/explore', params: { tab: 'mine' } })}>
          <Trophy color={theme.gold} size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>My Wins</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/favorites')}>
          <Heart color="#EC4899" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>Wishlist</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/recently-viewed')}>
          <History color="#4a9eff" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>Recently Viewed</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  header: { backgroundColor: '#04140e', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  backBtn: { color: '#18a663', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dummy: { width: 50 },
  menuBox: { backgroundColor: '#071b13', margin: 15, borderRadius: 15, borderWidth: 1, borderColor: '#174a35' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  menuText: { color: 'white', fontSize: 16, flex: 1, marginLeft: 12 },
  divider: { height: 1, backgroundColor: '#174a35' },
});
