import { Image, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { getStoredValue, setStoredValue } from '@/lib/storage';
import { resetPassword } from '@/lib/auth';
import { useAppTheme } from '@/hooks/use-theme';
import { AppThemes } from '@/constants/theme';
import { createNotification, createUserNotification } from '@/lib/notifications';
import { getAnnouncement, getHomeAdImages, saveAnnouncement as saveAnnouncementSetting, saveHomeAdImages } from '@/lib/app-settings';
import type { Entry, Product, ProductFormData, Transaction, User } from '@/types/database';
import {
  BarChart3, Bell, CalendarDays, Camera, Check, Circle, ClipboardList,
  Dices, DollarSign, Eye, EyeOff, LockKeyhole, Mail, Moon, Package, Pencil,
  Plus, ReceiptText, Rocket, Save, Send, Settings, Trash2,
  Search, Sun, TriangleAlert, Trophy, UserRound, UsersRound, X,
} from 'lucide-react-native';

const ADMIN_EMAIL = 'shoaibmithall@gmail.com';
const RECEIPT_BUCKET = 'payment-receipts';
const WINNER_MEDIA_BUCKET = 'winner-media';
const HOME_ADS_BUCKET = 'home-ads';

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

export default function AdminScreen() {
  const { mode, theme, setThemeMode } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
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
  const [winnerPhotoUploading, setWinnerPhotoUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const editingIdRef = useRef<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [announcementSaved, setAnnouncementSaved] = useState(false);
  const [homeAdImagesInput, setHomeAdImagesInput] = useState('');
  const [homeAdImagesSaved, setHomeAdImagesSaved] = useState(false);
  const [homeAdUploading, setHomeAdUploading] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [notificationSending, setNotificationSending] = useState(false);
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
      fetchEntries();
      fetchTransactions();
      loadAnnouncement();
      loadHomeAdImages();
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

    setAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setAuthLoading(false);
      alert('Admin login failed: ' + error.message);
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
  }

  async function fetchUsers() {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
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

  async function saveProduct() {
    if (!productName || !productPrice || !entryFee || !maxEntries) {
      alert('Please fill all required fields!'); return;
    }
    setLoading(true);
    const currentEditId = editingIdRef.current;

    const productData: ProductFormData = {
      name: productName,
      price: parseInt(productPrice),
      entry_fee: parseInt(entryFee),
      max_entries: parseInt(maxEntries),
      image_url: imageUrl || null,
      description: description || null,
      draw_date: drawDate || null,
      live_link: liveLink || null,
      winner_photo: winnerPhoto || null,
    };

    if (currentEditId) {
      const { error } = await supabase.from('products').update(productData).eq('id', currentEditId).select();
      if (error) alert('Save failed: ' + error.message);
      else { alert('Product updated!'); cancelEdit(); fetchProducts(); }
    } else {
      const { error } = await supabase.from('products').insert({ ...productData, current_entries: 0, status: 'active' });
      if (error) alert('Add failed: ' + error.message);
      else {
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

  async function deleteProduct(id: string) {
    const confirmed = await confirmAsync('Delete', 'Delete this product?');
    if (!confirmed) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  }

  async function toggleStatus(p: Product) {
    const newStatus = p.status === 'active' ? 'completed' : 'active';
    await supabase.from('products').update({ status: newStatus }).eq('id', p.id);
    fetchProducts();
  }

  async function sendDrawReminder(p: Product) {
    await createUserNotification({
      title: 'Draw reminder',
      body: `${p.name} currently has ${p.current_entries || 0}/${p.max_entries} participants. Check the draw page for scheduling updates.`,
      kind: 'draw-reminder',
      link: '/',
    });
    alert('Draw reminder notification sent.');
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

  async function approvePayment(txn: Transaction) {
    const confirmed = await confirmAsync('Approve', 'Approve this payment and add entry? Receipt screenshot will be deleted after approval.');
    if (!confirmed) return;

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
        alert('Payment cleanup failed: ' + message);
        return;
      }
      const existingProductName = products.find((p) => p.id === txn.product_id)?.name || 'your draw';
      await createUserNotification({
        title: 'Payment confirmed',
        body: `Your payment for ${existingProductName} has been confirmed. Your entry is already active.`,
        targetPhone: entryPhone,
        kind: 'payment-confirmed',
        link: '/entries',
      });
      alert('Entry already exists. Payment approved and receipt cleared.');
      fetchProducts();
      fetchEntries();
      fetchTransactions();
      return;
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
      alert('Entry approval failed: ' + rpcError.message);
      return;
    }

    if (!rpcResult?.ok) {
      alert(rpcResult?.error || 'Entry approval failed.');
      return;
    }

    const product = products.find((p) => p.id === txn.product_id);

    try {
      await clearApprovedPayment(txn);
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Payment cleanup failed.';
      alert('Entry added, but payment cleanup failed: ' + message);
      fetchProducts();
      fetchEntries();
      fetchTransactions();
      return;
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

    alert('Payment approved and receipt deleted.');
    fetchProducts();
    fetchEntries();
    fetchTransactions();
  }

  async function rejectPayment(txn: Transaction) {
    const confirmed = await confirmAsync('Reject', 'Reject this payment request?');
    if (!confirmed) return;
    await supabase.from('transactions').update({ status: 'rejected' }).eq('id', txn.id);
    fetchTransactions();
  }

  const totalRevenue = products.reduce((sum, p) => sum + ((p.current_entries || 0) * (p.entry_fee || 1)), 0);
  const activeDraws = products.filter(p => p.status === 'active').length;
  const completedDraws = products.filter(p => p.status === 'completed').length;
  const pendingPayments = transactions.filter((txn) => txn.status === 'pending');
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) =>
      [product.name, product.description, product.draw_date]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [productSearch, products]);

  if (authLoading && !authenticated) return (
    <View style={styles.loginContainer}>
      <LockKeyhole color={theme.gold} size={50} />
      <Text style={styles.loginSubtitle}>Checking secure session...</Text>
    </View>
  );

  if (!authenticated) return (
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
      <TouchableOpacity style={[styles.loginBtn, authLoading && styles.loginBtnDisabled]} onPress={handleLogin} disabled={authLoading}>
        {!authLoading && <Rocket color={theme.buttonText} size={19} />}<Text style={styles.loginBtnText}>{authLoading ? 'Signing in...' : 'Secure Login'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}><Settings color={theme.gold} size={23} /><Text style={styles.title}>Admin Panel</Text></View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {['products', 'payments', 'users', 'revenue', 'settings'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            {tab === 'products' ? <Package color={activeTab === tab ? theme.gold : theme.subtle} size={19} />
              : tab === 'payments' ? <ReceiptText color={activeTab === tab ? theme.gold : theme.subtle} size={19} />
              : tab === 'users' ? <UsersRound color={activeTab === tab ? theme.gold : theme.subtle} size={19} />
              : tab === 'revenue' ? <DollarSign color={activeTab === tab ? theme.gold : theme.subtle} size={19} />
              : <Settings color={activeTab === tab ? theme.gold : theme.subtle} size={19} />}
            <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>

        {activeTab === 'products' && (
          <View>
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>{editingId ? <Pencil color={theme.text} size={19} /> : <Plus color={theme.text} size={19} />}<Text style={styles.sectionTitle}>{editingId ? 'Edit Product' : 'Add New Product'}</Text></View>
              {editingId && <View style={styles.editBanner}><TriangleAlert color="#FFD700" size={16} /><Text style={styles.editBannerText}>Editing mode</Text></View>}
              <TextInput style={styles.input} placeholder="Product name *" placeholderTextColor="#666" value={productName} onChangeText={setProductName} />
              <TextInput style={styles.input} placeholder="Price in Rs. *" placeholderTextColor="#666" keyboardType="numeric" value={productPrice} onChangeText={setProductPrice} />
              <TextInput style={styles.input} placeholder="Entry fee (1, 10, or 100) *" placeholderTextColor="#666" keyboardType="numeric" value={entryFee} onChangeText={setEntryFee} />
              <TextInput style={styles.input} placeholder="Max entries *" placeholderTextColor="#666" keyboardType="numeric" value={maxEntries} onChangeText={setMaxEntries} />
              <TextInput style={styles.input} placeholder="Image URL (optional)" placeholderTextColor="#666" value={imageUrl} onChangeText={setImageUrl} />
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
                <Image source={{ uri: winnerPhoto }} style={styles.winnerPhotoPreview} resizeMode="cover" />
              ) : null}
        <TextInput style={styles.input} placeholder="Draw Date after full (e.g. 30 June 2026, 10:00 PM)" placeholderTextColor="#666" value={drawDate} onChangeText={setDrawDate} />
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
                  {p.draw_date && <View style={styles.inlineRow}><CalendarDays color="#4a9eff" size={14} /><Text style={styles.drawDateText}>Draw: {p.draw_date}</Text></View>}
                  <Text style={styles.productPrice}>Rs. {p.price?.toLocaleString()} — Entry: Rs. {p.entry_fee || 1}</Text>
                  <Text style={styles.entries}>{p.current_entries || 0} / {p.max_entries} entries</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progress, { width: `${Math.min(((p.current_entries||0)/p.max_entries)*100, 100)}%` }]} />
                  </View>
                  <View style={styles.inlineRow}><DollarSign color="#aaa" size={14} /><Text style={styles.revenue}>Revenue: Rs. {((p.current_entries || 0) * (p.entry_fee || 1)).toLocaleString()}</Text></View>
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

        {activeTab === 'payments' && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}><ReceiptText color={theme.text} size={19} /><Text style={styles.sectionTitle}>Pending Payments ({pendingPayments.length})</Text></View>
            {pendingPayments.length === 0 && <Text style={styles.emptyText}>No pending payments.</Text>}
            {pendingPayments.map((txn) => {
              const product = products.find((p) => p.id === txn.product_id);
              return (
                <View key={txn.id} style={styles.paymentCard}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>{product?.name || 'Unknown Draw'}</Text>
                    <Text style={styles.paymentStatus}>Pending</Text>
                  </View>
                  <Text style={styles.paymentLine}>Method: {txn.payment_method || 'Not provided'}</Text>
                  <Text style={styles.paymentLine}>Amount: Rs. {txn.amount}</Text>
                  <Text style={styles.paymentLine}>App User: {txn.user_name || 'Unknown'} ({txn.phone})</Text>
                  {receiptUrls[txn.id] ? (
                    <Image source={{ uri: receiptUrls[txn.id] }} style={styles.receiptImage} resizeMode="cover" />
                  ) : (
                    <Text style={styles.emptyText}>Receipt preview unavailable.</Text>
                  )}
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.approveButton} onPress={() => approvePayment(txn)}>
                      <Check color="white" size={16} /><Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectButton} onPress={() => rejectPayment(txn)}>
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
            {users.length === 0 && <Text style={styles.emptyText}>No users yet!</Text>}
            {users.map((u) => (
              <View key={u.id} style={styles.userCard}>
                <View style={styles.inlineRow}><UserRound color={theme.text} size={16} /><Text style={styles.userName}>{u.name || 'Unknown'}</Text></View>
                <Text style={styles.userPhone}>{u.phone}</Text>
                <Text style={styles.userDate}>Joined: {new Date(u.created_at).toLocaleDateString()}</Text>
                <Text style={styles.userEntries}>
                  Entries: {entries.filter(e => e.phone === u.phone).length}
                </Text>
              </View>
            ))}
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
                  <Image key={`${image}-${index}`} source={{ uri: image }} style={styles.adPreviewImage} resizeMode="cover" />
                ))}
              </ScrollView>
            ) : null}

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
              <Text style={styles.quickStat}>Revenue: Rs. {totalRevenue.toLocaleString()}</Text>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
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
  input: { backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border, color: theme.text, padding: 15, marginBottom: 12, fontSize: 14 },
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
 });
}
