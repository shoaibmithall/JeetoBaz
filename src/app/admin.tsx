import { Image, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { getStoredValue, setStoredValue } from '@/lib/storage';
import { resetPassword, signInWithEmail } from '@/lib/auth';
import { TurnstileWidget, type TurnstileWidgetHandle } from '@/components/turnstile-widget';
import { useAppTheme } from '@/hooks/use-theme';
import { AppThemes } from '@/constants/theme';
import { createNotification, createUserNotification } from '@/lib/notifications';
import {
  DEFAULT_TRUST_BADGES,
  getAnnouncement,
  getGoogleReviewLink,
  getHomeAdImages,
  getPaymentAccounts,
  getTrustBadges,
  saveAnnouncement as saveAnnouncementSetting,
  saveGoogleReviewLink,
  saveHomeAdImages,
  savePaymentAccounts,
  saveTrustBadges,
  type PaymentAccount,
} from '@/lib/app-settings';
import {
  createVerificationDocument,
  deleteVerificationDocument,
  getAllVerificationDocuments,
  updateVerificationDocument,
} from '@/lib/verification-documents';
import {
  createBrandShowcaseImage,
  deleteBrandShowcaseImage,
  getAllBrandShowcaseImages,
  updateBrandShowcaseImageVisibility,
} from '@/lib/brand-showcase';
import {
  createTestimonial,
  deleteTestimonial,
  getAllTestimonials,
  updateTestimonialVisibility,
} from '@/lib/testimonials';
import {
  BLOG_CATEGORIES,
  createBlogPost,
  deleteBlogPost,
  estimateReadMinutes,
  getAllBlogPosts,
  resolveBlogCover,
  updateBlogPost,
} from '@/lib/blog';
import type { AdminAuditLogEntry, BlogCategory, BlogPost, BrandShowcaseImage, DrawResult, Entry, PrizeStatus, Product, ProductFormData, RefundRequest, SupportTicket, Testimonial, TestimonialSource, Transaction, User, VerificationDocument, WalletTopupRequest, WalletTransactionType, WinnerStatus } from '@/types/database';
import { buildDrawDateIso, formatDrawDate, parseDrawDateParts } from '@/lib/format-draw-date';
import { PRODUCT_CATEGORIES } from '@/lib/product-categories';
import { downloadCsv } from '@/lib/csv-export';

type DrawResultWithProduct = DrawResult & { products?: Product | null };
const TESTIMONIAL_SOURCES: TestimonialSource[] = ['google', 'trustpilot', 'website', 'whatsapp'];
const TESTIMONIAL_SOURCE_LABELS: Record<TestimonialSource, string> = {
  google: 'Google',
  trustpilot: 'Trustpilot',
  website: 'Website',
  whatsapp: 'WhatsApp',
};
const PRIZE_STATUSES: PrizeStatus[] = ['pending', 'processing', 'shipped', 'delivered'];
const WINNER_STATUSES: WinnerStatus[] = ['selected', 'under_verification', 'verified', 'disqualified', 're_draw_required'];
const WINNER_STATUS_LABELS: Record<WinnerStatus, string> = {
  selected: 'Selected',
  under_verification: 'Under Verification',
  verified: 'Verified',
  disqualified: 'Disqualified',
  re_draw_required: 'Re-Draw Required',
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  product_deleted: 'Product deleted',
  product_status_changed: 'Product status changed',
  prize_status_updated: 'Prize delivery status updated',
  winner_status_updated: 'Winner verification status updated',
  certificate_uploaded: 'Winner certificate uploaded',
  payment_approved: 'Payment approved',
  payment_rejected: 'Payment rejected',
  wallet_topup_approved: 'Wallet top-up approved',
  wallet_topup_rejected: 'Wallet top-up rejected',
  wallet_balance_adjusted: 'Wallet balance adjusted',
  draw_run: 'Draw run',
  refund_requested: 'Refund requested',
  refund_approved: 'Refund approved',
  refund_rejected: 'Refund rejected',
};

function formatAuditActionLabel(actionType: string) {
  return AUDIT_ACTION_LABELS[actionType] || actionType;
}

function formatAuditDetails(details: Record<string, unknown>) {
  return Object.entries(details)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ');
}
import { isValidSlug, slugify } from '@/lib/validation';
import { pingIndexNow, pingIndexNowBulk } from '@/lib/indexnow';
import {
  Award, BadgeCheck, BarChart3, Bell, BookOpen, CalendarDays, Camera, Check, CheckSquare, ChevronDown, Circle, ClipboardList, CreditCard,
  Dices, DollarSign, Download, Eye, EyeOff, History, LockKeyhole, Mail, Moon, Package, Pencil,
  Plus, ReceiptText, Rocket, Save, Send, Settings, Square, Star, Trash2,
  Search, ShieldCheck, Sun, TriangleAlert, Trophy, Truck, UserRound, UsersRound, Wallet, Wand2, X,
} from 'lucide-react-native';

const ADMIN_EMAIL = 'shoaibmithall@gmail.com';
const RECEIPT_BUCKET = 'payment-receipts';
const WINNER_MEDIA_BUCKET = 'winner-media';
const HOME_ADS_BUCKET = 'home-ads';
const PAYMENT_QR_CODES_BUCKET = 'payment-qr-codes';
const VERIFICATION_DOCUMENTS_BUCKET = 'verification-documents';
const BRAND_SHOWCASE_BUCKET = 'brand-showcase';
const CERTIFICATES_BUCKET = 'winner-certificates';
const PRODUCT_IMAGES_BUCKET = 'products';
const BLOG_COVERS_BUCKET = 'blog-covers';

function confirmAsync(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(message));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'OK', onPress: () => resolve(true) },
    ]);
  });
}

// Draw dates are only ever set once entries fill up and the admin decides "1 week from now,
// 10 PM" -- that decision is still made manually, this just replaces free-typing it (which the
// live countdown timer on Home silently breaks on for any typo/unexpected format) with a picker
// that always produces a valid, unambiguous date. Remount via `key` (see call site) rather than a
// sync effect to reset to a different product's existing value when switching between products.
function DrawDatePicker({
  value,
  onChange,
  styles,
  theme,
}: {
  value: string;
  onChange: (next: string) => void;
  styles: ReturnType<typeof createStyles>;
  theme: AdminTheme;
}) {
  const existing = parseDrawDateParts(value);
  const [day, setDay] = useState(existing ? String(existing.day) : '');
  const [month, setMonth] = useState(existing ? String(existing.month) : '');
  const [year, setYear] = useState(existing ? String(existing.year) : '');
  const [hour12, setHour12] = useState(
    existing ? String(existing.hour24 % 12 === 0 ? 12 : existing.hour24 % 12) : ''
  );
  const [minute, setMinute] = useState(existing ? String(existing.minute).padStart(2, '0') : '');
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>(existing && existing.hour24 >= 12 ? 'PM' : 'AM');

  function commit(next: { day: string; month: string; year: string; hour12: string; minute: string; meridiem: 'AM' | 'PM' }) {
    const d = Number(next.day);
    const m = Number(next.month);
    const y = Number(next.year);
    const h = Number(next.hour12);
    const min = Number(next.minute);
    const valid =
      Number.isInteger(d) && d >= 1 && d <= 31 &&
      Number.isInteger(m) && m >= 1 && m <= 12 &&
      Number.isInteger(y) && y >= 2024 && y <= 2100 &&
      Number.isInteger(h) && h >= 1 && h <= 12 &&
      Number.isInteger(min) && min >= 0 && min <= 59;
    if (!valid) {
      onChange('');
      return;
    }
    const hour24 = next.meridiem === 'PM' ? (h % 12) + 12 : h % 12;
    onChange(buildDrawDateIso({ day: d, month: m, year: y, hour24, minute: min }));
  }

  return (
    <View style={styles.drawDatePicker}>
      <Text style={styles.drawDatePickerLabel}>Draw Date & Time (Pakistan time) -- set once entries fill up</Text>
      <View style={styles.drawDateRow}>
        <TextInput
          style={styles.drawDateField}
          placeholder="DD"
          placeholderTextColor="#666"
          keyboardType="number-pad"
          maxLength={2}
          value={day}
          onChangeText={(next) => { setDay(next); commit({ day: next, month, year, hour12, minute, meridiem }); }}
        />
        <Text style={styles.drawDateSeparator}>/</Text>
        <TextInput
          style={styles.drawDateField}
          placeholder="MM"
          placeholderTextColor="#666"
          keyboardType="number-pad"
          maxLength={2}
          value={month}
          onChangeText={(next) => { setMonth(next); commit({ day, month: next, year, hour12, minute, meridiem }); }}
        />
        <Text style={styles.drawDateSeparator}>/</Text>
        <TextInput
          style={[styles.drawDateField, styles.drawDateFieldYear]}
          placeholder="YYYY"
          placeholderTextColor="#666"
          keyboardType="number-pad"
          maxLength={4}
          value={year}
          onChangeText={(next) => { setYear(next); commit({ day, month, year: next, hour12, minute, meridiem }); }}
        />
        <TextInput
          style={[styles.drawDateField, styles.drawDateFieldSpaced]}
          placeholder="HH"
          placeholderTextColor="#666"
          keyboardType="number-pad"
          maxLength={2}
          value={hour12}
          onChangeText={(next) => { setHour12(next); commit({ day, month, year, hour12: next, minute, meridiem }); }}
        />
        <Text style={styles.drawDateSeparator}>:</Text>
        <TextInput
          style={styles.drawDateField}
          placeholder="MM"
          placeholderTextColor="#666"
          keyboardType="number-pad"
          maxLength={2}
          value={minute}
          onChangeText={(next) => { setMinute(next); commit({ day, month, year, hour12, minute: next, meridiem }); }}
        />
        <TouchableOpacity
          style={[styles.drawDateMeridiem, meridiem === 'AM' && styles.drawDateMeridiemActive]}
          onPress={() => { setMeridiem('AM'); commit({ day, month, year, hour12, minute, meridiem: 'AM' }); }}
        >
          <Text style={[styles.drawDateMeridiemText, meridiem === 'AM' && { color: theme.background }]}>AM</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.drawDateMeridiem, meridiem === 'PM' && styles.drawDateMeridiemActive]}
          onPress={() => { setMeridiem('PM'); commit({ day, month, year, hour12, minute, meridiem: 'PM' }); }}
        >
          <Text style={[styles.drawDateMeridiemText, meridiem === 'PM' && { color: theme.background }]}>PM</Text>
        </TouchableOpacity>
      </View>
      {value ? (
        <Text style={styles.drawDatePreview}>Will save as: {value.replace('T', ' ').replace(/:00$/, '')}</Text>
      ) : (day || month || year || hour12 || minute) ? (
        <Text style={styles.drawDatePreviewInvalid}>Incomplete or invalid -- won't be saved until all fields are valid</Text>
      ) : null}
    </View>
  );
}

