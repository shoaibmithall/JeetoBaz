import { Alert, Image, Linking, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useLanguage } from '@/lib/i18n';

const APP_URL = 'https://shoaibmithall.github.io/JeetoBaz/';

type ShareUrlType = 'message' | 'facebook' | 'messenger' | 'telegram' | 'x' | 'threads';
type SharePlatform = {
  name: string;
  color: string;
  textColor: string;
  icon: string;
  urlType?: ShareUrlType;
};

const platforms: SharePlatform[] = [
  { name: 'WhatsApp', color: '#25D366', textColor: 'white', icon: 'https://cdn.simpleicons.org/whatsapp/ffffff', urlType: 'message' },
  { name: 'Facebook', color: '#1877F2', textColor: 'white', icon: 'https://cdn.simpleicons.org/facebook/ffffff', urlType: 'facebook' },
  { name: 'Messenger', color: '#0099FF', textColor: 'white', icon: 'https://cdn.simpleicons.org/messenger/ffffff', urlType: 'messenger' },
  { name: 'Telegram', color: '#229ED9', textColor: 'white', icon: 'https://cdn.simpleicons.org/telegram/ffffff', urlType: 'telegram' },
  { name: 'X (Twitter)', color: '#000000', textColor: 'white', icon: 'https://cdn.simpleicons.org/x/ffffff', urlType: 'x' },
  { name: 'Instagram', color: '#E1306C', textColor: 'white', icon: 'https://cdn.simpleicons.org/instagram/ffffff' },
  { name: 'Snapchat', color: '#FFFC00', textColor: '#000', icon: 'https://cdn.simpleicons.org/snapchat/000000' },
  { name: 'TikTok', color: '#010101', textColor: 'white', icon: 'https://cdn.simpleicons.org/tiktok/ffffff' },
  { name: 'Threads', color: '#000000', textColor: 'white', icon: 'https://cdn.simpleicons.org/threads/ffffff', urlType: 'threads' },
  { name: 'Discord', color: '#5865F2', textColor: 'white', icon: 'https://cdn.simpleicons.org/discord/ffffff' },
  { name: 'WA Business', color: '#128C7E', textColor: 'white', icon: 'https://cdn.simpleicons.org/whatsapp/ffffff', urlType: 'message' },
];

type ShareModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function ShareModal({ visible, onClose }: ShareModalProps) {
  const { t } = useLanguage();
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
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>📤 {t('shareJeetoBaz')}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.linkRow}>
          <Text style={styles.linkText} numberOfLines={1}>{APP_URL}</Text>
          <TouchableOpacity style={styles.copyBtn} onPress={copyLink}>
            <Text style={styles.copyBtnText}>{t('copy')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {platforms.map((platform) => (
            <TouchableOpacity
              key={platform.name}
              style={[styles.platformBtn, { backgroundColor: platform.color }]}
              onPress={() => handleShare(platform)}
            >
              <Image source={{ uri: platform.icon }} style={styles.platformIcon} resizeMode="contain" />
              <Text style={[styles.platformName, { color: platform.textColor }]}>{platform.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.copyMsgBtn}
          onPress={() => copyText(fullMessage, 'Full JeetoBaz message copied.')}
        >
          <Text style={styles.copyMsgBtnText}>📋 {t('copyFullMessage')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ShareScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity onPress={() => router.push('/')} style={{ backgroundColor: '#1DB954', padding: 15, borderRadius: 10 }}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>← {t('backToHome')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    zIndex: 10000,
  },
  handle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  closeBtn: { color: '#aaa', fontSize: 20, fontWeight: 'bold' },
  linkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0a0a', borderRadius: 10, padding: 10, marginBottom: 15, gap: 10 },
  linkText: { flex: 1, color: '#1DB954', fontSize: 12, fontFamily: 'monospace' },
  copyBtn: { backgroundColor: '#1DB954', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  copyBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
  platformBtn: { width: '30%', padding: 12, borderRadius: 12, alignItems: 'center' },
  platformIcon: { width: 30, height: 30, marginBottom: 6 },
  platformName: { fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  copyMsgBtn: { backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center' },
  copyMsgBtnText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
});
