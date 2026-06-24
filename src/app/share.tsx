import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const APP_URL = 'https://jeetobaz.netlify.app';
const APP_MSG = 'JeetoBaz pe sirf Rs.1 mein bade prizes jeeto! 🏆 Pakistan ka No.1 Lucky Draw Platform. Abhi join karo: ';

const platforms = [
  { name: 'WhatsApp', color: '#25D366', textColor: 'white', icon: 'https://cdn.simpleicons.org/whatsapp/ffffff', url: `https://wa.me/?text=${encodeURIComponent(APP_MSG + APP_URL)}` },
  { name: 'Facebook', color: '#1877F2', textColor: 'white', icon: 'https://cdn.simpleicons.org/facebook/ffffff', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(APP_URL)}` },
  { name: 'Messenger', color: '#0099FF', textColor: 'white', icon: 'https://cdn.simpleicons.org/messenger/ffffff', url: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(APP_URL)}&app_id=291494419107518` },
  { name: 'Telegram', color: '#229ED9', textColor: 'white', icon: 'https://cdn.simpleicons.org/telegram/ffffff', url: `https://t.me/share/url?url=${encodeURIComponent(APP_URL)}&text=${encodeURIComponent(APP_MSG)}` },
  { name: 'X (Twitter)', color: '#000000', textColor: 'white', icon: 'https://cdn.simpleicons.org/x/ffffff', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(APP_MSG)}&url=${encodeURIComponent(APP_URL)}` },
  { name: 'Instagram', color: '#E1306C', textColor: 'white', icon: 'https://cdn.simpleicons.org/instagram/ffffff', url: null },
  { name: 'Snapchat', color: '#FFFC00', textColor: '#000', icon: 'https://cdn.simpleicons.org/snapchat/000000', url: null },
  { name: 'TikTok', color: '#010101', textColor: 'white', icon: 'https://cdn.simpleicons.org/tiktok/ffffff', url: null },
  { name: 'Threads', color: '#000000', textColor: 'white', icon: 'https://cdn.simpleicons.org/threads/ffffff', url: `https://www.threads.net/intent/post?text=${encodeURIComponent(APP_MSG + APP_URL)}` },
  { name: 'Discord', color: '#5865F2', textColor: 'white', icon: 'https://cdn.simpleicons.org/discord/ffffff', url: null },
  { name: 'WA Business', color: '#128C7E', textColor: 'white', icon: 'https://cdn.simpleicons.org/whatsapp/ffffff', url: `https://wa.me/?text=${encodeURIComponent(APP_MSG + APP_URL)}` },
];

export function ShareModal({ visible, onClose }) {
  if (!visible) return null;

  function handleShare(platform) {
    if (platform.url) {
      if (typeof window !== 'undefined') window.open(platform.url, '_blank');
    } else {
      if (typeof window !== 'undefined') {
        navigator.clipboard.writeText(APP_MSG + APP_URL);
        alert(`Link copied! Paste it in ${platform.name} 📋`);
      }
    }
  }

  function copyLink() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(APP_URL);
      alert('Link copied! ✅');
    }
  }

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>📤 Share JeetoBaz</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.linkRow}>
          <Text style={styles.linkText} numberOfLines={1}>{APP_URL}</Text>
          <TouchableOpacity style={styles.copyBtn} onPress={copyLink}>
            <Text style={styles.copyBtnText}>Copy</Text>
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

        <TouchableOpacity style={styles.copyMsgBtn} onPress={() => {
          if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(APP_MSG + APP_URL);
            alert('Message copied! ✅');
          }
        }}>
          <Text style={styles.copyMsgBtnText}>📋 Copy Full Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ShareScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity onPress={() => router.push('/')} style={{ backgroundColor: '#1DB954', padding: 15, borderRadius: 10 }}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>← Go Home</Text>
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
