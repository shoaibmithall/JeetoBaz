import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import { getStoredValue, removeStoredValues, setStoredValue } from '@/lib/storage';
import { isValidPakistaniMobile, normalizePakistaniMobile, normalizePersonName } from '@/lib/validation';
import { useAppTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const { t } = useLanguage();
  const { mode, theme, toggleThemeMode } = useAppTheme();
  const [step, setStep] = useState('check');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [ageAccepted, setAgeAccepted] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const [savedPhone, savedName] = await Promise.all([
        getStoredValue('userPhone'),
        getStoredValue('userName'),
      ]);
      if (!active) return;
      if (savedPhone) {
        setPhone(savedPhone);
        setName(savedName || '');
        setStep('profile');
        fetchStats(savedPhone);
      } else {
        setStep('phone');
      }
    }

    loadProfile();
    return () => { active = false; };
  }, []);

  async function fetchStats(phone: string) {
    const { data } = await supabase.from('entries').select('*').eq('phone', phone);
    if (data) setTotalEntries(data.length);
  }

  async function handleLogin() {
    const normalizedPhone = normalizePakistaniMobile(inputPhone);
    if (!isValidPakistaniMobile(normalizedPhone)) {
      alert('Please enter a valid Pakistani mobile number, e.g. 3001234567.');
      return;
    }
    setLoading(true);
    const fullPhone = '+92' + normalizedPhone;
    const { data: existing, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', fullPhone)
      .maybeSingle();

    if (error) {
      alert('Unable to check this number. Please try again.');
      setLoading(false);
      return;
    }

    if (existing) {
      const existingName = existing.name || '';
      await Promise.all([
        setStoredValue('userPhone', fullPhone),
        setStoredValue('userName', existingName),
      ]);
      setPhone(fullPhone);
      setName(existingName);
      setStep('profile');
      fetchStats(fullPhone);
    } else {
      setStep('name');
    }
    setLoading(false);
  }

  async function createAccount() {
    if (!ageAccepted) {
      alert('You must confirm that you are 18 years or older and accept the Terms.');
      return;
    }
    const normalizedName = normalizePersonName(name);
    if (normalizedName.length < 2) { alert('Please enter your full name.'); return; }
    setLoading(true);
    const fullPhone = '+92' + normalizePakistaniMobile(inputPhone);
    const { error } = await supabase.from('users').insert({
      name: normalizedName,
      phone: fullPhone,
      jazzcash_number: fullPhone,
    });
    if (!error) {
      await Promise.all([
        setStoredValue('userPhone', fullPhone),
        setStoredValue('userName', normalizedName),
      ]);
      setPhone(fullPhone);
      setName(normalizedName);
      setStep('profile');
      fetchStats(fullPhone);
    } else {
      alert('Error: ' + error.message);
    }
    setLoading(false);
  }

  async function logout() {
    await removeStoredValues(['userPhone', 'userName']);
    setStep('phone');
    setPhone('');
    setName('');
    setInputPhone('');
  }

  if (step === 'profile') return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.profileHeader}>
        <Text style={styles.avatar}>👤</Text>
        <Text style={styles.profileName}>{name}</Text>
        <Text style={styles.profilePhone}>{phone}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={styles.statNumber}>{totalEntries}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>{t('drawsEntered')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>{t('drawsWon')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={styles.statNumber}>🟢</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>{t('active')}</Text>
        </View>
      </View>

      <View style={[styles.menuBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/entries')}>
          <Text style={styles.menuIcon}>🎯</Text>
          <Text style={[styles.menuText, { color: theme.text }]}>{t('myEntries')}</Text>
          <Text style={[styles.menuArrow, { color: theme.subtle }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/')}>
          <Text style={styles.menuIcon}>🏆</Text>
          <Text style={[styles.menuText, { color: theme.text }]}>{t('activeDraws')}</Text>
          <Text style={[styles.menuArrow, { color: theme.subtle }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/explore')}>
          <Text style={styles.menuIcon}>🥇</Text>
          <Text style={[styles.menuText, { color: theme.text }]}>{t('pastWinners')}</Text>
          <Text style={[styles.menuArrow, { color: theme.subtle }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications' as never)}>
          <Text style={styles.menuIcon}>🔔</Text>
          <Text style={[styles.menuText, { color: theme.text }]}>Notifications</Text>
          <Text style={[styles.menuArrow, { color: theme.subtle }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/terms')}>
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={[styles.menuText, { color: theme.text }]}>{t('terms')}</Text>
          <Text style={[styles.menuArrow, { color: theme.subtle }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/privacy')}>
          <Text style={styles.menuIcon}>🔒</Text>
          <Text style={[styles.menuText, { color: theme.text }]}>{t('privacyAccountData')}</Text>
          <Text style={[styles.menuArrow, { color: theme.subtle }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/language' as never)}>
          <Text style={styles.menuIcon}>🌐</Text>
          <Text style={[styles.menuText, { color: theme.text }]}>{t('language')}</Text>
          <Text style={[styles.menuArrow, { color: theme.subtle }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={toggleThemeMode}>
          <Text style={styles.menuIcon}>{mode === 'dark' ? '☀️' : '🌙'}</Text>
          <Text style={[styles.menuText, { color: theme.text }]}>{mode === 'dark' ? 'Light Mode' : 'Dark Mode'}</Text>
          <Text style={[styles.menuArrow, { color: theme.subtle }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/help')}>
          <Text style={styles.menuIcon}>🎧</Text>
          <Text style={[styles.menuText, { color: theme.text }]}>{t('helpCenter')}</Text>
          <Text style={[styles.menuArrow, { color: theme.subtle }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.infoTitle, { color: theme.text }]}>ℹ️ About JeetoBaz</Text>
        <Text style={[styles.infoText, { color: theme.muted }]}>{t('appTagline')} Platform</Text>
        <Text style={[styles.infoText, { color: theme.muted }]}>Version 1.0.0</Text>
        <Text style={[styles.infoText, { color: theme.muted }]}>{t('madeInPakistan')}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={styles.logo}>🏆 JeetoBaz</Text>
        <Text style={styles.tagline}>{t('appTagline')}</Text>
      </View>
      <View style={styles.form}>
        {step === 'phone' && (
          <>
            <Text style={[styles.formTitle, { color: theme.text }]}>{t('loginSignUp')}</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>{t('enterPhone')}</Text>
            <View style={[styles.phoneRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.code, { color: theme.text, borderRightColor: theme.border }]}>🇵🇰 +92</Text>
              <TextInput
                style={[styles.phoneInput, { color: theme.text }]}
                placeholder="3001234567"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
                value={inputPhone}
                onChangeText={(value) => setInputPhone(normalizePakistaniMobile(value))}
                maxLength={10}
              />
            </View>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Please wait...' : `${t('continue')} →`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/terms')}>
              <Text style={styles.termsLink}>
                {t('youAgreeContinue')}{' '}
                <Text style={styles.termsLinkHighlight}>{t('terms')}</Text>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/privacy')}>
              <Text style={styles.privacyLink}>{t('readPrivacy')}</Text>
            </TouchableOpacity>
          </>
        )}
        {step === 'name' && (
          <>
            <Text style={[styles.formTitle, { color: theme.text }]}>{t('createAccount')}</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>{t('welcome')}! What's your name?</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="e.g. Shoaib Mithal"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
              maxLength={60}
            />
            <TouchableOpacity
              style={styles.consentRow}
              onPress={() => setAgeAccepted((accepted) => !accepted)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: ageAccepted }}
            >
              <View style={[styles.checkbox, ageAccepted && styles.checkboxChecked]}>
                {ageAccepted ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={[styles.consentText, { color: theme.text }]}>
                I confirm that I am 18 years or older.
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, (loading || !ageAccepted) && styles.buttonDisabled]}
              onPress={createAccount}
              disabled={loading || !ageAccepted}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating...' : '🚀 Join JeetoBaz!'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('phone')}>
              <Text style={styles.backText}>← {t('changeNumber')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/terms')}>
              <Text style={styles.termsLink}>
                {t('youAgreeJoin')}{' '}
                <Text style={styles.termsLinkHighlight}>{t('terms')}</Text>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/privacy')}>
              <Text style={styles.privacyLink}>{t('readPrivacy')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  profileHeader: { backgroundColor: '#1DB954', padding: 40, alignItems: 'center' },
  avatar: { fontSize: 60, marginBottom: 10 },
  profileName: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  profilePhone: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  statsRow: { flexDirection: 'row', padding: 15, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#FFD700' },
  statLabel: { fontSize: 11, color: '#aaa', marginTop: 4, textAlign: 'center' },
  menuBox: { backgroundColor: '#1a1a1a', margin: 15, borderRadius: 15, borderWidth: 1, borderColor: '#333' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuText: { color: 'white', fontSize: 16, flex: 1 },
  menuArrow: { color: '#666', fontSize: 20 },
  divider: { height: 1, backgroundColor: '#333', marginHorizontal: 15 },
  infoBox: { backgroundColor: '#1a1a1a', margin: 15, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#333' },
  infoTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  infoText: { color: '#aaa', fontSize: 14, marginBottom: 5 },
  logoutBtn: { margin: 15, padding: 18, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ff4444', marginBottom: 40 },
  logoutText: { color: '#ff4444', fontWeight: 'bold', fontSize: 16 },
  header: { backgroundColor: '#1DB954', padding: 50, alignItems: 'center' },
  logo: { fontSize: 36, fontWeight: 'bold', color: 'white' },
  tagline: { fontSize: 14, color: 'white', marginTop: 8 },
  form: { padding: 25, marginTop: 20 },
  formTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#aaa', marginBottom: 25, textAlign: 'center' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 10, borderWidth: 1, borderColor: '#333', marginBottom: 20 },
  code: { color: 'white', padding: 15, fontSize: 14, borderRightWidth: 1, borderRightColor: '#333' },
  phoneInput: { flex: 1, color: 'white', padding: 15, fontSize: 18 },
  input: { backgroundColor: '#1a1a1a', borderRadius: 10, borderWidth: 1, borderColor: '#333', color: 'white', padding: 15, fontSize: 16, marginBottom: 20 },
  consentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: '#666', borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxChecked: { backgroundColor: '#1DB954', borderColor: '#1DB954' },
  checkmark: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  consentText: { flex: 1, fontSize: 14, lineHeight: 20 },
  button: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  buttonDisabled: { backgroundColor: '#555' },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  backText: { color: '#1DB954', textAlign: 'center', fontSize: 14, marginBottom: 10 },
  termsLink: { color: '#666', fontSize: 12, textAlign: 'center', marginTop: 10 },
  termsLinkHighlight: { color: '#1DB954', fontWeight: 'bold' },
  privacyLink: { color: '#1DB954', fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginTop: 8 },
});
