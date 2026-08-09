import { Image, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Share, Platform, useWindowDimensions, Modal, Switch, Linking } from 'react-native';
import { useState, useEffect, useMemo, useRef, useCallback, type ElementRef } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { signInWithEmail, signOut, updateUserProfile } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { DEFAULT_NOTIFICATION_PREFERENCES, type NotificationPreferences } from '@/lib/notifications';
import { getStoredValue, removeStoredValues, setStoredValue } from '@/lib/storage';
import { getReferralDeviceToken } from '@/lib/referrals';
import { validateEmail } from '@/lib/auth-validation';
import { useAppTheme } from '@/hooks/use-theme';
import { pageSchema } from '@/lib/structured-data';
import { BrandedLoader } from '@/components/branded-loader';
import { TurnstileWidget, type TurnstileWidgetHandle } from '@/components/turnstile-widget';
import { subscribeScrollToTop } from '@/lib/home-scroll';
import { getActivePushSubscription, isPushSupported, subscribeToPush, unsubscribeFromPush } from '@/lib/push-notifications';
import {
  Award, BadgeCheck, Bell, BellRing, CalendarDays, Camera, Check, ChevronDown, ChevronRight, ChevronUp, Circle, CircleHelp, CircleUserRound, ClipboardList,
  Copy, Eye, EyeOff, Flag, Gift, Globe2, Info, HeartHandshake, LockKeyhole, LogOut, Mail, MailCheck, Megaphone, MessageSquare,
  MapPin, Medal, Moon, Phone, Rocket, RotateCcw, Settings, Share2, Shield, ShieldCheck, Smartphone, Sun, Ticket, Trophy,
  Truck, User, UserPlus, UsersRound, Wallet, X,
} from 'lucide-react-native';

