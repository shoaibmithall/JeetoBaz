import { Alert, Linking, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useLanguage } from '@/lib/i18n';
import { useAppTheme } from '@/hooks/use-theme';
import { Clipboard as ClipboardIcon, ExternalLink, Share2, X } from 'lucide-react-native';
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  SnapchatIcon,
  XIcon,
  TelegramIcon,
} from '@/components/social-icons';

const APP_URL = 'https://jeetobaz.pk/';

type ShareUrlType = 'message' | 'facebook' | 'messenger' | 'telegram' | 'x' | 'threads';
type SharePlatform = {
  name: string;
  icon: React.ReactNode;
  urlType?: ShareUrlType;
};

function WhatsAppIcon({ size = 24 }: { size?: number }) {
  const { Svg, Path, Circle } = require('react-native-svg');
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill="#25D366" />
      <Path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
        fill="white"
      />
      <Path
        d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.69 0-3.265-.46-4.61-1.262l-.33-.198-2.87.852.852-2.87-.198-.33A7.963 7.963 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"
        fill="#25D366"
      />
    </Svg>
  );
}

function MessengerIcon({ size = 24 }: { size?: number }) {
  const { Svg, Path, Circle } = require('react-native-svg');
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill="#0099FF" />
      <Path
        d="M12 2C6.477 2 2 6.145 2 11.243c0 2.837 1.396 5.374 3.584 7.075V22l3.256-1.789c.899.249 1.85.384 2.86.384 5.523 0 10-4.145 10-9.243C22 6.145 17.523 2 12 2zm1.076 12.538l-2.55-2.728-4.98 2.728 5.464-5.818 2.604 2.728 4.926-2.728-5.464 5.818z"
        fill="white"
      />
    </Svg>
  );
}

function WABusinessIcon({ size = 24 }: { size?: number }) {
  const { Svg, Path, Circle } = require('react-native-svg');
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill="#128C7E" />
      <Path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
        fill="white"
      />
    </Svg>
  );
}

function ThreadsIcon({ size = 24 }: { size?: number }) {
  const { Svg, Path, Circle } = require('react-native-svg');
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill="#000000" />
      <Path
        d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.34-.776-.963-1.394-1.803-1.79-.128 2.834-1.19 5.107-3.18 6.817-1.65 1.417-3.678 2.128-6.013 2.128h-.008c-1.838-.015-3.355-.549-4.505-1.58-1.29-1.157-1.946-2.803-1.954-4.87.01-2.862.978-5.074 2.872-6.56C6.588 6.47 8.828 5.735 11.57 5.71h.013c1.852.012 3.39.544 4.574 1.588.963.853 1.633 2.042 1.977 3.497l-2.027.57c-.432-1.787-1.47-3.022-3.055-3.666-1.09-.44-2.354-.678-3.738-.688-2.427.019-4.271.724-5.48 2.082-1.062 1.19-1.604 2.82-1.612 4.833.008 2.013.55 3.643 1.612 4.833 1.21 1.358 3.053 2.063 5.48 2.082h.006c1.523-.01 2.868-.357 3.983-1.03 1.478-.9 2.478-2.36 2.89-4.23.264-1.19.216-2.272-.139-3.14a3.813 3.813 0 00-1.35-1.59c.375-.577.614-1.248.695-1.987.187-1.69-.262-3.235-1.333-4.507C15.465 1.89 14.01 1.275 12.18 1.26h-.007C9.406 1.278 7.104 2.08 5.358 3.658 3.556 5.28 2.637 7.602 2.61 10.49v.02c.027 2.888.946 5.21 2.748 6.832 1.746 1.578 4.048 2.38 6.822 2.398h.007c2.253-.015 4.247-.668 5.89-1.93 1.897-1.455 2.993-3.537 3.113-6.01-.448.376-1.02.668-1.693.853-1.367.376-2.877.323-4.078-.145a5.497 5.497 0 01-1.155-.626c.33-1.558.18-3.165-.438-4.59-.826-1.912-2.627-3.395-5.158-4.248-1.466-.49-3.047-.733-4.682-.72h-.04c-2.678.02-4.938.876-6.68 2.538C1.764 5.536.865 7.95.84 10.925v.02c.025 2.975.924 5.39 2.666 7.028C5.248 19.647 7.508 20.503 10.186 20.52h.006c2.428-.018 4.494-.775 6.133-2.245 2.187-1.962 2.313-4.613 1.84-6.23-.236-.81-.69-1.464-1.332-1.93.453-.453.822-1.014 1.077-1.66.43-1.09.466-2.47-.08-3.79a5.095 5.095 0 00-1.576-2.028c-.072 1.07-.445 2.09-1.094 2.97-.855 1.153-2.05 1.882-3.46 2.06-.93.118-1.823-.01-2.627-.374-.755-.34-1.355-.89-1.765-1.614.318-1.586.196-3.203-.352-4.612-.74-1.916-2.52-3.364-5.02-4.21C3.57 1.94 5.133 1.693 6.743 1.68h.04c2.584-.014 4.78.64 6.543 1.95 2.175 1.616 3.378 3.892 3.523 6.648-.447-.364-1.01-.642-1.666-.822-1.374-.377-2.894-.315-4.11.165a5.52 5.52 0 01-1.142.617c.323-1.534.18-3.12-.422-4.505-.8-1.84-2.556-3.272-4.972-4.085C5.958 1.637 4.413 1.39 2.823 1.4h-.04C.158 1.418-2.052 2.255-3.763 3.875"
        fill="white"
      />
    </Svg>
  );
}

function DiscordIcon({ size = 24 }: { size?: number }) {
  const { Svg, Path, Circle } = require('react-native-svg');
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill="#5865F2" />
      <Path
        d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 00-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 00-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.02.04-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.22.17.33.26.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.68 1.19 1.07 1.74.03.01.06.02.09.01 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12z"
        fill="white"
      />
    </Svg>
  );
}

const platforms: SharePlatform[] = [
  { name: 'WhatsApp', icon: <WhatsAppIcon size={28} />, urlType: 'message' },
  { name: 'WhatsApp Business', icon: <WABusinessIcon size={28} />, urlType: 'message' },
  { name: 'Facebook', icon: <FacebookIcon size={28} />, urlType: 'facebook' },
  { name: 'Messenger', icon: <MessengerIcon size={28} />, urlType: 'messenger' },
  { name: 'Instagram', icon: <InstagramIcon size={28} /> },
  { name: 'Threads', icon: <ThreadsIcon size={28} />, urlType: 'threads' },
  { name: 'X', icon: <XIcon size={28} />, urlType: 'x' },
  { name: 'Telegram', icon: <TelegramIcon size={28} />, urlType: 'telegram' },
  { name: 'TikTok', icon: <TikTokIcon size={28} /> },
  { name: 'Snapchat', icon: <SnapchatIcon size={28} /> },
  { name: 'Discord', icon: <DiscordIcon size={28} /> },
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
                <View style={styles.platformIconContainer}>
                  {platform.icon}
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
  platformIconContainer: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  platformName: { fontSize: 15, fontWeight: '600' },

  copyMsgBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, borderWidth: 1, gap: 8 },
  copyMsgBtnText: { fontSize: 15, fontWeight: '700' },
});
