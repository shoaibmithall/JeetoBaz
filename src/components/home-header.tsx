import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

import { useAppTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/lib/i18n';

type HomeHeaderProps = {
  unreadCount: number;
  onShare: () => void;
};

type MenuRoute = '/language' | '/help' | '/terms' | '/privacy';

export function HomeHeader({ unreadCount, onShare }: HomeHeaderProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { mode, theme, toggleThemeMode } = useAppTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  function openRoute(route: MenuRoute) {
    setMenuVisible(false);
    router.push(route);
  }

  function openShare() {
    setMenuVisible(false);
    onShare();
  }

  async function toggleTheme() {
    setMenuVisible(false);
    await toggleThemeMode();
  }

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={() => setMenuVisible(true)}
          accessibilityLabel="Open more menu"
        >
          <Text style={styles.moreIcon}>•••</Text>
        </TouchableOpacity>

        <View style={styles.brand}>
          <Text style={styles.brandName}>🏆 JeetoBaz</Text>
          <Text style={styles.tagline}>{t('winBig')}</Text>
        </View>

        <TouchableOpacity
          style={styles.headerAction}
          onPress={() => router.push('/notifications' as never)}
          accessibilityLabel="Open notifications"
        >
          <Text style={styles.bellIcon}>🔔</Text>
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
                <Text style={[styles.menuTitle, { color: theme.text }]}>JeetoBaz</Text>
                <Text style={[styles.menuSubtitle, { color: theme.muted }]}>More options</Text>
              </View>
              <TouchableOpacity onPress={() => setMenuVisible(false)} accessibilityLabel="Close menu">
                <Text style={[styles.closeIcon, { color: theme.muted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <MenuItem icon="📤" label={t('shareJeetoBaz')} onPress={openShare} textColor={theme.text} />
            <MenuItem icon="🌐" label={t('language')} onPress={() => openRoute('/language')} textColor={theme.text} />
            <MenuItem
              icon={mode === 'dark' ? '☀️' : '🌙'}
              label={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
              onPress={toggleTheme}
              textColor={theme.text}
            />
            <MenuItem icon="🎧" label={t('helpCenter')} onPress={() => openRoute('/help')} textColor={theme.text} />
            <MenuItem icon="📋" label={t('terms')} onPress={() => openRoute('/terms')} textColor={theme.text} />
            <MenuItem icon="🔒" label={t('privacyPolicy')} onPress={() => openRoute('/privacy')} textColor={theme.text} />

            <View style={[styles.about, { borderTopColor: theme.border }]}>
              <Text style={[styles.aboutTitle, { color: theme.text }]}>ℹ️ About JeetoBaz</Text>
              <Text style={[styles.aboutText, { color: theme.muted }]}>Version 1.0.0 • Made in Pakistan 🇵🇰</Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

type MenuItemProps = {
  icon: string;
  label: string;
  onPress: () => void;
  textColor: string;
};

function MenuItem({ icon, label, onPress, textColor }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuItemIcon}>{icon}</Text>
      <Text style={[styles.menuItemText, { color: textColor }]}>{label}</Text>
      <Text style={styles.menuItemArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 88,
    backgroundColor: '#1DB954',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0,0,0,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: { color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  bellIcon: { fontSize: 21 },
  brand: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  brandName: { color: 'white', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  tagline: { color: 'white', fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 2 },
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
  closeIcon: { fontSize: 20, padding: 6 },
  menuItem: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemIcon: { width: 26, fontSize: 19, textAlign: 'center' },
  menuItemText: { flex: 1, fontSize: 14, fontWeight: '700' },
  menuItemArrow: { color: '#888', fontSize: 24 },
  about: { borderTopWidth: 1, marginTop: 8, paddingHorizontal: 10, paddingTop: 12, paddingBottom: 4 },
  aboutTitle: { fontSize: 13, fontWeight: '800' },
  aboutText: { fontSize: 11, marginTop: 3 },
});
