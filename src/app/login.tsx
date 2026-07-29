import { Image, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Share, Platform, useWindowDimensions } from 'react-native';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { signInWithEmail, signOut, updateUserProfile } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { getStoredValue, removeStoredValues, setStoredValue } from '@/lib/storage';
import { validateEmail } from '@/lib/auth-validation';
import { useAppTheme } from '@/hooks/use-theme';
import { pageSchema } from '@/lib/structured-data';
import { TurnstileWidget, type TurnstileWidgetHandle } from '@/components/turnstile-widget';
import {
  CalendarDays, Camera, Check, ChevronRight, Circle, CircleHelp, CircleUserRound, ClipboardList,
  Copy, Eye, EyeOff, Gift, Info, HeartHandshake, LockKeyhole, LogOut, Mail, MailCheck,
  MapPin, Medal, Phone, Rocket, Shield, ShieldCheck, Smartphone, Target, Trophy, BadgeCheck,
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

export default function ProfileScreen() {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const profileCardAvailableWidth = Math.max(width - 24, 1);
  const profileCardCanvasWidth = Math.max(1160, profileCardAvailableWidth);
  const profileCardScale = Math.min(1, profileCardAvailableWidth / 1160);
  const profileCardViewportHeight = 210 * profileCardScale;
  const { user, isEmailVerified, loading: authLoading } = useAuth();
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
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileError, setTurnstileError] = useState('');
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [profileCreatedAt, setProfileCreatedAt] = useState<string | null>(null);
  const [city, setCity] = useState('');
  const [profileExists, setProfileExists] = useState(false);
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

  const loadLocation = useCallback(async () => {
    if (!user?.id) {
      setCity('');
      return;
    }
    const { data } = await supabase
      .from('user_profile_details')
      .select('city')
      .eq('auth_user_id', user.id)
      .maybeSingle();
    setCity(data?.city || '');
  }, [user?.id]);

  useFocusEffect(useCallback(() => {
    if (!authLoading && user?.id) void loadLocation();
  }, [authLoading, loadLocation, user?.id]));

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (authLoading) {
        if (active) setStep('check');
        return;
      }

      if (user) {
        if (active) setStep('check');
        const scopedAvatar = await getStoredValue(avatarStorageKey(user.id));
        if (scopedAvatar && active) setAvatarUrl(scopedAvatar);

        const [{ data: profile }, { data: location }] = await Promise.all([
          supabase
            .from('users')
            .select('name, phone, avatar_url, referral_code, created_at')
            .eq('auth_user_id', user.id)
            .maybeSingle(),
          supabase
            .from('user_profile_details')
            .select('city')
            .eq('auth_user_id', user.id)
            .maybeSingle(),
        ]);

        if (profile && active) {
          setProfileExists(true);
          setPhone(profile.phone || '');
          setName(profile.name || '');
          setEmail(user.email || '');
          setCity(location?.city || '');
          setAvatarUrl(profile.avatar_url || scopedAvatar || '');
          if (profile.avatar_url) void setStoredValue(avatarStorageKey(user.id), profile.avatar_url);
          setReferralCode(profile.referral_code || null);
          setProfileCreatedAt(profile.created_at || null);
          setStep('profile');
          if (profile.phone) {
            void fetchStats(profile.phone);
            void setStoredValue('userPhone', profile.phone);
            void setStoredValue('userName', profile.name || '');
          }
        } else if (active) {
          const metadataPhone = typeof user.user_metadata?.phone === 'string'
            ? user.user_metadata.phone.trim()
            : '';
          setProfileExists(false);
          setStep('profile');
          setEmail(user.email || '');
          setName(user.user_metadata?.name || '');
          setPhone(/^\+92[0-9]{10}$/.test(metadataPhone) ? metadataPhone : '');
          setCity(location?.city || '');
          setReferralCode(null);
          setProfileCreatedAt(null);
          if (/^\+92[0-9]{10}$/.test(metadataPhone)) {
            void fetchStats(metadataPhone);
            void setStoredValue('userPhone', metadataPhone);
          }
        }
        return;
      }

      if (active) {
        setProfileExists(false);
        setPhone('');
        setName('');
        setEmail('');
        setAvatarUrl('');
        setCity('');
        setReferralCode(null);
        setProfileCreatedAt(null);
        setTotalEntries(0);
        setStep('login');
      }
    }

    void loadProfile();
    return () => { active = false; };
  }, [authLoading, user?.id]);

  async function fetchStats(phone: string) {
    const { data } = await supabase.from('entries').select('*').eq('phone', phone);
    if (data) setTotalEntries(data.length);
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

    if (Platform.OS === 'web' && !turnstileToken) {
      setTurnstileError('Please complete the verification.');
      return;
    }

    setLoading(true);
    setEmailError('');
    setTurnstileError('');
    const { error } = await signInWithEmail(email.trim().toLowerCase(), password, turnstileToken || undefined);

    turnstileRef.current?.reset();
    setTurnstileToken('');

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
    const scopedKey = user?.id ? avatarStorageKey(user.id) : null;
    if (user) {
      await signOut();
    }
    await removeStoredValues(['userPhone', 'userName', USER_AVATAR_STORAGE_KEY, ...(scopedKey ? [scopedKey] : [])]);
    setStep('login');
    setProfileExists(false);
    setPhone('');
    setName('');
    setEmail('');
    setPassword('');
    setAvatarUrl('');
    setCity('');
    setReferralCode(null);
    setProfileCreatedAt(null);
    setTotalEntries(0);
  }

  async function uploadProfilePhoto() {
    if (!user?.id || avatarUploading) return;
    if (!profileExists) {
      alert('Please complete your phone profile before uploading a photo.');
      router.push('/profile-setup');
      return;
    }

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
    let uploadedPath = '';
    try {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const extension = mimeType === 'image/png'
        ? 'png'
        : mimeType === 'image/webp'
          ? 'webp'
          : 'jpg';
      const filePath = `${user.id}/avatar-${Date.now()}.${extension}`;
      uploadedPath = filePath;
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

      const { error: updateError } = await updateUserProfile(undefined, nextAvatarUrl);
      if (updateError) throw updateError;

      setAvatarUrl(nextAvatarUrl);
      await setStoredValue(avatarStorageKey(user.id), nextAvatarUrl);
      alert('Profile photo updated.');
    } catch (error) {
      if (uploadedPath) {
        await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([uploadedPath]);
      }
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

  if (authLoading || step === 'check') return (
    <View style={[styles.profileLoading, { backgroundColor: theme.background }]}>
      <ActivityIndicator color={theme.gold} size="large" />
      <Text style={[styles.profileLoadingText, { color: theme.muted }]}>Loading profile...</Text>
    </View>
  );

  if (step === 'profile') return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.profileHeader}>
        <View
          style={[
            styles.profileCardViewport,
            {
              width: profileCardAvailableWidth,
              height: profileCardViewportHeight,
            },
          ]}
        >
          <View
            style={[
              styles.profileCard,
              styles.profileCardWide,
              {
                width: profileCardCanvasWidth,
                transform: [{ scale: profileCardScale }],
              },
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <TouchableOpacity
              style={[styles.avatarButton, styles.avatarButtonWide]}
              onPress={uploadProfilePhoto}
              disabled={avatarUploading}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={[styles.avatarImage, styles.avatarImageWide]} />
              ) : (
                <CircleUserRound color={theme.text} size={96} />
              )}
              <View style={[styles.cameraOverlay, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
                {avatarUploading ? <ActivityIndicator color={theme.primary} size="small" /> : <Camera color={theme.primary} size={17} />}
              </View>
            </TouchableOpacity>

            <View style={styles.profileCardContent}>
              <View style={styles.profileIdentity}>
                <Text
                  style={[styles.profileName, { color: theme.text }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {name || 'JeetoBaz Member'}
                </Text>
                <View style={styles.verifiedBadge}>
                  <ShieldCheck color={isEmailVerified ? '#18a663' : '#F59E0B'} size={15} />
                  <Text style={[styles.verifiedText, { color: isEmailVerified ? '#18a663' : '#F59E0B' }]}>
                    {isEmailVerified ? 'Verified Member' : 'Verification Pending'}
                  </Text>
                </View>
                <View style={[styles.profileAccent, { backgroundColor: theme.primary }]} />
              </View>

              <View style={styles.profileDetailsRow}>
                <View style={styles.profileDetailItem}>
                  <View style={[styles.profileDetailIcon, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Phone color="#18a663" size={22} />
                  </View>
                  <View style={styles.profileContactText}>
                    <Text style={[styles.profileContactLabel, { color: theme.muted }]}>Phone Number</Text>
                    <Text style={[styles.profileContactValue, { color: theme.text }]} numberOfLines={1}>{phone || 'Not added'}</Text>
                  </View>
                </View>

                <View style={[styles.profileDivider, { backgroundColor: theme.border }]} />

                <View style={styles.profileDetailItem}>
                  <View style={[styles.profileDetailIcon, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <MailCheck color="#18a663" size={22} />
                  </View>
                  <View style={styles.profileContactText}>
                    <Text style={[styles.profileContactLabel, { color: theme.muted }]}>Email Address</Text>
                    <Text style={[styles.profileContactValue, { color: theme.text }]} numberOfLines={1}>{user?.email || 'Not added'}</Text>
                  </View>
                </View>

                <View style={[styles.profileDivider, { backgroundColor: theme.border }]} />

                <TouchableOpacity
                  style={styles.profileDetailItem}
                  onPress={() => router.push('/profile-location' as never)}
                  accessibilityRole="button"
                  accessibilityLabel={city ? `Edit city, currently ${city}` : 'Add city'}
                >
                  <View style={[styles.profileDetailIcon, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <MapPin color="#18a663" size={21} />
                  </View>
                  <View style={styles.profileContactText}>
                    <Text style={[styles.profileContactLabel, { color: theme.muted }]}>City</Text>
                    <Text style={[styles.profileContactValue, { color: theme.text }]} numberOfLines={1}>{city || 'Add city'}</Text>
                  </View>
                </TouchableOpacity>

                <View style={[styles.profileDivider, { backgroundColor: theme.border }]} />

                <TouchableOpacity
                  style={styles.profileDetailItem}
                  onPress={() => jbUserId && copyToClipboard(jbUserId, 'jbId')}
                  disabled={!jbUserId}
                  accessibilityRole="button"
                  accessibilityLabel={jbUserId ? 'Copy member ID' : 'Member ID unavailable'}
                >
                  <View style={[styles.profileDetailIcon, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <ShieldCheck color="#18a663" size={22} />
                  </View>
                  <View style={styles.profileContactText}>
                    <Text style={[styles.profileContactLabel, { color: theme.muted }]}>Member ID</Text>
                    <Text style={[styles.profileContactValue, styles.profileMemberId, { color: theme.text }]} numberOfLines={1}>
                      {jbUserId || 'Unavailable'}
                    </Text>
                  </View>
                  {jbUserId ? <Copy color={copiedField === 'jbId' ? theme.primary : theme.subtle} size={15} /> : null}
                </TouchableOpacity>

                <View style={[styles.profileDivider, { backgroundColor: theme.border }]} />

                <View style={styles.profileDetailItem}>
                  <View style={[styles.profileDetailIcon, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <CalendarDays color="#18a663" size={22} />
                  </View>
                  <View style={styles.profileContactText}>
                    <Text style={[styles.profileContactLabel, { color: theme.muted }]}>Member Since</Text>
                    <Text style={[styles.profileContactValue, { color: theme.text }]} numberOfLines={1}>{memberSince || 'Unavailable'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
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
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/registered-verified' as never)}>
          <BadgeCheck color="#18a663" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>Registered &amp; Verified</Text>
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
        <Text style={[styles.infoText, { color: theme.muted }]}>Pakistan&apos;s Trusted Prize Platform</Text>
        <Text style={[styles.infoText, { color: theme.muted }]}>Secure Payments • Transparent Draws • Verified Winners</Text>
        <Text style={[styles.infoText, { color: theme.muted }]}>Version 1.0.0</Text>
        <Text style={[styles.infoText, { color: theme.muted }]}>Secure • Transparent • Trusted</Text>
        <Text style={[styles.infoText, { color: theme.muted }]}>© 2026 JeetoBaz. All rights reserved.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <LogOut color="#ff4444" size={19} /><Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const loginSchema = pageSchema('WebPage', '/login', 'Login', 'Sign in securely to your JeetoBaz account to access entries, saved campaigns, account details, notifications, and available prize opportunities.');
  return (
    <>
    <Head>
      <title>Login | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="Sign in securely to your JeetoBaz account to access entries, saved campaigns, account details, notifications, and available prize opportunities." />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Login | JeetoBaz" />
      <meta property="og:description" content="Sign in securely to your JeetoBaz account to access entries, saved campaigns, account details, notifications, and available prize opportunities." />
      <meta property="og:url" content="https://jeetobaz.pk/login" />
      <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content="Login | JeetoBaz" />
      <meta name="twitter:description" content="Sign in securely to your JeetoBaz account to access entries, saved campaigns, account details, notifications, and available prize opportunities." />
      <meta name="twitter:image" content="https://jeetobaz.pk/twitter-image.png" />
      <link rel="canonical" href="https://jeetobaz.pk/login" />
      <script type="application/ld+json">{JSON.stringify(loginSchema)}</script>
    </Head>
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
          <View style={styles.logoRow}>
            <Image source={require('@/assets/images/icon.png')} style={styles.logoImage} />
            <Text style={[styles.logo, { color: theme.gold }]}>JeetoBaz</Text>
          </View>
          <Text style={[styles.tagline, { color: theme.muted }]}>Pakistan's Transparent Prize Campaign Platform</Text>
        </View>

        <View style={[styles.loginCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.secureBadge, { backgroundColor: theme.primarySoft }]}>
            <Shield color="#18a663" size={16} />
            <Text style={styles.secureBadgeText}>Secure Account Access</Text>
          </View>

          <Text role="heading" aria-level={1} style={[styles.welcomeTitle, { color: theme.gold }]}>Welcome Back</Text>
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

          <TurnstileWidget
            ref={turnstileRef}
            onVerify={(token) => { setTurnstileToken(token); setTurnstileError(''); }}
            onExpire={() => setTurnstileToken('')}
          />
          {turnstileError ? <Text style={styles.errorText}>{turnstileError}</Text> : null}

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
    </>
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

  profileLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  profileLoadingText: { fontSize: 14, fontWeight: '600' },
  profileHeader: { paddingVertical: 20, paddingHorizontal: 12 },
  profileCardViewport: { overflow: 'hidden', alignSelf: 'center' },
  profileCard: { minWidth: 980, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 22, paddingVertical: 24, paddingHorizontal: 28, borderRadius: 18, borderWidth: 1, borderCurve: 'continuous' },
  profileCardWide: { minWidth: 1160, height: 210, flex: 0, gap: 36, paddingVertical: 30, paddingHorizontal: 38, transformOrigin: 'top left' },
  profileCardContent: { flex: 1, minWidth: 0, gap: 20 },
  avatarButton: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 },
  avatarButtonWide: { width: 150, height: 150, borderRadius: 75, marginBottom: 0 },
  avatarImage: { width: 92, height: 92, borderRadius: 46, borderWidth: 2, borderColor: '#FFD700' },
  avatarImageWide: { width: 150, height: 150, borderRadius: 75 },
  cameraOverlay: { position: 'absolute', right: -3, bottom: -3, width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  profileIdentity: { alignItems: 'flex-start', flexShrink: 1, minWidth: 0 },
  profileIdentityWide: { alignItems: 'flex-start' },
  profileName: { fontSize: 26, fontWeight: 'bold', textAlign: 'left', maxWidth: '100%' },
  profileEmail: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: 'rgba(24,166,99,0.12)', borderRadius: 20 },
  verifiedText: { fontSize: 13, fontWeight: '700' },
  profileAccent: { width: 40, height: 4, borderRadius: 2, marginTop: 12 },

  jbIdRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  jbIdText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', letterSpacing: 1 },
  copiedLabel: { fontSize: 11, color: '#18a663', fontWeight: '600', marginLeft: 4 },

  memberSinceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  memberSinceText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  profileDetailsRow: { flexDirection: 'row', alignItems: 'stretch', flex: 1 },
  profileDetailItem: { minWidth: 142, flex: 1, minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  profileDetailIcon: { width: 46, height: 46, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  profileDivider: { width: 1, marginVertical: 6 },
  profileMemberId: { fontFamily: 'monospace', letterSpacing: 0.7 },
  profileContactRow: { width: '100%', maxWidth: 900, alignSelf: 'center', flexDirection: 'row', gap: 10, marginTop: 24 },
  profileContactRowWide: { marginTop: 28 },
  profileContactCard: { flex: 1, minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  profileContactText: { flex: 1 },
  profileContactLabel: { fontSize: 11, fontWeight: '500', marginBottom: 3 },
  profileContactValue: { fontSize: 14, fontWeight: '700' },

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
