import { Alert, Image, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import { getStoredValue } from '@/lib/storage';
import { isValidTransactionId, normalizeTransactionId } from '@/lib/validation';

const RECEIPT_BUCKET = 'payment-receipts';
const PAYMENT_ACCOUNTS = [
  { method: 'JazzCash', icon: '💚', number: '03706814892', accountTitle: 'Shoaib Ahmed' },
  { method: 'Easypaisa', icon: '🟠', number: '03706814892', accountTitle: 'Shoaib Ahmed' },
  { method: 'My ABL Allied Bank / Bank Transfer', icon: '🏦', number: '08530010142159150013', accountTitle: 'Shoaib Ahmed' },
];

type ReceiptAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export default function PaymentScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { productId, productName, entryFee } = useLocalSearchParams();
  const productIdValue = Array.isArray(productId) ? productId[0] : productId;
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_ACCOUNTS[0].method);
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [txnId, setTxnId] = useState('');
  const [receipt, setReceipt] = useState<ReceiptAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('payment');

  async function copyAccountNumber(number: string) {
    await Clipboard.setStringAsync(number);
    Alert.alert(t('copied'), 'Account number copied.');
  }

  async function pickReceipt() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Please allow photo access to upload your payment receipt.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setReceipt({
        uri: result.assets[0].uri,
        fileName: result.assets[0].fileName,
        mimeType: result.assets[0].mimeType,
      });
    }
  }

  async function uploadReceipt(userPhone: string) {
    if (!receipt || !productIdValue) return null;

    const response = await fetch(receipt.uri);
    const arrayBuffer = await response.arrayBuffer();
    const extension = receipt.fileName?.split('.').pop() || 'jpg';
    const cleanPhone = userPhone.replace(/\D/g, '') || 'unknown';
    const path = `${productIdValue}/${cleanPhone}-${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from(RECEIPT_BUCKET)
      .upload(path, arrayBuffer, {
        contentType: receipt.mimeType || 'image/jpeg',
        upsert: false,
      });

    if (error) throw error;
    return path;
  }

  async function confirmPayment() {
    const normalizedTxnId = normalizeTransactionId(txnId);
    if (!isValidTransactionId(normalizedTxnId)) {
      alert('Please enter a valid transaction ID!');
      return;
    }

    const cleanSenderName = senderName.trim().replace(/\s+/g, ' ');
    const cleanSenderPhone = senderPhone.trim().replace(/\s+/g, '');
    if (cleanSenderName.length < 2) {
      alert('Please enter the payment account title/name.');
      return;
    }
    if (cleanSenderPhone.length < 8) {
      alert('Please enter the sender payment number/account.');
      return;
    }
    if (!receipt) {
      alert('Please upload your payment receipt screenshot.');
      return;
    }

    setLoading(true);

    const [userPhone, userName] = await Promise.all([
      getStoredValue('userPhone'),
      getStoredValue('userName'),
    ]);

    if (!productIdValue) {
      alert('Missing product for this payment!');
      setLoading(false);
      return;
    }

    if (!userPhone) {
      router.push('/login');
      setLoading(false);
      return;
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, entry_fee, status, current_entries, max_entries')
      .eq('id', productIdValue)
      .maybeSingle();

    if (productError || !product) {
      alert('This draw could not be verified. Please try again.');
      setLoading(false);
      return;
    }

    if (product.status !== 'active') {
      alert('This draw is no longer active.');
      setLoading(false);
      return;
    }

    if ((product.current_entries || 0) >= product.max_entries) {
      alert('Sorry, this draw is full.');
      setLoading(false);
      return;
    }

    const { data: existing, error: existingError } = await supabase
      .from('entries')
      .select('id')
      .eq('product_id', productIdValue)
      .eq('phone', userPhone)
      .maybeSingle();

    if (existingError) {
      alert('Unable to verify your entry. Please try again.');
      setLoading(false);
      return;
    }

    if (existing) {
      alert('You have already entered this draw!');
      setLoading(false);
      return;
    }

    try {
      const receiptPath = await uploadReceipt(userPhone);
      const { error } = await supabase.from('transactions').insert({
        product_id: productIdValue,
        phone: userPhone,
        user_name: userName,
        amount: product.entry_fee || 1,
        jazzcash_txn_id: normalizedTxnId,
        payment_method: selectedMethod,
        sender_name: cleanSenderName,
        sender_phone: cleanSenderPhone,
        receipt_path: receiptPath,
        status: 'pending',
      });

      if (error) throw error;
      setStep('success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment submit failed.';
      alert('Error: ' + message);
    }
    setLoading(false);
  }

  if (step === 'success') return (
    <View style={styles.container}>
      <View style={styles.successBox}>
        <Text style={styles.successEmoji}>🎉</Text>
        <Text style={styles.successTitle}>Payment Submitted!</Text>
        <Text style={styles.successText}>{t('goodLuck')}</Text>
        <Text style={styles.successSub}>Your entry will be added after admin approval.</Text>
      </View>
      <TouchableOpacity style={styles.homeBtn} onPress={() => router.push('/')}>
        <Text style={styles.homeBtnText}>🏠 {t('backToHome')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← {t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>💳 {t('payment')}</Text>
        <Text style={styles.dummy}></Text>
      </View>

      <View style={styles.productBox}>
        <Text style={styles.productName}>{productName}</Text>
        <Text style={styles.entryFee}>{t('entryFee')}: Rs. {entryFee || 1}</Text>
      </View>

      <View style={styles.paymentBox}>
        <Text style={styles.payTitle}>{t('sendPaymentTo')}:</Text>

        {PAYMENT_ACCOUNTS.map((account) => (
          <TouchableOpacity
            key={account.method}
            style={[styles.methodCard, selectedMethod === account.method && styles.methodCardSelected]}
            onPress={() => setSelectedMethod(account.method)}
            activeOpacity={0.85}
          >
            <Text style={styles.methodIcon}>{account.icon}</Text>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{account.method}</Text>
              <TouchableOpacity onPress={() => copyAccountNumber(account.number)}>
                <Text style={styles.methodNumber}>{account.number}</Text>
              </TouchableOpacity>
              <Text style={styles.methodAccount}>{account.accountTitle}</Text>
            </View>
            <Text style={styles.copyHint}>Tap number to copy</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.stepsBox}>
          <Text style={styles.stepsTitle}>{t('howToPay')}:</Text>
          <Text style={styles.step}>1️⃣ {t('openPaymentApp')}</Text>
          <Text style={styles.step}>2️⃣ Send any entry fee to the above accounts</Text>
          <Text style={styles.step}>3️⃣ Share transaction receipt screenshot</Text>
          <Text style={styles.step}>4️⃣ Upload it below and confirm</Text>
        </View>
      </View>

      <View style={styles.txnBox}>
        <Text style={styles.txnLabel}>Payment Account Title / Name:</Text>
        <TextInput
          style={styles.txnInput}
          placeholder="e.g. Shoaib Ahmed"
          placeholderTextColor="#666"
          value={senderName}
          onChangeText={setSenderName}
          maxLength={80}
        />
        <Text style={styles.txnLabel}>Payment Number / Account:</Text>
        <TextInput
          style={styles.txnInput}
          placeholder="e.g. 03XXXXXXXXX"
          placeholderTextColor="#666"
          value={senderPhone}
          onChangeText={setSenderPhone}
          keyboardType="phone-pad"
          maxLength={40}
        />
        <Text style={styles.txnLabel}>Enter Transaction ID:</Text>
        <TextInput
          style={styles.txnInput}
          placeholder="e.g. TXN123456789"
          placeholderTextColor="#666"
          value={txnId}
          onChangeText={(value) => setTxnId(normalizeTransactionId(value))}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={50}
        />
        <Text style={styles.txnLabel}>Enter Screenshot:</Text>
        <TouchableOpacity style={styles.receiptButton} onPress={pickReceipt}>
          <Text style={styles.receiptButtonText}>{receipt ? 'Change Screenshot' : 'Upload Payment Screenshot'}</Text>
        </TouchableOpacity>
        {receipt && <Image source={{ uri: receipt.uri }} style={styles.receiptPreview} resizeMode="cover" />}
        <TouchableOpacity
          style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
          onPress={confirmPayment}
          disabled={loading}
        >
          <Text style={styles.confirmBtnText}>
            {loading ? t('confirming') : `✅ ${t('confirmEntry')}`}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.noteBox}>
        <Text style={styles.noteTitle}>⚠️ {t('important')}:</Text>
        <Text style={styles.noteText}>• {t('paymentVerify')}</Text>
        <Text style={styles.noteText}>• Keep your transaction receipt ID safe</Text>
        <Text style={styles.noteText}>• {t('oneEntry')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { backgroundColor: '#1a1a1a', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  backBtn: { color: '#1DB954', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  dummy: { width: 50 },
  productBox: { backgroundColor: '#1a1a1a', margin: 15, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  productName: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  entryFee: { fontSize: 16, color: '#FFD700', fontWeight: 'bold' },
  paymentBox: { margin: 15 },
  payTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 15 },
  methodCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 15, borderWidth: 1, borderColor: '#333' },
  methodCardSelected: { borderColor: '#FFD700', backgroundColor: '#241f0b' },
  methodIcon: { fontSize: 30 },
  methodInfo: { flex: 1 },
  methodName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  methodNumber: { color: '#FFD700', fontSize: 16, fontFamily: 'monospace', marginTop: 2 },
  methodAccount: { color: '#1DB954', fontSize: 13, marginTop: 2 },
  copyHint: { color: '#777', fontSize: 11, width: 82, textAlign: 'right' },
  stepsBox: { backgroundColor: '#0d2b1a', borderRadius: 12, padding: 15, marginTop: 10, borderWidth: 1, borderColor: '#1DB954' },
  stepsTitle: { color: '#1DB954', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  step: { color: '#aaa', fontSize: 14, marginBottom: 6 },
  txnBox: { margin: 15 },
  txnLabel: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  txnInput: { backgroundColor: '#1a1a1a', borderRadius: 10, borderWidth: 1, borderColor: '#FFD700', color: 'white', padding: 15, fontSize: 16, marginBottom: 15 },
  receiptButton: { backgroundColor: '#1a3a5c', borderColor: '#4a9eff', borderWidth: 1, borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 12 },
  receiptButtonText: { color: '#4a9eff', fontSize: 15, fontWeight: 'bold' },
  receiptPreview: { width: '100%', height: 180, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  confirmBtn: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#555' },
  confirmBtnText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  noteBox: { backgroundColor: '#1a1a1a', margin: 15, borderRadius: 12, padding: 15, marginBottom: 40, borderWidth: 1, borderColor: '#333' },
  noteTitle: { color: '#FFD700', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  noteText: { color: '#aaa', fontSize: 13, marginBottom: 4 },
  successBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 100 },
  successEmoji: { fontSize: 80, marginBottom: 20 },
  successTitle: { fontSize: 28, fontWeight: 'bold', color: '#1DB954', marginBottom: 10 },
  successText: { fontSize: 18, color: 'white', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#aaa' },
  homeBtn: { backgroundColor: '#1DB954', margin: 15, padding: 15, borderRadius: 12, alignItems: 'center' },
  homeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
