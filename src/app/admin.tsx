import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
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
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
    fetchPendingTransactions();
  }, []);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  }

  async function fetchPendingTransactions() {
    const { data } = await supabase.from('transactions').select('*').eq('status', 'pending');
    if (data) setPendingTransactions(data);
  }

  async function addProduct() {
    if (!productName || !productPrice || !entryFee || !maxEntries) {
      alert('Please fill all required fields!'); return;
    }
    setLoading(true);
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
    if (!error) {
      setProductName(''); setProductPrice(''); setEntryFee('');
      setMaxEntries(''); setImageUrl(''); setDescription('');
      fetchProducts();
      alert('Product added successfully!');
    }
    setLoading(false);
  }

  async function saveEdit() {
    if (!editProduct) return;
    setLoading(true);
    const { error } = await supabase.from('products').update({
      name: editProduct.name,
      price: parseInt(editProduct.price),
      entry_fee: parseInt(editProduct.entry_fee),
      max_entries: parseInt(editProduct.max_entries),
      image_url: editProduct.image_url,
      description: editProduct.description,
    }).eq('id', editProduct.id);
    if (!error) {
      setEditModal(false);
      fetchProducts();
      alert('Product updated!');
    }
    setLoading(false);
  }

  async function deleteProduct(id) {
    if (!confirm('Are you sure?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  }

  async function approveTransaction(txn) {
    await supabase.from('transactions').update({ status: 'approved' }).eq('id', txn.id);
    await supabase.from('entries').insert({
      product_id: txn.product_id,
      phone: txn.phone,
      name: txn.phone,
    });
    await supabase.from('products').update({ 
      current_entries: supabase.rpc('increment', { x: 1 }) 
    }).eq('id', txn.product_id);
    fetchPendingTransactions();
    alert('Transaction approved! Entry confirmed.');
  }

  async function rejectTransaction(id) {
    await supabase.from('transactions').update({ status: 'rejected' }).eq('id', id);
    fetchPendingTransactions();
    alert('Transaction rejected!');
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Admin Panel</Text>
        <Text style={styles.subtitle}>JeetoBaz Management</Text>
      </View>

      {pendingTransactions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏳ Pending Payments ({pendingTransactions.length})</Text>
          {pendingTransactions.map((txn) => (
            <View key={txn.id} style={styles.txnCard}>
              <Text style={styles.txnPhone}>📱 {txn.phone}</Text>
              <Text style={styles.txnAmount}>Rs. {txn.amount}</Text>
              <Text style={styles.txnId}>TXN: {txn.jazzcash_txn_id}</Text>
              <View style={styles.txnActions}>
                <TouchableOpacity style={styles.approveBtn} onPress={() => approveTransaction(txn)}>
                  <Text style={styles.approveBtnText}>✅ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectTransaction(txn.id)}>
                  <Text style={styles.rejectBtnText}>❌ Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>➕ Add New Product</Text>
        <TextInput style={styles.input} placeholder="Product name *" placeholderTextColor="#666" value={productName} onChangeText={setProductName} />
        <TextInput style={styles.input} placeholder="Product price (Rs.) *" placeholderTextColor="#666" keyboardType="numeric" value={productPrice} onChangeText={setProductPrice} />
        <TextInput style={styles.input} placeholder="Entry fee *" placeholderTextColor="#666" keyboardType="numeric" value={entryFee} onChangeText={setEntryFee} />
        <TextInput style={styles.input} placeholder="Max entries *" placeholderTextColor="#666" keyboardType="numeric" value={maxEntries} onChangeText={setMaxEntries} />
        <TextInput style={styles.input} placeholder="Image URL (optional)" placeholderTextColor="#666" value={imageUrl} onChangeText={setImageUrl} />
        <TextInput style={[styles.input, styles.textArea]} placeholder="Description (optional)" placeholderTextColor="#666" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
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
            <Text style={styles.entryFee}>Entry: Rs. {p.entry_fee || 1}</Text>
            <Text style={styles.entries}>{p.current_entries || 0} / {p.max_entries} entries</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progress, { width: `${Math.min(((p.current_entries||0)/p.max_entries)*100, 100)}%` }]} />
            </View>
            {p.winner_phone && <Text style={styles.winner}>🏆 Winner: {p.winner_phone}</Text>}
            <View style={styles.actionRow}>
              {p.status === 'active' && (
                <TouchableOpacity style={styles.drawButton} onPress={() => router.push({ pathname: '/draw', params: { productId: p.id, productName: p.name } })}>
                  <Text style={styles.drawButtonText}>🎰 Live Draw</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.editButton} onPress={() => { setEditProduct({...p}); setEditModal(true); }}>
                <Text style={styles.editButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => deleteProduct(p.id)}>
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>✏️ Edit Product</Text>
            {editProduct && (
              <>
                <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#666" value={editProduct.name} onChangeText={t => setEditProduct({...editProduct, name: t})} />
                <TextInput style={styles.input} placeholder="Price" placeholderTextColor="#666" keyboardType="numeric" value={String(editProduct.price)} onChangeText={t => setEditProduct({...editProduct, price: t})} />
                <TextInput style={styles.input} placeholder="Entry Fee" placeholderTextColor="#666" keyboardType="numeric" value={String(editProduct.entry_fee)} onChangeText={t => setEditProduct({...editProduct, entry_fee: t})} />
                <TextInput style={styles.input} placeholder="Max Entries" placeholderTextColor="#666" keyboardType="numeric" value={String(editProduct.max_entries)} onChangeText={t => setEditProduct({...editProduct, max_entries: t})} />
                <TextInput style={styles.input} placeholder="Image URL" placeholderTextColor="#666" value={editProduct.image_url || ''} onChangeText={t => setEditProduct({...editProduct, image_url: t})} />
                <TextInput style={[styles.input, styles.textArea]} placeholder="Description" placeholderTextColor="#666" value={editProduct.description || ''} onChangeText={t => setEditProduct({...editProduct, description: t})} multiline />
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.saveBtn} onPress={saveEdit} disabled={loading}>
                    <Text style={styles.saveBtnText}>{loading ? 'Saving...' : '💾 Save'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModal(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  textArea: { height: 80, textAlignVertical: 'top' },
  addButton: { backgroundColor: '#1DB954', padding: 15, borderRadius: 10, alignItems: 'center' },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  txnCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#FFD700' },
  txnPhone: { color: 'white', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  txnAmount: { color: '#FFD700', fontSize: 14, marginBottom: 4 },
  txnId: { color: '#aaa', fontSize: 12, marginBottom: 10 },
  txnActions: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, backgroundColor: '#0d2b1a', padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#1DB954' },
  approveBtnText: { color: '#1DB954', fontWeight: 'bold' },
  rejectBtn: { flex: 1, backgroundColor: '#2b0d0d', padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ff4444' },
  rejectBtnText: { color: '#ff4444', fontWeight: 'bold' },
  productCard: { backgroundColor: '#1a1a1a', borderRadius: 15, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 16, fontWeight: 'bold', color: 'white', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  activeBadge: { backgroundColor: '#0d2b1a' },
  completedBadge: { backgroundColor: '#2b2b0d' },
  badgeText: { fontSize: 11, color: '#1DB954', fontWeight: 'bold' },
  productPrice: { color: '#FFD700', fontSize: 13, marginBottom: 2 },
  entryFee: { color: '#1DB954', fontSize: 13, marginBottom: 6 },
  entries: { color: '#aaa', fontSize: 12, marginBottom: 6 },
  progressBar: { backgroundColor: '#333', height: 6, borderRadius: 3, marginBottom: 10 },
  progress: { backgroundColor: '#1DB954', height: 6, borderRadius: 3 },
  winner: { color: '#FFD700', fontSize: 13, fontWeight: 'bold', marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 8 },
  drawButton: { flex: 1, backgroundColor: '#FFD700', padding: 10, borderRadius: 8, alignItems: 'center' },
  drawButtonText: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  editButton: { backgroundColor: '#1a3a5c', padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#4a9eff', paddingHorizontal: 15 },
  editButtonText: { color: '#4a9eff', fontWeight: 'bold', fontSize: 13 },
  deleteButton: { backgroundColor: '#2b0d0d', padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ff4444', paddingHorizontal: 15 },
  deleteButtonText: { color: '#ff4444', fontWeight: 'bold', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#1a1a1a', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#FFD700' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700', marginBottom: 15, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 5 },
  saveBtn: { flex: 1, backgroundColor: '#1DB954', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { flex: 1, backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center' },
  cancelBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
