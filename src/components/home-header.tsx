import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, Globe2, Headphones, Menu, Moon, Share2, Sun, X } from 'lucide-react-native';

import { useAppTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/lib/i18n';

type HomeHeaderProps = {
  unreadCount: number;
};

type MenuRoute = '/language' | '/help' | '/share';

export function HomeHeader({ unreadCount }: HomeHeaderProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { mode, theme, toggleThemeMode } = useAppTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  function openRoute(route: MenuRoute) {
    setMenuVisible(false);
    router.push(route);
  }

  async function toggleTheme() {
    setMenuVisible(false);
    await toggleThemeMode();
  }

  return (
    <>
      <View style={[styles.header, { backgroundColor: theme.surfaceAlt, borderBottomColor: theme.gold }]}>
        <TouchableOpacity
          style={[styles.headerAction, { backgroundColor: theme.primarySoft }]}
          onPress={() => setMenuVisible(true)}
          accessibilityLabel="Open menu"
        >
          <Menu color={theme.gold} size={24} strokeWidth={2.6} />
        </TouchableOpacity>

        <View style={styles.brand}>
          <View style={styles.brandNameRow}>
            <Image source={require('@/assets/images/icon.png')} style={styles.brandLogo} />
            <Text style={[styles.brandName, { color: theme.gold }]}>JEETOBAZ</Text>
          </View>
          <Text style={[styles.tagline, { color: theme.text }]}>{t('winBig')}</Text>
        </View>

        <TouchableOpacity
          style={[styles.headerAction, { backgroundColor: theme.primarySoft }]}
          onPress={() => router.push('/notifications' as never)}
          accessibilityLabel="Open notifications"
        >
          <Bell color={theme.gold} size={22} strokeWidth={2.4} />
          {unreadCount > 0 ? (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setMenuVisible(false)}
            accessibilityLabel="Close more menu"
          />
          <View style={[styles.menu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.menuHeader}>
              <View>
                <Text style={[styles.menuTitle, { color: theme.gold }]}>JeetoBaz</Text>
                <Text style={[styles.menuSubtitle, { color: theme.muted }]}>Quick settings</Text>
              </View>
              <TouchableOpacity onPress={() => setMenuVisible(false)} accessibilityLabel="Close menu">
                <X color={theme.muted} size={22} />
              </TouchableOpacity>
            </View>

            <MenuItem icon={<Globe2 color={theme.gold} size={21} />} label={t('language')} onPress={() => openRoute('/language')} textColor={theme.gold} />
            <MenuItem
              icon={mode === 'dark' ? <Sun color={theme.gold} size={21} /> : <Moon color={theme.gold} size={21} />}
              label={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
              onPress={toggleTheme}
              textColor={theme.gold}
            />
            <MenuItem icon={<Headphones color={theme.gold} size={21} />} label={t('helpCenter')} onPress={() => openRoute('/help')} textColor={theme.gold} />
            <MenuItem icon={<Share2 color={theme.gold} size={21} />} label={t('shareJeetoBaz')} onPress={() => openRoute('/share')} textColor={theme.gold} />
          </View>
        </View>
      </Modal>
    </>
  );
}

type MenuItemProps = {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  textColor: string;
};

function MenuItem({ icon, label, onPress, textColor }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemIcon}>{icon}</View>
      <Text style={[styles.menuItemText, { color: textColor }]}>{label}</Text>
      <ChevronRight color="#888" size={20} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 88,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerAction: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  brandNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  brandLogo: { width: 30, height: 30, borderRadius: 8 },
  brandName: { fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: 0.4 },
  tagline: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  notificationBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: '#E53935',
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: { color: 'white', fontSize: 9, fontWeight: '900', fontVariant: ['tabular-nums'] },
  modalRoot: { flex: 1, justifyContent: 'flex-start' },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  menu: {
    width: '86%',
    maxWidth: 360,
    marginTop: 72,
    marginLeft: 12,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  menuTitle: { fontSize: 19, fontWeight: '900' },
  menuSubtitle: { fontSize: 12, marginTop: 1 },
  menuItem: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemIcon: { width: 28, alignItems: 'center', justifyContent: 'center' },
  menuItemText: { flex: 1, fontSize: 14, fontWeight: '700' },
});