export default function AdminScreen() {
  const { mode, theme, setThemeMode } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileError, setTurnstileError] = useState('');
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [drawsSearch, setDrawsSearch] = useState('');
  const [paymentsSearch, setPaymentsSearch] = useState('');
  const [paymentsHistorySearch, setPaymentsHistorySearch] = useState('');
  const [paymentsHistoryExpanded, setPaymentsHistoryExpanded] = useState(false);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(new Set());
  const [bulkPaymentsProcessing, setBulkPaymentsProcessing] = useState(false);
  const [walletTopupRequests, setWalletTopupRequests] = useState<WalletTopupRequest[]>([]);
  const [walletTopupReceiptUrls, setWalletTopupReceiptUrls] = useState<Record<string, string>>({});
  const [walletTopupsSearch, setWalletTopupsSearch] = useState('');
  const [selectedWalletTopupIds, setSelectedWalletTopupIds] = useState<Set<string>>(new Set());
  const [bulkWalletTopupsProcessing, setBulkWalletTopupsProcessing] = useState(false);
  const [walletBalances, setWalletBalances] = useState<Record<string, number>>({});
  const [walletAdjustExpandedPhone, setWalletAdjustExpandedPhone] = useState<string | null>(null);
  const [walletAdjustDrafts, setWalletAdjustDrafts] = useState<Record<string, { amount: string; type: WalletTransactionType; reason: string }>>({});
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportTicketResolvingId, setSupportTicketResolvingId] = useState<string | null>(null);
  const [refundFormExpandedPhone, setRefundFormExpandedPhone] = useState<string | null>(null);
  const [refundDrafts, setRefundDrafts] = useState<Record<string, { transactionId: string; reason: string }>>({});
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundResolvingId, setRefundResolvingId] = useState<string | null>(null);
  const [walletAdjustSaving, setWalletAdjustSaving] = useState<string | null>(null);
  const [usersSearch, setUsersSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [userProfileDetails, setUserProfileDetails] = useState<Record<string, { city: string | null; date_of_birth: string | null }>>({});
  const [entries, setEntries] = useState<Entry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [receiptUrls, setReceiptUrls] = useState<Record<string, string>>({});
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [maxEntries, setMaxEntries] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [drawDate, setDrawDate] = useState('');
  const [liveLink, setLiveLink] = useState('');
  const [winnerPhoto, setWinnerPhoto] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [winnerPhotoUploading, setWinnerPhotoUploading] = useState(false);
  const [productImageUploading, setProductImageUploading] = useState(false);
  const seoDefaults = {
    seo_title: '',
    meta_description: '',
    meta_keywords: '',
    slug: '',
    indexable: true,
  };
  const [seoData, setSeoData] = useState({ ...seoDefaults });
  const [seoExpanded, setSeoExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [indexNowSubmitting, setIndexNowSubmitting] = useState(false);
  const editingIdRef = useRef<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [announcementSaved, setAnnouncementSaved] = useState(false);
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [googleReviewLinkSaved, setGoogleReviewLinkSaved] = useState(false);
  const [homeAdImagesInput, setHomeAdImagesInput] = useState('');
  const [homeAdImagesSaved, setHomeAdImagesSaved] = useState(false);
  const [homeAdUploading, setHomeAdUploading] = useState(false);
  const [trustBadges, setTrustBadges] = useState<[string, string, string]>(DEFAULT_TRUST_BADGES);
  const [trustBadgesSaving, setTrustBadgesSaving] = useState(false);
  const [trustBadgesSaved, setTrustBadgesSaved] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [paymentAccountsSaving, setPaymentAccountsSaving] = useState(false);
  const [paymentAccountsSaved, setPaymentAccountsSaved] = useState(false);
  const [paymentQrUploadingIndex, setPaymentQrUploadingIndex] = useState<number | null>(null);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [notificationSending, setNotificationSending] = useState(false);
  const [verificationDocuments, setVerificationDocuments] = useState<VerificationDocument[]>([]);
  const [verificationTitle, setVerificationTitle] = useState('');
  const [verificationDescription, setVerificationDescription] = useState('');
  const [verificationImageUrl, setVerificationImageUrl] = useState('');
  const [verificationImagePath, setVerificationImagePath] = useState('');
  const [verificationEditingId, setVerificationEditingId] = useState<string | null>(null);
  const [verificationUploading, setVerificationUploading] = useState(false);
  const [verificationSaving, setVerificationSaving] = useState(false);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogSlug, setBlogSlug] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogCategory, setBlogCategory] = useState<BlogCategory>('how-it-works');
  const [blogContent, setBlogContent] = useState('');
  const [blogCoverImage, setBlogCoverImage] = useState('');
  const [blogEditingId, setBlogEditingId] = useState<string | null>(null);
  const [blogUploading, setBlogUploading] = useState(false);
  const [blogSaving, setBlogSaving] = useState(false);
  const [brandShowcaseImages, setBrandShowcaseImages] = useState<BrandShowcaseImage[]>([]);
  const [brandShowcaseUploading, setBrandShowcaseUploading] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialReviewerName, setTestimonialReviewerName] = useState('');
  const [testimonialReviewText, setTestimonialReviewText] = useState('');
  const [testimonialRating, setTestimonialRating] = useState(5);
  const [testimonialSource, setTestimonialSource] = useState<TestimonialSource>('google');
  const [testimonialSourceUrl, setTestimonialSourceUrl] = useState('');
  const [testimonialSaving, setTestimonialSaving] = useState(false);
  const [drawResults, setDrawResults] = useState<DrawResultWithProduct[]>([]);
  const [prizeStatusDrafts, setPrizeStatusDrafts] = useState<Record<string, { status: PrizeStatus; note: string }>>({});
  const [prizeStatusSaving, setPrizeStatusSaving] = useState<string | null>(null);
  const [winnerStatusDrafts, setWinnerStatusDrafts] = useState<Record<string, { status: WinnerStatus; note: string }>>({});
  const [winnerStatusSaving, setWinnerStatusSaving] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<Record<string, { id: string; file_name: string | null }[]>>({});
  const [certificateUploading, setCertificateUploading] = useState<string | null>(null);
  const [drawSessionStates, setDrawSessionStates] = useState<Record<string, string>>({});
  const [auditLog, setAuditLog] = useState<AdminAuditLogEntry[]>([]);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setAuthenticated(data.session?.user.email?.toLowerCase() === ADMIN_EMAIL);
      setAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAuthenticated(session?.user.email?.toLowerCase() === ADMIN_EMAIL);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchProducts();
      fetchUsers();
      fetchUserProfileDetails();
      fetchEntries();
      fetchTransactions();
      fetchWalletTopupRequests();
      fetchWalletBalances();
      fetchRefundRequests();
      fetchSupportTickets();
      fetchDrawResults();
      fetchAuditLog();
      loadAnnouncement();
      loadGoogleReviewLink();
      loadHomeAdImages();
      loadTrustBadgesSettings();
      loadPaymentAccountsSettings();
      loadVerificationDocuments();
      loadBrandShowcaseImages();
      loadTestimonials();
      loadBlogPosts();
    }
  }, [authenticated]);

  async function handleLogin() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      alert('Please enter your admin email and password.');
      return;
    }

    if (normalizedEmail !== ADMIN_EMAIL) {
      alert('This email is not authorized for the admin panel.');
      return;
    }

    if (Platform.OS === 'web' && !turnstileToken) {
      setTurnstileError('Please complete the verification.');
      return;
    }

    setAuthLoading(true);
    setTurnstileError('');
    // TEMP DIAGNOSTIC — remove once the empty gotrue_meta_security regression is confirmed fixed.
    // Never logs the token itself, only whether one is present and its length.
    console.log('[admin-login] turnstileToken present:', Boolean(turnstileToken), 'length:', turnstileToken.length);
    const { data, error } = await signInWithEmail(normalizedEmail, password, turnstileToken || undefined);

    turnstileRef.current?.reset();
    setTurnstileToken('');

    if (error || !data.user) {
      setAuthLoading(false);
      alert('Admin login failed: ' + (error?.message ?? 'Unknown error'));
      return;
    }

    if (data.user.email?.toLowerCase() !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      setAuthLoading(false);
      alert('This account is not authorized for the admin panel.');
      return;
    }

    setPassword('');
    setAuthenticated(true);
    setAuthLoading(false);
  }

  async function handleForgotPassword() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      alert('Please enter your admin email first.');
      return;
    }
    if (normalizedEmail !== ADMIN_EMAIL) {
      alert('This email is not authorized for the admin panel.');
      return;
    }

    setResetSending(true);
    const { error } = await resetPassword(normalizedEmail);
    setResetSending(false);
    if (error) {
      alert('Password reset email could not be sent: ' + error.message);
      return;
    }
    alert('Password reset email sent. Your current password remains active until you complete the reset.');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setAuthenticated(false);
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    await fetchDrawSessionStates();
  }

  async function fetchDrawSessionStates() {
    const { data } = await supabase.from('draw_sessions').select('product_id, state');
    if (!data) return;
    const map: Record<string, string> = {};
    for (const row of data) map[row.product_id] = row.state;
    setDrawSessionStates(map);
  }

  async function fetchUsers() {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
  }

  function exportUsersCsv() {
    downloadCsv('jeetobaz-users.csv', users.map((u) => ({
      member_id: `JB-${u.member_number}`,
      name: u.name,
      phone: u.phone,
      email: u.email || '',
      cnic: u.cnic || '',
      jazzcash_number: u.jazzcash_number || '',
      referral_code: u.referral_code || '',
      created_at: u.created_at,
    })));
  }

  async function fetchUserProfileDetails() {
    const { data } = await supabase.from('user_profile_details').select('auth_user_id, city, date_of_birth');
    if (!data) return;
    const map: Record<string, { city: string | null; date_of_birth: string | null }> = {};
    for (const row of data) {
      map[row.auth_user_id] = { city: row.city, date_of_birth: row.date_of_birth };
    }
    setUserProfileDetails(map);
  }

  async function fetchEntries() {
    const { data } = await supabase.from('entries').select('*');
    if (data) setEntries(data);
  }

  async function fetchTransactions() {
    const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (data) {
      const clearedPaymentIds = await clearPendingPaymentsWithExistingEntries(data);
      const visibleTransactions = data.filter((item) => !clearedPaymentIds.has(item.id));
      setTransactions(visibleTransactions);
      loadReceiptUrls(visibleTransactions);
    }
  }

  function exportTransactionsCsv() {
    downloadCsv('jeetobaz-payments.csv', transactions.map((txn) => ({
      id: txn.id,
      product_id: txn.product_id,
      phone: txn.phone,
      sender_name: txn.sender_name || '',
      sender_phone: txn.sender_phone || '',
      amount: txn.amount,
      payment_method: txn.payment_method || '',
      jazzcash_txn_id: txn.jazzcash_txn_id,
      status: txn.status,
      created_at: txn.created_at,
    })));
  }

  async function clearPendingPaymentsWithExistingEntries(items: Transaction[]) {
    const clearedPaymentIds = new Set<string>();
    const pendingItems = items.filter((item) => item.status === 'pending');
    if (pendingItems.length === 0) return clearedPaymentIds;

    const uniqueProductIds = [...new Set(pendingItems.map((item) => item.product_id))];

    const { data: existingEntries } = await supabase
      .from('entries')
      .select('product_id, phone')
      .in('product_id', uniqueProductIds);

    if (!existingEntries) return clearedPaymentIds;

    const existingSet = new Set(
      existingEntries.map((e) => `${e.product_id}:${e.phone}`)
    );

    for (const item of pendingItems) {
      if (!existingSet.has(`${item.product_id}:${item.phone}`)) continue;

      try {
        await clearApprovedPayment(item);
        clearedPaymentIds.add(item.id);
      } catch (error) {
        console.warn('Unable to clear already-entered payment:', error);
      }
    }

    return clearedPaymentIds;
  }

  async function loadReceiptUrls(items: Transaction[]) {
    const nextUrls: Record<string, string> = {};
    for (const item of items) {
      if (!item.receipt_path) continue;
      if (item.receipt_path.startsWith('data:')) {
        nextUrls[item.id] = item.receipt_path;
        continue;
      }
      const { data } = await supabase.storage
        .from(RECEIPT_BUCKET)
        .createSignedUrl(item.receipt_path, 60 * 60);
      if (data?.signedUrl) nextUrls[item.id] = data.signedUrl;
    }
    setReceiptUrls(nextUrls);
  }

  async function fetchWalletBalances() {
    const { data } = await supabase.from('wallets').select('phone, balance');
    if (!data) return;
    const map: Record<string, number> = {};
    for (const row of data) map[row.phone] = row.balance;
    setWalletBalances(map);
  }

  async function fetchWalletTopupRequests() {
    const { data } = await supabase
      .from('wallet_topup_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) {
      setWalletTopupRequests(data);
      loadWalletTopupReceiptUrls(data);
    }
  }

  async function loadWalletTopupReceiptUrls(items: WalletTopupRequest[]) {
    const nextUrls: Record<string, string> = {};
    for (const item of items) {
      if (!item.receipt_path) continue;
      if (item.receipt_path.startsWith('data:')) {
        nextUrls[item.id] = item.receipt_path;
        continue;
      }
      const { data } = await supabase.storage
        .from(RECEIPT_BUCKET)
        .createSignedUrl(item.receipt_path, 60 * 60);
      if (data?.signedUrl) nextUrls[item.id] = data.signedUrl;
    }
    setWalletTopupReceiptUrls(nextUrls);
  }

  function startEdit(p: Product) {
    editingIdRef.current = p.id;
    setEditingId(p.id);
    setProductName(p.name || '');
    setProductPrice(String(p.price || ''));
    setEntryFee(String(p.entry_fee || ''));
    setMaxEntries(String(p.max_entries || ''));
    setImageUrl(p.image_url || '');
    setDescription(p.description || '');
    setDrawDate(p.draw_date || '');
    setLiveLink(p.live_link || '');
    setWinnerPhoto(p.winner_photo || '');
    setCategory(p.category || null);
    setSeoData({
      seo_title: p.seo_title ?? '',
      meta_description: p.meta_description ?? '',
      meta_keywords: p.meta_keywords ?? '',
      slug: p.slug ?? '',
      indexable: p.indexable ?? true,
    });
    setActiveTab('products');
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  }

  function cancelEdit() {
    editingIdRef.current = null;
    setEditingId(null);
    setProductName(''); setProductPrice(''); setEntryFee('');
    setMaxEntries(''); setImageUrl(''); setDescription(''); setDrawDate('');
    setLiveLink('');
    setWinnerPhoto('');
    setCategory(null);
    setSeoData({ ...seoDefaults });
  }

  async function uploadWinnerPhoto() {
    if (!editingId) {
      alert('Please edit an existing product before uploading its winner photo.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Photo permission is required to upload the winner photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;

    setWinnerPhotoUploading(true);
    try {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const extension = mimeType === 'image/png'
        ? 'png'
        : mimeType === 'image/webp'
          ? 'webp'
          : 'jpg';
      const response = await fetch(asset.uri);
      const fileData = await response.arrayBuffer();
      const filePath = `${editingId}/${Date.now()}.${extension}`;
      const { error } = await supabase.storage
        .from(WINNER_MEDIA_BUCKET)
        .upload(filePath, fileData, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from(WINNER_MEDIA_BUCKET)
        .getPublicUrl(filePath);
      setWinnerPhoto(data.publicUrl);
      alert('Winner photo uploaded. Save Changes to publish it.');
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Winner photo upload failed.';
      alert(message);
    } finally {
      setWinnerPhotoUploading(false);
    }
  }

  async function uploadProductImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Photo permission is required to upload a product image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;

    setProductImageUploading(true);
    try {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const extension = mimeType === 'image/png'
        ? 'png'
        : mimeType === 'image/webp'
          ? 'webp'
          : 'jpg';
      const response = await fetch(asset.uri);
      const fileData = await response.arrayBuffer();
      const filePath = `${editingIdRef.current || 'new'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
      const { error } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(filePath, fileData, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .getPublicUrl(filePath);
      setImageUrl(data.publicUrl);
      alert('Product image uploaded. Save the product to publish it.');
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Product image upload failed.';
      alert(message);
    } finally {
      setProductImageUploading(false);
    }
  }

  async function saveProduct() {
    if (!productName || !productPrice || !entryFee || !maxEntries) {
      alert('Please fill all required fields!'); return;
    }
    const parsedPrice = parseInt(productPrice, 10);
    const parsedEntryFee = parseInt(entryFee, 10);
    const parsedMaxEntries = parseInt(maxEntries, 10);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      alert('Price must be a valid positive number.'); return;
    }
    if (!Number.isFinite(parsedEntryFee) || parsedEntryFee <= 0) {
      alert('Entry fee must be a valid positive number.'); return;
    }
    if (!Number.isFinite(parsedMaxEntries) || parsedMaxEntries <= 0) {
      alert('Max entries must be a valid positive number.'); return;
    }
    const currentEditId = editingIdRef.current;

    const willBeActive = currentEditId
      ? products.find((p) => p.id === currentEditId)?.status === 'active'
      : true;

    const normalizedSlug = slugify(seoData.slug || '');

    if (willBeActive && !normalizedSlug) {
      alert('Slug is required for an active product.');
      return;
    }
    if (normalizedSlug && !isValidSlug(normalizedSlug)) {
      alert('Slug is invalid. Use lowercase letters, numbers and hyphens only.');
      return;
    }

    if (normalizedSlug) {
      let duplicateQuery = supabase.from('products').select('id').eq('slug', normalizedSlug);
      if (currentEditId) {
        duplicateQuery = duplicateQuery.neq('id', currentEditId);
      }
      const { data: duplicateRows, error: duplicateError } = await duplicateQuery.limit(1);
      if (duplicateError) {
        alert('Could not verify slug uniqueness: ' + duplicateError.message);
        return;
      }
      if (duplicateRows && duplicateRows.length > 0) {
        alert('This slug is already used by another product. Choose a different one.');
        return;
      }
    }

    setLoading(true);

    const productData: ProductFormData = {
      name: productName,
      price: parsedPrice,
      entry_fee: parsedEntryFee,
      max_entries: parsedMaxEntries,
      image_url: imageUrl || null,
      description: description || null,
      draw_date: drawDate || null,
      live_link: liveLink || null,
      winner_photo: winnerPhoto || null,
      seo_title: seoData.seo_title || null,
      meta_description: seoData.meta_description || null,
      meta_keywords: seoData.meta_keywords || null,
      slug: normalizedSlug || null,
      indexable: seoData.indexable,
      category: category || null,
    };

    if (currentEditId) {
      const { error } = await supabase.from('products').update(productData).eq('id', currentEditId).select();
      if (error) alert('Save failed: ' + error.message);
      else {
        if (normalizedSlug) pingIndexNow(`/product/${normalizedSlug}`);
        alert('Product updated!'); cancelEdit(); fetchProducts();
      }
    } else {
      const { error } = await supabase.from('products').insert({ ...productData, current_entries: 0, status: 'active' });
      if (error) alert('Add failed: ' + error.message);
      else {
        if (normalizedSlug) pingIndexNow(`/product/${normalizedSlug}`);
        await createUserNotification({
          title: 'New contest added',
          body: `${productName} is now live. Enter the draw today!`,
          kind: 'new-contest',
          link: '/',
        });
        alert('Product added!');
        cancelEdit();
        fetchProducts();
      }
    }
    setLoading(false);
  }

  async function submitAllProductsToIndexNow() {
    const slugs = products.filter((p) => p.slug).map((p) => `/product/${p.slug}`);
    if (slugs.length === 0) {
      alert('No products with a slug to submit.');
      return;
    }
    setIndexNowSubmitting(true);
    await pingIndexNowBulk(slugs);
    setIndexNowSubmitting(false);
    alert(`Submitted ${slugs.length} product(s) to IndexNow.`);
  }

  async function fetchAuditLog() {
    const { data } = await supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setAuditLog(data as AdminAuditLogEntry[]);
  }

  async function logAdminAction(actionType: string, targetId: string | null, details?: Record<string, unknown>) {
    try {
      await supabase.from('admin_audit_log').insert({ action_type: actionType, target_id: targetId, details: details || null });
      await fetchAuditLog();
    } catch {
      // Best-effort only — never let audit logging block or fail an admin action.
    }
  }

  async function deleteProduct(id: string) {
    const confirmed = await confirmAsync('Delete', 'Delete this product?');
    if (!confirmed) return;
    const deletedProduct = products.find((p) => p.id === id);
    await supabase.from('products').delete().eq('id', id);
    void logAdminAction('product_deleted', id, { name: deletedProduct?.name });
    fetchProducts();
  }

  async function toggleStatus(p: Product) {
    const newStatus = p.status === 'active' ? 'completed' : 'active';
    await supabase.from('products').update({ status: newStatus }).eq('id', p.id);
    void logAdminAction('product_status_changed', p.id, { name: p.name, from: p.status, to: newStatus });
    fetchProducts();
  }

  async function sendDrawReminder(p: Product) {
    try {
      const { error } = await createNotification({
        title: 'Draw reminder',
        body: `${p.name} currently has ${p.current_entries || 0}/${p.max_entries} participants. Check the draw page for scheduling updates.`,
        kind: 'draw-reminder',
        link: '/',
      });

      if (error) {
        alert('Draw reminder could not be sent. Error: ' + error.message);
        return;
      }

      alert('Draw reminder notification sent to all users.');
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Unknown notification error.';
      alert('Draw reminder could not be sent. Error: ' + message);
    }
  }

  async function fetchDrawResults() {
    const { data } = await supabase
      .from('draw_results')
      .select('*, products(*)')
      .order('drawn_at', { ascending: false });
    if (data) setDrawResults(data as unknown as DrawResultWithProduct[]);
    await fetchCertificates();
  }

  function exportWinnersCsv() {
    downloadCsv('jeetobaz-winners.csv', drawResults.map((result) => ({
      product: result.products?.name || 'Unknown Draw',
      winner_name: result.winner_name,
      winner_phone: result.winner_phone,
      ticket_number: result.winner_ticket_number,
      total_entries: result.total_entries,
      drawn_at: result.drawn_at,
      prize_status: result.prize_status,
      winner_status: result.winner_status,
    })));
  }

  function exportEntriesCsv() {
    downloadCsv('jeetobaz-entries.csv', entries.map((entry) => ({
      product_id: entry.product_id,
      name: entry.name || '',
      phone: entry.phone,
      ticket_number: entry.ticket_number || '',
      entry_source: entry.entry_source || '',
      created_at: entry.created_at,
    })));
  }

  async function fetchCertificates() {
    const { data } = await supabase
      .from('winner_certificates')
      .select('id, draw_result_id, file_name')
      .order('created_at', { ascending: false });
    if (!data) return;
    const grouped: Record<string, { id: string; file_name: string | null }[]> = {};
    for (const row of data as { id: string; draw_result_id: string; file_name: string | null }[]) {
      if (!grouped[row.draw_result_id]) grouped[row.draw_result_id] = [];
      grouped[row.draw_result_id].push({ id: row.id, file_name: row.file_name });
    }
    setCertificates(grouped);
  }

  async function uploadCertificate(result: DrawResultWithProduct) {
    if (!result.winner_user_id) {
      alert('This winner has no linked account (entry approved before account-linking was added), so certificate access cannot be securely granted.');
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });
    if (pickerResult.canceled || !pickerResult.assets[0]) return;

    setCertificateUploading(result.id);
    try {
      const asset = pickerResult.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
      const response = await fetch(asset.uri);
      const fileData = await response.arrayBuffer();
      const filePath = `${result.id}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(CERTIFICATES_BUCKET)
        .upload(filePath, fileData, { contentType: mimeType, upsert: false });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('winner_certificates').insert({
        draw_result_id: result.id,
        winner_user_id: result.winner_user_id,
        storage_path: filePath,
        file_name: asset.fileName || null,
      });
      if (insertError) throw insertError;

      void logAdminAction('certificate_uploaded', result.product_id, { draw_result_id: result.id });
      await fetchCertificates();
      alert('Certificate uploaded — the winner can now see it under "My Certificates".');
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Certificate upload failed.';
      alert(message);
    } finally {
      setCertificateUploading(null);
    }
  }

  function getPrizeStatusDraft(result: DrawResultWithProduct) {
    return prizeStatusDrafts[result.product_id] || { status: result.prize_status, note: result.prize_tracking_note || '' };
  }

  async function savePrizeStatus(result: DrawResultWithProduct) {
    const draft = getPrizeStatusDraft(result);
    setPrizeStatusSaving(result.product_id);
    const { error } = await supabase.rpc('update_prize_status', {
      p_product_id: result.product_id,
      p_status: draft.status,
      p_tracking_note: draft.note.trim() || null,
    });
    setPrizeStatusSaving(null);
    if (error) {
      alert('Could not update prize status: ' + error.message);
      return;
    }
    void logAdminAction('prize_status_updated', result.product_id, { status: draft.status, note: draft.note || null });
    await fetchDrawResults();
  }

  function getWinnerStatusDraft(result: DrawResultWithProduct) {
    return winnerStatusDrafts[result.id] || { status: result.winner_status, note: '' };
  }

  async function saveWinnerStatus(result: DrawResultWithProduct) {
    const draft = getWinnerStatusDraft(result);
    const justVerified = result.winner_status !== 'verified' && draft.status === 'verified';
    setWinnerStatusSaving(result.id);
    const { error } = await supabase.rpc('update_winner_status', {
      p_draw_result_id: result.id,
      p_status: draft.status,
      p_note: draft.note.trim() || null,
    });
    setWinnerStatusSaving(null);
    if (error) {
      alert('Could not update winner status: ' + error.message);
      return;
    }
    if (justVerified) {
      const { link: reviewLink } = await getGoogleReviewLink();
      const prizeName = result.products?.name || 'your prize';
      await createUserNotification({
        title: 'Congratulations again! 🎉',
        body: reviewLink
          ? `Your win of ${prizeName} is now verified. If you have a minute, a quick honest review would mean a lot to us.`
          : `Your win of ${prizeName} is now verified. Thank you for being part of JeetoBaz!`,
        targetPhone: result.winner_phone,
        link: reviewLink || null,
        kind: 'review-request',
      });
    }
    void logAdminAction('winner_status_updated', result.product_id, { status: draft.status, note: draft.note || null });
    await fetchDrawResults();
  }

  async function loadAnnouncement() {
    const { announcement: savedAnnouncement, error } = await getAnnouncement();
    if (!error && savedAnnouncement) {
      setAnnouncement(savedAnnouncement);
      return;
    }
    const localAnnouncement = await getStoredValue('announcement');
    setAnnouncement(localAnnouncement || '');
  }

  async function saveAnnouncement() {
    const { announcement: savedAnnouncement, error } = await saveAnnouncementSetting(announcement);
    if (error) {
      alert('Announcement could not be saved. Error: ' + error.message);
      return;
    }
    setAnnouncement(savedAnnouncement);
    await setStoredValue('announcement', savedAnnouncement);
    setAnnouncementSaved(true);
    setTimeout(() => setAnnouncementSaved(false), 2000);
  }

  async function loadGoogleReviewLink() {
    const { link, error } = await getGoogleReviewLink();
    if (!error) setGoogleReviewLink(link);
  }

  async function saveGoogleReviewLinkSetting() {
    const { link, error } = await saveGoogleReviewLink(googleReviewLink);
    if (error) {
      alert('Google review link could not be saved. Error: ' + error.message);
      return;
    }
    setGoogleReviewLink(link);
    setGoogleReviewLinkSaved(true);
    setTimeout(() => setGoogleReviewLinkSaved(false), 2000);
  }

  function parseHomeAdImagesInput() {
    return homeAdImagesInput
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 10);
  }

  async function loadHomeAdImages() {
    const { images } = await getHomeAdImages();
    setHomeAdImagesInput(images.join('\n'));
  }

  async function saveHomeAdImageSettings(nextImages = parseHomeAdImagesInput()) {
    const { images, error } = await saveHomeAdImages(nextImages);
    if (error) {
      alert('Home ad images could not be saved. Error: ' + error.message);
      return;
    }
    setHomeAdImagesInput(images.join('\n'));
    setHomeAdImagesSaved(true);
    setTimeout(() => setHomeAdImagesSaved(false), 2000);
  }

  async function uploadHomeAdImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Photo permission is required to upload the ad image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 6],
      quality: 0.82,
    });

    if (result.canceled || !result.assets[0]) return;

    setHomeAdUploading(true);
    try {
      const existingImages = parseHomeAdImagesInput();
      if (existingImages.length >= 10) {
        alert('Maximum 10 home ad images allowed.');
        return;
      }

      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const extension = mimeType === 'image/png'
        ? 'png'
        : mimeType === 'image/webp'
          ? 'webp'
          : 'jpg';
      const response = await fetch(asset.uri);
      const fileData = await response.arrayBuffer();
      const filePath = `home/${Date.now()}.${extension}`;
      const { error } = await supabase.storage
        .from(HOME_ADS_BUCKET)
        .upload(filePath, fileData, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from(HOME_ADS_BUCKET)
        .getPublicUrl(filePath);
      await saveHomeAdImageSettings([...existingImages, data.publicUrl]);
      alert('Home ad image uploaded and saved.');
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Home ad image upload failed.';
      alert(message);
    } finally {
      setHomeAdUploading(false);
    }
  }

  async function loadTrustBadgesSettings() {
    const { badges } = await getTrustBadges();
    setTrustBadges(badges);
  }

  async function saveTrustBadgesSettings() {
    setTrustBadgesSaving(true);
    const { badges, error } = await saveTrustBadges(trustBadges);
    setTrustBadgesSaving(false);
    if (error) {
      alert('Trust badges could not be saved. Error: ' + error.message);
      return;
    }
    setTrustBadges(badges);
    setTrustBadgesSaved(true);
    setTimeout(() => setTrustBadgesSaved(false), 2000);
  }

  function updateTrustBadge(index: 0 | 1 | 2, value: string) {
    setTrustBadges((current) => {
      const next: [string, string, string] = [...current];
      next[index] = value;
      return next;
    });
  }

  async function loadPaymentAccountsSettings() {
    const { accounts } = await getPaymentAccounts();
    setPaymentAccounts(accounts);
  }

  async function savePaymentAccountsSettings(nextAccounts = paymentAccounts) {
    setPaymentAccountsSaving(true);
    const { accounts, error } = await savePaymentAccounts(nextAccounts);
    setPaymentAccountsSaving(false);
    if (error) {
      alert('Payment accounts could not be saved. Error: ' + error.message);
      return;
    }
    setPaymentAccounts(accounts);
    setPaymentAccountsSaved(true);
    setTimeout(() => setPaymentAccountsSaved(false), 2000);
  }

  function updatePaymentAccountField(index: number, field: 'method' | 'number' | 'accountTitle', value: string) {
    setPaymentAccounts((current) => current.map((account, i) => (i === index ? { ...account, [field]: value } : account)));
  }

  function togglePaymentAccountActive(index: number) {
    setPaymentAccounts((current) => {
      const next = current.map((account, i) => (i === index ? { ...account, active: !account.active } : account));
      void savePaymentAccountsSettings(next);
      return next;
    });
  }

  function addPaymentAccountRow() {
    setPaymentAccounts((current) => [...current, { method: '', number: '', accountTitle: '', qrImageUrl: null, active: true }]);
  }

  function removePaymentAccountRow(index: number) {
    Alert.alert('Remove payment method?', 'Users will no longer see this option on the payment screen once you save.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const next = paymentAccounts.filter((_, i) => i !== index);
          setPaymentAccounts(next);
          void savePaymentAccountsSettings(next);
        },
      },
    ]);
  }

  async function uploadPaymentAccountQr(index: number) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Photo permission is required to upload a QR code.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return;

    setPaymentQrUploadingIndex(index);
    try {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
      const response = await fetch(asset.uri);
      const fileData = await response.arrayBuffer();
      const filePath = `${Date.now()}.${extension}`;
      const { error } = await supabase.storage
        .from(PAYMENT_QR_CODES_BUCKET)
        .upload(filePath, fileData, { contentType: mimeType, upsert: false });

      if (error) throw error;

      const { data } = supabase.storage.from(PAYMENT_QR_CODES_BUCKET).getPublicUrl(filePath);
      const next = paymentAccounts.map((account, i) => (i === index ? { ...account, qrImageUrl: data.publicUrl } : account));
      setPaymentAccounts(next);
      await savePaymentAccountsSettings(next);
      alert('QR code uploaded and saved.');
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'QR code upload failed.';
      alert(message);
    } finally {
      setPaymentQrUploadingIndex(null);
    }
  }

  async function loadVerificationDocuments() {
    const { data, error } = await getAllVerificationDocuments();
    if (error) {
      console.warn('Unable to load verification documents:', error.message);
      return;
    }
    setVerificationDocuments(data || []);
  }

  function resetVerificationForm() {
    setVerificationTitle('');
    setVerificationDescription('');
    setVerificationImageUrl('');
    setVerificationImagePath('');
    setVerificationEditingId(null);
  }

  async function loadBrandShowcaseImages() {
    const { data, error } = await getAllBrandShowcaseImages();
    if (error) {
      console.warn('Unable to load brand showcase images:', error.message);
      return;
    }
    setBrandShowcaseImages(data || []);
  }

  async function uploadBrandShowcaseImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Photo permission is required to upload a showcase image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5 MB.');
      return;
    }

    setBrandShowcaseUploading(true);
    try {
      const mimeType = asset.mimeType || 'image/jpeg';
      const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
      const response = await fetch(asset.uri);
      const fileData = await response.arrayBuffer();
      const filePath = `showcase/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(BRAND_SHOWCASE_BUCKET)
        .upload(filePath, fileData, { contentType: mimeType, upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(BRAND_SHOWCASE_BUCKET).getPublicUrl(filePath);
      const { error: insertError } = await createBrandShowcaseImage({ image_url: data.publicUrl, image_path: filePath });
      if (insertError) throw insertError;

      await loadBrandShowcaseImages();
      alert('Showcase image published.');
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Showcase image upload failed.';
      alert(message);
    } finally {
      setBrandShowcaseUploading(false);
    }
  }

  async function toggleBrandShowcaseVisibility(image: BrandShowcaseImage) {
    const { error } = await updateBrandShowcaseImageVisibility(image.id, !image.is_visible);
    if (error) {
      alert('Visibility could not be changed. Error: ' + error.message);
      return;
    }
    await loadBrandShowcaseImages();
  }

  async function removeBrandShowcaseImage(image: BrandShowcaseImage) {
    const confirmed = await confirmAsync('Delete image', 'Delete this showcase image?');
    if (!confirmed) return;

    const { error } = await deleteBrandShowcaseImage(image.id);
    if (error) {
      alert('Image could not be deleted. Error: ' + error.message);
      return;
    }

    const { error: storageError } = await supabase.storage.from(BRAND_SHOWCASE_BUCKET).remove([image.image_path]);
    if (storageError) console.warn('Image record deleted but storage cleanup failed:', storageError.message);
    await loadBrandShowcaseImages();
  }

  async function loadTestimonials() {
    const { data, error } = await getAllTestimonials();
    if (error) {
      console.warn('Unable to load testimonials:', error.message);
      return;
    }
    setTestimonials(data || []);
  }

  function resetTestimonialForm() {
    setTestimonialReviewerName('');
    setTestimonialReviewText('');
    setTestimonialRating(5);
    setTestimonialSource('google');
    setTestimonialSourceUrl('');
  }

  async function addTestimonial() {
    if (testimonialReviewerName.trim().length < 2) {
      alert('Enter the reviewer’s name.');
      return;
    }
    if (testimonialReviewText.trim().length < 10) {
      alert('Paste the actual review text (at least 10 characters) -- never write one yourself.');
      return;
    }
    setTestimonialSaving(true);
    const { error } = await createTestimonial({
      reviewer_name: testimonialReviewerName.trim(),
      review_text: testimonialReviewText.trim(),
      rating: testimonialRating,
      source: testimonialSource,
      source_url: testimonialSourceUrl.trim() || undefined,
    });
    setTestimonialSaving(false);
    if (error) {
      alert('Testimonial could not be saved. Error: ' + error.message);
      return;
    }
    resetTestimonialForm();
    await loadTestimonials();
  }

  async function toggleTestimonialVisibility(testimonial: Testimonial) {
    const { error } = await updateTestimonialVisibility(testimonial.id, !testimonial.is_visible);
    if (error) {
      alert('Visibility could not be changed. Error: ' + error.message);
      return;
    }
    await loadTestimonials();
  }

  async function removeTestimonial(testimonial: Testimonial) {
    const confirmed = await confirmAsync('Delete testimonial', `Delete ${testimonial.reviewer_name}'s testimonial?`);
    if (!confirmed) return;

    const { error } = await deleteTestimonial(testimonial.id);
    if (error) {
      alert('Testimonial could not be deleted. Error: ' + error.message);
      return;
    }
    await loadTestimonials();
  }

  function startVerificationEdit(document: VerificationDocument) {
    setVerificationEditingId(document.id);
    setVerificationTitle(document.title);
    setVerificationDescription(document.description);
    setVerificationImageUrl(document.image_url);
    setVerificationImagePath(document.image_path);
  }

  async function uploadVerificationImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Photo permission is required to upload a document image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5 MB.');
      return;
    }

    setVerificationUploading(true);
    try {
      const mimeType = asset.mimeType || 'image/jpeg';
      const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
      const response = await fetch(asset.uri);
      const fileData = await response.arrayBuffer();
      const filePath = `documents/${Date.now()}.${extension}`;
      const { error } = await supabase.storage
        .from(VERIFICATION_DOCUMENTS_BUCKET)
        .upload(filePath, fileData, { contentType: mimeType, upsert: false });

      if (error) throw error;

      const { data } = supabase.storage.from(VERIFICATION_DOCUMENTS_BUCKET).getPublicUrl(filePath);
      setVerificationImageUrl(data.publicUrl);
      setVerificationImagePath(filePath);
      alert('Document image uploaded. Save the document to publish it.');
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Document image upload failed.';
      alert(message);
    } finally {
      setVerificationUploading(false);
    }
  }

  async function saveVerificationDocument() {
    const title = verificationTitle.trim();
    const documentDescription = verificationDescription.trim();
    if (!title || !documentDescription || !verificationImageUrl || !verificationImagePath) {
      alert('Title, description and document image are required.');
      return;
    }

    setVerificationSaving(true);
    const wasEditing = Boolean(verificationEditingId);
    const payload = {
      title,
      description: documentDescription,
      image_url: verificationImageUrl,
      image_path: verificationImagePath,
    };
    const { error } = verificationEditingId
      ? await updateVerificationDocument(verificationEditingId, payload)
      : await createVerificationDocument(payload);
    setVerificationSaving(false);

    if (error) {
      alert('Document could not be saved. Error: ' + error.message);
      return;
    }

    resetVerificationForm();
    await loadVerificationDocuments();
    alert(wasEditing ? 'Document updated.' : 'Document published.');
  }

  async function toggleVerificationVisibility(document: VerificationDocument) {
    const { error } = await updateVerificationDocument(document.id, { is_visible: !document.is_visible });
    if (error) {
      alert('Document visibility could not be changed. Error: ' + error.message);
      return;
    }
    await loadVerificationDocuments();
  }

  async function removeVerificationDocument(document: VerificationDocument) {
    const confirmed = await confirmAsync('Delete document', `Delete “${document.title}”?`);
    if (!confirmed) return;

    const { error } = await deleteVerificationDocument(document.id);
    if (error) {
      alert('Document could not be deleted. Error: ' + error.message);
      return;
    }

    if (document.image_path) {
      const { error: storageError } = await supabase.storage
        .from(VERIFICATION_DOCUMENTS_BUCKET)
        .remove([document.image_path]);
      if (storageError) console.warn('Document record deleted but image cleanup failed:', storageError.message);
    }
    if (verificationEditingId === document.id) resetVerificationForm();
    await loadVerificationDocuments();
  }

  async function loadBlogPosts() {
    const { data, error } = await getAllBlogPosts();
    if (error) {
      console.warn('Unable to load blog posts:', error.message);
      return;
    }
    setBlogPosts(data || []);
  }

  function resetBlogForm() {
    setBlogTitle('');
    setBlogSlug('');
    setBlogExcerpt('');
    setBlogCategory('how-it-works');
    setBlogContent('');
    setBlogCoverImage('');
    setBlogEditingId(null);
  }

  function startBlogEdit(post: BlogPost) {
    setBlogEditingId(post.id);
    setBlogTitle(post.title);
    setBlogSlug(post.slug);
    setBlogExcerpt(post.excerpt);
    setBlogCategory(post.category);
    setBlogContent(post.content);
    setBlogCoverImage(post.cover_image);
  }

  async function uploadBlogCover() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Photo permission is required to upload a cover image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5 MB.');
      return;
    }

    setBlogUploading(true);
    try {
      const mimeType = asset.mimeType || 'image/jpeg';
      const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
      const response = await fetch(asset.uri);
      const fileData = await response.arrayBuffer();
      const filePath = `covers/${Date.now()}.${extension}`;
      const { error } = await supabase.storage
        .from(BLOG_COVERS_BUCKET)
        .upload(filePath, fileData, { contentType: mimeType, upsert: false });

      if (error) throw error;

      const { data } = supabase.storage.from(BLOG_COVERS_BUCKET).getPublicUrl(filePath);
      setBlogCoverImage(data.publicUrl);
      alert('Cover image uploaded. Save the article to publish it.');
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Cover image upload failed.';
      alert(message);
    } finally {
      setBlogUploading(false);
    }
  }

  async function saveBlogPost() {
    const title = blogTitle.trim();
    const excerpt = blogExcerpt.trim();
    const content = blogContent.trim();
    const slug = slugify(blogSlug.trim() || title);
    if (!title || !excerpt || !content || !blogCoverImage || !isValidSlug(slug)) {
      alert('Title, slug, excerpt, content and a cover image are all required.');
      return;
    }

    setBlogSaving(true);
    const wasEditing = Boolean(blogEditingId);
    const payload = {
      slug,
      title,
      excerpt,
      category: blogCategory,
      content,
      cover_image: blogCoverImage,
      read_minutes: estimateReadMinutes(content),
    };
    const { error } = blogEditingId
      ? await updateBlogPost(blogEditingId, payload)
      : await createBlogPost(payload);
    setBlogSaving(false);

    if (error) {
      alert('Article could not be saved. Error: ' + error.message);
      return;
    }

    resetBlogForm();
    await loadBlogPosts();
    alert(wasEditing ? 'Article updated.' : 'Article published.');
  }

  async function toggleBlogVisibility(post: BlogPost) {
    const { error } = await updateBlogPost(post.id, { is_visible: !post.is_visible });
    if (error) {
      alert('Article visibility could not be changed. Error: ' + error.message);
      return;
    }
    await loadBlogPosts();
  }

  async function removeBlogPost(post: BlogPost) {
    const confirmed = await confirmAsync('Delete article', `Delete "${post.title}"?`);
    if (!confirmed) return;

    const { error } = await deleteBlogPost(post.id);
    if (error) {
      alert('Article could not be deleted. Error: ' + error.message);
      return;
    }

    if (blogEditingId === post.id) resetBlogForm();
    await loadBlogPosts();
  }

  async function sendGlobalNotification() {
    const title = notificationTitle.trim();
    const body = notificationBody.trim();
    if (!title || !body) {
      alert('A notification title and message are required.');
      return;
    }

    setNotificationSending(true);
    const { error } = await createNotification({
      title,
      body,
      kind: 'admin',
      link: '/',
    });
    setNotificationSending(false);

    if (error) {
      alert('Notification could not be sent. Error: ' + error.message);
      return;
    }

    setNotificationTitle('');
    setNotificationBody('');
    alert('Notification sent to all users.');
  }

  async function clearApprovedPayment(txn: Transaction) {
    if (txn.receipt_path && !txn.receipt_path.startsWith('data:')) {
      const { error: receiptDeleteError } = await supabase.storage.from(RECEIPT_BUCKET).remove([txn.receipt_path]);
      if (receiptDeleteError) throw receiptDeleteError;
    }

    const { data: updatedPayment, error: paymentUpdateError } = await supabase
      .from('transactions')
      .update({ status: 'approved', receipt_path: null })
      .eq('id', txn.id)
      .select('id')
      .maybeSingle();

    if (paymentUpdateError) throw paymentUpdateError;
    if (!updatedPayment) throw new Error('Database permission missing for payment approval update.');
  }

  // Core logic shared by the single Approve button and bulk-approve -- returns a result instead
  // of alert()-ing or refetching directly, so bulk-approve can run this per selected payment
  // without popping N confirm/alert dialogs, then refetch once at the end.
  async function approvePaymentCore(txn: Transaction): Promise<{ ok: boolean; message: string }> {
    const entryPhone = txn.phone;
    const entryName = txn.user_name || undefined;

    const { data: existing } = await supabase
      .from('entries')
      .select('id')
      .eq('product_id', txn.product_id)
      .eq('phone', entryPhone)
      .maybeSingle();

    if (existing) {
      try {
        await clearApprovedPayment(txn);
      } catch (error) {
        const message = error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Payment cleanup failed.';
        return { ok: false, message: 'Payment cleanup failed: ' + message };
      }
      const existingProductName = products.find((p) => p.id === txn.product_id)?.name || 'your draw';
      await createUserNotification({
        title: 'Payment confirmed',
        body: `Your payment for ${existingProductName} has been confirmed. Your entry is already active.`,
        targetPhone: entryPhone,
        kind: 'payment-confirmed',
        link: '/entries',
      });
      void logAdminAction('payment_approved', txn.id, { product_id: txn.product_id, phone: entryPhone, note: 'entry already existed' });
      return { ok: true, message: 'Entry already exists. Payment approved and receipt cleared.' };
    }

    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('approve_entry_atomic', {
        p_product_id: txn.product_id,
        p_phone: entryPhone,
        p_name: entryName,
        p_transaction_id: txn.jazzcash_txn_id,
      })
      .single();

    if (rpcError) {
      return { ok: false, message: 'Entry approval failed: ' + rpcError.message };
    }

    if (!rpcResult?.ok) {
      return { ok: false, message: rpcResult?.error || 'Entry approval failed.' };
    }

    const product = products.find((p) => p.id === txn.product_id);

    try {
      await clearApprovedPayment(txn);
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Payment cleanup failed.';
      return { ok: true, message: 'Entry added, but payment cleanup failed: ' + message };
    }

    const productName = product?.name || 'your draw';
    await createUserNotification({
      title: 'Payment confirmed',
      body: `Your entry for ${productName} has been approved. Good luck!`,
      targetPhone: entryPhone,
      kind: 'payment-confirmed',
      link: '/entries',
    });

    if (rpcResult?.new_entries != null && product && rpcResult.new_entries >= product.max_entries) {
      await createUserNotification({
        title: 'Draw ready',
        body: `${productName} has reached the required number of participants. JeetoBaz will announce the draw date and time.`,
        kind: 'draw-ready',
        link: '/',
      });
    }

    void logAdminAction('payment_approved', txn.id, { product_id: txn.product_id, phone: entryPhone, entry_id: rpcResult?.entry_id });
    return { ok: true, message: 'Payment approved and receipt deleted.' };
  }

  async function approvePayment(txn: Transaction) {
    const confirmed = await confirmAsync('Approve', 'Approve this payment and add entry? Receipt screenshot will be deleted after approval.');
    if (!confirmed) return;
    const result = await approvePaymentCore(txn);
    alert(result.message);
    fetchProducts();
    fetchEntries();
    fetchTransactions();
  }

  async function rejectPaymentCore(txn: Transaction): Promise<{ ok: boolean; message: string }> {
    const { error } = await supabase.from('transactions').update({ status: 'rejected' }).eq('id', txn.id);
    if (error) return { ok: false, message: 'Reject failed: ' + error.message };
    await createUserNotification({
      title: 'Payment could not be verified',
      body: `Your payment of Rs. ${txn.amount} could not be confirmed. Please double-check your receipt and try again, or contact support if you believe this is a mistake.`,
      targetPhone: txn.phone,
      kind: 'payment-rejected',
    });
    void logAdminAction('payment_rejected', txn.id, { product_id: txn.product_id, phone: txn.phone });
    return { ok: true, message: 'Payment rejected.' };
  }

  async function rejectPayment(txn: Transaction) {
    const confirmed = await confirmAsync('Reject', 'Reject this payment request?');
    if (!confirmed) return;
    await rejectPaymentCore(txn);
    fetchTransactions();
  }

  function togglePaymentSelected(id: string) {
    setSelectedPaymentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkApprovePayments(txns: Transaction[]) {
    if (txns.length === 0 || bulkPaymentsProcessing) return;
    const confirmed = await confirmAsync(
      'Approve Selected',
      `Approve ${txns.length} selected payment(s) and add entries? Receipt screenshots will be deleted after approval.`
    );
    if (!confirmed) return;

    setBulkPaymentsProcessing(true);
    let successCount = 0;
    const failures: string[] = [];
    for (const txn of txns) {
      const result = await approvePaymentCore(txn);
      if (result.ok) successCount += 1;
      else failures.push(`${txn.user_name || txn.phone}: ${result.message}`);
    }
    setBulkPaymentsProcessing(false);
    setSelectedPaymentIds(new Set());
    fetchProducts();
    fetchEntries();
    fetchTransactions();
    alert(`Approved ${successCount} of ${txns.length}.` + (failures.length ? `\n\nFailed:\n${failures.join('\n')}` : ''));
  }

  async function bulkRejectPayments(txns: Transaction[]) {
    if (txns.length === 0 || bulkPaymentsProcessing) return;
    const confirmed = await confirmAsync('Reject Selected', `Reject ${txns.length} selected payment request(s)?`);
    if (!confirmed) return;

    setBulkPaymentsProcessing(true);
    let successCount = 0;
    const failures: string[] = [];
    for (const txn of txns) {
      const result = await rejectPaymentCore(txn);
      if (result.ok) successCount += 1;
      else failures.push(`${txn.user_name || txn.phone}: ${result.message}`);
    }
    setBulkPaymentsProcessing(false);
    setSelectedPaymentIds(new Set());
    fetchTransactions();
    alert(`Rejected ${successCount} of ${txns.length}.` + (failures.length ? `\n\nFailed:\n${failures.join('\n')}` : ''));
  }

  async function approveWalletTopupCore(request: WalletTopupRequest): Promise<{ ok: boolean; message: string }> {
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('approve_wallet_topup_request', { p_request_id: request.id })
      .single();

    if (rpcError) {
      return { ok: false, message: 'Top-up approval failed: ' + rpcError.message };
    }

    if (!rpcResult?.ok) {
      return { ok: false, message: rpcResult?.error || 'Top-up approval failed.' };
    }

    if (request.receipt_path && !request.receipt_path.startsWith('data:')) {
      await supabase.storage.from(RECEIPT_BUCKET).remove([request.receipt_path]).catch(() => {});
    }

    await createUserNotification({
      title: 'Wallet topped up',
      body: `Rs. ${request.amount} has been added to your wallet.`,
      targetPhone: request.phone,
      kind: 'payment-confirmed',
    });

    void logAdminAction('wallet_topup_approved', request.id, { phone: request.phone, amount: request.amount, new_balance: rpcResult?.new_balance });
    return { ok: true, message: 'Wallet topped up and receipt deleted.' };
  }

  async function approveWalletTopup(request: WalletTopupRequest) {
    const confirmed = await confirmAsync('Approve', `Add Rs. ${request.amount} to this user's wallet? Receipt screenshot will be deleted after approval.`);
    if (!confirmed) return;
    const result = await approveWalletTopupCore(request);
    alert(result.message);
    fetchWalletTopupRequests();
  }

  async function rejectWalletTopupCore(request: WalletTopupRequest): Promise<{ ok: boolean; message: string }> {
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('reject_wallet_topup_request', { p_request_id: request.id })
      .single();

    if (rpcError) return { ok: false, message: 'Reject failed: ' + rpcError.message };
    if (!rpcResult?.ok) return { ok: false, message: rpcResult?.error || 'Reject failed.' };

    await createUserNotification({
      title: 'Wallet top-up could not be verified',
      body: `Your wallet top-up of Rs. ${request.amount} could not be confirmed. Please double-check your receipt and try again, or contact support if you believe this is a mistake.`,
      targetPhone: request.phone,
      kind: 'payment-rejected',
    });

    void logAdminAction('wallet_topup_rejected', request.id, { phone: request.phone, amount: request.amount });
    return { ok: true, message: 'Top-up request rejected.' };
  }

  async function rejectWalletTopup(request: WalletTopupRequest) {
    const confirmed = await confirmAsync('Reject', 'Reject this wallet top-up request?');
    if (!confirmed) return;
    await rejectWalletTopupCore(request);
    fetchWalletTopupRequests();
  }

  function toggleWalletTopupSelected(id: string) {
    setSelectedWalletTopupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkApproveWalletTopups(requests: WalletTopupRequest[]) {
    if (requests.length === 0 || bulkWalletTopupsProcessing) return;
    const confirmed = await confirmAsync(
      'Approve Selected',
      `Add wallet balance for ${requests.length} selected request(s)? Receipt screenshots will be deleted after approval.`
    );
    if (!confirmed) return;

    setBulkWalletTopupsProcessing(true);
    let successCount = 0;
    const failures: string[] = [];
    for (const request of requests) {
      const result = await approveWalletTopupCore(request);
      if (result.ok) successCount += 1;
      else failures.push(`${request.user_name || request.phone}: ${result.message}`);
    }
    setBulkWalletTopupsProcessing(false);
    setSelectedWalletTopupIds(new Set());
    fetchWalletTopupRequests();
    alert(`Approved ${successCount} of ${requests.length}.` + (failures.length ? `\n\nFailed:\n${failures.join('\n')}` : ''));
  }

  async function bulkRejectWalletTopups(requests: WalletTopupRequest[]) {
    if (requests.length === 0 || bulkWalletTopupsProcessing) return;
    const confirmed = await confirmAsync('Reject Selected', `Reject ${requests.length} selected top-up request(s)?`);
    if (!confirmed) return;

    setBulkWalletTopupsProcessing(true);
    let successCount = 0;
    const failures: string[] = [];
    for (const request of requests) {
      const result = await rejectWalletTopupCore(request);
      if (result.ok) successCount += 1;
      else failures.push(`${request.user_name || request.phone}: ${result.message}`);
    }
    setBulkWalletTopupsProcessing(false);
    setSelectedWalletTopupIds(new Set());
    fetchWalletTopupRequests();
    alert(`Rejected ${successCount} of ${requests.length}.` + (failures.length ? `\n\nFailed:\n${failures.join('\n')}` : ''));
  }

  function getWalletAdjustDraft(phone: string) {
    return walletAdjustDrafts[phone] || { amount: '', type: 'bonus' as WalletTransactionType, reason: '' };
  }

  async function saveWalletAdjustment(phone: string) {
    const draft = getWalletAdjustDraft(phone);
    const amount = Math.trunc(Number(draft.amount));
    if (!amount) {
      alert('Enter a non-zero amount. Use a negative number to debit the wallet.');
      return;
    }

    const confirmed = await confirmAsync(
      'Adjust Wallet',
      `${amount > 0 ? 'Credit' : 'Debit'} Rs. ${Math.abs(amount)} ${amount > 0 ? 'to' : 'from'} this user's wallet (${draft.type})?`
    );
    if (!confirmed) return;

    setWalletAdjustSaving(phone);
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('adjust_wallet_balance_atomic', {
        p_phone: phone,
        p_amount: amount,
        p_type: draft.type,
        p_reference: draft.reason.trim() || undefined,
      })
      .single();
    setWalletAdjustSaving(null);

    if (rpcError || !rpcResult?.ok) {
      alert('Adjustment failed: ' + (rpcError?.message || rpcResult?.error || 'Unknown error.'));
      return;
    }

    setWalletBalances((prev) => ({ ...prev, [phone]: rpcResult.new_balance ?? prev[phone] ?? 0 }));
    setWalletAdjustDrafts((prev) => ({ ...prev, [phone]: { amount: '', type: draft.type, reason: '' } }));
    setWalletAdjustExpandedPhone(null);
    void logAdminAction('wallet_balance_adjusted', null, { phone, amount, type: draft.type, reason: draft.reason.trim() || undefined, new_balance: rpcResult.new_balance });
    alert(`Wallet updated. New balance: Rs. ${rpcResult.new_balance}`);
  }

  async function fetchSupportTickets() {
    const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    if (data) setSupportTickets(data);
  }

  async function resolveSupportTicket(ticket: SupportTicket) {
    setSupportTicketResolvingId(ticket.id);
    const { error } = await supabase
      .from('support_tickets')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', ticket.id);
    setSupportTicketResolvingId(null);

    if (error) {
      alert('Could not mark resolved: ' + error.message);
      return;
    }
    await fetchSupportTickets();
  }

  async function reopenSupportTicket(ticket: SupportTicket) {
    setSupportTicketResolvingId(ticket.id);
    const { error } = await supabase
      .from('support_tickets')
      .update({ status: 'open', resolved_at: null })
      .eq('id', ticket.id);
    setSupportTicketResolvingId(null);

    if (error) {
      alert('Could not reopen: ' + error.message);
      return;
    }
    await fetchSupportTickets();
  }

  async function fetchRefundRequests() {
    const { data } = await supabase.from('refund_requests').select('*').order('created_at', { ascending: false });
    if (data) setRefundRequests(data);
  }

  function getRefundDraft(phone: string) {
    return refundDrafts[phone] || { transactionId: '', reason: '' };
  }

  async function submitRefundRequest(phone: string) {
    const draft = getRefundDraft(phone);
    if (!draft.transactionId) {
      alert('Select which payment this refund is for.');
      return;
    }
    const txn = transactions.find((t) => t.id === draft.transactionId);
    if (!txn) {
      alert('That payment could not be found. Try refreshing the page.');
      return;
    }

    const confirmed = await confirmAsync(
      'Log Refund Request',
      `Log a refund request for Rs. ${txn.amount} against this payment? This does not credit the wallet yet -- you'll approve or reject it from the Refund Requests list.`
    );
    if (!confirmed) return;

    setRefundSubmitting(true);
    const { error } = await supabase.from('refund_requests').insert({
      transaction_id: txn.id,
      phone,
      amount: txn.amount,
      reason: draft.reason.trim() || null,
    });
    setRefundSubmitting(false);

    if (error) {
      alert('Could not log refund request: ' + error.message);
      return;
    }

    setRefundDrafts((prev) => ({ ...prev, [phone]: { transactionId: '', reason: '' } }));
    setRefundFormExpandedPhone(null);
    void logAdminAction('refund_requested', txn.id, { phone, amount: txn.amount, reason: draft.reason.trim() || undefined });
    await fetchRefundRequests();
    alert('Refund request logged as pending.');
  }

  async function approveRefundRequest(request: RefundRequest) {
    const confirmed = await confirmAsync('Approve Refund', `Credit Rs. ${request.amount} to this user's wallet as a refund?`);
    if (!confirmed) return;

    setRefundResolvingId(request.id);
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('adjust_wallet_balance_atomic', {
        p_phone: request.phone,
        p_amount: request.amount,
        p_type: 'refund' as WalletTransactionType,
        p_reference: request.reason || `Refund for transaction ${request.transaction_id}`,
      })
      .single();

    if (rpcError || !rpcResult?.ok) {
      setRefundResolvingId(null);
      alert('Refund failed: ' + (rpcError?.message || rpcResult?.error || 'Unknown error.'));
      return;
    }

    const { error: updateError } = await supabase
      .from('refund_requests')
      .update({ status: 'approved', resolved_at: new Date().toISOString() })
      .eq('id', request.id);
    setRefundResolvingId(null);

    if (updateError) {
      alert('Wallet was credited, but the refund request could not be marked approved: ' + updateError.message);
    }

    setWalletBalances((prev) => ({ ...prev, [request.phone]: rpcResult.new_balance ?? prev[request.phone] ?? 0 }));
    await createUserNotification({
      title: 'Refund approved',
      body: `Rs. ${request.amount} has been refunded to your JeetoBaz wallet.`,
      targetPhone: request.phone,
      kind: 'payment-confirmed',
    });
    void logAdminAction('refund_approved', request.id, { phone: request.phone, amount: request.amount, new_balance: rpcResult.new_balance });
    await fetchRefundRequests();
  }

  async function rejectRefundRequest(request: RefundRequest) {
    const confirmed = await confirmAsync('Reject Refund', 'Reject this refund request? No wallet credit will be made.');
    if (!confirmed) return;

    setRefundResolvingId(request.id);
    const { error } = await supabase
      .from('refund_requests')
      .update({ status: 'rejected', resolved_at: new Date().toISOString() })
      .eq('id', request.id);
    setRefundResolvingId(null);

    if (error) {
      alert('Could not reject refund request: ' + error.message);
      return;
    }

    await createUserNotification({
      title: 'Refund request declined',
      body: `Your refund request could not be approved. Please contact support if you have questions.`,
      targetPhone: request.phone,
      kind: 'payment-rejected',
    });
    void logAdminAction('refund_rejected', request.id, { phone: request.phone, amount: request.amount });
    await fetchRefundRequests();
  }

  const totalRevenue = products.reduce((sum, p) => sum + ((p.current_entries || 0) * (p.entry_fee || 1)), 0);
  const activeDraws = products.filter(p => p.status === 'active').length;
  const completedDraws = products.filter(p => p.status === 'completed').length;
  const pendingPayments = transactions.filter((txn) => txn.status === 'pending');
  const overdueDraws = useMemo(() => {
    const now = Date.now();
    return products.filter((product) => (
      product.status === 'active' && product.draw_date && new Date(product.draw_date).getTime() < now
    ));
  }, [products]);
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) =>
      [product.name, product.description, product.draw_date]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [productSearch, products]);
  const filteredDrawResults = useMemo(() => {
    const query = drawsSearch.trim().toLowerCase();
    if (!query) return drawResults;

    return drawResults.filter((result) =>
      [result.products?.name, result.winner_name, result.winner_phone, result.winner_ticket_number]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [drawsSearch, drawResults]);
  const filteredPendingPayments = useMemo(() => {
    const query = paymentsSearch.trim().toLowerCase();
    if (!query) return pendingPayments;

    return pendingPayments.filter((txn) => {
      const product = products.find((p) => p.id === txn.product_id);
      return [product?.name, txn.user_name, txn.phone, txn.payment_method]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [paymentsSearch, pendingPayments, products]);
  const allFilteredPaymentsSelected = filteredPendingPayments.length > 0
    && filteredPendingPayments.every((txn) => selectedPaymentIds.has(txn.id));
  const filteredPaymentsHistory = useMemo(() => {
    const query = paymentsHistorySearch.trim().toLowerCase();
    if (!query) return transactions;

    return transactions.filter((txn) => {
      const product = products.find((p) => p.id === txn.product_id);
      return [product?.name, txn.user_name, txn.phone, txn.payment_method, txn.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [paymentsHistorySearch, transactions, products]);
  const HISTORY_PREVIEW_LIMIT = 25;
  const visiblePaymentsHistory = paymentsHistoryExpanded || paymentsHistorySearch.trim()
    ? filteredPaymentsHistory
    : filteredPaymentsHistory.slice(0, HISTORY_PREVIEW_LIMIT);

  useEffect(() => {
    setSelectedPaymentIds(new Set());
  }, [paymentsSearch]);

  function toggleSelectAllPayments() {
    setSelectedPaymentIds(allFilteredPaymentsSelected ? new Set() : new Set(filteredPendingPayments.map((txn) => txn.id)));
  }
  const filteredWalletTopupRequests = useMemo(() => {
    const query = walletTopupsSearch.trim().toLowerCase();
    if (!query) return walletTopupRequests;

    return walletTopupRequests.filter((request) =>
      [request.user_name, request.phone, request.payment_method]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [walletTopupsSearch, walletTopupRequests]);
  const allFilteredWalletTopupsSelected = filteredWalletTopupRequests.length > 0
    && filteredWalletTopupRequests.every((request) => selectedWalletTopupIds.has(request.id));

  useEffect(() => {
    setSelectedWalletTopupIds(new Set());
  }, [walletTopupsSearch]);

  function toggleSelectAllWalletTopups() {
    setSelectedWalletTopupIds(allFilteredWalletTopupsSelected ? new Set() : new Set(filteredWalletTopupRequests.map((request) => request.id)));
  }
  const filteredUsers = useMemo(() => {
    const query = usersSearch.trim().toLowerCase();
    if (!query) return users;

    return users.filter((u) =>
      [u.name, u.phone, u.email, u.member_number ? `JB-${u.member_number}` : null]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [usersSearch, users]);

  if (authLoading && !authenticated) return (
    <>
    <Head>
      <title>Admin Panel | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="JeetoBaz admin panel for managing products, payments, users, and platform settings." />
    </Head>
    <View style={styles.loginContainer}>
      <LockKeyhole color={theme.gold} size={50} />
      <Text style={styles.loginSubtitle}>Checking secure session...</Text>
    </View>
    </>
  );

  if (!authenticated) return (
    <>
    <Head>
      <title>Admin Panel | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="JeetoBaz admin panel for managing products, payments, users, and platform settings." />
    </Head>
    <View style={styles.loginContainer}>
      <LockKeyhole color={theme.gold} size={50} />
      <Text style={styles.loginSubtitle}>Admin Panel</Text>
      <View style={styles.loginInputRow}>
        <Mail color={theme.muted} size={20} />
        <TextInput
          style={styles.loginInput}
          placeholder="Enter admin email"
          placeholderTextColor={theme.subtle}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>
      <View style={styles.loginInputRow}>
        <LockKeyhole color={theme.muted} size={20} />
        <TextInput
          style={styles.loginInput}
          placeholder="Enter admin password"
          placeholderTextColor={theme.subtle}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
        />
        <TouchableOpacity onPress={() => setShowPassword((current) => !current)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
          {showPassword ? <EyeOff color={theme.muted} size={21} /> : <Eye color={theme.muted} size={21} />}
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.forgotButton} onPress={handleForgotPassword} disabled={resetSending}>
        <Text style={styles.forgotText}>{resetSending ? 'Sending reset email...' : 'Forgot Password?'}</Text>
      </TouchableOpacity>
      <TurnstileWidget
        ref={turnstileRef}
        onVerify={(token) => { setTurnstileToken(token); setTurnstileError(''); }}
        onExpire={() => setTurnstileToken('')}
      />
      {turnstileError ? <Text style={styles.errorText}>{turnstileError}</Text> : null}
      <TouchableOpacity style={[styles.loginBtn, authLoading && styles.loginBtnDisabled]} onPress={handleLogin} disabled={authLoading}>
        {!authLoading && <Rocket color={theme.buttonText} size={19} />}<Text style={styles.loginBtnText}>{authLoading ? 'Signing in...' : 'Secure Login'}</Text>
      </TouchableOpacity>
    </View>
    </>
  );

  return (
    <>
    <Head>
      <title>Admin Panel | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="JeetoBaz admin panel for managing products, payments, users, and platform settings." />
    </Head>
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}><Settings color={theme.gold} size={23} /><Text style={styles.title}>Admin Panel</Text></View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {['products', 'draws', 'payments', 'wallet-topups', 'users', 'support', 'revenue', 'audit', 'settings'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            {tab === 'products' ? <Package color={activeTab === tab ? theme.gold : theme.subtle} size={19} />
              : tab === 'draws' ? <Trophy color={activeTab === tab ? theme.gold : theme.subtle} size={19} />
              : tab === 'payments' ? <ReceiptText color={activeTab === tab ? theme.gold : theme.subtle} size={19} />
              : tab === 'wallet-topups' ? <Wallet color={activeTab === tab ? theme.gold : theme.subtle} size={19} />
              : tab === 'users' ? <UsersRound color={activeTab === tab ? theme.gold : theme.subtle} size={19} />
              : tab === 'support' ? <Mail color={activeTab === tab ? theme.gold : theme.subtle} size={19} />
              : tab === 'revenue' ? <DollarSign color={activeTab === tab ? theme.gold : theme.subtle} size={19} />
              : tab === 'audit' ? <History color={activeTab === tab ? theme.gold : theme.subtle} size={19} />
              : <Settings color={activeTab === tab ? theme.gold : theme.subtle} size={19} />}
            <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabText]}>
              {tab === 'wallet-topups' ? 'Wallet Top-Ups' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {overdueDraws.length > 0 && (
        <TouchableOpacity
          style={styles.overdueDrawsBanner}
          onPress={() => setActiveTab('products')}
          accessibilityRole="button"
        >
          <TriangleAlert color="#FFD700" size={17} />
          <Text style={styles.overdueDrawsBannerText}>
            {overdueDraws.length} draw{overdueDraws.length > 1 ? 's' : ''} past its scheduled date and not yet run: {overdueDraws.map((p) => p.name).slice(0, 3).join(', ')}
            {overdueDraws.length > 3 ? ` +${overdueDraws.length - 3} more` : ''}. Tap to review.
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.content}>

        {activeTab === 'products' && (
          <View>
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>{editingId ? <Pencil color={theme.text} size={19} /> : <Plus color={theme.text} size={19} />}<Text style={styles.sectionTitle}>{editingId ? 'Edit Product' : 'Add New Product'}</Text></View>
              {editingId && <View style={styles.editBanner}><TriangleAlert color="#FFD700" size={16} /><Text style={styles.editBannerText}>Editing mode</Text></View>}
              <TextInput style={styles.input} placeholder="Product name *" placeholderTextColor="#666" value={productName} onChangeText={setProductName} />

              <Text style={styles.categoryLabel}>Category</Text>
              <View style={styles.categoryChipsWrap}>
                <TouchableOpacity
                  style={[styles.categoryChip, !category && styles.categoryChipActive]}
                  onPress={() => setCategory(null)}
                >
                  <Text style={[styles.categoryChipText, !category && styles.categoryChipTextActive]}>Auto-detect</Text>
                </TouchableOpacity>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.categoryChip, category === cat.key && styles.categoryChipActive]}
                    onPress={() => setCategory(cat.key)}
                  >
                    <Text style={[styles.categoryChipText, category === cat.key && styles.categoryChipTextActive]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput style={styles.input} placeholder="Price in Rs. *" placeholderTextColor="#666" keyboardType="numeric" value={productPrice} onChangeText={setProductPrice} />
              <TextInput style={styles.input} placeholder="Entry fee (1, 10, or 100) *" placeholderTextColor="#666" keyboardType="numeric" value={entryFee} onChangeText={setEntryFee} />
              <TextInput style={styles.input} placeholder="Max entries *" placeholderTextColor="#666" keyboardType="numeric" value={maxEntries} onChangeText={setMaxEntries} />
              <TextInput style={styles.input} placeholder="Image URL (optional)" placeholderTextColor="#666" value={imageUrl} onChangeText={setImageUrl} />
              <TouchableOpacity
                style={[styles.photoUploadButton, productImageUploading && styles.photoUploadDisabled]}
                onPress={uploadProductImage}
                disabled={productImageUploading}
              >
                {!productImageUploading && <Camera color="#4a9eff" size={18} />}
                <Text style={styles.photoUploadText}>{productImageUploading ? 'Uploading...' : 'Upload Product Image'}</Text>
              </TouchableOpacity>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.winnerPhotoPreview} resizeMode="cover" accessibilityLabel="Product image preview" />
              ) : null}
              <TextInput style={[styles.input, styles.textArea]} placeholder="Description (optional)" placeholderTextColor="#666" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
              <TextInput style={styles.input} placeholder="Live Link (YouTube/Facebook URL)" placeholderTextColor="#666" value={liveLink} onChangeText={setLiveLink} />
              <TextInput style={styles.input} placeholder="Winner Photo URL (optional)" placeholderTextColor="#666" value={winnerPhoto} onChangeText={setWinnerPhoto} />
              {editingId && (
                <TouchableOpacity
                  style={[styles.photoUploadButton, winnerPhotoUploading && styles.photoUploadDisabled]}
                  onPress={uploadWinnerPhoto}
                  disabled={winnerPhotoUploading}
                >
                  {!winnerPhotoUploading && <Camera color="#4a9eff" size={18} />}
                  <Text style={styles.photoUploadText}>{winnerPhotoUploading ? 'Uploading...' : 'Upload Winner Photo'}</Text>
                </TouchableOpacity>
              )}
              {winnerPhoto ? (
                <Image source={{ uri: winnerPhoto }} style={styles.winnerPhotoPreview} resizeMode="cover" accessibilityLabel="Winner photo preview" />
              ) : null}
        <DrawDatePicker
          key={editingId || 'new'}
          value={drawDate}
          onChange={setDrawDate}
          styles={styles}
          theme={theme}
        />

              <TouchableOpacity style={styles.seoToggle} onPress={() => setSeoExpanded((prev) => !prev)}>
                <ChevronDown size={18} color={theme.text} style={{ transform: [{ rotate: seoExpanded ? '0deg' : '-90deg' }] }} />
                <Text style={styles.seoSectionTitle}>SEO & Search</Text>
              </TouchableOpacity>
              {seoExpanded && (
                <>
                  <TextInput style={styles.input} placeholder="SEO Title (leave empty to use product name)" placeholderTextColor="#666" value={seoData.seo_title} onChangeText={(v) => setSeoData((prev) => ({ ...prev, seo_title: v }))} />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Meta Description" placeholderTextColor="#666" value={seoData.meta_description} onChangeText={(v) => setSeoData((prev) => ({ ...prev, meta_description: v }))} multiline numberOfLines={3} />
                  <TextInput style={styles.input} placeholder="Meta Keywords (comma separated)" placeholderTextColor="#666" value={seoData.meta_keywords} onChangeText={(v) => setSeoData((prev) => ({ ...prev, meta_keywords: v }))} />
                  <View style={styles.slugRow}>
                    <TextInput
                      style={[styles.input, styles.slugInput]}
                      placeholder="Slug (e.g. honda-70-draw)"
                      placeholderTextColor="#666"
                      value={seoData.slug}
                      onChangeText={(v) => setSeoData((prev) => ({ ...prev, slug: v }))}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.slugAutoButton}
                      onPress={() => {
                        if (seoData.slug.trim()) return;
                        if (!productName.trim()) {
                          alert('Enter the product name first.');
                          return;
                        }
                        setSeoData((prev) => (prev.slug.trim() ? prev : { ...prev, slug: slugify(productName) }));
                      }}
                    >
                      <Wand2 color={theme.primary} size={16} />
                      <Text style={styles.slugAutoButtonText}>Auto-generate</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.seoCheckRow} onPress={() => setSeoData((prev) => ({ ...prev, indexable: !prev.indexable }))}>
                    <View style={[styles.seoCheckbox, seoData.indexable && styles.seoCheckboxActive]}>
                      {seoData.indexable && <Check size={14} color="white" />}
                    </View>
                    <Text style={styles.seoCheckLabel}>Indexable (allow search engines to index this product)</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity style={[styles.addButton, editingId && styles.saveButton]} onPress={saveProduct} disabled={loading}>
                {!loading && (editingId ? <Save color="white" size={18} /> : <Plus color="white" size={18} />)}
                <Text style={styles.addButtonText}>{loading ? 'Saving...' : editingId ? 'Save Changes' : 'Add Product'}</Text>
              </TouchableOpacity>
              {editingId && (
                <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
                  <X color="#ff4444" size={17} /><Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionTitleRow}><ClipboardList color={theme.text} size={19} /><Text style={styles.sectionTitle}>All Products ({products.length})</Text></View>
              <TouchableOpacity
                style={[styles.photoUploadButton, indexNowSubmitting && styles.photoUploadDisabled]}
                onPress={submitAllProductsToIndexNow}
                disabled={indexNowSubmitting}
              >
                <Text style={styles.photoUploadText}>{indexNowSubmitting ? 'Submitting...' : 'Submit All Products to IndexNow'}</Text>
              </TouchableOpacity>
              <View style={styles.productSearchBox}>
                <Search color={theme.muted} size={20} />
                <TextInput
                  style={styles.productSearchInput}
                  placeholder="Search products to edit..."
                  placeholderTextColor={theme.muted}
                  value={productSearch}
                  onChangeText={setProductSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  accessibilityLabel="Search products"
                />
                {productSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setProductSearch('')} accessibilityLabel="Clear product search">
                    <X color={theme.muted} size={20} />
                  </TouchableOpacity>
                )}
              </View>
              {productSearch.trim() && (
                <Text style={styles.searchResultText}>
                  Showing {filteredProducts.length} of {products.length} products
                </Text>
              )}
              {filteredProducts.length === 0 && (
                <Text style={styles.emptyText}>No products match “{productSearch.trim()}”.</Text>
              )}
              {filteredProducts.map((p) => (
                <View key={p.id} style={[styles.productCard, editingId === p.id && styles.productCardEditing]}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>{p.name}</Text>
                    <TouchableOpacity onPress={() => toggleStatus(p)} style={[styles.statusBadge, p.status === 'active' ? styles.activeBadge : styles.completedBadge]}>
                      {p.status === 'active' ? <Circle color="#18a663" fill="#18a663" size={10} /> : <Check color="#18a663" size={13} />}
                      <Text style={styles.statusText}>{p.status === 'active' ? 'Active' : 'Done'}</Text>
                    </TouchableOpacity>
                  </View>
                  {p.description && <Text style={styles.description}>{p.description}</Text>}
                  {p.draw_date && <View style={styles.inlineRow}><CalendarDays color="#4a9eff" size={14} /><Text style={styles.drawDateText}>Draw: {formatDrawDate(p.draw_date)}</Text></View>}
                  <Text style={styles.productPrice}>Rs. {p.price?.toLocaleString()} — Entry: Rs. {p.entry_fee || 1}</Text>
                  <Text style={styles.entries}>{p.current_entries || 0} / {p.max_entries} entries</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progress, { width: `${Math.min(((p.current_entries||0)/p.max_entries)*100, 100)}%` }]} />
                  </View>
                  <View style={styles.inlineRow}><DollarSign color="#aaa" size={14} /><Text style={styles.revenue}>Revenue: Rs. {((p.current_entries || 0) * (p.entry_fee || 1)).toLocaleString()}</Text></View>
                  {drawSessionStates[p.id] && <View style={styles.inlineRow}><History color="#8B5CF6" size={14} /><Text style={styles.drawDateText}>Draw Session: {drawSessionStates[p.id]}</Text></View>}
                  {p.winner_phone && <View style={styles.inlineRow}><Trophy color="#FFD700" size={14} /><Text style={styles.winner}>Winner: {p.winner_phone}</Text></View>}
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.editButton} onPress={() => startEdit(p)}>
                      <Pencil color="#4a9eff" size={15} /><Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.drawButton} onPress={() => router.push({ pathname: '/draw', params: { productId: p.id, productName: p.name } })}>
                      <Dices color="#000" size={15} /><Text style={styles.drawButtonText}>Draw</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.reminderButton} onPress={() => sendDrawReminder(p)}>
                      <Bell color="white" size={17} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteProduct(p.id)}>
                      <Trash2 color="#ff4444" size={17} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'draws' && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}><Trophy color={theme.text} size={19} /><Text style={styles.sectionTitle}>Completed Draws ({drawResults.length})</Text></View>
            <View style={styles.settingsButtonRow}>
              <TouchableOpacity style={[styles.photoUploadButton, styles.settingsHalfButton]} onPress={exportWinnersCsv}>
                <Download color="#4a9eff" size={16} />
                <Text style={styles.photoUploadText}>Export Winners CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.photoUploadButton, styles.settingsHalfButton]} onPress={exportEntriesCsv}>
                <Download color="#4a9eff" size={16} />
                <Text style={styles.photoUploadText}>Export Entries CSV</Text>
              </TouchableOpacity>
            </View>
            {drawResults.length > 0 && (
              <View style={styles.productSearchBox}>
                <Search color={theme.muted} size={20} />
                <TextInput
                  style={styles.productSearchInput}
                  placeholder="Search by product, winner name, phone, or ticket..."
                  placeholderTextColor={theme.muted}
                  value={drawsSearch}
                  onChangeText={setDrawsSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  accessibilityLabel="Search completed draws"
                />
                {drawsSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setDrawsSearch('')} accessibilityLabel="Clear draws search">
                    <X color={theme.muted} size={20} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            {drawsSearch.trim() && (
              <Text style={styles.searchResultText}>
                Showing {filteredDrawResults.length} of {drawResults.length} draws
              </Text>
            )}
            {drawResults.length === 0 && <Text style={styles.emptyText}>No draws have been run yet.</Text>}
            {drawResults.length > 0 && filteredDrawResults.length === 0 && (
              <Text style={styles.emptyText}>No draws match “{drawsSearch.trim()}”.</Text>
            )}
            {filteredDrawResults.map((result) => {
              const draft = getPrizeStatusDraft(result);
              const winnerDraft = getWinnerStatusDraft(result);
              const winnerUser = users.find((u) => u.phone === result.winner_phone);
              return (
                <View key={result.id} style={styles.paymentCard}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>{result.products?.name || 'Unknown Draw'}</Text>
                  </View>
                  <Text style={styles.paymentLine}>Winner: {result.winner_name} ({result.winner_phone})</Text>
                  {winnerUser?.cnic && <Text style={styles.paymentLine}>CNIC: {winnerUser.cnic}</Text>}
                  {winnerUser?.jazzcash_number && <Text style={styles.paymentLine}>JazzCash: {winnerUser.jazzcash_number}</Text>}
                  <Text style={styles.paymentLine}>Ticket: {result.winner_ticket_number}</Text>
                  <Text style={styles.paymentLine}>Drawn: {new Date(result.drawn_at).toLocaleString()}</Text>
                  <Text style={styles.paymentLine}>Winner Verification Status:</Text>
                  <View style={styles.actionRow}>
                    {WINNER_STATUSES.map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[styles.statusBadge, winnerDraft.status === status ? styles.activeBadge : styles.completedBadge]}
                        onPress={() => setWinnerStatusDrafts((prev) => ({ ...prev, [result.id]: { ...winnerDraft, status } }))}
                      >
                        <Text style={styles.tabLabel}>{WINNER_STATUS_LABELS[status]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Verification note — optional (e.g. only used for rare Disqualified / Re-Draw Required cases)"
                    placeholderTextColor="#666"
                    value={winnerDraft.note}
                    onChangeText={(text) => setWinnerStatusDrafts((prev) => ({ ...prev, [result.id]: { ...winnerDraft, note: text } }))}
                  />
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => saveWinnerStatus(result)}
                    disabled={winnerStatusSaving === result.id}
                  >
                    <BadgeCheck color="white" size={16} />
                    <Text style={styles.approveButtonText}>{winnerStatusSaving === result.id ? 'Saving...' : 'Save Winner Status'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.paymentLine}>Prize Delivery Status:</Text>
                  <View style={styles.actionRow}>
                    {PRIZE_STATUSES.map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[styles.statusBadge, draft.status === status ? styles.activeBadge : styles.completedBadge]}
                        onPress={() => setPrizeStatusDrafts((prev) => ({ ...prev, [result.product_id]: { ...draft, status } }))}
                      >
                        <Text style={styles.tabLabel}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Tracking note (courier, tracking number, etc.) — optional"
                    placeholderTextColor="#666"
                    value={draft.note}
                    onChangeText={(text) => setPrizeStatusDrafts((prev) => ({ ...prev, [result.product_id]: { ...draft, note: text } }))}
                  />
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => savePrizeStatus(result)}
                    disabled={prizeStatusSaving === result.product_id}
                  >
                    <Truck color="white" size={16} />
                    <Text style={styles.approveButtonText}>{prizeStatusSaving === result.product_id ? 'Saving...' : 'Save Status'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.paymentLine}>
                    Certificate: {(certificates[result.id] || []).length > 0 ? `${(certificates[result.id] || []).length} uploaded` : 'Not uploaded yet'}
                  </Text>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => uploadCertificate(result)}
                    disabled={certificateUploading === result.id}
                  >
                    <Award color="white" size={16} />
                    <Text style={styles.approveButtonText}>{certificateUploading === result.id ? 'Uploading...' : 'Upload Certificate'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'payments' && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}><ReceiptText color={theme.text} size={19} /><Text style={styles.sectionTitle}>Pending Payments ({pendingPayments.length})</Text></View>
            <TouchableOpacity style={styles.photoUploadButton} onPress={exportTransactionsCsv}>
              <Download color="#4a9eff" size={16} />
              <Text style={styles.photoUploadText}>Export All Payments CSV ({transactions.length} total)</Text>
            </TouchableOpacity>

            <View style={styles.divider} />
            <View style={styles.sectionTitleRow}>
              <ReceiptText color={theme.text} size={19} />
              <Text style={styles.sectionTitle}>Refund Requests ({refundRequests.filter((r) => r.status === 'pending').length} pending)</Text>
            </View>
            {refundRequests.length === 0 ? (
              <Text style={styles.emptyText}>No refund requests logged yet. Log one from a user's card on the Users tab.</Text>
            ) : (
              refundRequests.map((request) => (
                <View key={request.id} style={styles.paymentCard}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>Rs. {request.amount} — {request.phone}</Text>
                    <View style={[
                      styles.statusBadge,
                      request.status === 'approved' ? styles.activeBadge : request.status === 'rejected' ? styles.rejectedBadge : styles.pendingBadge,
                    ]}>
                      <Text style={styles.statusText}>{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</Text>
                    </View>
                  </View>
                  {request.reason && <Text style={styles.paymentLine}>Reason: {request.reason}</Text>}
                  <Text style={styles.paymentLine}>Logged: {new Date(request.created_at).toLocaleString()}</Text>
                  {request.status === 'pending' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.approveButton} onPress={() => approveRefundRequest(request)} disabled={refundResolvingId === request.id}>
                        <Check color="white" size={16} /><Text style={styles.approveButtonText}>{refundResolvingId === request.id ? 'Working...' : 'Approve & Credit Wallet'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectButton} onPress={() => rejectRefundRequest(request)} disabled={refundResolvingId === request.id}>
                        <X color="#ff4444" size={16} /><Text style={styles.rejectButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
            <View style={styles.divider} />

            {pendingPayments.length > 0 && (
              <View style={styles.productSearchBox}>
                <Search color={theme.muted} size={20} />
                <TextInput
                  style={styles.productSearchInput}
                  placeholder="Search by product, name, phone, or method..."
                  placeholderTextColor={theme.muted}
                  value={paymentsSearch}
                  onChangeText={setPaymentsSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  accessibilityLabel="Search pending payments"
                />
                {paymentsSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setPaymentsSearch('')} accessibilityLabel="Clear payments search">
                    <X color={theme.muted} size={20} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            {paymentsSearch.trim() && (
              <Text style={styles.searchResultText}>
                Showing {filteredPendingPayments.length} of {pendingPayments.length} pending payments
              </Text>
            )}
            {pendingPayments.length === 0 && <Text style={styles.emptyText}>No pending payments.</Text>}
            {pendingPayments.length > 0 && filteredPendingPayments.length === 0 && (
              <Text style={styles.emptyText}>No pending payments match “{paymentsSearch.trim()}”.</Text>
            )}
            {filteredPendingPayments.length > 0 && (
              <View style={styles.bulkActionBar}>
                <TouchableOpacity style={styles.bulkSelectAll} onPress={toggleSelectAllPayments} disabled={bulkPaymentsProcessing}>
                  {allFilteredPaymentsSelected ? <CheckSquare color={theme.gold} size={20} /> : <Square color={theme.muted} size={20} />}
                  <Text style={styles.bulkSelectAllText}>
                    {selectedPaymentIds.size > 0 ? `${selectedPaymentIds.size} selected` : 'Select all'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.bulkActionButtons}>
                  <TouchableOpacity
                    style={[styles.approveButton, styles.bulkActionButton, selectedPaymentIds.size === 0 && styles.photoUploadDisabled]}
                    onPress={() => bulkApprovePayments(filteredPendingPayments.filter((txn) => selectedPaymentIds.has(txn.id)))}
                    disabled={selectedPaymentIds.size === 0 || bulkPaymentsProcessing}
                  >
                    <Check color="white" size={16} />
                    <Text style={styles.approveButtonText}>{bulkPaymentsProcessing ? 'Working...' : `Approve Selected (${selectedPaymentIds.size})`}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectButton, styles.bulkActionButton, selectedPaymentIds.size === 0 && styles.photoUploadDisabled]}
                    onPress={() => bulkRejectPayments(filteredPendingPayments.filter((txn) => selectedPaymentIds.has(txn.id)))}
                    disabled={selectedPaymentIds.size === 0 || bulkPaymentsProcessing}
                  >
                    <X color="#ff4444" size={16} />
                    <Text style={styles.rejectButtonText}>{bulkPaymentsProcessing ? 'Working...' : `Reject Selected (${selectedPaymentIds.size})`}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {filteredPendingPayments.map((txn) => {
              const product = products.find((p) => p.id === txn.product_id);
              const selected = selectedPaymentIds.has(txn.id);
              return (
                <View key={txn.id} style={[styles.paymentCard, selected && styles.paymentCardSelected]}>
                  <View style={styles.productHeader}>
                    <TouchableOpacity style={styles.bulkRowCheckbox} onPress={() => togglePaymentSelected(txn.id)} disabled={bulkPaymentsProcessing}>
                      {selected ? <CheckSquare color={theme.gold} size={20} /> : <Square color={theme.muted} size={20} />}
                    </TouchableOpacity>
                    <Text style={[styles.productName, styles.bulkRowProductName]}>{product?.name || 'Unknown Draw'}</Text>
                    <Text style={styles.paymentStatus}>Pending</Text>
                  </View>
                  <Text style={styles.paymentLine}>Method: {txn.payment_method || 'Not provided'}</Text>
                  <Text style={styles.paymentLine}>Amount: Rs. {txn.amount}</Text>
                  <Text style={styles.paymentLine}>App User: {txn.user_name || 'Unknown'} ({txn.phone})</Text>
                  {receiptUrls[txn.id] ? (
                    <Image source={{ uri: receiptUrls[txn.id] }} style={styles.receiptImage} resizeMode="cover" accessibilityLabel="Payment receipt" />
                  ) : (
                    <Text style={styles.emptyText}>Receipt preview unavailable.</Text>
                  )}
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.approveButton} onPress={() => approvePayment(txn)} disabled={bulkPaymentsProcessing}>
                      <Check color="white" size={16} /><Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectButton} onPress={() => rejectPayment(txn)} disabled={bulkPaymentsProcessing}>
                      <X color="#ff4444" size={16} /><Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <View style={styles.divider} />
            <View style={styles.sectionTitleRow}>
              <History color={theme.text} size={19} />
              <Text style={styles.sectionTitle}>Full Payment History ({transactions.length})</Text>
            </View>
            <View style={styles.productSearchBox}>
              <Search color={theme.muted} size={20} />
              <TextInput
                style={styles.productSearchInput}
                placeholder="Search all payments by product, name, phone, method, or status..."
                placeholderTextColor={theme.muted}
                value={paymentsHistorySearch}
                onChangeText={setPaymentsHistorySearch}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Search full payment history"
              />
              {paymentsHistorySearch.length > 0 && (
                <TouchableOpacity onPress={() => setPaymentsHistorySearch('')} accessibilityLabel="Clear payment history search">
                  <X color={theme.muted} size={20} />
                </TouchableOpacity>
              )}
            </View>
            {transactions.length === 0 ? (
              <Text style={styles.emptyText}>No payments recorded yet.</Text>
            ) : filteredPaymentsHistory.length === 0 ? (
              <Text style={styles.emptyText}>No payments match “{paymentsHistorySearch.trim()}”.</Text>
            ) : (
              visiblePaymentsHistory.map((txn) => {
                const product = products.find((p) => p.id === txn.product_id);
                return (
                  <View key={txn.id} style={styles.paymentCard}>
                    <View style={styles.productHeader}>
                      <Text style={styles.productName}>{product?.name || 'Unknown Draw'}</Text>
                      <View style={[
                        styles.statusBadge,
                        txn.status === 'approved' ? styles.activeBadge : txn.status === 'rejected' ? styles.rejectedBadge : styles.pendingBadge,
                      ]}>
                        <Text style={styles.statusText}>{txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}</Text>
                      </View>
                    </View>
                    <Text style={styles.paymentLine}>Method: {txn.payment_method || 'Not provided'}</Text>
                    <Text style={styles.paymentLine}>Amount: Rs. {txn.amount}</Text>
                    <Text style={styles.paymentLine}>App User: {txn.user_name || 'Unknown'} ({txn.phone})</Text>
                    <Text style={styles.paymentLine}>Date: {new Date(txn.created_at).toLocaleString()}</Text>
                  </View>
                );
              })
            )}
            {!paymentsHistoryExpanded && !paymentsHistorySearch.trim() && filteredPaymentsHistory.length > HISTORY_PREVIEW_LIMIT && (
              <TouchableOpacity style={styles.visibilityButton} onPress={() => setPaymentsHistoryExpanded(true)}>
                <Text style={styles.visibilityButtonText}>Show all {filteredPaymentsHistory.length} payments</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {activeTab === 'wallet-topups' && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}><Wallet color={theme.text} size={19} /><Text style={styles.sectionTitle}>Pending Wallet Top-Ups ({walletTopupRequests.length})</Text></View>
            {walletTopupRequests.length > 0 && (
              <View style={styles.productSearchBox}>
                <Search color={theme.muted} size={20} />
                <TextInput
                  style={styles.productSearchInput}
                  placeholder="Search by name, phone, or method..."
                  placeholderTextColor={theme.muted}
                  value={walletTopupsSearch}
                  onChangeText={setWalletTopupsSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  accessibilityLabel="Search pending wallet top-ups"
                />
                {walletTopupsSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setWalletTopupsSearch('')} accessibilityLabel="Clear wallet top-ups search">
                    <X color={theme.muted} size={20} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            {walletTopupsSearch.trim() && (
              <Text style={styles.searchResultText}>
                Showing {filteredWalletTopupRequests.length} of {walletTopupRequests.length} pending top-ups
              </Text>
            )}
            {walletTopupRequests.length === 0 && <Text style={styles.emptyText}>No pending wallet top-ups.</Text>}
            {walletTopupRequests.length > 0 && filteredWalletTopupRequests.length === 0 && (
              <Text style={styles.emptyText}>No pending top-ups match “{walletTopupsSearch.trim()}”.</Text>
            )}
            {filteredWalletTopupRequests.length > 0 && (
              <View style={styles.bulkActionBar}>
                <TouchableOpacity style={styles.bulkSelectAll} onPress={toggleSelectAllWalletTopups} disabled={bulkWalletTopupsProcessing}>
                  {allFilteredWalletTopupsSelected ? <CheckSquare color={theme.gold} size={20} /> : <Square color={theme.muted} size={20} />}
                  <Text style={styles.bulkSelectAllText}>
                    {selectedWalletTopupIds.size > 0 ? `${selectedWalletTopupIds.size} selected` : 'Select all'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.bulkActionButtons}>
                  <TouchableOpacity
                    style={[styles.approveButton, styles.bulkActionButton, selectedWalletTopupIds.size === 0 && styles.photoUploadDisabled]}
                    onPress={() => bulkApproveWalletTopups(filteredWalletTopupRequests.filter((request) => selectedWalletTopupIds.has(request.id)))}
                    disabled={selectedWalletTopupIds.size === 0 || bulkWalletTopupsProcessing}
                  >
                    <Check color="white" size={16} />
                    <Text style={styles.approveButtonText}>{bulkWalletTopupsProcessing ? 'Working...' : `Approve Selected (${selectedWalletTopupIds.size})`}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectButton, styles.bulkActionButton, selectedWalletTopupIds.size === 0 && styles.photoUploadDisabled]}
                    onPress={() => bulkRejectWalletTopups(filteredWalletTopupRequests.filter((request) => selectedWalletTopupIds.has(request.id)))}
                    disabled={selectedWalletTopupIds.size === 0 || bulkWalletTopupsProcessing}
                  >
                    <X color="#ff4444" size={16} />
                    <Text style={styles.rejectButtonText}>{bulkWalletTopupsProcessing ? 'Working...' : `Reject Selected (${selectedWalletTopupIds.size})`}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {filteredWalletTopupRequests.map((request) => {
              const selected = selectedWalletTopupIds.has(request.id);
              return (
                <View key={request.id} style={[styles.paymentCard, selected && styles.paymentCardSelected]}>
                  <View style={styles.productHeader}>
                    <TouchableOpacity style={styles.bulkRowCheckbox} onPress={() => toggleWalletTopupSelected(request.id)} disabled={bulkWalletTopupsProcessing}>
                      {selected ? <CheckSquare color={theme.gold} size={20} /> : <Square color={theme.muted} size={20} />}
                    </TouchableOpacity>
                    <Text style={[styles.productName, styles.bulkRowProductName]}>Rs. {request.amount}</Text>
                    <Text style={styles.paymentStatus}>Pending</Text>
                  </View>
                  <Text style={styles.paymentLine}>Method: {request.payment_method || 'Not provided'}</Text>
                  <Text style={styles.paymentLine}>App User: {request.user_name || 'Unknown'} ({request.phone})</Text>
                  {walletTopupReceiptUrls[request.id] ? (
                    <Image source={{ uri: walletTopupReceiptUrls[request.id] }} style={styles.receiptImage} resizeMode="cover" accessibilityLabel="Top-up receipt" />
                  ) : (
                    <Text style={styles.emptyText}>Receipt preview unavailable.</Text>
                  )}
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.approveButton} onPress={() => approveWalletTopup(request)} disabled={bulkWalletTopupsProcessing}>
                      <Check color="white" size={16} /><Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectButton} onPress={() => rejectWalletTopup(request)} disabled={bulkWalletTopupsProcessing}>
                      <X color="#ff4444" size={16} /><Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'users' && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}><UsersRound color={theme.text} size={19} /><Text style={styles.sectionTitle}>All Users ({users.length})</Text></View>
            <TouchableOpacity style={styles.photoUploadButton} onPress={exportUsersCsv}>
              <Download color="#4a9eff" size={16} />
              <Text style={styles.photoUploadText}>Export Users CSV</Text>
            </TouchableOpacity>
            {users.length > 0 && (
              <View style={styles.productSearchBox}>
                <Search color={theme.muted} size={20} />
                <TextInput
                  style={styles.productSearchInput}
                  placeholder="Search by name, phone, email, or member ID..."
                  placeholderTextColor={theme.muted}
                  value={usersSearch}
                  onChangeText={setUsersSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  accessibilityLabel="Search users"
                />
                {usersSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setUsersSearch('')} accessibilityLabel="Clear users search">
                    <X color={theme.muted} size={20} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            {usersSearch.trim() && (
              <Text style={styles.searchResultText}>
                Showing {filteredUsers.length} of {users.length} users
              </Text>
            )}
            {users.length === 0 && <Text style={styles.emptyText}>No users yet!</Text>}
            {users.length > 0 && filteredUsers.length === 0 && (
              <Text style={styles.emptyText}>No users match “{usersSearch.trim()}”.</Text>
            )}
            {filteredUsers.map((u) => {
              const details = u.auth_user_id ? userProfileDetails[u.auth_user_id] : undefined;
              const walletExpanded = walletAdjustExpandedPhone === u.phone;
              const walletDraft = getWalletAdjustDraft(u.phone);
              return (
                <View key={u.id} style={styles.userCard}>
                  <View style={styles.inlineRow}><UserRound color={theme.text} size={16} /><Text style={styles.userName}>{u.name || 'Unknown'}</Text></View>
                  <Text style={styles.userPhone}>{u.phone}</Text>
                  {u.email && <Text style={styles.userDate}>Email: {u.email}</Text>}
                  {u.cnic && <Text style={styles.userDate}>CNIC: {u.cnic}</Text>}
                  {u.jazzcash_number && <Text style={styles.userDate}>JazzCash: {u.jazzcash_number}</Text>}
                  <Text style={styles.userDate}>Member ID: JB-{u.member_number}</Text>
                  <Text style={styles.userDate}>City: {details?.city || 'Not added'}</Text>
                  <Text style={styles.userDate}>Date of Birth: {details?.date_of_birth ? new Date(details.date_of_birth).toLocaleDateString() : 'Not added'}</Text>
                  <Text style={styles.userDate}>Joined: {new Date(u.created_at).toLocaleDateString()}</Text>
                  <Text style={styles.userEntries}>
                    Entries: {entries.filter(e => e.phone === u.phone).length}
                  </Text>
                  <View style={styles.inlineRow}>
                    <Wallet color={theme.gold} size={16} />
                    <Text style={styles.userEntries}>Wallet: Rs. {(walletBalances[u.phone] ?? 0).toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.walletAdjustToggle}
                    onPress={() => setWalletAdjustExpandedPhone(walletExpanded ? null : u.phone)}
                  >
                    <Text style={styles.walletAdjustToggleText}>{walletExpanded ? 'Cancel' : 'Adjust Wallet'}</Text>
                  </TouchableOpacity>
                  {walletExpanded && (
                    <View style={styles.walletAdjustForm}>
                      <View style={styles.actionRow}>
                        {(['bonus', 'refund', 'adjustment'] as WalletTransactionType[]).map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={[styles.statusBadge, walletDraft.type === type ? styles.activeBadge : styles.completedBadge]}
                            onPress={() => setWalletAdjustDrafts((prev) => ({ ...prev, [u.phone]: { ...walletDraft, type } }))}
                          >
                            <Text style={styles.tabLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Amount (negative to debit, e.g. -50)"
                        placeholderTextColor="#666"
                        keyboardType="numbers-and-punctuation"
                        value={walletDraft.amount}
                        onChangeText={(text) => setWalletAdjustDrafts((prev) => ({ ...prev, [u.phone]: { ...walletDraft, amount: text } }))}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Reason — optional (shows in this user's transaction history)"
                        placeholderTextColor="#666"
                        value={walletDraft.reason}
                        onChangeText={(text) => setWalletAdjustDrafts((prev) => ({ ...prev, [u.phone]: { ...walletDraft, reason: text } }))}
                      />
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => saveWalletAdjustment(u.phone)}
                        disabled={walletAdjustSaving === u.phone}
                      >
                        <Wallet color="white" size={16} />
                        <Text style={styles.approveButtonText}>{walletAdjustSaving === u.phone ? 'Saving...' : 'Save Adjustment'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {(() => {
                    const refundExpanded = refundFormExpandedPhone === u.phone;
                    const refundDraft = getRefundDraft(u.phone);
                    const approvedTxns = transactions.filter((t) => t.phone === u.phone && t.status === 'approved');
                    return (
                      <>
                        <TouchableOpacity
                          style={styles.walletAdjustToggle}
                          onPress={() => setRefundFormExpandedPhone(refundExpanded ? null : u.phone)}
                        >
                          <Text style={styles.walletAdjustToggleText}>{refundExpanded ? 'Cancel' : 'Request Refund'}</Text>
                        </TouchableOpacity>
                        {refundExpanded && (
                          <View style={styles.walletAdjustForm}>
                            {approvedTxns.length === 0 ? (
                              <Text style={styles.emptyText}>No approved payments found for this user to refund.</Text>
                            ) : (
                              approvedTxns.map((txn) => (
                                <TouchableOpacity
                                  key={txn.id}
                                  style={[styles.statusBadge, refundDraft.transactionId === txn.id ? styles.activeBadge : styles.completedBadge]}
                                  onPress={() => setRefundDrafts((prev) => ({ ...prev, [u.phone]: { ...refundDraft, transactionId: txn.id } }))}
                                >
                                  <Text style={styles.tabLabel}>Rs. {txn.amount} — {new Date(txn.created_at).toLocaleDateString()}</Text>
                                </TouchableOpacity>
                              ))
                            )}
                            <TextInput
                              style={styles.input}
                              placeholder="Reason for refund"
                              placeholderTextColor="#666"
                              value={refundDraft.reason}
                              onChangeText={(text) => setRefundDrafts((prev) => ({ ...prev, [u.phone]: { ...refundDraft, reason: text } }))}
                            />
                            <TouchableOpacity
                              style={styles.approveButton}
                              onPress={() => submitRefundRequest(u.phone)}
                              disabled={refundSubmitting || approvedTxns.length === 0}
                            >
                              <ReceiptText color="white" size={16} />
                              <Text style={styles.approveButtonText}>{refundSubmitting ? 'Logging...' : 'Log Refund Request'}</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </>
                    );
                  })()}
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'support' && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Mail color={theme.text} size={19} />
              <Text style={styles.sectionTitle}>Support Inbox ({supportTickets.filter((t) => t.status === 'open').length} open)</Text>
            </View>
            {supportTickets.length === 0 ? (
              <Text style={styles.emptyText}>No feedback or problem reports yet.</Text>
            ) : (
              supportTickets.map((ticket) => (
                <View key={ticket.id} style={[styles.paymentCard, ticket.status === 'resolved' && styles.verificationAdminCardHidden]}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>{ticket.subject}</Text>
                    <View style={[styles.statusBadge, ticket.kind === 'problem' ? styles.rejectedBadge : styles.activeBadge]}>
                      <Text style={styles.statusText}>{ticket.kind === 'problem' ? 'Problem' : 'Feedback'}</Text>
                    </View>
                  </View>
                  <Text style={styles.paymentLine}>{ticket.message}</Text>
                  <Text style={styles.paymentLine}>From: {ticket.name || 'Unknown'} ({ticket.phone || 'No phone'})</Text>
                  <Text style={styles.paymentLine}>Received: {new Date(ticket.created_at).toLocaleString()}</Text>
                  <View style={styles.actionRow}>
                    {ticket.status === 'open' ? (
                      <TouchableOpacity style={styles.approveButton} onPress={() => resolveSupportTicket(ticket)} disabled={supportTicketResolvingId === ticket.id}>
                        <Check color="white" size={16} /><Text style={styles.approveButtonText}>{supportTicketResolvingId === ticket.id ? 'Working...' : 'Mark Resolved'}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.visibilityButton} onPress={() => reopenSupportTicket(ticket)} disabled={supportTicketResolvingId === ticket.id}>
                        <Text style={styles.visibilityButtonText}>{supportTicketResolvingId === ticket.id ? 'Working...' : 'Reopen'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'revenue' && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}><DollarSign color={theme.text} size={19} /><Text style={styles.sectionTitle}>Revenue Dashboard</Text></View>
            <View style={styles.revenueGrid}>
              <View style={styles.revenueCard}>
                <Text style={styles.revenueNumber}>Rs. {totalRevenue.toLocaleString()}</Text>
                <Text style={styles.revenueLabel}>Total Revenue</Text>
              </View>
              <View style={styles.revenueCard}>
                <Text style={styles.revenueNumber}>{users.length}</Text>
                <Text style={styles.revenueLabel}>Total Users</Text>
              </View>
              <View style={styles.revenueCard}>
                <Text style={styles.revenueNumber}>{entries.length}</Text>
                <Text style={styles.revenueLabel}>Total Entries</Text>
              </View>
              <View style={styles.revenueCard}>
                <Text style={styles.revenueNumber}>{activeDraws}</Text>
                <Text style={styles.revenueLabel}>Active Draws</Text>
              </View>
              <View style={styles.revenueCard}>
                <Text style={styles.revenueNumber}>{completedDraws}</Text>
                <Text style={styles.revenueLabel}>Completed</Text>
              </View>
            </View>

            <View style={[styles.sectionTitleRow, { marginTop: 20 }]}><Package color={theme.text} size={19} /><Text style={styles.sectionTitle}>Per Product Revenue</Text></View>
            {products.map((p) => (
              <View key={p.id} style={styles.revenueRow}>
                <Text style={styles.revenueProductName}>{p.name}</Text>
                <Text style={styles.revenueProductAmt}>Rs. {((p.current_entries || 0) * (p.entry_fee || 1)).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'audit' && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}><History color={theme.text} size={19} /><Text style={styles.sectionTitle}>Admin Action Log ({auditLog.length})</Text></View>
            {auditLog.length === 0 && <Text style={styles.emptyText}>No admin actions logged yet.</Text>}
            {auditLog.map((entry) => (
              <View key={entry.id} style={styles.paymentCard}>
                <View style={styles.productHeader}>
                  <Text style={styles.productName}>{formatAuditActionLabel(entry.action_type)}</Text>
                </View>
                {entry.details ? (
                  <Text style={styles.paymentLine}>{formatAuditDetails(entry.details)}</Text>
                ) : null}
                <Text style={styles.paymentLine}>{new Date(entry.created_at).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}><Settings color={theme.text} size={19} /><Text style={styles.sectionTitle}>App Settings</Text></View>

            <View style={styles.settingLabelRow}><Sun color={theme.text} size={17} /><Text style={styles.settingLabel}>Admin Panel Theme</Text></View>
            <Text style={styles.settingHint}>Choose the appearance used throughout the admin panel.</Text>
            <View style={styles.themeSelector}>
              <TouchableOpacity
                style={[styles.themeOption, mode === 'light' && styles.themeOptionSelected]}
                onPress={() => setThemeMode('light')}
              >
                <Sun color={mode === 'light' ? theme.buttonText : theme.text} size={20} />
                <Text style={[styles.themeOptionText, mode === 'light' && styles.themeOptionTextSelected]}>Light Mode</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeOption, mode === 'dark' && styles.themeOptionSelected]}
                onPress={() => setThemeMode('dark')}
              >
                <Moon color={mode === 'dark' ? theme.buttonText : theme.text} size={20} />
                <Text style={[styles.themeOptionText, mode === 'dark' && styles.themeOptionTextSelected]}>Dark Mode</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.settingLabelRow}><BadgeCheck color={theme.text} size={17} /><Text style={styles.settingLabel}>Registered &amp; Verified Documents</Text></View>
            <Text style={styles.settingHint}>Upload and manage documents shown on the public Registered &amp; Verified page.</Text>
            {verificationEditingId ? (
              <View style={styles.editBanner}>
                <Pencil color={theme.gold} size={15} />
                <Text style={styles.editBannerText}>Editing document</Text>
              </View>
            ) : null}
            <TextInput
              style={styles.input}
              placeholder="Document title"
              placeholderTextColor={theme.subtle}
              value={verificationTitle}
              onChangeText={setVerificationTitle}
              maxLength={120}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Document description"
              placeholderTextColor={theme.subtle}
              value={verificationDescription}
              onChangeText={setVerificationDescription}
              multiline
              numberOfLines={4}
              maxLength={2000}
            />
            <TouchableOpacity
              style={[styles.photoUploadButton, verificationUploading && styles.photoUploadDisabled]}
              onPress={uploadVerificationImage}
              disabled={verificationUploading}
            >
              {!verificationUploading && <Camera color={theme.info} size={18} />}
              <Text style={styles.photoUploadText}>{verificationUploading ? 'Uploading...' : verificationImageUrl ? 'Replace Document Image' : 'Upload Document Image'}</Text>
            </TouchableOpacity>
            {verificationImageUrl ? <Image source={{ uri: verificationImageUrl }} style={styles.verificationPreviewImage} resizeMode="contain" accessibilityLabel="Verification document preview" /> : null}
            <View style={styles.settingsButtonRow}>
              <TouchableOpacity
                style={[styles.addButton, styles.settingsHalfButton, verificationSaving && styles.photoUploadDisabled]}
                onPress={saveVerificationDocument}
                disabled={verificationSaving}
              >
                {!verificationSaving && <Save color="white" size={18} />}
                <Text style={styles.addButtonText}>{verificationSaving ? 'Saving...' : verificationEditingId ? 'Save Changes' : 'Publish Document'}</Text>
              </TouchableOpacity>
              {verificationEditingId ? (
                <TouchableOpacity style={[styles.cancelButton, styles.settingsHalfButton]} onPress={resetVerificationForm}>
                  <X color={theme.danger} size={17} />
                  <Text style={styles.cancelButtonText}>Cancel Edit</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.verificationList}>
              {verificationDocuments.length === 0 ? (
                <Text style={styles.emptyText}>No verification documents added yet.</Text>
              ) : verificationDocuments.map((document) => (
                <View key={document.id} style={[styles.verificationAdminCard, !document.is_visible && styles.verificationAdminCardHidden]}>
                  <Image source={{ uri: document.image_url }} style={styles.verificationAdminImage} resizeMode="contain" accessibilityLabel={`${document.title} document`} />
                  <View style={styles.verificationAdminContent}>
                    <View style={styles.productHeader}>
                      <Text style={styles.productName}>{document.title}</Text>
                      <View style={[styles.statusBadge, document.is_visible ? styles.activeBadge : styles.completedBadge]}>
                        <Circle color={document.is_visible ? theme.primary : theme.gold} size={8} fill={document.is_visible ? theme.primary : theme.gold} />
                        <Text style={styles.statusText}>{document.is_visible ? 'Visible' : 'Hidden'}</Text>
                      </View>
                    </View>
                    <Text style={styles.verificationAdminDescription}>{document.description}</Text>
                    <View style={styles.verificationActionRow}>
                      <TouchableOpacity style={styles.editButton} onPress={() => startVerificationEdit(document)}>
                        <Pencil color={theme.info} size={16} /><Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.visibilityButton} onPress={() => toggleVerificationVisibility(document)}>
                        {document.is_visible ? <EyeOff color={theme.gold} size={16} /> : <Eye color={theme.gold} size={16} />}
                        <Text style={styles.visibilityButtonText}>{document.is_visible ? 'Hide' : 'Show'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteWideButton} onPress={() => removeVerificationDocument(document)}>
                        <Trash2 color={theme.danger} size={16} /><Text style={styles.deleteWideButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.settingLabelRow}><BookOpen color={theme.text} size={17} /><Text style={styles.settingLabel}>Blog Posts</Text></View>
            <Text style={styles.settingHint}>Articles shown on the public JeetoBaz Blog. Content uses "## Heading" lines for headings and "- " lines for bullets -- everything else becomes paragraphs.</Text>
            {blogEditingId ? (
              <View style={styles.editBanner}>
                <Pencil color={theme.gold} size={15} />
                <Text style={styles.editBannerText}>Editing article</Text>
              </View>
            ) : null}
            <TextInput
              style={styles.input}
              placeholder="Article title"
              placeholderTextColor={theme.subtle}
              value={blogTitle}
              onChangeText={setBlogTitle}
              maxLength={160}
            />
            <TextInput
              style={styles.input}
              placeholder="URL slug (auto-generated from title if left blank)"
              placeholderTextColor={theme.subtle}
              value={blogSlug}
              onChangeText={setBlogSlug}
              autoCapitalize="none"
              maxLength={160}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Short excerpt shown on the blog listing card"
              placeholderTextColor={theme.subtle}
              value={blogExcerpt}
              onChangeText={setBlogExcerpt}
              multiline
              numberOfLines={2}
              maxLength={300}
            />
            <View style={styles.categoryChipsWrap}>
              {BLOG_CATEGORIES.map((entry) => (
                <TouchableOpacity
                  key={entry.key}
                  style={[styles.categoryChip, blogCategory === entry.key && styles.categoryChipActive]}
                  onPress={() => setBlogCategory(entry.key)}
                >
                  <Text style={[styles.categoryChipText, blogCategory === entry.key && { color: theme.gold }]}>{entry.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Article content -- use ## for headings and - for bullet lines"
              placeholderTextColor={theme.subtle}
              value={blogContent}
              onChangeText={setBlogContent}
              multiline
              numberOfLines={10}
              maxLength={20000}
            />
            <TouchableOpacity
              style={[styles.photoUploadButton, blogUploading && styles.photoUploadDisabled]}
              onPress={uploadBlogCover}
              disabled={blogUploading}
            >
              {!blogUploading && <Camera color={theme.info} size={18} />}
              <Text style={styles.photoUploadText}>{blogUploading ? 'Uploading...' : blogCoverImage ? 'Replace Cover Image' : 'Upload Cover Image'}</Text>
            </TouchableOpacity>
            {blogCoverImage ? <Image source={resolveBlogCover(blogCoverImage)} style={styles.verificationPreviewImage} resizeMode="cover" accessibilityLabel="Blog cover preview" /> : null}
            <View style={styles.settingsButtonRow}>
              <TouchableOpacity
                style={[styles.addButton, styles.settingsHalfButton, blogSaving && styles.photoUploadDisabled]}
                onPress={saveBlogPost}
                disabled={blogSaving}
              >
                {!blogSaving && <Save color="white" size={18} />}
                <Text style={styles.addButtonText}>{blogSaving ? 'Saving...' : blogEditingId ? 'Save Changes' : 'Publish Article'}</Text>
              </TouchableOpacity>
              {blogEditingId ? (
                <TouchableOpacity style={[styles.cancelButton, styles.settingsHalfButton]} onPress={resetBlogForm}>
                  <X color={theme.danger} size={17} />
                  <Text style={styles.cancelButtonText}>Cancel Edit</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.verificationList}>
              {blogPosts.length === 0 ? (
                <Text style={styles.emptyText}>No blog posts added yet.</Text>
              ) : blogPosts.map((post) => (
                <View key={post.id} style={[styles.verificationAdminCard, !post.is_visible && styles.verificationAdminCardHidden]}>
                  <Image source={resolveBlogCover(post.cover_image)} style={styles.verificationAdminImage} resizeMode="cover" accessibilityLabel={`${post.title} cover`} />
                  <View style={styles.verificationAdminContent}>
                    <View style={styles.productHeader}>
                      <Text style={styles.productName}>{post.title}</Text>
                      <View style={[styles.statusBadge, post.is_visible ? styles.activeBadge : styles.completedBadge]}>
                        <Circle color={post.is_visible ? theme.primary : theme.gold} size={8} fill={post.is_visible ? theme.primary : theme.gold} />
                        <Text style={styles.statusText}>{post.is_visible ? 'Visible' : 'Hidden'}</Text>
                      </View>
                    </View>
                    <Text style={styles.verificationAdminDescription}>{post.excerpt}</Text>
                    <View style={styles.verificationActionRow}>
                      <TouchableOpacity style={styles.editButton} onPress={() => startBlogEdit(post)}>
                        <Pencil color={theme.info} size={16} /><Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.visibilityButton} onPress={() => toggleBlogVisibility(post)}>
                        {post.is_visible ? <EyeOff color={theme.gold} size={16} /> : <Eye color={theme.gold} size={16} />}
                        <Text style={styles.visibilityButtonText}>{post.is_visible ? 'Hide' : 'Show'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteWideButton} onPress={() => removeBlogPost(post)}>
                        <Trash2 color={theme.danger} size={16} /><Text style={styles.deleteWideButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.settingLabelRow}><Camera color={theme.text} size={17} /><Text style={styles.settingLabel}>Brand Showcase Images</Text></View>
            <Text style={styles.settingHint}>Just photos, no names or claims -- shown in the "JeetoBaz Style" carousel on the home page.</Text>
            <TouchableOpacity
              style={[styles.photoUploadButton, brandShowcaseUploading && styles.photoUploadDisabled]}
              onPress={uploadBrandShowcaseImage}
              disabled={brandShowcaseUploading}
            >
              {!brandShowcaseUploading && <Camera color={theme.info} size={18} />}
              <Text style={styles.photoUploadText}>{brandShowcaseUploading ? 'Uploading...' : 'Upload Showcase Image'}</Text>
            </TouchableOpacity>

            <View style={styles.verificationList}>
              {brandShowcaseImages.length === 0 ? (
                <Text style={styles.emptyText}>No showcase images added yet.</Text>
              ) : brandShowcaseImages.map((image) => (
                <View key={image.id} style={[styles.verificationAdminCard, !image.is_visible && styles.verificationAdminCardHidden]}>
                  <Image source={{ uri: image.image_url }} style={styles.verificationAdminImage} resizeMode="contain" accessibilityLabel="Brand showcase image" />
                  <View style={styles.verificationAdminContent}>
                    <View style={styles.productHeader}>
                      <View style={[styles.statusBadge, image.is_visible ? styles.activeBadge : styles.completedBadge]}>
                        <Circle color={image.is_visible ? theme.primary : theme.gold} size={8} fill={image.is_visible ? theme.primary : theme.gold} />
                        <Text style={styles.statusText}>{image.is_visible ? 'Visible' : 'Hidden'}</Text>
                      </View>
                    </View>
                    <View style={styles.verificationActionRow}>
                      <TouchableOpacity style={styles.visibilityButton} onPress={() => toggleBrandShowcaseVisibility(image)}>
                        {image.is_visible ? <EyeOff color={theme.gold} size={16} /> : <Eye color={theme.gold} size={16} />}
                        <Text style={styles.visibilityButtonText}>{image.is_visible ? 'Hide' : 'Show'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteWideButton} onPress={() => removeBrandShowcaseImage(image)}>
                        <Trash2 color={theme.danger} size={16} /><Text style={styles.deleteWideButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.settingLabelRow}><Star color={theme.text} size={17} /><Text style={styles.settingLabel}>Testimonials</Text></View>
            <Text style={styles.settingHint}>
              Paste a real winner&apos;s actual review word-for-word (from Google, Trustpilot, WhatsApp, or the
              website) -- never write one yourself. Shown on the About page with review structured data.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Reviewer name (e.g. Ahmed K.)"
              placeholderTextColor="#666"
              value={testimonialReviewerName}
              onChangeText={setTestimonialReviewerName}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Paste the actual review text here..."
              placeholderTextColor="#666"
              value={testimonialReviewText}
              onChangeText={setTestimonialReviewText}
              multiline
              numberOfLines={3}
            />
            <Text style={styles.paymentLine}>Rating:</Text>
            <View style={styles.actionRow}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[styles.statusBadge, testimonialRating === rating ? styles.activeBadge : styles.completedBadge]}
                  onPress={() => setTestimonialRating(rating)}
                >
                  <Text style={styles.tabLabel}>{rating} ★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.paymentLine}>Source:</Text>
            <View style={styles.actionRow}>
              {TESTIMONIAL_SOURCES.map((source) => (
                <TouchableOpacity
                  key={source}
                  style={[styles.statusBadge, testimonialSource === source ? styles.activeBadge : styles.completedBadge]}
                  onPress={() => setTestimonialSource(source)}
                >
                  <Text style={styles.tabLabel}>{TESTIMONIAL_SOURCE_LABELS[source]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Source URL — optional (link to the actual review, e.g. on Google)"
              placeholderTextColor="#666"
              value={testimonialSourceUrl}
              onChangeText={setTestimonialSourceUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.addButton} onPress={addTestimonial} disabled={testimonialSaving}>
              <Plus color="white" size={18} />
              <Text style={styles.addButtonText}>{testimonialSaving ? 'Saving...' : 'Add Testimonial'}</Text>
            </TouchableOpacity>

            <View style={styles.verificationList}>
              {testimonials.length === 0 ? (
                <Text style={styles.emptyText}>No testimonials added yet.</Text>
              ) : testimonials.map((testimonial) => (
                <View key={testimonial.id} style={[styles.verificationAdminCard, !testimonial.is_visible && styles.verificationAdminCardHidden]}>
                  <View style={styles.verificationAdminContent}>
                    <View style={styles.productHeader}>
                      <Text style={styles.productName}>{testimonial.reviewer_name} — {testimonial.rating}★ ({TESTIMONIAL_SOURCE_LABELS[testimonial.source]})</Text>
                      <View style={[styles.statusBadge, testimonial.is_visible ? styles.activeBadge : styles.completedBadge]}>
                        <Circle color={testimonial.is_visible ? theme.primary : theme.gold} size={8} fill={testimonial.is_visible ? theme.primary : theme.gold} />
                        <Text style={styles.statusText}>{testimonial.is_visible ? 'Visible' : 'Hidden'}</Text>
                      </View>
                    </View>
                    <Text style={styles.paymentLine}>{testimonial.review_text}</Text>
                    <View style={styles.verificationActionRow}>
                      <TouchableOpacity style={styles.visibilityButton} onPress={() => toggleTestimonialVisibility(testimonial)}>
                        {testimonial.is_visible ? <EyeOff color={theme.gold} size={16} /> : <Eye color={theme.gold} size={16} />}
                        <Text style={styles.visibilityButtonText}>{testimonial.is_visible ? 'Hide' : 'Show'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteWideButton} onPress={() => removeTestimonial(testimonial)}>
                        <Trash2 color={theme.danger} size={16} /><Text style={styles.deleteWideButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.settingLabelRow}><Bell color={theme.text} size={17} /><Text style={styles.settingLabel}>Announcement Banner</Text></View>
            <Text style={styles.settingHint}>This message will appear near the top of the home page for all users.</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. New draw starting soon! Honda 70 draw on 30 June!"
              placeholderTextColor="#666"
              value={announcement}
              onChangeText={setAnnouncement}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity style={styles.addButton} onPress={saveAnnouncement}>
              {announcementSaved ? <Check color="white" size={18} /> : <Save color="white" size={18} />}
              <Text style={styles.addButtonText}>{announcementSaved ? 'Saved!' : 'Save Announcement'}</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.settingLabelRow}><Star color={theme.text} size={17} /><Text style={styles.settingLabel}>Google Review Link</Text></View>
            <Text style={styles.settingHint}>
              Once a winner&apos;s status is set to Verified below, they automatically get an in-app notification asking
              for a review, linking here. Get this link from Google Business Profile → Get more reviews.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="https://g.page/r/.../review"
              placeholderTextColor="#666"
              value={googleReviewLink}
              onChangeText={setGoogleReviewLink}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.addButton} onPress={saveGoogleReviewLinkSetting}>
              {googleReviewLinkSaved ? <Check color="white" size={18} /> : <Save color="white" size={18} />}
              <Text style={styles.addButtonText}>{googleReviewLinkSaved ? 'Saved!' : 'Save Review Link'}</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.settingLabelRow}><Camera color={theme.text} size={17} /><Text style={styles.settingLabel}>Home Ad Images</Text></View>
            <Text style={styles.settingHint}>These images appear one at a time in the home-page carousel. Maximum 10 images.</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="One image URL per line"
              placeholderTextColor="#666"
              value={homeAdImagesInput}
              onChangeText={setHomeAdImagesInput}
              multiline
              numberOfLines={6}
            />
            <View style={styles.settingsButtonRow}>
              <TouchableOpacity style={[styles.addButton, styles.settingsHalfButton]} onPress={() => saveHomeAdImageSettings()}>
                {homeAdImagesSaved ? <Check color="white" size={18} /> : <Save color="white" size={18} />}
                <Text style={styles.addButtonText}>{homeAdImagesSaved ? 'Saved!' : 'Save Ad Images'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoUploadButton, styles.settingsHalfButton, homeAdUploading && styles.photoUploadDisabled]}
                onPress={uploadHomeAdImage}
                disabled={homeAdUploading}
              >
                {!homeAdUploading && <Camera color="#4a9eff" size={18} />}
                <Text style={styles.photoUploadText}>{homeAdUploading ? 'Uploading...' : 'Upload Ad Image'}</Text>
              </TouchableOpacity>
            </View>
            {parseHomeAdImagesInput().length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.adPreviewRow}>
                {parseHomeAdImagesInput().map((image, index) => (
                  <Image key={`${image}-${index}`} source={{ uri: image }} style={styles.adPreviewImage} resizeMode="cover" accessibilityLabel={`Home ad image ${index + 1}`} />
                ))}
              </ScrollView>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.settingLabelRow}><ShieldCheck color={theme.text} size={17} /><Text style={styles.settingLabel}>Home Trust Badges</Text></View>
            <Text style={styles.settingHint}>The 3 short labels shown in the strip near the top of the home page.</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Locked Results"
              placeholderTextColor="#666"
              value={trustBadges[0]}
              onChangeText={(value) => updateTrustBadge(0, value)}
            />
            <TextInput
              style={styles.input}
              placeholder="e.g. Transparent"
              placeholderTextColor="#666"
              value={trustBadges[1]}
              onChangeText={(value) => updateTrustBadge(1, value)}
            />
            <TextInput
              style={styles.input}
              placeholder="e.g. Made for Pakistan"
              placeholderTextColor="#666"
              value={trustBadges[2]}
              onChangeText={(value) => updateTrustBadge(2, value)}
            />
            <TouchableOpacity style={styles.addButton} onPress={saveTrustBadgesSettings} disabled={trustBadgesSaving}>
              {trustBadgesSaved ? <Check color="white" size={18} /> : <Save color="white" size={18} />}
              <Text style={styles.addButtonText}>{trustBadgesSaving ? 'Saving...' : trustBadgesSaved ? 'Saved!' : 'Save Trust Badges'}</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.settingLabelRow}><CreditCard color={theme.text} size={17} /><Text style={styles.settingLabel}>Payment Accounts</Text></View>
            <Text style={styles.settingHint}>
              The account numbers and QR codes shown to users on the payment and wallet top-up screens. Toggle
              Active/Inactive to hide a method without deleting it (e.g. if an account gets temporarily blocked).
            </Text>
            <View style={styles.verificationList}>
              {paymentAccounts.length === 0 ? (
                <Text style={styles.emptyText}>No payment accounts configured yet.</Text>
              ) : paymentAccounts.map((account, index) => (
                <View key={`payment-account-${index}`} style={[styles.verificationAdminCard, !account.active && styles.verificationAdminCardHidden]}>
                  <View style={styles.verificationAdminContent}>
                    <View style={styles.productHeader}>
                      <TextInput
                        style={[styles.input, styles.paymentAccountMethodInput]}
                        placeholder="Method name e.g. JazzCash"
                        placeholderTextColor="#666"
                        value={account.method}
                        onChangeText={(value) => updatePaymentAccountField(index, 'method', value)}
                      />
                      <View style={[styles.statusBadge, account.active ? styles.activeBadge : styles.completedBadge]}>
                        <Circle color={account.active ? theme.primary : theme.gold} size={8} fill={account.active ? theme.primary : theme.gold} />
                        <Text style={styles.statusText}>{account.active ? 'Active' : 'Inactive'}</Text>
                      </View>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Account number"
                      placeholderTextColor="#666"
                      value={account.number}
                      onChangeText={(value) => updatePaymentAccountField(index, 'number', value)}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Account title"
                      placeholderTextColor="#666"
                      value={account.accountTitle}
                      onChangeText={(value) => updatePaymentAccountField(index, 'accountTitle', value)}
                    />
                    {account.qrImageUrl ? (
                      <Image source={{ uri: account.qrImageUrl }} style={styles.paymentAccountQrPreview} resizeMode="contain" accessibilityLabel={`${account.method || 'Payment'} QR code`} />
                    ) : (
                      <Text style={styles.settingNote}>No custom QR uploaded — the app's default QR for this method name is used, if one exists.</Text>
                    )}
                    <View style={styles.verificationActionRow}>
                      <TouchableOpacity
                        style={[styles.photoUploadButton, paymentQrUploadingIndex === index && styles.photoUploadDisabled]}
                        onPress={() => uploadPaymentAccountQr(index)}
                        disabled={paymentQrUploadingIndex === index}
                      >
                        {paymentQrUploadingIndex !== index && <Camera color="#4a9eff" size={16} />}
                        <Text style={styles.photoUploadText}>{paymentQrUploadingIndex === index ? 'Uploading...' : 'Upload QR'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.visibilityButton} onPress={() => togglePaymentAccountActive(index)}>
                        {account.active ? <EyeOff color={theme.gold} size={16} /> : <Eye color={theme.gold} size={16} />}
                        <Text style={styles.visibilityButtonText}>{account.active ? 'Deactivate' : 'Activate'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteWideButton} onPress={() => removePaymentAccountRow(index)}>
                        <Trash2 color={theme.danger} size={16} /><Text style={styles.deleteWideButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.settingsButtonRow}>
              <TouchableOpacity style={[styles.addButton, styles.settingsHalfButton]} onPress={() => savePaymentAccountsSettings()} disabled={paymentAccountsSaving}>
                {paymentAccountsSaved ? <Check color="white" size={18} /> : <Save color="white" size={18} />}
                <Text style={styles.addButtonText}>{paymentAccountsSaving ? 'Saving...' : paymentAccountsSaved ? 'Saved!' : 'Save Payment Accounts'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.photoUploadButton, styles.settingsHalfButton]} onPress={addPaymentAccountRow}>
                <Plus color="#4a9eff" size={18} />
                <Text style={styles.photoUploadText}>Add Payment Method</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.settingLabelRow}><Send color={theme.text} size={17} /><Text style={styles.settingLabel}>Send Notification</Text></View>
            <Text style={styles.settingHint}>This notification will appear on every user's Notifications page.</Text>
            <TextInput
              style={styles.input}
              placeholder="Title e.g. New draw added!"
              placeholderTextColor="#666"
              value={notificationTitle}
              onChangeText={setNotificationTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Message e.g. The Powerbank draw is now live. Enter today!"
              placeholderTextColor="#666"
              value={notificationBody}
              onChangeText={setNotificationBody}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity style={styles.addButton} onPress={sendGlobalNotification} disabled={notificationSending}>
              {!notificationSending && <Send color="white" size={18} />}<Text style={styles.addButtonText}>{notificationSending ? 'Sending...' : 'Send to All Users'}</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.settingLabelRow}><LockKeyhole color={theme.text} size={17} /><Text style={styles.settingLabel}>Secure Admin Login</Text></View>
            <Text style={styles.settingHint}>Admin: {ADMIN_EMAIL}</Text>
            <Text style={styles.settingNote}>The password is managed securely through Supabase Authentication.</Text>

            <View style={styles.divider} />

            <View style={styles.settingLabelRow}><BarChart3 color={theme.text} size={17} /><Text style={styles.settingLabel}>Quick Stats</Text></View>
            <View style={styles.quickStats}>
              <Text style={styles.quickStat}>Live URL: jeetobaz.pk</Text>
              <Text style={styles.quickStat}>Products: {products.length}</Text>
              <Text style={styles.quickStat}>Users: {users.length}</Text>
              <Text style={styles.quickStat}>Entries: {entries.length}</Text>
              <Text style={styles.quickStat}>Pending Payments: {pendingPayments.length}</Text>
              <Text style={styles.quickStat}>Pending Wallet Top-Ups: {walletTopupRequests.length}</Text>
              <Text style={styles.quickStat}>Revenue: Rs. {totalRevenue.toLocaleString()}</Text>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
    </>
  );
}

type AdminTheme = (typeof AppThemes)[keyof typeof AppThemes];

function createStyles(theme: AdminTheme) {
 return StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  loginContainer: { flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 30 },
  loginSubtitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 24 },
  loginInputRow: { backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 15, width: '100%', marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginInput: { color: theme.text, paddingVertical: 15, fontSize: 16, flex: 1, outlineStyle: 'none' } as never,
  forgotButton: { alignSelf: 'flex-end', marginBottom: 18, paddingVertical: 3 },
  forgotText: { color: theme.gold, fontSize: 14, fontWeight: 'bold' },
  errorText: { color: '#ff4444', fontSize: 12, marginBottom: 10, marginLeft: 4 },
  loginBtn: { backgroundColor: theme.gold, padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: '100%', flexDirection: 'row', gap: 7 },
  loginBtnDisabled: { opacity: 0.55 },
  loginBtnText: { fontSize: 18, fontWeight: 'bold', color: theme.buttonText },
  header: { backgroundColor: theme.surfaceAlt, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: theme.gold },
  title: { fontSize: 22, fontWeight: 'bold', color: theme.gold },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  logoutBtn: { color: theme.danger, fontSize: 14, fontWeight: 'bold' },
  tabBar: { flexDirection: 'row', backgroundColor: theme.surfaceAlt, borderBottomWidth: 1, borderBottomColor: theme.border },
  tab: { flex: 1, alignItems: 'center', padding: 10 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: theme.gold },
  tabText: { fontSize: 18 },
  tabLabel: { fontSize: 11, color: theme.subtle, marginTop: 2 },
  activeTabText: { color: theme.gold },
  content: { flex: 1 },
  section: { margin: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  editBanner: { backgroundColor: theme.goldSoft, borderWidth: 1, borderColor: theme.gold, borderRadius: 8, padding: 8, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  editBannerText: { color: theme.gold, fontSize: 13, textAlign: 'center' },
  overdueDrawsBanner: { backgroundColor: '#3a2a05', borderBottomWidth: 1, borderBottomColor: theme.gold, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  overdueDrawsBannerText: { color: theme.gold, fontSize: 13, flex: 1, flexWrap: 'wrap' },
  input: { backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border, color: theme.text, padding: 15, marginBottom: 12, fontSize: 14 },
  categoryLabel: { color: theme.muted, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  categoryChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  categoryChip: { backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, paddingVertical: 7 },
  categoryChipActive: { backgroundColor: theme.goldSoft, borderColor: theme.gold },
  categoryChipText: { color: theme.muted, fontSize: 12, fontWeight: '600' },
  categoryChipTextActive: { color: theme.gold, fontWeight: '800' },
  drawDatePicker: { marginBottom: 12 },
  drawDatePickerLabel: { color: theme.muted, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  drawDateRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  drawDateField: { backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border, color: theme.text, paddingVertical: 12, paddingHorizontal: 8, fontSize: 14, width: 48, textAlign: 'center' },
  drawDateFieldYear: { width: 66 },
  drawDateFieldSpaced: { marginLeft: 14 },
  drawDateSeparator: { color: theme.muted, fontSize: 16, fontWeight: '700' },
  drawDateMeridiem: { backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border, paddingVertical: 12, paddingHorizontal: 12, marginLeft: 6 },
  drawDateMeridiemActive: { backgroundColor: theme.gold, borderColor: theme.gold },
  drawDateMeridiemText: { color: theme.text, fontSize: 13, fontWeight: '700' },
  drawDatePreview: { color: '#18a663', fontSize: 12, marginTop: 8 },
  drawDatePreviewInvalid: { color: '#ff4444', fontSize: 12, marginTop: 8 },
  productSearchBox: { minHeight: 52, backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 15, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  productSearchInput: { flex: 1, color: theme.text, fontSize: 14, paddingVertical: 13 },
  searchResultText: { color: theme.muted, fontSize: 12, marginBottom: 10 },
  textArea: { height: 80, textAlignVertical: 'top' },
  photoUploadButton: { backgroundColor: theme.infoSoft, borderWidth: 1, borderColor: theme.info, padding: 13, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12, flexDirection: 'row', gap: 7 },
  photoUploadDisabled: { opacity: 0.55 },
  photoUploadText: { color: theme.info, fontWeight: 'bold', fontSize: 14 },
  winnerPhotoPreview: { width: 120, height: 120, borderRadius: 8, alignSelf: 'center', marginBottom: 12, borderWidth: 1, borderColor: theme.gold },
  addButton: { backgroundColor: theme.primary, padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10, flexDirection: 'row', gap: 7 },
  settingsButtonRow: { flexDirection: 'row', gap: 10 },
  settingsHalfButton: { flex: 1 },
  adPreviewRow: { marginBottom: 4 },
  adPreviewImage: { width: 150, height: 72, borderRadius: 8, marginRight: 10, borderWidth: 1, borderColor: theme.border },
  paymentAccountMethodInput: { flex: 1, marginBottom: 0, marginRight: 10 },
  paymentAccountQrPreview: { width: 96, height: 96, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: theme.border, alignSelf: 'flex-start' },
  verificationPreviewImage: { width: '100%', height: 260, borderRadius: 10, backgroundColor: theme.surfaceAlt, borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
  verificationList: { marginTop: 14 },
  verificationAdminCard: { backgroundColor: theme.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.border, padding: 12, marginBottom: 12, flexDirection: 'row', gap: 12 },
  verificationAdminCardHidden: { opacity: 0.68 },
  verificationAdminImage: { width: 120, height: 110, borderRadius: 8, backgroundColor: theme.surfaceAlt },
  verificationAdminContent: { flex: 1 },
  verificationAdminDescription: { color: theme.muted, fontSize: 13, lineHeight: 19, marginBottom: 10 },
  verificationActionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  visibilityButton: { flex: 1, minWidth: 90, backgroundColor: theme.goldSoft, padding: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.gold, flexDirection: 'row', gap: 5 },
  visibilityButtonText: { color: theme.gold, fontWeight: 'bold', fontSize: 13 },
  deleteWideButton: { flex: 1, minWidth: 90, backgroundColor: theme.dangerSoft, padding: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.danger, flexDirection: 'row', gap: 5 },
  deleteWideButtonText: { color: theme.danger, fontWeight: 'bold', fontSize: 13 },
  saveButton: { backgroundColor: theme.gold },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { backgroundColor: theme.dangerSoft, padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.danger, flexDirection: 'row', gap: 7 },
  cancelButtonText: { color: theme.danger, fontSize: 14, fontWeight: 'bold' },
  productCard: { backgroundColor: theme.surface, borderRadius: 15, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
  productCardEditing: { borderColor: theme.gold, borderWidth: 2 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 16, fontWeight: 'bold', color: theme.text, flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  activeBadge: { backgroundColor: theme.primarySoft },
  completedBadge: { backgroundColor: theme.goldSoft },
  pendingBadge: { backgroundColor: '#F59E0B33' },
  rejectedBadge: { backgroundColor: '#ff444433' },
  statusText: { fontSize: 12, fontWeight: 'bold', color: theme.primary },
  description: { color: theme.muted, fontSize: 13, marginBottom: 6, fontStyle: 'italic' },
  drawDateText: { color: theme.info, fontSize: 13, marginBottom: 6 },
  productPrice: { color: theme.gold, fontSize: 13, marginBottom: 4 },
  entries: { color: theme.muted, fontSize: 12, marginBottom: 6 },
  progressBar: { backgroundColor: theme.border, height: 5, borderRadius: 3, marginBottom: 6 },
  progress: { backgroundColor: theme.primary, height: 5, borderRadius: 3 },
  revenue: { color: theme.muted, fontSize: 12, marginBottom: 8 },
  winner: { color: theme.gold, fontSize: 13, fontWeight: 'bold', marginBottom: 8 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionRow: { flexDirection: 'row', gap: 8 },
  paymentCard: { backgroundColor: theme.surface, borderRadius: 15, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: theme.gold },
  paymentCardSelected: { borderColor: theme.primary, borderWidth: 2 },
  bulkActionBar: { backgroundColor: theme.surfaceAlt, borderRadius: 12, borderWidth: 1, borderColor: theme.border, padding: 12, marginBottom: 14, gap: 10 },
  bulkSelectAll: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulkSelectAllText: { color: theme.text, fontSize: 13, fontWeight: '600' },
  bulkActionButtons: { flexDirection: 'row', gap: 8 },
  bulkActionButton: { flex: 1 },
  bulkRowCheckbox: { padding: 2 },
  bulkRowProductName: { marginLeft: 10 },
  paymentStatus: { color: theme.gold, fontSize: 12, fontWeight: 'bold' },
  paymentLine: { color: theme.muted, fontSize: 13, marginBottom: 5 },
  receiptImage: { width: '100%', height: 260, borderRadius: 10, marginVertical: 12, borderWidth: 1, borderColor: theme.border },
  approveButton: { flex: 1, backgroundColor: theme.primary, padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  approveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  rejectButton: { flex: 1, backgroundColor: theme.dangerSoft, padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.danger, flexDirection: 'row', gap: 6 },
  rejectButtonText: { color: theme.danger, fontWeight: 'bold', fontSize: 13 },
  editButton: { flex: 1, backgroundColor: theme.infoSoft, padding: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.info, flexDirection: 'row', gap: 5 },
  editButtonText: { color: theme.info, fontWeight: 'bold', fontSize: 13 },
  drawButton: { flex: 1, backgroundColor: theme.gold, padding: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  drawButtonText: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  reminderButton: { backgroundColor: theme.primary, padding: 10, borderRadius: 8, alignItems: 'center', width: 42 },
  reminderButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  deleteButton: { backgroundColor: theme.dangerSoft, padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: theme.danger, width: 42 },
  deleteButtonText: { color: theme.danger, fontWeight: 'bold', fontSize: 14 },
  userCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
  userName: { color: theme.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  userPhone: { color: theme.primary, fontSize: 14, marginBottom: 4 },
  userDate: { color: theme.muted, fontSize: 12, marginBottom: 2 },
  userEntries: { color: theme.gold, fontSize: 12 },
  walletAdjustToggle: { alignSelf: 'flex-start', marginTop: 10, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: theme.surfaceAlt, borderWidth: 1, borderColor: theme.border },
  walletAdjustToggleText: { color: theme.gold, fontSize: 12, fontWeight: 'bold' },
  walletAdjustForm: { marginTop: 10, gap: 8 },
  emptyText: { color: theme.muted, textAlign: 'center', padding: 20 },
  revenueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  revenueCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: theme.border, width: '47%' },
  revenueNumber: { fontSize: 22, fontWeight: 'bold', color: theme.gold },
  revenueLabel: { fontSize: 12, color: theme.muted, marginTop: 4, textAlign: 'center' },
  revenueRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.surface, padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: theme.border },
  revenueProductName: { color: theme.text, fontSize: 14, flex: 1 },
  revenueProductAmt: { color: theme.primary, fontSize: 14, fontWeight: 'bold' },
  settingLabel: { color: theme.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  settingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingHint: { color: theme.muted, fontSize: 13, marginBottom: 10 },
  settingNote: { color: theme.subtle, fontSize: 12, marginBottom: 15 },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 20 },
  themeSelector: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  themeOption: { flex: 1, minHeight: 54, borderRadius: 10, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  themeOptionSelected: { backgroundColor: theme.gold, borderColor: theme.gold },
  themeOptionText: { color: theme.text, fontSize: 14, fontWeight: 'bold' },
  themeOptionTextSelected: { color: theme.buttonText },
  quickStats: { backgroundColor: theme.surface, borderRadius: 12, padding: 15, borderWidth: 1, borderColor: theme.border },
  quickStat: { color: theme.muted, fontSize: 14, marginBottom: 8 },
  slugRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  slugInput: { flex: 1, marginBottom: 0 },
  slugAutoButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface },
  slugAutoButtonText: { color: theme.primary, fontSize: 12, fontWeight: '600' },
  seoToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 4, marginBottom: 8, borderTopWidth: 1, borderTopColor: theme.border, marginTop: 4 },
  seoSectionTitle: { color: theme.text, fontSize: 15, fontWeight: '600' },
  seoCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 8, marginBottom: 8, backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border },
  seoCheckbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  seoCheckboxActive: { backgroundColor: theme.primary },
  seoCheckLabel: { color: theme.text, fontSize: 14, flex: 1 },
 });
}
