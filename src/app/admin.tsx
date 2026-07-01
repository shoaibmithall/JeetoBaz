import { Image, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { getStoredValue, setStoredValue } from '@/lib/storage';
import { createNotification, createUserNotification } from '@/lib/notifications';
import type { Entry, Product, ProductFormData, Transaction, User } from '@/types/database';
import {
  BarChart3, Bell, CalendarDays, Camera, Check, Circle, ClipboardList,
  Dices, DollarSign, LockKeyhole, Package, Pencil,
  Plus, ReceiptText, Rocket, Save, Send, Settings, Trash2,
  TriangleAlert, Trophy, UserRound, UsersRound, X,
} from 'lucide-react-native';

const ADMIN_EMAIL = 'shoaibmithall@gmail.com';
const RECEIPT_BUCKET = 'payment-receipts';
const WINNER_MEDIA_BUCKET = 'winner-media';

export default function AdminScreen() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<Product[]>([]);
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
      getStoredValue('announcement').then((value) => setAnnouncement(value || ''));
    }
  }, [authenticated]);

  async function handleLogin() {
    if (!password) {
      alert('Please enter your admin password.');
      return;
    }

    setAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
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

    for (const item of items) {
      if (item.status !== 'pending') continue;

      const { data: existingEntry, error: existingError } = await supabase
        .from('entries')
        .select('id')
        .eq('product_id', item.product_id)
        .eq('phone', item.phone)
        .maybeSingle();

      if (existingError || !existingEntry) continue;

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
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
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
          body: `${productName} draw live ho gaya hai. Abhi entry karein!`,
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
    if (!window.confirm('Delete this product?')) return;
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
      body: `${p.name} draw ke participants ${p.current_entries || 0}/${p.max_entries} hain. Draw ready/scheduled update check karein.`,
      kind: 'draw-reminder',
      link: '/',
    });
    alert('Draw reminder notification send ho gayi.');
  }

  async function saveAnnouncement() {
    await setStoredValue('announcement', announcement);
    setAnnouncementSaved(true);
    setTimeout(() => setAnnouncementSaved(false), 2000);
  }

  async function sendGlobalNotification() {
    const title = notificationTitle.trim();
    const body = notificationBody.trim();
    if (!title || !body) {
      alert('Notification title aur message required hain.');
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
      alert('Notification send failed. Pehle Supabase SQL setup run karein. Error: ' + error.message);
      return;
    }

    setNotificationTitle('');
    setNotificationBody('');
    alert('Notification users ko send ho gayi.');
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
    if (!window.confirm('Approve this payment and add entry? Receipt screenshot will be deleted after approval.')) return;

    const entryPhone = txn.phone;
    const entryName = txn.user_name || null;

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
        body: `Aapki ${existingProductName} wali payment confirm ho gayi. Aapki entry already active hai.`,
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

    const { data: product } = await supabase
      .from('products')
      .select('id, current_entries, max_entries, status')
      .eq('id', txn.product_id)
      .maybeSingle();

    if (!product || product.status !== 'active') {
      alert('This draw is not active.');
      return;
    }

    if ((product.current_entries || 0) >= product.max_entries) {
      alert('This draw is full.');
      return;
    }

    const { error: entryError } = await supabase.from('entries').insert({
      product_id: txn.product_id,
      phone: entryPhone,
      name: entryName,
      transaction_id: txn.jazzcash_txn_id,
    });

    if (entryError) {
      alert('Entry approval failed: ' + entryError.message);
      return;
    }

    await supabase
      .from('products')
      .update({ current_entries: (product.current_entries || 0) + 1 })
      .eq('id', txn.product_id);

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

    const productName = products.find((p) => p.id === txn.product_id)?.name || 'your draw';
    await createUserNotification({
      title: 'Payment confirmed',
      body: `Aapki ${productName} wali entry approve ho gayi hai. Good luck!`,
      targetPhone: entryPhone,
      kind: 'payment-confirmed',
      link: '/entries',
    });

    if ((product.current_entries || 0) + 1 >= product.max_entries) {
      await createUserNotification({
        title: 'Draw ready',
        body: `${productName} ke participants complete ho gaye hain. JeetoBaz draw date/time announce karega.`,
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
    if (!window.confirm('Reject this payment request?')) return;
    await supabase.from('transactions').update({ status: 'rejected' }).eq('id', txn.id);
    fetchTransactions();
  }

  const totalRevenue = products.reduce((sum, p) => sum + ((p.current_entries || 0) * (p.entry_fee || 1)), 0);
  const activeDraws = products.filter(p => p.status === 'active').length;
  const completedDraws = products.filter(p => p.status === 'completed').length;
  const pendingPayments = transactions.filter((txn) => txn.status === 'pending');

  if (authLoading && !authenticated) return (
    <View style={styles.loginContainer}>
      <LockKeyhole color="#FFD700" size={50} />
      <Text style={styles.loginSubtitle}>Checking secure session...</Text>
    </View>
  );

  if (!authenticated) return (
    <View style={styles.loginContainer}>
      <LockKeyhole color="#FFD700" size={50} />
      <Text style={styles.loginSubtitle}>Admin Panel</Text>
      <Text style={styles.adminEmail}>{ADMIN_EMAIL}</Text>
      <TextInput style={styles.passwordInput} placeholder="Enter admin password" placeholderTextColor="#666" secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={[styles.loginBtn, authLoading && styles.loginBtnDisabled]} onPress={handleLogin} disabled={authLoading}>
        {!authLoading && <Rocket color="#000" size={19} />}<Text style={styles.loginBtnText}>{authLoading ? 'Signing in...' : 'Secure Login'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}><Settings color="#FFD700" size={23} /><Text style={styles.title}>Admin Panel</Text></View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {['products', 'payments', 'users', 'revenue', 'settings'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            {tab === 'products' ? <Package color={activeTab === tab ? '#FFD700' : '#666'} size={19} />
              : tab === 'payments' ? <ReceiptText color={activeTab === tab ? '#FFD700' : '#666'} size={19} />
              : tab === 'users' ? <UsersRound color={activeTab === tab ? '#FFD700' : '#666'} size={19} />
              : tab === 'revenue' ? <DollarSign color={activeTab === tab ? '#FFD700' : '#666'} size={19} />
              : <Settings color={activeTab === tab ? '#FFD700' : '#666'} size={19} />}
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
              <View style={styles.sectionTitleRow}>{editingId ? <Pencil color="white" size={19} /> : <Plus color="white" size={19} />}<Text style={styles.sectionTitle}>{editingId ? 'Edit Product' : 'Add New Product'}</Text></View>
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
              <View style={styles.sectionTitleRow}><ClipboardList color="white" size={19} /><Text style={styles.sectionTitle}>All Products ({products.length})</Text></View>
              {products.map((p) => (
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
            <View style={styles.sectionTitleRow}><ReceiptText color="white" size={19} /><Text style={styles.sectionTitle}>Pending Payments ({pendingPayments.length})</Text></View>
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
            <View style={styles.sectionTitleRow}><UsersRound color="white" size={19} /><Text style={styles.sectionTitle}>All Users ({users.length})</Text></View>
            {users.length === 0 && <Text style={styles.emptyText}>No users yet!</Text>}
            {users.map((u) => (
              <View key={u.id} style={styles.userCard}>
                <View style={styles.inlineRow}><UserRound color="white" size={16} /><Text style={styles.userName}>{u.name || 'Unknown'}</Text></View>
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
            <View style={styles.sectionTitleRow}><DollarSign color="white" size={19} /><Text style={styles.sectionTitle}>Revenue Dashboard</Text></View>
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

            <View style={[styles.sectionTitleRow, { marginTop: 20 }]}><Package color="white" size={19} /><Text style={styles.sectionTitle}>Per Product Revenue</Text></View>
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
            <View style={styles.sectionTitleRow}><Settings color="white" size={19} /><Text style={styles.sectionTitle}>App Settings</Text></View>

            <View style={styles.settingLabelRow}><Bell color="white" size={17} /><Text style={styles.settingLabel}>Announcement Banner</Text></View>
            <Text style={styles.settingHint}>Home page pe top pe dikh jayega</Text>
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

            <View style={styles.settingLabelRow}><Send color="white" size={17} /><Text style={styles.settingLabel}>Send Notification</Text></View>
            <Text style={styles.settingHint}>Ye notification sab users ke Notifications page me dikh jayegi</Text>
            <TextInput
              style={styles.input}
              placeholder="Title e.g. New draw added!"
              placeholderTextColor="#666"
              value={notificationTitle}
              onChangeText={setNotificationTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Message e.g. Powerbank draw live ho gaya hai. Abhi entry karein!"
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

            <View style={styles.settingLabelRow}><LockKeyhole color="white" size={17} /><Text style={styles.settingLabel}>Secure Admin Login</Text></View>
            <Text style={styles.settingHint}>Admin: {ADMIN_EMAIL}</Text>
            <Text style={styles.settingNote}>Password Supabase Authentication se securely manage hota hai.</Text>

            <View style={styles.divider} />

            <View style={styles.settingLabelRow}><BarChart3 color="white" size={17} /><Text style={styles.settingLabel}>Quick Stats</Text></View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  loginContainer: { flex: 1, backgroundColor: '#020d09', justifyContent: 'center', alignItems: 'center', padding: 30 },
  loginSubtitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 30 },
  adminEmail: { color: '#18a663', fontSize: 14, marginBottom: 12 },
  passwordInput: { backgroundColor: '#071b13', borderRadius: 10, borderWidth: 1, borderColor: '#174a35', color: 'white', padding: 15, fontSize: 16, width: '100%', marginBottom: 20 },
  loginBtn: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: '100%', flexDirection: 'row', gap: 7 },
  loginBtnDisabled: { backgroundColor: '#777' },
  loginBtnText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  header: { backgroundColor: '#04140e', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFD700' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  logoutBtn: { color: '#ff4444', fontSize: 14, fontWeight: 'bold' },
  tabBar: { flexDirection: 'row', backgroundColor: '#04140e', borderBottomWidth: 1, borderBottomColor: '#174a35' },
  tab: { flex: 1, alignItems: 'center', padding: 10 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  tabText: { fontSize: 18 },
  tabLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  activeTabText: { color: '#FFD700' },
  content: { flex: 1 },
  section: { margin: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  editBanner: { backgroundColor: '#2a2105', borderWidth: 1, borderColor: '#FFD700', borderRadius: 8, padding: 8, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  editBannerText: { color: '#FFD700', fontSize: 13, textAlign: 'center' },
  input: { backgroundColor: '#071b13', borderRadius: 10, borderWidth: 1, borderColor: '#174a35', color: 'white', padding: 15, marginBottom: 12, fontSize: 14 },
  textArea: { height: 80, textAlignVertical: 'top' },
  photoUploadButton: { backgroundColor: '#1a3a5c', borderWidth: 1, borderColor: '#4a9eff', padding: 13, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12, flexDirection: 'row', gap: 7 },
  photoUploadDisabled: { opacity: 0.55 },
  photoUploadText: { color: '#4a9eff', fontWeight: 'bold', fontSize: 14 },
  winnerPhotoPreview: { width: 120, height: 120, borderRadius: 8, alignSelf: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#FFD700' },
  addButton: { backgroundColor: '#18a663', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10, flexDirection: 'row', gap: 7 },
  saveButton: { backgroundColor: '#FFD700' },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#2b0d0d', padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ff4444', flexDirection: 'row', gap: 7 },
  cancelButtonText: { color: '#ff4444', fontSize: 14, fontWeight: 'bold' },
  productCard: { backgroundColor: '#071b13', borderRadius: 15, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#174a35' },
  productCardEditing: { borderColor: '#FFD700', borderWidth: 2 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 16, fontWeight: 'bold', color: 'white', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  activeBadge: { backgroundColor: '#082d1e' },
  completedBadge: { backgroundColor: '#2b2b0d' },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#18a663' },
  description: { color: '#aaa', fontSize: 13, marginBottom: 6, fontStyle: 'italic' },
  drawDateText: { color: '#4a9eff', fontSize: 13, marginBottom: 6 },
  productPrice: { color: '#FFD700', fontSize: 13, marginBottom: 4 },
  entries: { color: '#aaa', fontSize: 12, marginBottom: 6 },
  progressBar: { backgroundColor: '#174a35', height: 5, borderRadius: 3, marginBottom: 6 },
  progress: { backgroundColor: '#18a663', height: 5, borderRadius: 3 },
  revenue: { color: '#aaa', fontSize: 12, marginBottom: 8 },
  winner: { color: '#FFD700', fontSize: 13, fontWeight: 'bold', marginBottom: 8 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionRow: { flexDirection: 'row', gap: 8 },
  paymentCard: { backgroundColor: '#071b13', borderRadius: 15, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#FFD700' },
  paymentStatus: { color: '#FFD700', fontSize: 12, fontWeight: 'bold' },
  paymentLine: { color: '#aaa', fontSize: 13, marginBottom: 5 },
  receiptImage: { width: '100%', height: 260, borderRadius: 10, marginVertical: 12, borderWidth: 1, borderColor: '#174a35' },
  approveButton: { flex: 1, backgroundColor: '#18a663', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  approveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  rejectButton: { flex: 1, backgroundColor: '#2b0d0d', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ff4444', flexDirection: 'row', gap: 6 },
  rejectButtonText: { color: '#ff4444', fontWeight: 'bold', fontSize: 13 },
  editButton: { flex: 1, backgroundColor: '#1a3a5c', padding: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#4a9eff', flexDirection: 'row', gap: 5 },
  editButtonText: { color: '#4a9eff', fontWeight: 'bold', fontSize: 13 },
  drawButton: { flex: 1, backgroundColor: '#FFD700', padding: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  drawButtonText: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  reminderButton: { backgroundColor: '#18a663', padding: 10, borderRadius: 8, alignItems: 'center', width: 42 },
  reminderButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  deleteButton: { backgroundColor: '#2b0d0d', padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ff4444', width: 42 },
  deleteButtonText: { color: '#ff4444', fontWeight: 'bold', fontSize: 14 },
  userCard: { backgroundColor: '#071b13', borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#174a35' },
  userName: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  userPhone: { color: '#18a663', fontSize: 14, marginBottom: 4 },
  userDate: { color: '#aaa', fontSize: 12, marginBottom: 2 },
  userEntries: { color: '#FFD700', fontSize: 12 },
  emptyText: { color: '#aaa', textAlign: 'center', padding: 20 },
  revenueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  revenueCard: { backgroundColor: '#071b13', borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#174a35', width: '47%' },
  revenueNumber: { fontSize: 22, fontWeight: 'bold', color: '#FFD700' },
  revenueLabel: { fontSize: 12, color: '#aaa', marginTop: 4, textAlign: 'center' },
  revenueRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#071b13', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#174a35' },
  revenueProductName: { color: 'white', fontSize: 14, flex: 1 },
  revenueProductAmt: { color: '#18a663', fontSize: 14, fontWeight: 'bold' },
  settingLabel: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  settingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingHint: { color: '#aaa', fontSize: 13, marginBottom: 10 },
  settingNote: { color: '#666', fontSize: 12, marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#174a35', marginVertical: 20 },
  quickStats: { backgroundColor: '#071b13', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#174a35' },
  quickStat: { color: '#aaa', fontSize: 14, marginBottom: 8 },
});