const PROFILE_AVATAR_BUCKET = 'profile-avatars';
const USER_AVATAR_STORAGE_KEY = 'userAvatarUrl';
const SUPPORT_EMAIL = 'support@jeetobaz.pk';

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
  const { theme, mode, toggleThemeMode } = useAppTheme();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [personalInfoExpanded, setPersonalInfoExpanded] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [notificationPreferenceSaving, setNotificationPreferenceSaving] = useState<keyof NotificationPreferences | null>(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSaving, setPushSaving] = useState(false);
  const { width } = useWindowDimensions();
  const isMobileProfile = width < 700;
  const profileCardAvailableWidth = Math.max(width - 24, 1);
  const profileCardCanvasWidth = isMobileProfile ? profileCardAvailableWidth : Math.max(1160, profileCardAvailableWidth);
  const profileCardScale = isMobileProfile ? 1 : Math.min(1, profileCardAvailableWidth / 1160);
  const profileCardViewportHeight = 300 * profileCardScale;
  const profileCardCanvasHeight = profileCardViewportHeight / profileCardScale;
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
  const [certificateCount, setCertificateCount] = useState(0);
  const [successfulReferrals, setSuccessfulReferrals] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileError, setTurnstileError] = useState('');
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const scrollViewRef = useRef<ElementRef<typeof ScrollView>>(null);

  useEffect(() => {
    return subscribeScrollToTop('login', () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, []);

  useEffect(() => {
    const supported = isPushSupported();
    setPushSupported(supported);
    if (!supported) return;
    let active = true;
    getActivePushSubscription().then((subscription) => {
      if (active) setPushEnabled(Boolean(subscription));
    });
    return () => { active = false; };
  }, []);

  async function togglePushNotifications() {
    if (!phone) {
      alert('Please add your phone number to your profile first.');
      return;
    }
    setPushSaving(true);
    if (pushEnabled) {
      await unsubscribeFromPush();
      setPushEnabled(false);
    } else {
      const result = await subscribeToPush(phone);
      if (result.ok) setPushEnabled(true);
      else alert(result.message || 'Could not enable push notifications.');
    }
    setPushSaving(false);
  }
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [profileCreatedAt, setProfileCreatedAt] = useState<string | null>(null);
  const [city, setCity] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [profileExists, setProfileExists] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const router = useRouter();

  const memberSince = useMemo(() => {
    const dateStr = profileCreatedAt || user?.created_at;
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [profileCreatedAt, user?.created_at]);

  const formattedDateOfBirth = useMemo(() => {
    if (!dateOfBirth) return 'Add DOB';
    const [year, month, day] = dateOfBirth.split('-').map(Number);
    if (!year || !month || !day) return 'Add DOB';
    return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [dateOfBirth]);

  async function copyToClipboard(text: string, field: string) {
    await Clipboard.setStringAsync(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const loadLocation = useCallback(async () => {
    if (!user?.id) {
      setCity('');
      setDateOfBirth('');
      return;
    }
    const { data } = await supabase
      .from('user_profile_details')
      .select('city, date_of_birth')
      .eq('auth_user_id', user.id)
      .maybeSingle();
    setCity(data?.city || '');
    setDateOfBirth(data?.date_of_birth || '');
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
        void fetchReferralCount();
        const scopedAvatar = await getStoredValue(avatarStorageKey(user.id));
        const metadataAvatar = typeof user.user_metadata?.avatar_url === 'string'
          ? user.user_metadata.avatar_url.trim()
          : '';
        if (active) setAvatarUrl(metadataAvatar || scopedAvatar || '');

        const [{ data: profile }, { data: location }, { data: certificates }] = await Promise.all([
          supabase
            .from('users')
            .select('id, name, phone, avatar_url, referral_code, created_at, member_number, notification_preferences')
            .eq('auth_user_id', user.id)
            .maybeSingle(),
          supabase
            .from('user_profile_details')
            .select('city, date_of_birth')
            .eq('auth_user_id', user.id)
            .maybeSingle(),
          supabase.rpc('get_my_certificates'),
        ]);
        if (active) setCertificateCount(certificates?.length || 0);

        if (profile && active) {
          setProfileExists(true);
          setPhone(profile.phone || '');
          setName(profile.name || '');
          setEmail(user.email || '');
          setCity(location?.city || '');
          setDateOfBirth(location?.date_of_birth || '');
          const resolvedAvatar = profile.avatar_url || metadataAvatar || scopedAvatar || '';
          setAvatarUrl(resolvedAvatar);
          if (resolvedAvatar) void setStoredValue(avatarStorageKey(user.id), resolvedAvatar);
          setReferralCode(profile.referral_code || null);
          setMemberId(profile.member_number ? `JB-${profile.member_number}` : null);
          setProfileCreatedAt(profile.created_at || null);
          setNotificationPreferences(profile.notification_preferences || DEFAULT_NOTIFICATION_PREFERENCES);
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
          setAvatarUrl(metadataAvatar || scopedAvatar || '');
          if (metadataAvatar) void setStoredValue(avatarStorageKey(user.id), metadataAvatar);
          setCity(location?.city || '');
          setDateOfBirth(location?.date_of_birth || '');
          setReferralCode(null);
          setMemberId(null);
          setProfileCreatedAt(null);
          setNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
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
        setMemberId(null);
        setProfileCreatedAt(null);
        setNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
        setTotalEntries(0);
        setCertificateCount(0);
        setSuccessfulReferrals(0);
        setWalletBalance(0);
        setStep('login');
      }
    }

    void loadProfile();
    return () => { active = false; };
  }, [authLoading, user?.id]);

  async function fetchReferralCount() {
    const deviceToken = await getReferralDeviceToken();
    const { data } = await supabase.rpc('get_referral_dashboard', { requested_device_token: deviceToken });
    setSuccessfulReferrals(Number(data?.[0]?.successful_referrals) || 0);
  }

  async function fetchStats(phone: string) {
    const { data } = await supabase.rpc('count_my_entries', { p_phone: phone });
    if (typeof data === 'number') setTotalEntries(data);
    const { data: walletRow } = await supabase.from('wallets').select('balance').eq('phone', phone).maybeSingle();
    setWalletBalance(walletRow?.balance ?? 0);
  }

  async function sendFeedback() {
    const subject = encodeURIComponent('JeetoBaz Feedback');
    const body = encodeURIComponent(
      `Hi JeetoBaz team,\n\nMy feedback:\n\n\n\nName: ${name || 'Not provided'}\nPhone: ${phone || 'Not provided'}`
    );
    try {
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
    } catch {
      alert(`Unable to open email. Please email your feedback to ${SUPPORT_EMAIL}.`);
    }
  }

  async function reportProblem() {
    const subject = encodeURIComponent('[Problem Report] JeetoBaz');
    const body = encodeURIComponent(
      `Hi JeetoBaz team,\n\nI'd like to report a problem:\n\nWhat happened:\n\n\nWhere (page/screen):\n\n\nName: ${name || 'Not provided'}\nPhone: ${phone || 'Not provided'}`
    );
    try {
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
    } catch {
      alert(`Unable to open email. Please email your problem report to ${SUPPORT_EMAIL}.`);
    }
  }

  async function shareJeetoBaz() {
    try {
      await Share.share({ message: 'Check out JeetoBaz — Pakistan\'s trusted prize draw platform. Win big for just Rs.1!\nhttps://jeetobaz.pk/' });
    } catch {
      // User cancelled or share failed silently; nothing to recover from here.
    }
  }

  async function toggleNotificationPreference(key: keyof NotificationPreferences) {
    const previous = notificationPreferences;
    const next = { ...previous, [key]: !previous[key] };
    setNotificationPreferences(next);
    setNotificationPreferenceSaving(key);
    const { error } = await supabase.rpc('update_notification_preferences', { p_preferences: next });
    setNotificationPreferenceSaving(null);
    if (error) {
      setNotificationPreferences(previous);
      alert('Could not update notification preference: ' + error.message);
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
    setMemberId(null);
    setProfileCreatedAt(null);
    setNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
    setTotalEntries(0);
  }

  async function uploadProfilePhoto() {
    if (!user?.id || avatarUploading) return;

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

      const { error: updateError } = profileExists
        ? await updateUserProfile(undefined, nextAvatarUrl)
        : await supabase.auth.updateUser({
          data: { avatar_url: nextAvatarUrl },
        });
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
      <BrandedLoader message="Loading profile..." />
    </View>
  );

  if (step === 'profile') return (
    <>
    <ScrollView ref={scrollViewRef} style={[styles.container, { backgroundColor: theme.background }]}>
      {!profileExists && (
        <TouchableOpacity
          style={[styles.incompleteBanner, { backgroundColor: theme.primarySoft, borderColor: theme.gold }]}
          onPress={() => router.push('/profile-setup' as never)}
          accessibilityRole="button"
        >
          <Info color={theme.gold} size={18} />
          <View style={styles.incompleteBannerTextWrap}>
            <Text style={[styles.incompleteBannerTitle, { color: theme.text }]}>Complete your profile</Text>
            <Text style={[styles.incompleteBannerSubtitle, { color: theme.muted }]}>
              Add your name and phone number to unlock Member ID, draws, and referrals.
            </Text>
          </View>
          <ChevronRight color={theme.muted} size={18} />
        </TouchableOpacity>
      )}
      <View style={[styles.profileHeader, isMobileProfile && styles.profileHeaderMobile]}>
        {isMobileProfile ? (
          <View style={[styles.mobileProfileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.settingsGearButton, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => setSettingsVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
            >
              <Settings color={theme.gold} size={20} />
            </TouchableOpacity>
            <View style={styles.mobileProfileTop}>
              <TouchableOpacity
                style={styles.mobileAvatarButton}
                onPress={uploadProfilePhoto}
                disabled={avatarUploading}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.mobileAvatarImage} accessibilityLabel="Profile photo" />
                ) : (
                  <CircleUserRound color={theme.text} size={76} />
                )}
                <View style={[styles.mobileCameraOverlay, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
                  {avatarUploading ? <ActivityIndicator color={theme.primary} size="small" accessibilityLabel="Uploading photo" /> : <Camera color={theme.primary} size={15} />}
                </View>
              </TouchableOpacity>

              <View style={styles.mobileIdentity}>
                <Text style={[styles.mobileProfileName, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
                  {name || 'JeetoBaz Member'}
                </Text>
                <View style={styles.verifiedBadge}>
                  <ShieldCheck color={isEmailVerified ? '#18a663' : '#F59E0B'} size={14} />
                  <Text style={[styles.mobileVerifiedText, { color: isEmailVerified ? '#18a663' : '#F59E0B' }]}>
                    {isEmailVerified ? 'Verified Member' : 'Verification Pending'}
                  </Text>
                </View>
                <View style={[styles.mobileProfileAccent, { backgroundColor: theme.gold }]} />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.personalInfoToggle, { backgroundColor: theme.background, borderColor: personalInfoExpanded ? theme.gold : theme.border }]}
              onPress={() => setPersonalInfoExpanded((expanded) => !expanded)}
              accessibilityRole="button"
              accessibilityState={{ expanded: personalInfoExpanded }}
              accessibilityLabel="Toggle personal information"
            >
              <User color={theme.primary} size={18} />
              <Text style={[styles.personalInfoToggleText, { color: theme.text }]}>Personal Information</Text>
              {personalInfoExpanded ? (
                <ChevronUp color={theme.gold} size={20} />
              ) : (
                <ChevronDown color={theme.subtle} size={20} />
              )}
            </TouchableOpacity>

            <View style={[styles.mobileDetailsGrid, !personalInfoExpanded && styles.mobileDetailsGridHidden]}>
              <View style={styles.mobileDetailsRow}>
                <View style={[styles.mobileDetailTile, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <View style={[styles.mobileDetailIcon, { borderColor: theme.border }]}>
                    <Phone color={theme.primary} size={18} />
                  </View>
                  <View style={styles.mobileDetailText}>
                    <Text style={[styles.mobileDetailLabel, { color: theme.muted }]}>Phone Number</Text>
                    <Text style={[styles.mobileDetailValue, { color: theme.text }]} numberOfLines={1}>{phone || 'Not added'}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.mobileDetailTile, { backgroundColor: theme.background, borderColor: theme.border }]}
                  onPress={() => router.push({ pathname: '/profile-location', params: { from: '/login' } } as never)}
                  accessibilityRole="button"
                  accessibilityLabel={city ? `Edit city, currently ${city}` : 'Add city'}
                >
                  <View style={[styles.mobileDetailIcon, { borderColor: theme.border }]}>
                    <MapPin color={theme.primary} size={18} />
                  </View>
                  <View style={styles.mobileDetailText}>
                    <Text style={[styles.mobileDetailLabel, { color: theme.muted }]}>City</Text>
                    <Text style={[styles.mobileDetailValue, { color: theme.text }]} numberOfLines={1}>{city || 'Add city'}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.mobileDetailsRow}>
                <View style={[styles.mobileDetailTile, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <View style={[styles.mobileDetailIcon, { borderColor: theme.border }]}>
                    <MailCheck color={theme.primary} size={18} />
                  </View>
                  <View style={styles.mobileDetailText}>
                    <Text style={[styles.mobileDetailLabel, { color: theme.muted }]}>Email Address</Text>
                    <Text style={[styles.mobileDetailValue, { color: theme.text }]} numberOfLines={1}>{user?.email || email || 'Not added'}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.mobileDetailTile, { backgroundColor: theme.background, borderColor: theme.border }]}
                  onPress={() => router.push({ pathname: '/profile-date-of-birth', params: { from: '/login' } } as never)}
                  accessibilityRole="button"
                  accessibilityLabel={dateOfBirth ? `Edit date of birth, currently ${formattedDateOfBirth}` : 'Add date of birth'}
                >
                  <View style={[styles.mobileDetailIcon, { borderColor: theme.border }]}>
                    <CalendarDays color={theme.primary} size={18} />
                  </View>
                  <View style={styles.mobileDetailText}>
                    <Text style={[styles.mobileDetailLabel, { color: theme.muted }]}>Date of Birth</Text>
                    <Text style={[styles.mobileDetailValue, { color: theme.text }]} numberOfLines={1}>{formattedDateOfBirth}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.mobileDetailsRow}>
                <TouchableOpacity
                  style={[styles.mobileDetailTile, { backgroundColor: theme.background, borderColor: theme.border }]}
                  onPress={() => memberId && copyToClipboard(memberId, 'jbId')}
                  disabled={!memberId}
                  accessibilityRole="button"
                  accessibilityLabel={memberId ? 'Copy member ID' : 'Member ID unavailable'}
                >
                  <View style={[styles.mobileDetailIcon, { borderColor: theme.border }]}>
                    <ShieldCheck color={theme.primary} size={18} />
                  </View>
                  <View style={styles.mobileDetailText}>
                    <Text style={[styles.mobileDetailLabel, { color: theme.muted }]}>Member ID</Text>
                    <Text style={[styles.mobileDetailValue, styles.profileMemberId, { color: theme.text }]} numberOfLines={1}>
                      {memberId || 'Unavailable'}
                    </Text>
                  </View>
                  {memberId ? <Copy color={copiedField === 'jbId' ? theme.primary : theme.subtle} size={12} /> : null}
                </TouchableOpacity>
                <View style={[styles.mobileDetailTile, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <View style={[styles.mobileDetailIcon, { borderColor: theme.border }]}>
                    <CalendarDays color={theme.primary} size={18} />
                  </View>
                  <View style={styles.mobileDetailText}>
                    <Text style={[styles.mobileDetailLabel, { color: theme.muted }]}>Member Since</Text>
                    <Text style={[styles.mobileDetailValue, { color: theme.text }]} numberOfLines={1}>{memberSince || 'Unavailable'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ) : (
        <View
          style={[
            styles.profileCardViewport,
            {
              width: isMobileProfile ? '100%' : profileCardAvailableWidth,
              height: profileCardViewportHeight,
            },
          ]}
        >
          <View
            style={[
              styles.profileCard,
              styles.profileCardWide,
              isMobileProfile && styles.profileCardMobile,
              {
                width: isMobileProfile ? '100%' : profileCardCanvasWidth,
                height: profileCardCanvasHeight,
                transformOrigin: [0, 0, 0],
                transform: [{ scale: profileCardScale }],
              },
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <TouchableOpacity
              style={[styles.settingsGearButton, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => setSettingsVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
            >
              <Settings color={theme.gold} size={22} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.avatarButton, styles.avatarButtonWide, isMobileProfile && styles.avatarButtonMobile]}
              onPress={uploadProfilePhoto}
              disabled={avatarUploading}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={[styles.avatarImage, styles.avatarImageWide, isMobileProfile && styles.avatarImageMobile]} accessibilityLabel="Profile photo" />
              ) : (
                <CircleUserRound color={theme.text} size={96} />
              )}
              <View style={[styles.cameraOverlay, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
                {avatarUploading ? <ActivityIndicator color={theme.primary} size="small" accessibilityLabel="Uploading photo" /> : <Camera color={theme.primary} size={17} />}
              </View>
            </TouchableOpacity>

            <View style={[styles.profileCardContent, isMobileProfile && styles.profileCardContentMobile]}>
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

              <View style={styles.profileDetailsGridDesktop}>
                <View style={styles.profileDetailItemDesktop}>
                  <View style={[styles.profileDetailIcon, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Phone color="#18a663" size={22} />
                  </View>
                  <View style={styles.profileContactText}>
                    <Text style={[styles.profileContactLabel, { color: theme.muted }]}>Phone Number</Text>
                    <Text style={[styles.profileContactValue, { color: theme.text }]} numberOfLines={1}>{phone || 'Not added'}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.profileDetailItemDesktop}
                  onPress={() => router.push({ pathname: '/profile-location', params: { from: '/login' } } as never)}
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

                <View style={styles.profileDetailItemDesktop}>
                  <View style={[styles.profileDetailIcon, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <CalendarDays color="#18a663" size={22} />
                  </View>
                  <View style={styles.profileContactText}>
                    <Text style={[styles.profileContactLabel, { color: theme.muted }]}>Member Since</Text>
                    <Text style={[styles.profileContactValue, { color: theme.text }]} numberOfLines={1}>{memberSince || 'Unavailable'}</Text>
                  </View>
                </View>

                <View style={styles.profileDetailItemDesktop}>
                  <View style={[styles.profileDetailIcon, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <MailCheck color="#18a663" size={22} />
                  </View>
                  <View style={styles.profileContactText}>
                    <Text style={[styles.profileContactLabel, { color: theme.muted }]}>Email Address</Text>
                    <Text style={[styles.profileContactValue, { color: theme.text }]} numberOfLines={1}>{user?.email || 'Not added'}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.profileDetailItemDesktop}
                  onPress={() => router.push({ pathname: '/profile-date-of-birth', params: { from: '/login' } } as never)}
                  accessibilityRole="button"
                  accessibilityLabel={dateOfBirth ? `Edit date of birth, currently ${formattedDateOfBirth}` : 'Add date of birth'}
                >
                  <View style={[styles.profileDetailIcon, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <CalendarDays color="#18a663" size={22} />
                  </View>
                  <View style={styles.profileContactText}>
                    <Text style={[styles.profileContactLabel, { color: theme.muted }]}>Date of Birth</Text>
                    <Text style={[styles.profileContactValue, { color: theme.text }]} numberOfLines={1}>{formattedDateOfBirth}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileDetailItemDesktop}
                  onPress={() => memberId && copyToClipboard(memberId, 'jbId')}
                  disabled={!memberId}
                  accessibilityRole="button"
                  accessibilityLabel={memberId ? 'Copy member ID' : 'Member ID unavailable'}
                >
                  <View style={[styles.profileDetailIcon, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <ShieldCheck color="#18a663" size={22} />
                  </View>
                  <View style={styles.profileContactText}>
                    <Text style={[styles.profileContactLabel, { color: theme.muted }]}>Member ID</Text>
                    <Text style={[styles.profileContactValue, styles.profileMemberId, { color: theme.text }]} numberOfLines={1}>
                      {memberId || 'Unavailable'}
                    </Text>
                  </View>
                  {memberId ? <Copy color={copiedField === 'jbId' ? theme.primary : theme.subtle} size={15} /> : null}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        )}
      </View>

      <View style={[styles.verifyRow, isMobileProfile && styles.verifyRowMobile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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

      <View style={[styles.statsRow, isMobileProfile && styles.statsRowMobile]}>
        <View style={[styles.statCard, isMobileProfile && styles.statCardMobile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, { color: theme.gold }]}>{totalEntries}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>{t('drawsEntered')}</Text>
        </View>
        <View style={[styles.statCard, isMobileProfile && styles.statCardMobile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, { color: theme.gold }]}>0</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>{t('drawsWon')}</Text>
        </View>
        <View style={[styles.statCard, isMobileProfile && styles.statCardMobile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Circle color="#18a663" fill="#18a663" size={22} />
          <Text style={[styles.statLabel, { color: theme.muted }]}>{t('active')}</Text>
        </View>
        <View style={[styles.statCard, isMobileProfile && styles.statCardMobile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, { color: theme.gold }]}>{certificateCount}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>My Certificates</Text>
        </View>
        <View style={[styles.statCard, isMobileProfile && styles.statCardMobile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, { color: theme.gold }]}>{successfulReferrals}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Refer & Earn</Text>
        </View>
        <View style={[styles.statCard, isMobileProfile && styles.statCardMobile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, { color: theme.gold }]}>Rs. {walletBalance.toLocaleString()}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>My Wallet</Text>
        </View>
      </View>

      {memberId ? (
        <View style={[styles.referralCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.referralTop}>
            <View style={styles.referralLeft}>
              <View style={[styles.referralIconBox, { backgroundColor: theme.primarySoft }]}>
                <BadgeCheck color="#18a663" size={20} />
              </View>
              <View>
                <Text style={[styles.referralLabel, { color: theme.muted }]}>Member ID</Text>
                <Text style={[styles.referralCode, { color: theme.gold }]}>{memberId}</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.referralBtn, { backgroundColor: theme.primarySoft }]} onPress={() => copyToClipboard(memberId, 'memberId')}>
              <Copy color={copiedField === 'memberId' ? '#18a663' : theme.gold} size={16} />
            </TouchableOpacity>
          </View>
          {copiedField === 'memberId' ? <Text style={[styles.copiedMsg, { color: '#18a663' }]}>Copied to clipboard!</Text> : null}
        </View>
      ) : null}

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

      <View style={[styles.menuBox, isMobileProfile && styles.menuBoxMobile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/my-activity', params: { source: 'profile' } })}>
          <Ticket color="#FF6B6B" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>My Activity</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/wallet', params: { source: 'profile' } })}>
          <Wallet color="#18a663" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>My Wallet</Text>
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
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/certificates' as never)}>
          <Award color="#FFD700" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>My Certificates</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/referral', params: { source: 'profile' } })}>
          <UserPlus color="#18a663" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>Refer & Earn</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/registered-verified', params: { source: 'profile' } })}>
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
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/refund-policy' as never, params: { source: 'profile' } })}>
          <RotateCcw color="#F59E0B" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>Refund & Cancellation</Text>
          <ChevronRight color={theme.subtle} size={20} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/shipping-policy' as never, params: { source: 'profile' } })}>
          <Truck color="#18a663" size={21} />
          <Text style={[styles.menuText, { color: theme.gold }]}>Shipping Policy</Text>
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

    <Modal visible={settingsVisible} transparent animationType="slide" onRequestClose={() => setSettingsVisible(false)} accessibilityLabel="Settings">
      <View style={styles.settingsOverlay}>
        <TouchableOpacity style={styles.settingsBackdrop} activeOpacity={1} onPress={() => setSettingsVisible(false)} />
        <View style={[styles.settingsPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.settingsPanelHeader}>
            <Text style={[styles.settingsPanelTitle, { color: theme.gold }]}>Settings</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(false)} accessibilityRole="button" accessibilityLabel="Close settings">
              <X color={theme.muted} size={22} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.settingsSectionLabel, { color: theme.muted, marginTop: 0 }]}>ACCOUNT</Text>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); router.push({ pathname: '/edit-profile', params: { from: '/login' } } as never); }}>
              <User color="#3B82F6" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Edit Profile</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); router.push({ pathname: '/change-email', params: { from: '/login' } } as never); }}>
              <Mail color="#F59E0B" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Change Email</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); router.push({ pathname: '/edit-profile', params: { from: '/login' } } as never); }}>
              <Phone color="#18a663" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Change Phone</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); router.push('/profile-location' as never); }}>
              <MapPin color="#F97316" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Edit Location</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); router.push('/profile-date-of-birth' as never); }}>
              <CalendarDays color="#4a9eff" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Edit Date of Birth</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); router.push({ pathname: '/change-password', params: { from: '/login' } } as never); }}>
              <LockKeyhole color="#EC4899" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Change Password</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>

            <Text style={[styles.settingsSectionLabel, { color: theme.muted }]}>PRIVACY & SECURITY</Text>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); router.push({ pathname: '/login-activity', params: { from: '/login' } } as never); }}>
              <Smartphone color="#6366F1" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Login Activity</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>

            <Text style={[styles.settingsSectionLabel, { color: theme.muted }]}>NOTIFICATIONS</Text>
            {pushSupported && (
              <>
                <View style={styles.settingsItem}>
                  <BellRing color="#EF4444" size={20} />
                  <Text style={[styles.settingsItemText, { color: theme.text }]}>Push Notifications (this device)</Text>
                  {pushSaving
                    ? <ActivityIndicator color={theme.gold} size="small" />
                    : <Switch
                        value={pushEnabled}
                        onValueChange={togglePushNotifications}
                        trackColor={{ false: theme.border, true: theme.primary }}
                        thumbColor="#fff"
                      />}
                </View>
                <Text style={[styles.settingsHint, { color: theme.subtle }]}>
                  On iPhone/iPad, add JeetoBaz to your Home Screen first for this to work.
                </Text>
              </>
            )}
            <View style={styles.settingsItem}>
              <Bell color="#F59E0B" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Prize Updates</Text>
              {notificationPreferenceSaving === 'prize_updates'
                ? <ActivityIndicator color={theme.gold} size="small" />
                : <Switch
                    value={notificationPreferences.prize_updates}
                    onValueChange={() => toggleNotificationPreference('prize_updates')}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor="#fff"
                  />}
            </View>
            <View style={styles.settingsItem}>
              <Trophy color="#FBBF24" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Winner Announcements</Text>
              {notificationPreferenceSaving === 'winner_announcements'
                ? <ActivityIndicator color={theme.gold} size="small" />
                : <Switch
                    value={notificationPreferences.winner_announcements}
                    onValueChange={() => toggleNotificationPreference('winner_announcements')}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor="#fff"
                  />}
            </View>
            <View style={styles.settingsItem}>
              <Wallet color="#18a663" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Payment Notifications</Text>
              {notificationPreferenceSaving === 'payment_notifications'
                ? <ActivityIndicator color={theme.gold} size="small" />
                : <Switch
                    value={notificationPreferences.payment_notifications}
                    onValueChange={() => toggleNotificationPreference('payment_notifications')}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor="#fff"
                  />}
            </View>
            <View style={styles.settingsItem}>
              <Megaphone color="#3B82F6" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Promotional</Text>
              {notificationPreferenceSaving === 'promotional'
                ? <ActivityIndicator color={theme.gold} size="small" />
                : <Switch
                    value={notificationPreferences.promotional}
                    onValueChange={() => toggleNotificationPreference('promotional')}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor="#fff"
                  />}
            </View>

            <Text style={[styles.settingsSectionLabel, { color: theme.muted }]}>PREFERENCES</Text>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); router.push('/language'); }}>
              <Globe2 color="#3B82F6" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>{t('language')}</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={toggleThemeMode}>
              {mode === 'dark' ? <Sun color="#FBBF24" size={20} /> : <Moon color="#A78BFA" size={20} />}
              <Text style={[styles.settingsItemText, { color: theme.text }]}>{mode === 'dark' ? 'Light Mode' : 'Dark Mode'}</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>

            <Text style={[styles.settingsSectionLabel, { color: theme.muted }]}>SUPPORT & INFO</Text>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); router.push({ pathname: '/help', params: { from: '/login' } }); }}>
              <HeartHandshake color="#14B8A6" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>{t('helpCenter')}</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); router.push({ pathname: '/faq', params: { source: 'settings' } }); }}>
              <CircleHelp color="#3B82F6" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Frequently Asked Questions</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); router.push({ pathname: '/about', params: { section: 'menu', source: 'settings' } }); }}>
              <Info color={theme.gold} size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>About JeetoBaz</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); void shareJeetoBaz(); }}>
              <Share2 color="#8B5CF6" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Share JeetoBaz</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); void sendFeedback(); }}>
              <MessageSquare color="#F97316" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Send Feedback</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); void reportProblem(); }}>
              <Flag color="#EF4444" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Report a Problem</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>

            <Text style={[styles.settingsSectionLabel, { color: theme.muted }]}>LEGAL</Text>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); router.push({ pathname: '/terms', params: { source: 'settings' } }); }}>
              <ClipboardList color="#6366F1" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>{t('terms')}</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); router.push({ pathname: '/privacy', params: { source: 'settings' } }); }}>
              <LockKeyhole color="#EC4899" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>{t('privacyAccountData')}</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); router.push({ pathname: '/refund-policy' as never, params: { source: 'settings' } }); }}>
              <RotateCcw color="#F59E0B" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Refund & Cancellation</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); router.push({ pathname: '/shipping-policy' as never, params: { source: 'settings' } }); }}>
              <Truck color="#18a663" size={20} />
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Shipping Policy</Text>
              <ChevronRight color={theme.subtle} size={18} />
            </TouchableOpacity>

            <Text style={[styles.settingsSectionLabel, { color: theme.muted }]}>ACCOUNT ACTIONS</Text>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsVisible(false); logout(); }}>
              <LogOut color="#ff4444" size={20} />
              <Text style={[styles.settingsItemText, { color: '#ff4444' }]}>Logout</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
    </>
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
      <meta property="og:image:alt" content="JeetoBaz — Pakistan's trusted prize draw platform" />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta property="og:locale" content="en_PK" />
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
            <Image source={require('@/assets/images/icon-small.png')} style={styles.logoImage} accessibilityLabel="JeetoBaz logo" />
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
              <ActivityIndicator color="#000" size="small" accessibilityLabel="Signing in" />
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

          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={() => router.push('/signup' as never)}
          >
            <Image source={require('@/assets/images/jeetobaz-logo-gold.png')} style={styles.createAccountLogo} accessibilityLabel="JeetoBaz logo" />
            <Text style={styles.createAccountLabel}>
              New to JeetoBaz? <Text style={styles.createAccountHighlight}>Create Account</Text>
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

  createAccountButton: { backgroundColor: '#ff4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 10 },
  createAccountLogo: { width: 26, height: 26, borderRadius: 6 },
  createAccountLabel: { fontSize: 14, color: 'white' },
  createAccountHighlight: { fontWeight: 'bold', color: 'white' },

  trustStrip: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 24, paddingHorizontal: 20, flexWrap: 'wrap' },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { color: '#5e7468', fontSize: 11, fontWeight: '500' },

  footerLinks: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16 },
  footerLink: { color: '#5e7468', fontSize: 12 },
  footerDot: { color: '#5e7468', fontSize: 12 },

  profileLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  profileLoadingText: { fontSize: 14, fontWeight: '600' },
  profileHeader: { paddingTop: 28, paddingBottom: 20, paddingHorizontal: 12 },
  profileHeaderMobile: { paddingBottom: 4 },
  incompleteBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, marginHorizontal: 16, padding: 14, borderRadius: 12, borderWidth: 1 },
  incompleteBannerTextWrap: { flex: 1 },
  incompleteBannerTitle: { fontSize: 14, fontWeight: '700' },
  incompleteBannerSubtitle: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  mobileProfileCard: { width: '100%', borderRadius: 18, borderWidth: 1, padding: 14, gap: 14, overflow: 'hidden' },
  settingsGearButton: { position: 'absolute', top: 12, right: 12, width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  settingsOverlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  settingsBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  settingsPanel: { width: '86%', maxWidth: 380, height: '100%', borderLeftWidth: 1, paddingTop: 24, paddingHorizontal: 18 },
  settingsPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  settingsPanelTitle: { fontSize: 20, fontWeight: '800' },
  settingsSectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginTop: 18, marginBottom: 8 },
  settingsHint: { fontSize: 12, lineHeight: 17, marginTop: -4, marginBottom: 10 },
  settingsItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  settingsItemText: { flex: 1, fontSize: 14, fontWeight: '600' },
  mobileProfileTop: { minHeight: 112, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 18 },
  mobileAvatarButton: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 },
  mobileAvatarImage: { width: 92, height: 92, borderRadius: 46, borderWidth: 2.5, borderColor: '#FFD700' },
  mobileCameraOverlay: { position: 'absolute', right: -3, bottom: -3, width: 31, height: 31, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  mobileIdentity: { flex: 1, minWidth: 0, alignItems: 'flex-start' },
  mobileProfileName: { maxWidth: '100%', fontSize: 24, fontWeight: '800', textAlign: 'left' },
  mobileVerifiedText: { fontSize: 12, fontWeight: '700' },
  mobileProfileAccent: { width: 40, height: 4, borderRadius: 2, marginTop: 12 },
  personalInfoToggle: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, marginBottom: 10 },
  personalInfoToggleText: { flex: 1, fontSize: 14, fontWeight: '700' },
  mobileDetailsGrid: { gap: 8 },
  mobileDetailsGridHidden: { display: 'none' },
  mobileDetailsRow: { flexDirection: 'row', gap: 8 },
  mobileDetailTile: { flex: 1, minWidth: 0, minHeight: 70, borderRadius: 12, borderWidth: 1, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 8, overflow: 'hidden' },
  mobileDetailIcon: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  mobileDetailText: { flex: 1, minWidth: 0 },
  mobileDetailLabel: { fontSize: 9.5, fontWeight: '600', marginBottom: 3 },
  mobileDetailValue: { fontSize: 12, fontWeight: '800' },
  profileCardViewport: { overflow: 'hidden', alignSelf: 'center', position: 'relative' },
  profileCard: { minWidth: 980, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 22, paddingVertical: 24, paddingHorizontal: 28, borderRadius: 18, borderWidth: 1, borderCurve: 'continuous' },
  profileCardWide: { minWidth: 1160, height: 300, flex: 0, position: 'absolute', left: 0, top: 0, gap: 36, paddingVertical: 30, paddingHorizontal: 38 },
  profileCardMobile: { minWidth: 0, height: 480, alignItems: 'flex-start', gap: 18, paddingVertical: 26, paddingHorizontal: 22 },
  profileCardContent: { flex: 1, minWidth: 0, gap: 20 },
  profileCardContentMobile: { paddingTop: 8 },
  avatarButton: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 },
  avatarButtonWide: { width: 150, height: 150, borderRadius: 75, marginBottom: 0 },
  avatarButtonMobile: { width: 116, height: 116, borderRadius: 58 },
  avatarImage: { width: 92, height: 92, borderRadius: 46, borderWidth: 2, borderColor: '#FFD700' },
  avatarImageWide: { width: 150, height: 150, borderRadius: 75 },
  avatarImageMobile: { width: 116, height: 116, borderRadius: 58 },
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
  profileDetailsGridDesktop: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center', rowGap: 8 },
  profileDetailItemDesktop: { flexBasis: '33.333%', flexGrow: 0, minWidth: 0, minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, overflow: 'hidden' },
  profileDetailsRowMobile: { position: 'absolute', left: -134, right: 0, top: 184, height: 224, flexWrap: 'wrap', alignContent: 'stretch', rowGap: 8 },
  profileDetailItem: { minWidth: 142, flex: 1, minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  profileDetailItemMobile: { minWidth: 0, flexBasis: '32%', flexGrow: 1, minHeight: 104, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 7, paddingHorizontal: 10, overflow: 'hidden' },
  profileDetailIcon: { width: 46, height: 46, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  profileDivider: { width: 1, marginVertical: 6 },
  profileDividerMobile: { display: 'none' },
  profileMemberId: { fontFamily: 'monospace', letterSpacing: 0.7 },
  profileContactRow: { width: '100%', maxWidth: 900, alignSelf: 'center', flexDirection: 'row', gap: 10, marginTop: 24 },
  profileContactRowWide: { marginTop: 28 },
  profileContactCard: { flex: 1, minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  profileContactText: { flex: 1 },
  profileContactLabel: { fontSize: 11, fontWeight: '500', marginBottom: 3 },
  profileContactValue: { fontSize: 14, fontWeight: '700' },

  verifyRow: { flexDirection: 'row', marginHorizontal: 15, marginTop: 12, gap: 10 },
  verifyRowMobile: { marginTop: 4 },
  verifyPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#071b13', borderRadius: 12, padding: 14, borderWidth: 1 },
  verifyLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  verifyStatus: { fontSize: 14, fontWeight: '700' },
  statsRow: { flexDirection: 'row', padding: 15, gap: 10 },
  statsRowMobile: { paddingTop: 6, paddingBottom: 6, flexWrap: 'wrap' },
  statCard: { flex: 1, backgroundColor: '#071b13', borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#174a35' },
  statCardMobile: { flexGrow: 0, flexBasis: '31%' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#FFD700' },
  statLabel: { fontSize: 11, color: '#aaa', marginTop: 4, textAlign: 'center' },
  menuBox: { backgroundColor: '#071b13', margin: 15, borderRadius: 15, borderWidth: 1, borderColor: '#174a35' },
  menuBoxMobile: { marginTop: 4 },
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
