import { Image, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Share } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { createUserProfile, signInWithEmail, signOut, updateUserProfile } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { getStoredValue, removeStoredValues, setStoredValue } from '@/lib/storage';
import { validateEmail } from '@/lib/auth-validation';
import { useAppTheme } from '@/hooks/use-theme';
import {
  CalendarDays, Camera, Check, ChevronRight, Circle, CircleHelp, CircleUserRound, ClipboardList,
  Copy, Eye, EyeOff, Gift, Info, HeartHandshake, LockKeyhole, LogOut, Mail, MailCheck,
  Medal, Pencil, Rocket, Shield, ShieldCheck, Smartphone, Target, Trophy,
  UserPlus, UsersRound,
} from 'lucide-react-native';

const PROFILE_AVATAR_BUCKET = 'profile-avatars';
const USER_AVATAR_STORAGE_KEY = 'userAvatarUrl';

function avatarStorageKey(userId: string) {
  return `${USER_AVATAR_STORAGE_KEY}:${userId}`;
}

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
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [profileCreatedAt, setProfileCreatedAt] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const router = useRouter();

  const jbUserId = useMemo(() => {
    if (!user?.id) return null;
    return 'JB-' + user.id.replace(/-/g, '').slice(0, 8).toUpperCase();
  }, [user?.id]);

  const memberSince = useMemo(() => {
    const dateStr = profileCreatedAt || user?.created_at;
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [profileCreatedAt, user?.created_at]);

  async function copyToClipboard(text: string, field: string) {
    await Clipboard.setStringAsync(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (user && isEmailVerified) {
        const scopedAvatar = await getStoredValue(avatarStorageKey(user.id));
        const legacyAvatar = scopedAvatar ? null : await getStoredValue(USER_AVATAR_STORAGE_KEY);
        const cachedAvatar = scopedAvatar || legacyAvatar;
        if (cachedAvatar && active) {
          setAvatarUrl(cachedAvatar);
          if (!scopedAvatar) await setStoredValue(avatarStorageKey(user.id), cachedAvatar);
        }

        const { data: profile } = await supabase
          .from('users')
          .select('name, phone, avatar_url, referral_code, created_at')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (profile && active) {
          setPhone(profile.phone || '');
          setName(profile.name || '');
          if (profile.avatar_url) {
            setAvatarUrl(profile.avatar_url);
            setStoredValue(avatarStorageKey(user.id), profile.avatar_url);
          }
          setReferralCode(profile.referral_code || null);
          setProfileCreatedAt(profile.created_at || null);
          setStep('profile');
          if (profile.phone) {
            fetchStats(profile.phone);
            setStoredValue('userPhone', profile.phone);
            setStoredValue('userName', profile.name || '');
          }
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

      if (user?.id) {
        let { error: updateError } = await updateUserProfile(undefined, nextAvatarUrl);

        if (updateError?.message.includes('Profile not found')) {
          const metadataName = typeof user.user_metadata?.name === 'string'
            ? user.user_metadata.name.trim()
            : name.trim();
          const metadataPhone = typeof user.user_metadata?.phone === 'string'
            ? user.user_metadata.phone.trim()
            : '';

          if (!metadataName || !/^\+92[0-9]{10}$/.test(metadataPhone)) {
            router.push('/profile-setup');
            throw new Error('Please complete your phone profile, then upload the photo again.');
          }

          const { error: profileError } = await createUserProfile(metadataName, metadataPhone);
          if (profileError) throw profileError;

          setName(metadataName);
          setPhone(metadataPhone);
          await setStoredValue('userName', metadataName);
          await setStoredValue('userPhone', metadataPhone);

          ({ error: updateError } = await updateUserProfile(undefined, nextAvatarUrl));
        }

        if (updateError) throw updateError;
      } else if (phone) {
        const { error: updateError } = await supabase
          .rpc('update_profile_avatar', {
            requested_phone: phone,
            requested_avatar_url: nextAvatarUrl,
          });
        if (updateError) throw updateError;
      }

      setAvatarUrl(nextAvatarUrl);
      if (user?.id) await setStoredValue(avatarStorageKey(user.id), nextAvatarUrl);
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
    router.push({ pathname: '/about', params: { section, source: 'profile' } });
  }

  if (step === 'profile') return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.profileHeader, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
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
            <CircleUserRound color={theme.text} size={60} />
          )}
        </TouchableOpacity>
        <Text style={[styles.profileName, { color: theme.text }]}>{name}</Text>

        <View style={styles.verifiedBadge}>
          <ShieldCheck color={isEmailVerified ? '#18a663' : '#F59E0B'} size={15} />
          <Text style={[styles.verifiedText, { color: isEmailVerified ? '#18a663' : '#F59E0B' }]}>
            {isEmailVerified ? 'Verified Member' : 'Verification Pending'}
          </Text>
        </View>

        {user ? (
          <Text style={[styles.profileEmail, { color: theme.muted }]}>{user.email}</Text>
        ) : phone ? (
          <Text style={[styles.profileEmail, { color: theme.muted }]}>{phone}</Text>
        ) : null}

        {jbUserId ? (
          <TouchableOpacity style={styles.jbIdRow} onPress={() => copyToClipboard(jbUserId, 'jbId')} activeOpacity={0.7}>
            <Text style={[styles.jbIdText, { color: theme.muted }]}>{jbUserId}</Text>
            <Copy color={copiedField === 'jbId' ? theme.primary : theme.subtle} size={14} />
            {copiedField === 'jbId' ? <Text style={styles.copiedLabel}>Copied!</Text> : null}
          </TouchableOpacity>
        ) : null}

        {memberSince ? (
          <View style={styles.memberSinceRow}>
            <CalendarDays color={theme.subtle} size={14} />
            <Text style={[styles.memberSinceText, { color: theme.subtle }]}>Member Since {memberSince}</Text>
          </View>
        ) : null}

        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.editProfileBtn, { borderColor: theme.gold }]} onPress={() => router.push('/profile-setup' as never)} activeOpacity={0.7}>
            <Pencil color={theme.gold} size={15} />
            <Text style={[styles.editProfileText, { color: theme.gold }]}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.changePhotoBtn, { borderColor: theme.border }]} onPress={uploadProfilePhoto} disabled={avatarUploading} activeOpacity={0.7}>
            <Camera color={theme.muted} size={15} />
            <Text style={[styles.changePhotoBtnText, { color: theme.muted }]}>{avatarUploading ? 'Uploading...' : 'Change Photo'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.verifyRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.verifyPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MailCheck color={theme.gold} size={18} />
          <View>
            <Text style={[styles.verifyLabel, { color: theme.muted }]}>Email</Text>
            <Text style={[styles.verifyStatus, { color: isEmailVerified ? '#18a663' : '#F59E0B' }]}>
              {isEmailVerified ? 'Verified' : 'Not Verified'}
            </Text>
          </View>
        </View>
        <View style={[styles.verifyPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Smartphone color={phone ? '#18a663' : '#F59E0B'} size={18} />
          <View>
            <Text style={[styles.verifyLabel, { color: theme.muted }]}>Phone</Text>
            <Text style={[styles.verifyStatus, { color: phone ? '#18a663' : '#F59E0B' }]}>
              {phone ? 'Verified' : 'Not Verified'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, { color: theme.gold }]}>{totalEntries}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>{t('drawsEntered')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, { color: theme.gold }]}>0</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>{t('drawsWon')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Circle color="#18a663" fill="#18a663" size={22} />
          <Text style={[styles.statLabel, { color: theme.muted }]}>{t('active')}</Text>
        </View>
      </View>

      {referralCode ? (
        <View style={[styles.referralCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.referralTop}>
            <View style={styles.referralLeft}>
              <View style={[styles.referralIconBox, { backgroundColor: theme.primarySoft }]}>
                <Gift color="#FFD700" size={20} />
              </View>
              <View>
                <Text style={[styles.referralLabel, { color: theme.muted }]}>Referral Code</Text>
                <Text style={[styles.referralCode, { color: theme.gold }]}>{referralCode}</Text>
              </View>
            </View>
            <View style={styles.referralActions}>
              <TouchableOpacity style={[styles.referralBtn, { backgroundColor: theme.primarySoft }]} onPress={() => copyToClipboard(referralCode, 'referral')}>
                <Copy color={copiedField === 'referral' ? '#18a663' : theme.gold} size={16} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.referralBtn, { backgroundColor: theme.primarySoft }]}
                onPress={() => Share.share({ message: `Join JeetoBaz using my referral code: ${referralCode}\nhttps://jeetobaz.pk/` })}
              >
                <Gift color={theme.gold} size={16} />
              </TouchableOpacity>
            </View>
          </View>
          {copiedField === 'referral' ? <Text style={[styles.copiedMsg, { color: '#18a663' }]}>Copied to clipboard!</Text> : null}
        </View>
      ) : null}

      <View style={[styles.menuBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/entries', params: { source: 'profile' } })}>
          <Target color="#FF6B6B" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>{t('myEntries')}</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/')}>
          <Trophy color="#FFD700" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>{t('activeDraws')}</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/explore')}>
          <Medal color="#F59E0B" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>{t('pastWinners')}</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/referral', params: { source: 'profile' } })}>
          <UserPlus color="#18a663" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>Refer & Earn</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/terms', params: { source: 'profile' } })}>
          <ClipboardList color="#6366F1" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>{t('terms')}</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/privacy', params: { source: 'profile' } })}>
          <LockKeyhole color="#EC4899" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>{t('privacyAccountData')}</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/faq', params: { source: 'profile' } })}>
          <CircleHelp color="#3B82F6" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>Frequently Asked Questions</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => openAboutSection('social')}>
          <UsersRound color="#8B5CF6" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>Follow JeetoBaz</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => openAboutSection('works')}>
          <Rocket color="#F97316" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>How JeetoBaz Works</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => openAboutSection('support')}>
          <HeartHandshake color="#14B8A6" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>Support & Contact</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => router.push({ pathname: '/about', params: { section: 'menu', source: 'profile' } })}
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
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
          <View style={styles.logoRow}>
            <Image source={require('@/assets/images/icon.png')} style={styles.logoImage} />
            <Text style={[styles.logo, { color: theme.text }]}>JeetoBaz</Text>
          </View>
          <Text style={[styles.tagline, { color: theme.muted }]}>Pakistan's Transparent Prize Campaign Platform</Text>
        </View>

        <View style={[styles.loginCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.secureBadge, { backgroundColor: theme.primarySoft }]}>
            <Shield color="#18a663" size={16} />
            <Text style={styles.secureBadgeText}>Secure Account Access</Text>
          </View>

          <Text style={[styles.welcomeTitle, { color: theme.text }]}>Welcome Back</Text>
          <Text style={[styles.welcomeSubtitle, { color: theme.muted }]}>Sign in to your account</Text>

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

          <TouchableOpacity style={[styles.googleButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]} disabled>
            <Text style={[styles.googleButtonText, { color: theme.text }]}>G</Text>
            <Text style={[styles.googleButtonLabel, { color: theme.text }]}>Continue with Google</Text>
            <Text style={styles.comingSoonBadge}>Soon</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/signup' as never)}>
            <Text style={[styles.switchText, { color: theme.muted }]}>
              New to JeetoBaz?{' '}
              <Text style={styles.switchHighlight}>Create Account</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.trustStrip}>
          <View style={styles.trustItem}>
            <Shield color="#18a663" size={14} />
            <Text style={[styles.trustText, { color: theme.subtle }]}>Secure Login</Text>
          </View>
          <View style={styles.trustItem}>
            <Check color="#18a663" size={14} />
            <Text style={[styles.trustText, { color: theme.subtle }]}>Verified Platform</Text>
          </View>
          <View style={styles.trustItem}>
            <LockKeyhole color="#18a663" size={14} />
            <Text style={[styles.trustText, { color: theme.subtle }]}>Protected Information</Text>
          </View>
        </View>

        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => router.push('/terms')}>
            <Text style={[styles.footerLink, { color: theme.subtle }]}>Terms</Text>
          </TouchableOpacity>
          <Text style={[styles.footerDot, { color: theme.subtle }]}>•</Text>
          <TouchableOpacity onPress={() => router.push('/privacy')}>
            <Text style={[styles.footerLink, { color: theme.subtle }]}>Privacy</Text>
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
  logoImage: { width: 50, height: 50, borderRadius: 10 },
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
  avatarButton: { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 10 },
  avatarImage: { width: 82, height: 82, borderRadius: 41, borderWidth: 2, borderColor: '#FFD700' },
  profileName: { fontSize: 26, fontWeight: 'bold', color: 'white', marginTop: 8 },
  profileEmail: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: 'rgba(24,166,99,0.12)', borderRadius: 20 },
  verifiedText: { fontSize: 13, fontWeight: '700' },

  jbIdRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  jbIdText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', letterSpacing: 1 },
  copiedLabel: { fontSize: 11, color: '#18a663', fontWeight: '600', marginLeft: 4 },

  memberSinceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  memberSinceText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  editProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)' },
  editProfileText: { fontSize: 13, fontWeight: '700', color: '#FFD700' },
  changePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  changePhotoBtnText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },

  verifyRow: { flexDirection: 'row', marginHorizontal: 15, marginTop: 12, gap: 10 },
  verifyPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#071b13', borderRadius: 12, padding: 14, borderWidth: 1 },
  verifyLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  verifyStatus: { fontSize: 14, fontWeight: '700' },
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

  referralCard: { marginHorizontal: 15, marginTop: 12, borderRadius: 15, borderWidth: 1, padding: 16 },
  referralTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  referralLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  referralIconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  referralLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  referralCode: { fontSize: 17, fontWeight: '800', letterSpacing: 1 },
  referralActions: { flexDirection: 'row', gap: 8 },
  referralBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  copiedMsg: { fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' },
});
