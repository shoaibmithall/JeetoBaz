import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getStoredStringArray, getStoredValue, setStoredValue } from '@/lib/storage';
import { useAppTheme } from '@/hooks/use-theme';
import { isNotificationForUser } from '@/lib/notifications';
import type { AppNotification } from '@/types/database';
import { Bell } from 'lucide-react-native';

const READ_KEY = 'readNotificationIds';

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [phone, setPhone] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupMissing, setSetupMissing] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      setLoading(true);
      const savedPhone = await getStoredValue('userPhone');
      const savedReadIds = await getStoredStringArray(READ_KEY);
      if (!savedPhone) {
        if (!active) return;
        setPhone('');
        setReadIds(savedReadIds);
        setNotifications([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!active) return;
      setPhone(savedPhone);
      setReadIds(savedReadIds);
      if (error) {
        setSetupMissing(error.message.includes('notifications'));
        setNotifications([]);
      } else {
        setNotifications((data || []).filter((item) => isNotificationForUser(item, savedPhone)));
      }
      setLoading(false);
    }

    loadNotifications();
    return () => { active = false; };
  }, []);

  async function markAllRead() {
    const ids = notifications.map((item) => item.id);
    setReadIds(ids);
    await setStoredValue(READ_KEY, JSON.stringify(ids));
  }

  async function openNotification(item: AppNotification) {
    if (!readIds.includes(item.id)) {
      const nextReadIds = [...readIds, item.id];
      setReadIds(nextReadIds);
      await setStoredValue(READ_KEY, JSON.stringify(nextReadIds));
    }
    if (item.link?.startsWith('/')) router.push(item.link as never);
    else if (item.link) Linking.openURL(item.link);
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
        <Text style={[styles.centerText, { color: theme.muted }]}>Loading notifications...</Text>
      </View>
    );
  }

  if (!phone) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Bell color={theme.gold} size={42} />
        <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
        <Text style={[styles.emptyText, { color: theme.muted }]}>Login to see your JeetoBaz notifications.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/login')}>
          <Text style={styles.primaryButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}><Bell color={theme.gold} size={22} /><Text style={[styles.title, { color: theme.text }]}>Notifications</Text></View>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markReadText}>Mark read</Text>
          </TouchableOpacity>
        )}
      </View>

      {setupMissing && (
        <View style={[styles.noticeBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.noticeTitle, { color: theme.text }]}>Setup needed</Text>
          <Text style={[styles.noticeText, { color: theme.muted }]}>Notification service setup is incomplete. Please contact support.</Text>
        </View>
      )}

      {!setupMissing && notifications.length === 0 && (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Bell color={theme.subtle} size={42} />
          <Text style={[styles.emptyText, { color: theme.muted }]}>No notifications yet.</Text>
        </View>
      )}

      {notifications.map((item) => {
        const unread = !readIds.includes(item.id);
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.notificationCard,
              { backgroundColor: theme.surface, borderColor: unread ? theme.primary : theme.border },
            ]}
            onPress={() => openNotification(item)}
          >
            <View style={styles.notificationHeader}>
              <Text style={[styles.notificationTitle, { color: theme.text }]}>{item.title}</Text>
              {unread && <Text style={styles.unreadBadge}>NEW</Text>}
            </View>
            <Text style={[styles.notificationBody, { color: theme.muted }]}>{item.message}</Text>
            <Text style={[styles.notificationDate, { color: theme.subtle }]}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  centerText: { marginTop: 10, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10 },
  backText: { color: '#18a663', fontSize: 14, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  markReadText: { color: '#18a663', fontSize: 13, fontWeight: 'bold' },
  noticeBox: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12 },
  noticeTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  noticeText: { fontSize: 14, lineHeight: 20 },
  emptyCard: { borderWidth: 1, borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  notificationCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12 },
  notificationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  notificationTitle: { flex: 1, fontSize: 16, fontWeight: 'bold' },
  unreadBadge: { backgroundColor: '#FFD700', color: '#000', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  notificationBody: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  notificationDate: { fontSize: 12 },
  primaryButton: { marginTop: 18, backgroundColor: '#FFD700', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  primaryButtonText: { color: '#000', fontWeight: 'bold' },
});
