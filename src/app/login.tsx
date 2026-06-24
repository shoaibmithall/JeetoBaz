import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getStoredValue, removeStoredValues, setStoredValue } from '@/lib/storage';

export default function ProfileScreen() {
  const [step, setStep] = useState('check');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [loading, setLoading] = useState(false);
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
    if (inputPhone.length < 10) {
      alert('Please enter a valid 10-digit phone number!');
      return;
    }
    setLoading(true);
    const fullPhone = '+92' + inputPhone;
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('phone', fullPhone)
      .single();

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
    if (!name) { alert('Please enter your name!'); return; }
    setLoading(true);
    const fullPhone = '+92' + inputPhone;
    const { error } = await supabase.from('users').insert({
      name,
      phone: fullPhone,
      jazzcash_number: fullPhone,
    });
    if (!error) {
      await Promise.all([
        setStoredValue('userPhone', fullPhone),
        setStoredValue('userName', name),
      ]);
      setPhone(fullPhone);
      setName(name);
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
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <Text style={styles.avatar}>👤</Text>
        <Text style={styles.profileName}>{name}</Text>
        <Text style={styles.profilePhone}>{phone}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalEntries}</Text>
          <Text style={styles.statLabel}>Draws Entered</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Draws Won</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>🟢</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      <View style={styles.menuBox}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/entries')}>
          <Text style={styles.menuIcon}>🎯</Text>
          <Text style={styles.menuText}>My Entries</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/')}>
          <Text style={styles.menuIcon}>🏆</Text>
          <Text style={styles.menuText}>Active Draws</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/explore')}>
          <Text style={styles.menuIcon}>🥇</Text>
          <Text style={styles.menuText}>Past Winners</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/terms')}>
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuText}>Terms & Conditions</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ About JeetoBaz</Text>
        <Text style={styles.infoText}>Pakistan's No.1 Lucky Draw Platform</Text>
        <Text style={styles.infoText}>Version 1.0.0</Text>
        <Text style={styles.infoText}>Made with ❤️ in Pakistan</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🏆 JeetoBaz</Text>
        <Text style={styles.tagline}>Pakistan's No.1 Lucky Draw</Text>
      </View>
      <View style={styles.form}>
        {step === 'phone' && (
          <>
            <Text style={styles.formTitle}>Login / Sign Up</Text>
            <Text style={styles.subtitle}>Enter your phone number to continue</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.code}>🇵🇰 +92</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="3001234567"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
                value={inputPhone}
                onChangeText={setInputPhone}
                maxLength={10}
              />
            </View>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Please wait...' : 'Continue →'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/terms')}>
              <Text style={styles.termsLink}>
                By continuing you agree to our{' '}
                <Text style={styles.termsLinkHighlight}>Terms & Conditions</Text>
              </Text>
            </TouchableOpacity>
          </>
        )}
        {step === 'name' && (
          <>
            <Text style={styles.formTitle}>Create Account</Text>
            <Text style={styles.subtitle}>Welcome! What's your name?</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Shoaib Mithal"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={createAccount}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating...' : '🚀 Join JeetoBaz!'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('phone')}>
              <Text style={styles.backText}>← Change number</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/terms')}>
              <Text style={styles.termsLink}>
                By joining you agree to our{' '}
                <Text style={styles.termsLinkHighlight}>Terms & Conditions</Text>
              </Text>
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
  button: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  buttonDisabled: { backgroundColor: '#555' },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  backText: { color: '#1DB954', textAlign: 'center', fontSize: 14, marginBottom: 10 },
  termsLink: { color: '#666', fontSize: 12, textAlign: 'center', marginTop: 10 },
  termsLinkHighlight: { color: '#1DB954', fontWeight: 'bold' },
});
