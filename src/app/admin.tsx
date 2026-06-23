import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';

const supabase = createClient(
  'https://jqjrfnhqqfymwfsdkwmv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxanJmbmhxcWZ5bXdmc2Rrd212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTcxNDIsImV4cCI6MjA5NzU5MzE0Mn0.yuX-9QGr3w-gUQ9brELnohwgLNMDg7mhJTkRDw0L8w0'
);

const ADMIN_PASSWORD = 'JeetoBaz@2026';

export default function AdminScreen() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [maxEntries, setMaxEntries] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const editingIdRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('adminAuth');
      if (auth === 'true') setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (authenticated) fetchProducts();
  }, [authenticated]);

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      if (typeof window !== 'undefined') localStorage.setItem('adminAuth', 'true');
      setAuthenticated(true);
    } else {
      alert('Wrong password!');
    }
  }

  function handleLogout() {
    if (typeof window !== 'undefined') localStorage.removeItem('adminAuth');
    setAuthenticated(false);
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  }

  function startEdit(p) {
    editingIdRef.current = p.id;
    setEditingId(p.id);
    setProductName(p.name || '');
    setProductPrice(String(p.price || ''));
    setEntryFee(String(p.entry_fee || ''));
    setMaxEntries(String(p.max_entries || ''));
    setImageUrl(p.image_url || '');
    setDescription(p.description || '');
  }

  function cancelEdit() {
    editingIdRef.current = null;
    setEditingId(null);
    setProductName('');
    setProductPrice('');
    setEntryFee('');
    setMaxEntries('');
    setImageUrl('');
    setDescription('');
  }

  async function saveProduct() {
    if (!productName || !productPrice || !entryFee || !maxEntries) {
      alert('Please fill all required fields!');
      return;
    }
    setLoading(true);

    const currentEditId = editingIdRef.current;

    if (currentEditId) {
      const updateData = {
        name: productName,
        price: parseInt(productPrice),
        entry_fee: parseInt(entryFee),
        max_entries: parseInt(maxEntries),
        image_url: imageUrl || null,
        description: description || null,
      };

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', currentEditId)
        .select();

      if (error) {
        alert('Save failed: ' + error.message);
      } else {
        alert('✅ Product updated successfully!');
        cancelEdit();
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from('products').insert({
        name: productName,
        price: parseInt(productPrice),
        entry_fee: parseInt(entryFee),
        max_entries: parseInt(maxEntries),
        current_entries: 0,
        status: 'active',
        image_url: imageUrl || null,
        description: description || null,
      });

      if (error) {
        alert('Add failed: ' + error.message);
      } else {
        alert('✅ Product added!');
        cancelEdit();
        fetchProducts();
      }
    }
    setLoading(false);
  }

  async function deleteProduct(id) {
    const confirmed = window.confirm('Are you sure you want to delete this product?');
    if (!confirmed) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  }

  if (!authenticated) return (
    <View style={styles.loginContainer}>
      <Text style={styles.loginTitle}>🔐</Text>
      <Text style={styles.loginSubtitle}>Admin Panel</Text>
      <TextInput
        style={styles.passwordInput}
        placeholder="Enter admin password"
        placeholderTextColor="#666"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
        <Text style={styles.loginBtnText}>🚀 Login</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Admin Panel</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {editingId ? '✏️ Edit Product' : '➕ Add New Product'}
        </Text>
        {editingId && (
          <View style={styles.editingBanner}>
            <Text style={styles.editingText}>⚠️ Editing mode — make changes and save</Text>
          </View>
        )}
        <TextInput style={styles.input} placeholder="Product name *" placeholderTextColor="#666" value={productName} onChangeText={setProductName} />
        <TextInput style={styles.input} placeholder="Price in Rs. *" placeholderTextColor="#666" keyboardType="numeric" value={productPrice} onChangeText={setProductPrice} />
        <TextInput style={styles.input} placeholder="Entry fee (1, 10, or 100) *" placeholderTextColor="#666" keyboardType="numeric" value={entryFee} onChangeText={setEntryFee} />
        <TextInput style={styles.input} placeholder="Max entries *" placeholderTextColor="#666" keyboardType="numeric" value={maxEntries} onChangeText={setMaxEntries} />
        <TextInput style={styles.input} placeholder="📸 Image URL (optional)" placeholderTextColor="#666" value={imageUrl} onChangeText={setImageUrl} />
        <TextInput style={[styles.input, styles.textArea]} placeholder="📝 Description (optional)" placeholderTextColor="#666" value={description} onChangeText={setDescription} multiline numberOfLines={3} />

        <TouchableOpacity style={[styles.addButton, editingId && styles.saveButton]} onPress={saveProduct} disabled={loading}>
          <Text style={styles.addButtonText}>
            {loading ? 'Saving...' : editingId ? '💾 Save Changes' : '➕ Add Product'}
          </Text>
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
              <Text style={[styles.badge, p.status === 'active' ? styles.activeBadge : styles.completedBadge]}>
                {p.status === 'active' ? '🟢' : '✅'}
              </Text>
            </View>
            {p.description && <Text style={styles.description}>{p.description}</Text>}
            {p.image_url && <Text style={styles.imageUrl}>🖼️ {p.image_url.substring(0, 45)}...</Text>}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loginContainer: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 30 },
  loginTitle: { fontSize: 36, marginBottom: 10 },
  loginSubtitle: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 30 },
  passwordInput: { backgroundColor: '#1a1a1a', borderRadius: 10, borderWidth: 1, borderColor: '#333', color: 'white', padding: 15, fontSize: 16, width: '100%', marginBottom: 20 },
  loginBtn: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center', width: '100%' },
  loginBtnText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  header: { backgroundColor: '#1a1a1a', padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFD700' },
  logoutBtn: { color: '#ff4444', fontSize: 14, fontWeight: 'bold' },
  section: { margin: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 10 },
  editingBanner: { backgroundColor: '#2b2200', borderWidth: 1, borderColor: '#FFD700', borderRadius: 8, padding: 10, marginBottom: 12 },
  editingText: { color: '#FFD700', fontSize: 13, textAlign: 'center' },
  input: { backgroundColor: '#1a1a1a', borderRadius: 10, borderWidth: 1, borderColor: '#333', color: 'white', padding: 15, marginBottom: 12, fontSize: 14 },
  textArea: { height: 80, textAlignVertical: 'top' },
  addButton: { backgroundColor: '#1DB954', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  saveButton: { backgroundColor: '#FFD700' },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#2b0d0d', padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ff4444' },
  cancelButtonText: { color: '#ff4444', fontSize: 14, fontWeight: 'bold' },
  productCard: { backgroundColor: '#1a1a1a', borderRadius: 15, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  productCardEditing: { borderColor: '#FFD700', borderWidth: 2 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 17, fontWeight: 'bold', color: 'white', flex: 1 },
  description: { color: '#aaa', fontSize: 13, marginBottom: 6, fontStyle: 'italic' },
  imageUrl: { color: '#555', fontSize: 11, marginBottom: 6 },
  badge: { fontSize: 14 },
  activeBadge: { backgroundColor: '#0d2b1a' },
  completedBadge: { backgroundColor: '#2b2b0d' },
  productPrice: { color: '#FFD700', fontSize: 14, marginBottom: 4 },
  entries: { color: '#aaa', fontSize: 13, marginBottom: 6 },
  progressBar: { backgroundColor: '#333', height: 6, borderRadius: 3, marginBottom: 8 },
  progress: { backgroundColor: '#1DB954', height: 6, borderRadius: 3 },
  revenue: { color: '#aaa', fontSize: 13, marginBottom: 8 },
  winner: { color: '#FFD700', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 8 },
  editButton: { flex: 1, backgroundColor: '#1a3a5c', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#4a9eff' },
  editButtonText: { color: '#4a9eff', fontWeight: 'bold', fontSize: 13 },
  drawButton: { flex: 1, backgroundColor: '#FFD700', padding: 12, borderRadius: 8, alignItems: 'center' },
  drawButtonText: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  deleteButton: { backgroundColor: '#2b0d0d', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ff4444', width: 45 },
  deleteButtonText: { color: '#ff4444', fontWeight: 'bold', fontSize: 14 },
});
