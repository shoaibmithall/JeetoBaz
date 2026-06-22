import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';

const supabase = createClient(
  'https://jqjrfnhqqfymwfsdkwmv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxanJmbmhxcWZ5bXdmc2Rrd212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTcxNDIsImV4cCI6MjA5NzU5MzE0Mn0.yuX-9QGr3w-gUQ9brELnohwgLNMDg7mhJTkRDw0L8w0'
);

export default function AdminScreen() {
  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [maxEntries, setMaxEntries] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  }

  async function addProduct() {
    if (!productName || !productPrice || !entryFee || !maxEntries) {
      alert('Please fill all fields!'); return;
    }
    setLoading(true);
    const { error } = await supabase.from('products').insert({
      name: productName,
      price: parseInt(productPrice),
      entry_fee: parseInt(entryFee),
      max_entries: parseInt(maxEntries),
      current_entries: 0,
      status: 'active'
    });
    if (!error) {
      setProductName(''); setProductPrice(''); setEntryFee(''); setMaxEntries('');
      fetchProducts();
      alert('Product added!');
    }
    setLoading(false);
  }

  async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Admin Panel</Text>
        <Text style={styles.subtitle}>JeetoBaz Management</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>➕ Add New Product</Text>
        <TextInput style={styles.input} placeholder="Product name" placeholderTextColor="#666" value={productName} onChangeText={setProductName} />
        <TextInput style={styles.input} placeholder="Product price (Rs.)" placeholderTextColor="#666" keyboardType="numeric" value={productPrice} onChangeText={setProductPrice} />
        <TextInput style={styles.input} placeholder="Entry fee (1, 10, or 100)" placeholderTextColor="#666" keyboardType="numeric" value={entryFee} onChangeText={setEntryFee} />
        <TextInput style={styles.input} placeholder="Max entries" placeholderTextColor="#666" keyboardType="numeric" value={maxEntries} onChangeText={setMaxEntries} />
        <TouchableOpacity style={styles.addButton} onPress={addProduct} disabled={loading}>
          <Text style={styles.addButtonText}>{loading ? 'Adding...' : '➕ Add Product'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 All Products ({products.length})</Text>
        {products.map((p) => (
          <View key={p.id} style={styles.productCard}>
            <View style={styles.productHeader}>
              <Text style={styles.productName}>{p.name}</Text>
              <View style={[styles.badge, p.status === 'active' ? styles.activeBadge : styles.completedBadge]}>
                <Text style={styles.badgeText}>{p.status === 'active' ? '🟢 Active' : '✅ Done'}</Text>
              </View>
            </View>
            <Text style={styles.productPrice}>Price: Rs. {p.price?.toLocaleString()}</Text>
            <Text style={styles.entryFee}>Entry Fee: Rs. {p.entry_fee || 1}</Text>
            <Text style={styles.entries}>{p.current_entries || 0} / {p.max_entries} entries</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progress, { width: `${Math.min(((p.current_entries||0)/p.max_entries)*100, 100)}%` }]} />
            </View>
            {p.winner_phone && (
              <Text style={styles.winner}>🏆 Winner: {p.winner_phone}</Text>
            )}
            <View style={styles.actionRow}>
              {p.status === 'active' && (
                <TouchableOpacity
                  style={styles.drawButton}
                  onPress={() => router.push({ pathname: '/draw', params: { productId: p.id, productName: p.name } })}
                >
                  <Text style={styles.drawButtonText}>🎰 Start Live Draw</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.deleteButton} onPress={() => deleteProduct(p.id)}>
                <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
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
  header: { backgroundColor: '#1a1a1a', padding: 30, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFD700' },
  subtitle: { fontSize: 14, color: '#aaa', marginTop: 5 },
  section: { margin: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 15 },
  input: { backgroundColor: '#1a1a1a', borderRadius: 10, borderWidth: 1, borderColor: '#333', color: 'white', padding: 15, marginBottom: 12, fontSize: 14 },
  addButton: { backgroundColor: '#1DB954', padding: 15, borderRadius: 10, alignItems: 'center' },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  productCard: { backgroundColor: '#1a1a1a', borderRadius: 15, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 18, fontWeight: 'bold', color: 'white', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  activeBadge: { backgroundColor: '#0d2b1a' },
  completedBadge: { backgroundColor: '#2b2b0d' },
  badgeText: { fontSize: 12, color: '#1DB954', fontWeight: 'bold' },
  productPrice: { color: '#FFD700', fontSize: 14, marginBottom: 4 },
  entryFee: { color: '#1DB954', fontSize: 14, marginBottom: 8 },
  entries: { color: '#aaa', fontSize: 13, marginBottom: 6 },
  progressBar: { backgroundColor: '#333', height: 6, borderRadius: 3, marginBottom: 10 },
  progress: { backgroundColor: '#1DB954', height: 6, borderRadius: 3 },
  winner: { color: '#FFD700', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 10 },
  drawButton: { flex: 1, backgroundColor: '#FFD700', padding: 12, borderRadius: 8, alignItems: 'center' },
  drawButtonText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  deleteButton: { backgroundColor: '#2b0d0d', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ff4444', paddingHorizontal: 20 },
  deleteButtonText: { color: '#ff4444', fontWeight: 'bold', fontSize: 14 },
});
