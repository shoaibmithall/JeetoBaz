import { Image, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { signInWithEmail, signOut } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { getStoredValue, removeStoredValues, setStoredValue } from '@/lib/storage';
import { validateEmail } from '@/lib/auth-validation';
import { useAppTheme } from '@/hooks/use-theme';
import {
  Check, ChevronRight, Circle, CircleHelp, CircleUserRound, ClipboardList, Eye, EyeOff, Info,
  HeartHandshake, LockKeyhole, LogOut, Mail, Medal, Rocket, Shield, Target, Trophy,
  UserPlus, UsersRound,
} from 'lucide-react-native';

const PROFILE_AVATAR_BUCKET = 'profile-avatars';
const USER_AVATAR_STORAGE_KEY = 'userAvatarUrl';

function dataUrlToArrayBuffer(dataUrl: string) {
  const base64 = dataUrl.split(',')[1];
  if (!base64) throw new Error('Profile photo could not be prepared.');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function sanitizePhoneForPath(value: string) {
  return value.replace(/\D/g, '') || 'profile';
}

export default function ProfileScreen() {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { user, isEmailVerified } = useAuth();
  const [step, setStep] = useState<'check' | 'login' | 'profile'>('check');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [totalEntries, setTotalEntries] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (user && isEmailVerified) {
        const { data: profile } = await supabase
          .from('users')
          .select('name, phone, avatar_url')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (profile && active) {
          setPhone(profile.phone || '');
          setName(profile.name || '');
          setAvatarUrl(profile.avatar_url || '');
          setStep('profile');
          if (profile.phone) fetchStats(profile.phone);
        } else if (active) {
          setStep('profile');
          setEmail(user.email || '');
          setName(user.user_metadata?.name || '');
        }
        return;
      }

      const savedPhone = await getStoredValue('userPhone');
      if (!active) return;

      if (savedPhone) {
        const savedName = await getStoredValue('userName');
        const savedAvatar = await getStoredValue(USER_AVATAR_STORAGE_KEY);
        setPhone(savedPhone);
        setName(savedName || '');
        if (savedAvatar) setAvatarUrl(savedAvatar);
        setStep('profile');
        fetchStats(savedPhone);
        fetchProfileAvatar(savedPhone);
      } else {
        setStep('login');
      }
    }

    loadProfile();
    return () => { active = false; };
  }, [user, isEmailVerified]);

  async function fetchStats(phone: string) {
    const { data } = await supabase.from('entries').select('*').eq('phone', phone);
    if (data) setTotalEntries(data.length);
  }

  async function fetchProfileAvatar(phone: string) {
    const { data } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('phone', phone)
      .maybeSingle();
    if (data?.avatar_url) {
      setAvatarUrl(data.avatar_url);
      await setStoredValue(USER_AVATAR_STORAGE_KEY, data.avatar_url);
    }
  }

  async function handleEmailLogin() {
    const validationError = validateEmail(email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }
    if (!password) {
      alert('Please enter your password.');
      return;
    }

    setLoading(true);
    setEmailError('');
    const { error } = await signInWithEmail(email.trim().toLowerCase(), password);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        alert('Invalid email or password. Please try again.');
      } else {
        alert('Login failed: ' + error.message);
      }
    }
    setLoading(false);
  }

  async function logout() {
    if (user) {
      await signOut();
    }
    await removeStoredValues(['userPhone', 'userName', USER_AVATAR_STORAGE_KEY]);
    setStep('login');
    setPhone('');
    setName('');
    setEmail('');
    setPassword('');
    setAvatarUrl('');
  }

  async function uploadProfilePhoto() {
    const identifier = phone || user?.id;
    if (!identifier || avatarUploading) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Please allow photo access to upload your profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.65,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;

    setAvatarUploading(true);
    try {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const extension = mimeType === 'image/png'
        ? 'png'
        : mimeType === 'image/webp'
          ? 'webp'
          : 'jpg';
      const filePath = `${sanitizePhoneForPath(identifier)}/avatar-${Date.now()}.${extension}`;
      const fileData = asset.base64
        ? dataUrlToArrayBuffer(`data:${mimeType};base64,${asset.base64}`)
        : await fetch(asset.uri).then((response) => response.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from(PROFILE_AVATAR_BUCKET)
        .upload(filePath, fileData, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(PROFILE_AVATAR_BUCKET)
        .getPublicUrl(filePath);
      const nextAvatarUrl = publicUrlData.publicUrl;

      if (phone) {
        const { error: updateError } = await supabase
          .rpc('update_profile_avatar', {
            requested_phone: phone,
            requested_avatar_url: nextAvatarUrl,
          });
        if (updateError) throw updateError;
      }

      setAvatarUrl(nextAvatarUrl);
      await setStoredValue(USER_AVATAR_STORAGE_KEY, nextAvatarUrl);
      alert('Profile photo updated.');
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Profile photo upload failed.';
      alert(message);
    } finally {
      setAvatarUploading(false);
    }
  }

  function openAboutSection(section: 'social' | 'works' | 'support') {
    router.push({ pathname: '/about', params: { section } });
  }

  if (step === 'profile') return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.profileHeader}>
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={uploadProfilePhoto}
          disabled={avatarUploading}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <CircleUserRound color="white" size={60} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.changePhotoButton}
          onPress={uploadProfilePhoto}
          disabled={avatarUploading}
          accessibilityRole="button"
        >
          <Text style={styles.changePhotoText}>
            {avatarUploading ? 'Uploading...' : 'Change Photo'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.profileName}>{name}</Text>
        {user ? (
          <Text style={styles.profilePhone}>{user.email}</Text>
        ) : (
          <Text style={styles.profilePhone}>{phone}</Text>
        )}
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
          <Circle color="#18a663" fill="#18a663" size={22} />
          <Text style={[styles.statLabel, { color: theme.muted }]}>{t('active')}</Text>
        </View>
      </View>

      <View style={[styles.menuBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/entries')}>
          <Target color={theme.gold} size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>{t('myEntries')}</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/')}>
          <Trophy color={theme.gold} size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>{t('activeDraws')}</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/explore')}>
          <Medal color={theme.gold} size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>{t('pastWinners')}</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/referral' as never)}>
          <UserPlus color={theme.gold} size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>Refer & Earn</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/terms')}>
          <ClipboardList color={theme.gold} size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>{t('terms')}</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/privacy')}>
          <LockKeyhole color={theme.gold} size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>{t('privacyAccountData')}</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/faq' as never)}>
          <CircleHelp color={theme.gold} size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>Frequently Asked Questions</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => openAboutSection('social')}>
          <UsersRound color={theme.gold} size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>Follow JeetoBaz</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => openAboutSection('works')}>
          <Rocket color={theme.gold} size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>How JeetoBaz Works</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => openAboutSection('support')}>
          <HeartHandshake color={theme.gold} size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>Support & Contact</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => router.push('/about' as never)}
        accessibilityRole="button"
        accessibilityLabel="Open About JeetoBaz"
      >
        <View style={styles.infoTitleRow}>
          <Info color={theme.gold} size={18} />
          <Text style={[styles.infoTitle, { color: theme.gold }]}>About JeetoBaz</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </View>
        <Text style={[styles.infoText, { color: theme.muted }]}>{t('appTagline')} Platform</Text>
        <Text style={[styles.infoText, { color: theme.muted }]}>Version 1.0.0</Text>
        <Text style={[styles.infoText, { color: theme.muted }]}>{t('madeInPakistan')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <LogOut color="#ff4444" size={19} /><Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Trophy color="#FFD700" size={40} />
            <Text style={styles.logo}>JeetoBaz</Text>
          </View>
          <Text style={styles.tagline}>Pakistan's Transparent Prize Campaign Platform</Text>
        </View>

        <View style={styles.loginCard}>
          <View style={styles.secureBadge}>
            <Shield color="#18a663" size={16} />
            <Text style={styles.secureBadgeText}>Secure Account Access</Text>
          </View>

          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSubtitle}>Sign in to your account</Text>

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: emailError ? '#ff4444' : theme.border }]}>
            <Mail color={theme.muted} size={18} />
            <TextInput
              style={[styles.inputField, { color: theme.text }]}
              placeholder="Email address"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(v) => { setEmail(v); setEmailError(''); }}
            />
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <LockKeyhole color={theme.muted} size={18} />
            <TextInput
              style={[styles.inputField, { color: theme.text }]}
              placeholder="Password"
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff color={theme.muted} size={18} /> : <Eye color={theme.muted} size={18} />}
            </TouchableOpacity>
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe ? <Check color="white" size={12} strokeWidth={3} /> : null}
              </View>
              <Text style={[styles.rememberText, { color: theme.muted }]}>Keep me signed in</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/forgot-password' as never)}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleEmailLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Sign In</Text>
                <Text style={styles.primaryButtonText}>→</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.muted }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          <TouchableOpacity style={styles.googleButton} disabled>
            <Text style={styles.googleButtonText}>G</Text>
            <Text style={styles.googleButtonLabel}>Continue with Google</Text>
            <Text style={styles.comingSoonBadge}>Soon</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/signup' as never)}>
            <Text style={styles.switchText}>
              New to JeetoBaz?{' '}
              <Text style={styles.switchHighlight}>Create Account</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.trustStrip}>
          <View style={styles.trustItem}>
            <Shield color="#18a663" size={14} />
            <Text style={styles.trustText}>Secure Login</Text>
          </View>
          <View style={styles.trustItem}>
            <Check color="#18a663" size={14} />
            <Text style={styles.trustText}>Verified Platform</Text>
          </View>
          <View style={styles.trustItem}>
            <LockKeyhole color="#18a663" size={14} />
            <Text style={styles.trustText}>Protected Information</Text>
          </View>
        </View>

        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => router.push('/terms')}>
            <Text style={styles.footerLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>•</Text>
          <TouchableOpacity onPress={() => router.push('/privacy')}>
            <Text style={styles.footerLink}>Privacy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  scrollContent: { paddingBottom: 40 },
  header: { backgroundColor: '#04140e', borderBottomColor: '#FFD700', borderBottomWidth: 2, paddingVertical: 50, paddingHorizontal: 20, alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { fontSize: 40, fontWeight: 'bold', color: 'white' },
  tagline: { fontSize: 13, color: '#9aac9f', marginTop: 10, textAlign: 'center', lineHeight: 18 },

  loginCard: { backgroundColor: '#071b13', marginHorizontal: 20, marginTop: 24, borderRadius: 16, borderWidth: 1, borderColor: '#174a35', padding: 24 },

  secureBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20, paddingVertical: 8, backgroundColor: '#0a2419', borderRadius: 8 },
  secureBadgeText: { color: '#18a663', fontSize: 12, fontWeight: '600' },

  welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 4 },
  welcomeSubtitle: { fontSize: 14, color: '#9aac9f', textAlign: 'center', marginBottom: 24 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, marginBottom: 12, paddingHorizontal: 14, gap: 10 },
  inputField: { flex: 1, padding: 16, fontSize: 16 },
  errorText: { color: '#ff4444', fontSize: 12, marginBottom: 10, marginLeft: 4 },

  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 18, height: 18, borderWidth: 1.5, borderColor: '#5e7468', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#18a663', borderColor: '#18a663' },
  rememberText: { fontSize: 13 },
  forgotText: { color: '#FFD700', fontSize: 13, fontWeight: '600' },

  primaryButton: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 16 },
  buttonDisabled: { backgroundColor: '#555' },
  primaryButtonText: { fontSize: 17, fontWeight: 'bold', color: '#000' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },

  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#174a35', gap: 10, marginBottom: 16, opacity: 0.6 },
  googleButtonText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  googleButtonLabel: { fontSize: 15, color: 'white', flex: 1 },
  comingSoonBadge: { fontSize: 11, color: '#FFD700', backgroundColor: '#2a2105', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontWeight: '600' },

  switchText: { color: '#9aac9f', fontSize: 14, textAlign: 'center' },
  switchHighlight: { color: '#18a663', fontWeight: 'bold' },

  trustStrip: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 24, paddingHorizontal: 20, flexWrap: 'wrap' },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { color: '#5e7468', fontSize: 11, fontWeight: '500' },

  footerLinks: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16 },
  footerLink: { color: '#5e7468', fontSize: 12 },
  footerDot: { color: '#5e7468', fontSize: 12 },

  profileHeader: { backgroundColor: '#04140e', borderBottomColor: '#FFD700', borderBottomWidth: 2, padding: 40, alignItems: 'center' },
  avatarButton: { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 8 },
  avatarImage: { width: 82, height: 82, borderRadius: 41, borderWidth: 2, borderColor: '#FFD700' },
  changePhotoButton: { borderWidth: 1, borderColor: 'rgba(255,215,0,0.55)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 12 },
  changePhotoText: { color: '#FFD700', fontSize: 12, fontWeight: '700' },
  profileName: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  profilePhone: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  statsRow: { flexDirection: 'row', padding: 15, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#071b13', borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#174a35' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#FFD700' },
  statLabel: { fontSize: 11, color: '#aaa', marginTop: 4, textAlign: 'center' },
  menuBox: { backgroundColor: '#071b13', margin: 15, borderRadius: 15, borderWidth: 1, borderColor: '#174a35' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  menuText: { color: 'white', fontSize: 16, flex: 1, marginLeft: 12 },
  divider: { height: 1, backgroundColor: '#174a35', marginHorizontal: 15 },
  infoBox: { backgroundColor: '#071b13', margin: 15, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#174a35' },
  infoTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', flex: 1 },
  infoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  infoText: { color: '#aaa', fontSize: 14, marginTop: 7 },
  logoutBtn: { margin: 15, padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ff4444', marginBottom: 40, flexDirection: 'row', gap: 7 },
  logoutText: { color: '#ff4444', fontWeight: 'bold', fontSize: 16 },
});
