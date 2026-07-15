import { Alert, Image, Linking, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useLanguage } from '@/lib/i18n';
import { useAppTheme } from '@/hooks/use-theme';
import { Clipboard as ClipboardIcon, ExternalLink, Share2, X } from 'lucide-react-native';

const APP_URL = 'https://jeetobaz.pk/';

type ShareUrlType = 'message' | 'facebook' | 'messenger' | 'telegram' | 'x' | 'threads';
type SharePlatform = {
  name: string;
  icon: string;
  urlType?: ShareUrlType;
};

const platforms: SharePlatform[] = [
  { name: 'WhatsApp', icon: 'https://cdn.simpleicons.org/whatsapp/ffffff', urlType: 'message' },
  { name: 'WhatsApp Business', icon: 'https://cdn.simpleicons.org/whatsapp/ffffff', urlType: 'message' },
  { name: 'Facebook', icon: 'https://cdn.simpleicons.org/facebook/ffffff', urlType: 'facebook' },
  { name: 'Messenger', icon: 'https://cdn.simpleicons.org/messenger/ffffff', urlType: 'messenger' },
  { name: 'Instagram', icon: 'https://cdn.simpleicons.org/instagram/ffffff' },
  { name: 'Threads', icon: 'https://cdn.simpleicons.org/threads/ffffff', urlType: 'threads' },
  { name: 'X', icon: 'https://cdn.simpleicons.org/x/ffffff', urlType: 'x' },
  { name: 'Telegram', icon: 'https://cdn.simpleicons.org/telegram/ffffff', urlType: 'telegram' },
  { name: 'TikTok', icon: 'https://cdn.simpleicons.org/tiktok/ffffff' },
  { name: 'Snapchat', icon: 'https://cdn.simpleicons.org/snapchat/000000' },
  { name: 'Discord', icon: 'https://cdn.simpleicons.org/discord/ffffff' },
];

type ShareModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function ShareModal({ visible, onClose }: ShareModalProps) {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const shareMessage = t('shareMessage');
  const fullMessage = shareMessage + APP_URL;

  if (!visible) return null;

  function getPlatformUrl(type?: ShareUrlType) {
    if (type === 'message') return `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
    if (type === 'facebook') return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(APP_URL)}`;
    if (type === 'messenger') return `https://www.facebook.com/dialog/send?link=${encodeURIComponent(APP_URL)}&app_id=291494419107518`;
    if (type === 'telegram') return `https://t.me/share/url?url=${encodeURIComponent(APP_URL)}&text=${encodeURIComponent(shareMessage)}`;
    if (type === 'x') return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(APP_URL)}`;
    if (type === 'threads') return `https://www.threads.net/intent/post?text=${encodeURIComponent(fullMessage)}`;
    return null;
  }

  async function copyText(text: string, successMessage: string) {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert(t('copied'), successMessage);
    } catch {
      Alert.alert(t('unableToCopy'), 'Please try again.');
    }
  }

  async function handleShare(platform: SharePlatform) {
    try {
      const platformUrl = getPlatformUrl(platform.urlType);
      if (platformUrl) {
        await Linking.openURL(platformUrl);
        return;
      }

      if (Platform.OS === 'web') {
        await copyText(fullMessage, `Message copied. Paste it in ${platform.name}.`);
        return;
      }

      await Share.share({
        title: 'Share JeetoBaz',
        message: fullMessage,
      });
    } catch {
      Alert.alert(t('unableToShare'), 'Please try again.');
    }
  }

  async function copyLink() {
    await copyText(APP_URL, t('linkCopied'));
  }

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitleRow}>
            <View style={[styles.headerIcon, { backgroundColor: theme.primarySoft }]}>
              <Share2 color={theme.gold} size={20} />
            </View>
            <View>
              <Text style={[styles.sheetTitle, { color: theme.gold }]}>{t('shareJeetoBaz')}</Text>
              <Text style={[styles.sheetSubtitle, { color: theme.muted }]}>Invite friends and family to JeetoBaz.</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X color={theme.subtle} size={22} />
          </TouchableOpacity>
        </View>

        <View style={[styles.urlRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Text style={[styles.urlText, { color: theme.muted }]} numberOfLines={1}>{APP_URL}</Text>
          <TouchableOpacity style={[styles.copyBtn, { backgroundColor: theme.primarySoft }]} onPress={copyLink}>
            <ClipboardIcon color={theme.gold} size={14} />
            <Text style={[styles.copyBtnText, { color: theme.gold }]}>{t('copy')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.platformsList}>
          {platforms.map((platform) => (
            <TouchableOpacity
              key={platform.name}
              style={[styles.platformRow, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => handleShare(platform)}
              activeOpacity={0.7}
            >
              <View style={styles.platformLeft}>
                <View style={[styles.platformIconContainer, { backgroundColor: theme.primarySoft }]}>
                  <Image source={{ uri: platform.icon }} style={styles.platformIcon} resizeMode="contain" />
                </View>
                <Text style={[styles.platformName, { color: theme.text }]}>{platform.name}</Text>
              </View>
              <ExternalLink color={theme.subtle} size={18} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.copyMsgBtn, { backgroundColor: theme.primarySoft, borderColor: theme.border }]}
          onPress={() => copyText(fullMessage, 'Full JeetoBaz message copied.')}
        >
          <ClipboardIcon color={theme.gold} size={18} />
          <Text style={[styles.copyMsgBtnText, { color: theme.gold }]}>{t('copyFullMessage')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ShareScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  return (
    <View style={styles.screen}>
      <ShareModal visible onClose={() => router.push('/')} />
      <TouchableOpacity onPress={() => router.push('/')} style={styles.backHomeButton}>
        <Text style={styles.backHomeText}>← {t('backToHome')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#020d09',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backHomeButton: {
    backgroundColor: '#04140e',
    padding: 15,
    borderRadius: 10,
  },
  backHomeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    zIndex: 10000,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '85%',
  },
  handle: { width: 40, height: 4, backgroundColor: '#174a35', borderRadius: 2, alignSelf: 'center', marginBottom: 15 },

  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  sheetSubtitle: { fontSize: 13, marginTop: 2 },
  closeBtn: { padding: 4 },

  urlRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16, gap: 10 },
  urlText: { flex: 1, fontSize: 13, fontFamily: 'monospace' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, gap: 5 },
  copyBtnText: { fontSize: 12, fontWeight: '700' },

  platformsList: { gap: 8, marginBottom: 16 },
  platformRow: { minHeight: 56, borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  platformLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  platformIconContainer: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  platformIcon: { width: 22, height: 22 },
  platformName: { fontSize: 15, fontWeight: '600' },

  copyMsgBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, borderWidth: 1, gap: 8 },
  copyMsgBtnText: { fontSize: 15, fontWeight: '700' },
});
