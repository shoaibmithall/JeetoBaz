import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getStoredValue, removeStoredValues, setStoredValue } from '@/lib/storage';
import type { Entry, Product, ProductFormData, User } from '@/types/database';

const ADMIN_PASSWORD = 'JeetoBaz@2026';

export default function AdminScreen() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [maxEntries, setMaxEntries] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [drawDate, setDrawDate] = useState('');
  const [liveLink, setLiveLink] = useState('');
  const [winnerPhoto, setWinnerPhoto] = useState('');
  const [loading, setLoading] = useState(false);
  const editingIdRef = useRef<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [announcementSaved, setAnnouncementSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    getStoredValue('adminAuth').then((auth) => {
      if (!active) return;
      if (auth === 'true') setAuthenticated(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchProducts();
      fetchUsers();
      fetchEntries();
      getStoredValue('announcement').then((value) => setAnnouncement(value || ''));
    }
  }, [authenticated]);

  async function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      await setStoredValue('adminAuth', 'true');
      setAuthenticated(true);
    } else {
      alert('Wrong password!');
    }
  }

  async function handleLogout() {
    await removeStoredValues(['adminAuth']);
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
      else { alert('✅ Product updated!'); cancelEdit(); fetchProducts(); }
    } else {
      const { error } = await supabase.from('products').insert({ ...productData, current_entries: 0, status: 'active' });
      if (error) alert('Add failed: ' + error.message);
      else { alert('✅ Product added!'); cancelEdit(); fetchProducts(); }
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

  async function saveAnnouncement() {
    await setStoredValue('announcement', announcement);
    setAnnouncementSaved(true);
    setTimeout(() => setAnnouncementSaved(false), 2000);
  }

  const totalRevenue = products.reduce((sum, p) => sum + ((p.current_entries || 0) * (p.entry_fee || 1)), 0);
  const activeDraws = products.filter(p => p.status === 'active').length;
  const completedDraws = products.filter(p => p.status === 'completed').length;

  if (!authenticated) return (
    <View style={styles.loginContainer}>
      <Text style={styles.loginEmoji}>🔐</Text>
      <Text style={styles.loginSubtitle}>Admin Panel</Text>
      <TextInput style={styles.passwordInput} placeholder="Enter admin password" placeholderTextColor="#666" secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
        <Text style={styles.loginBtnText}>🚀 Login</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Admin Panel</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {['products', 'users', 'revenue', 'settings'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'products' ? '📦' : tab === 'users' ? '👥' : tab === 'revenue' ? '💰' : '⚙️'}
            </Text>
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
              <Text style={styles.sectionTitle}>{editingId ? '✏️ Edit Product' : '➕ Add New Product'}</Text>
              {editingId && <View style={styles.editBanner}><Text style={styles.editBannerText}>⚠️ Editing mode</Text></View>}
              <TextInput style={styles.input} placeholder="Product name *" placeholderTextColor="#666" value={productName} onChangeText={setProductName} />
              <TextInput style={styles.input} placeholder="Price in Rs. *" placeholderTextColor="#666" keyboardType="numeric" value={productPrice} onChangeText={setProductPrice} />
              <TextInput style={styles.input} placeholder="Entry fee (1, 10, or 100) *" placeholderTextColor="#666" keyboardType="numeric" value={entryFee} onChangeText={setEntryFee} />
              <TextInput style={styles.input} placeholder="Max entries *" placeholderTextColor="#666" keyboardType="numeric" value={maxEntries} onChangeText={setMaxEntries} />
              <TextInput style={styles.input} placeholder="📸 Image URL (optional)" placeholderTextColor="#666" value={imageUrl} onChangeText={setImageUrl} />
              <TextInput style={[styles.input, styles.textArea]} placeholder="📝 Description (optional)" placeholderTextColor="#666" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
              <TextInput style={styles.input} placeholder="🔴 Live Link (YouTube/Facebook URL)" placeholderTextColor="#666" value={liveLink} onChangeText={setLiveLink} />
        <TextInput style={styles.input} placeholder="🏆 Winner Photo URL (optional)" placeholderTextColor="#666" value={winnerPhoto} onChangeText={setWinnerPhoto} />
        <TextInput style={styles.input} placeholder="📅 Draw Date (e.g. 30 June 2026, 10:00 PM)" placeholderTextColor="#666" value={drawDate} onChangeText={setDrawDate} />
              <TouchableOpacity style={[styles.addButton, editingId && styles.saveButton]} onPress={saveProduct} disabled={loading}>
                <Text style={styles.addButtonText}>{loading ? 'Saving...' : editingId ? '💾 Save Changes' : '➕ Add Product'}</Text>
              </TouchableOpacity>
              {editingId && (
                <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
                  <Text style={styles.cancelButtonText}>✖ Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 All Products ({products.length})</Text>
              {products.map((p) => (
                <View key={p.id} style={[styles.productCard, editingId === p.id && styles.productCardEditing]}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>{p.name}</Text>
                    <TouchableOpacity onPress={() => toggleStatus(p)} style={[styles.statusBadge, p.status === 'active' ? styles.activeBadge : styles.completedBadge]}>
                      <Text style={styles.statusText}>{p.status === 'active' ? '🟢 Active' : '✅ Done'}</Text>
                    </TouchableOpacity>
                  </View>
                  {p.description && <Text style={styles.description}>{p.description}</Text>}
                  {p.draw_date && <Text style={styles.drawDateText}>📅 Draw: {p.draw_date}</Text>}
                  <Text style={styles.productPrice}>Rs. {p.price?.toLocaleString()} — Entry: Rs. {p.entry_fee || 1}</Text>
                  <Text style={styles.entries}>{p.current_entries || 0} / {p.max_entries} entries</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progress, { width: `${Math.min(((p.current_entries||0)/p.max_entries)*100, 100)}%` }]} />
                  </View>
                  <Text style={styles.revenue}>💰 Revenue: Rs. {((p.current_entries || 0) * (p.entry_fee || 1)).toLocaleString()}</Text>
                  {p.winner_phone && <Text style={styles.winner}>🏆 Winner: {p.winner_phone}</Text>}
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.editButton} onPress={() => startEdit(p)}>
                      <Text style={styles.editButtonText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.drawButton} onPress={() => router.push({ pathname: '/draw', params: { productId: p.id, productName: p.name } })}>
                      <Text style={styles.drawButtonText}>🎰 Draw</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteProduct(p.id)}>
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'users' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 All Users ({users.length})</Text>
            {users.length === 0 && <Text style={styles.emptyText}>No users yet!</Text>}
            {users.map((u) => (
              <View key={u.id} style={styles.userCard}>
                <Text style={styles.userName}>👤 {u.name || 'Unknown'}</Text>
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
            <Text style={styles.sectionTitle}>💰 Revenue Dashboard</Text>
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

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>📦 Per Product Revenue</Text>
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
            <Text style={styles.sectionTitle}>⚙️ App Settings</Text>

            <Text style={styles.settingLabel}>📢 Announcement Banner</Text>
            <Text style={styles.settingHint}>Home page pe top pe dikh jayega</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. 🎉 New draw starting soon! Honda 70 draw on 30 June!"
              placeholderTextColor="#666"
              value={announcement}
              onChangeText={setAnnouncement}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity style={styles.addButton} onPress={saveAnnouncement}>
              <Text style={styles.addButtonText}>{announcementSaved ? '✅ Saved!' : '💾 Save Announcement'}</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={styles.settingLabel}>🔑 Admin Password</Text>
            <Text style={styles.settingHint}>Current: JeetoBaz@2026</Text>
            <Text style={styles.settingNote}>Password change ke liye code update karna hoga</Text>

            <View style={styles.divider} />

            <Text style={styles.settingLabel}>📊 Quick Stats</Text>
            <View style={styles.quickStats}>
              <Text style={styles.quickStat}>🌐 Live URL: jeetobaz.netlify.app</Text>
              <Text style={styles.quickStat}>📦 Products: {products.length}</Text>
              <Text style={styles.quickStat}>👥 Users: {users.length}</Text>
              <Text style={styles.quickStat}>🎯 Entries: {entries.length}</Text>
              <Text style={styles.quickStat}>💰 Revenue: Rs. {totalRevenue.toLocaleString()}</Text>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loginContainer: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 30 },
  loginEmoji: { fontSize: 50, marginBottom: 10 },
  loginSubtitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 30 },
  passwordInput: { backgroundColor: '#1a1a1a', borderRadius: 10, borderWidth: 1, borderColor: '#333', color: 'white', padding: 15, fontSize: 16, width: '100%', marginBottom: 20 },
  loginBtn: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center', width: '100%' },
  loginBtnText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  header: { backgroundColor: '#1a1a1a', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFD700' },
  logoutBtn: { color: '#ff4444', fontSize: 14, fontWeight: 'bold' },
  tabBar: { flexDirection: 'row', backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#333' },
  tab: { flex: 1, alignItems: 'center', padding: 10 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  tabText: { fontSize: 18 },
  tabLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  activeTabText: { color: '#FFD700' },
  content: { flex: 1 },
  section: { margin: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 12 },
  editBanner: { backgroundColor: '#2b2200', borderWidth: 1, borderColor: '#FFD700', borderRadius: 8, padding: 8, marginBottom: 12 },
  editBannerText: { color: '#FFD700', fontSize: 13, textAlign: 'center' },
  input: { backgroundColor: '#1a1a1a', borderRadius: 10, borderWidth: 1, borderColor: '#333', color: 'white', padding: 15, marginBottom: 12, fontSize: 14 },
  textArea: { height: 80, textAlignVertical: 'top' },
  addButton: { backgroundColor: '#1DB954', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  saveButton: { backgroundColor: '#FFD700' },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#2b0d0d', padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ff4444' },
  cancelButtonText: { color: '#ff4444', fontSize: 14, fontWeight: 'bold' },
  productCard: { backgroundColor: '#1a1a1a', borderRadius: 15, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  productCardEditing: { borderColor: '#FFD700', borderWidth: 2 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 16, fontWeight: 'bold', color: 'white', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  activeBadge: { backgroundColor: '#0d2b1a' },
  completedBadge: { backgroundColor: '#2b2b0d' },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#1DB954' },
  description: { color: '#aaa', fontSize: 13, marginBottom: 6, fontStyle: 'italic' },
  drawDateText: { color: '#4a9eff', fontSize: 13, marginBottom: 6 },
  productPrice: { color: '#FFD700', fontSize: 13, marginBottom: 4 },
  entries: { color: '#aaa', fontSize: 12, marginBottom: 6 },
  progressBar: { backgroundColor: '#333', height: 5, borderRadius: 3, marginBottom: 6 },
  progress: { backgroundColor: '#1DB954', height: 5, borderRadius: 3 },
  revenue: { color: '#aaa', fontSize: 12, marginBottom: 8 },
  winner: { color: '#FFD700', fontSize: 13, fontWeight: 'bold', marginBottom: 8 },
  actionRow: { flexDirection: 'row', gap: 8 },
  editButton: { flex: 1, backgroundColor: '#1a3a5c', padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#4a9eff' },
  editButtonText: { color: '#4a9eff', fontWeight: 'bold', fontSize: 13 },
  drawButton: { flex: 1, backgroundColor: '#FFD700', padding: 10, borderRadius: 8, alignItems: 'center' },
  drawButtonText: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  deleteButton: { backgroundColor: '#2b0d0d', padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ff4444', width: 42 },
  deleteButtonText: { color: '#ff4444', fontWeight: 'bold', fontSize: 14 },
  userCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  userName: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  userPhone: { color: '#1DB954', fontSize: 14, marginBottom: 4 },
  userDate: { color: '#aaa', fontSize: 12, marginBottom: 2 },
  userEntries: { color: '#FFD700', fontSize: 12 },
  emptyText: { color: '#aaa', textAlign: 'center', padding: 20 },
  revenueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  revenueCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#333', width: '47%' },
  revenueNumber: { fontSize: 22, fontWeight: 'bold', color: '#FFD700' },
  revenueLabel: { fontSize: 12, color: '#aaa', marginTop: 4, textAlign: 'center' },
  revenueRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1a1a1a', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#333' },
  revenueProductName: { color: 'white', fontSize: 14, flex: 1 },
  revenueProductAmt: { color: '#1DB954', fontSize: 14, fontWeight: 'bold' },
  settingLabel: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  settingHint: { color: '#aaa', fontSize: 13, marginBottom: 10 },
  settingNote: { color: '#666', fontSize: 12, marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 20 },
  quickStats: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#333' },
  quickStat: { color: '#aaa', fontSize: 14, marginBottom: 8 },
});
