import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import '../firebase';

const supabase = createClient(
  'https://jqjrfnhqqfymwfsdkwmv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxanJmbmhxcWZ5bXdmc2Rrd212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTcxNDIsImV4cCI6MjA5NzU5MzE0Mn0.yuX-9QGr3w-gUQ9brELnohwgLNMDg7mhJTkRDw0L8w0'
);

export default function ProfileScreen() {
  const [step, setStep] = useState('check');
  const [name, setUserName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const recaptchaRef = useRef(null);
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPhone = localStorage.getItem('userPhone') || '';
      const savedName = localStorage.getItem('userName') || '';
      if (savedPhone) {
        setPhone(savedPhone);
        setUserName(savedName);
        setStep('profile');
        fetchStats(savedPhone);
      } else {
        setStep('phone');
      }
    }
  }, []);

  async function fetchStats(phone) {
    const { data } = await supabase.from('entries').select('*').eq('phone', phone);
    if (data) setTotalEntries(data.length);
  }

  async function sendOTP() {
    if (inputPhone.length < 10) { alert('Please enter a valid 10-digit phone number!'); return; }
    setLoading(true);
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
        });
      }
      const fullPhone = '+92' + inputPhone;
      const result = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setStep('otp');
      alert('OTP sent to ' + fullPhone);
    } catch (error) {
      console.error(error);
      alert('Error sending OTP: ' + error.message);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
    setLoading(false);
  }

  async function verifyOTP() {
    if (!otp || otp.length < 6) { alert('Please enter the 6-digit OTP!'); return; }
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      const fullPhone = '+92' + inputPhone;
      const { data: existing } = await supabase.from('users').select('*').eq('phone', fullPhone).single();
      if (existing) {
        localStorage.setItem('userPhone', fullPhone);
        localStorage.setItem('userName', existing.name);
        setPhone(fullPhone);
        setUserName(existing.name);
        setStep('profile');
        fetchStats(fullPhone);
        alert('Welcome back ' + existing.name + '!');
      } else {
        setStep('name');
      }
    } catch (error) {
      alert('Invalid OTP! Please try again.');
    }
    setLoading(false);
  }

  async function createAccount() {
    if (!name) { alert('Please enter your name!'); return; }
    setLoading(true);
    const fullPhone = '+92' + inputPhone;
    const { error } = await supabase.from('users').insert({
      name, phone: fullPhone, jazzcash_number: fullPhone,
    });
    if (!error) {
      localStorage.setItem('userPhone', fullPhone);
      localStorage.setItem('userName', name);
      setPhone(fullPhone);
      setStep('profile');
      alert('Welcome to JeetoBaz, ' + name + '!');
    }
    setLoading(false);
  }

  function logout() {
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userName');
    setStep('phone');
    setPhone('');
    setUserName('');
    setInputPhone('');
    setOtp('');
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
        <div id="recaptcha-container"></div>

        {step === 'phone' && (
          <>
            <Text style={styles.formTitle}>Login / Sign Up</Text>
            <Text style={styles.subtitle}>Enter your phone number to receive OTP</Text>
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
            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={sendOTP} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Sending OTP...' : 'Send OTP 📲'}</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'otp' && (
          <>
            <Text style={styles.formTitle}>Enter OTP</Text>
            <Text style={styles.subtitle}>6-digit code sent to +92{inputPhone}</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="------"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
            />
            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={verifyOTP} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify OTP ✅'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('phone')}>
              <Text style={styles.backText}>← Change number</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'name' && (
          <>
            <Text style={styles.formTitle}>What's your name?</Text>
            <Text style={styles.subtitle}>One last step!</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Shoaib Mithal"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setUserName}
            />
            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={createAccount} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Creating...' : '🚀 Enter JeetoBaz!'}</Text>
            </TouchableOpacity>
          </>
        )}
        <Text style={styles.terms}>By continuing you agree to our Terms & Conditions</Text>
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
  otpInput: { backgroundColor: '#1a1a1a', borderRadius: 10, borderWidth: 1, borderColor: '#FFD700', color: 'white', padding: 15, fontSize: 32, textAlign: 'center', letterSpacing: 12, marginBottom: 20 },
  input: { backgroundColor: '#1a1a1a', borderRadius: 10, borderWidth: 1, borderColor: '#333', color: 'white', padding: 15, fontSize: 16, marginBottom: 20 },
  button: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  buttonDisabled: { backgroundColor: '#555' },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  backText: { color: '#1DB954', textAlign: 'center', fontSize: 14 },
  terms: { color: '#666', fontSize: 12, textAlign: 'center', marginTop: 20 },
});
