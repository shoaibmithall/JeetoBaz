import { Alert, Image, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import { getStoredValue } from '@/lib/storage';
import { checkPaymentCooldown, markPaymentSubmitAttempt } from '@/lib/rate-limit';
import { CheckCircle2, CreditCard, House, Landmark, PartyPopper, TriangleAlert, WalletCards } from 'lucide-react-native';

const RECEIPT_BUCKET = 'payment-receipts';
const PAYMENT_ACCOUNTS = [
  { method: 'JazzCash', color: '#1DB954', number: '03706814892', accountTitle: 'Shoaib Ahmed' },
  { method: 'Easypaisa', color: '#ff8c32', number: '03706814892', accountTitle: 'Shoaib Ahmed' },
  { method: 'My ABL Allied Bank / Bank Transfer', color: '#4a9eff', number: '08530010142159150013', accountTitle: 'Shoaib Ahmed' },
];

type ReceiptAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  dataUrl?: string | null;
};

function dataUrlToArrayBuffer(dataUrl: string) {
  const base64 = dataUrl.split(',')[1];
  if (!base64) throw new Error('Receipt image could not be prepared.');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

export default function PaymentScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { productId, productName, entryFee } = useLocalSearchParams();
  const productIdValue = Array.isArray(productId) ? productId[0] : productId;
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_ACCOUNTS[0].method);
  const [receipt, setReceipt] = useState<ReceiptAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('payment');
  const [submitError, setSubmitError] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userName, setUserName] = useState('');
  const submittingRef = useRef(false);

  useEffect(() => {
    Promise.all([getStoredValue('userPhone'), getStoredValue('userName')]).then(
      ([storedPhone, storedName]) => {
        setUserPhone(storedPhone || '');
        setUserName(storedName || '');
      },
    );
  }, []);

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
      quality: 0.45,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const mimeType = result.assets[0].mimeType || 'image/jpeg';
      setReceipt({
        uri: result.assets[0].uri,
        fileName: result.assets[0].fileName,
        mimeType,
        dataUrl: result.assets[0].base64 ? `data:${mimeType};base64,${result.assets[0].base64}` : null,
      });
    }
  }

  async function uploadReceipt(productId: string) {
    if (!receipt?.dataUrl) {
      throw new Error('Please choose the receipt screenshot again.');
    }

    const mimeType = receipt.mimeType || 'image/jpeg';
    const extension = mimeType === 'image/png'
      ? 'png'
      : mimeType === 'image/webp'
        ? 'webp'
        : 'jpg';
    const filePath = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
    const { error } = await supabase.storage
      .from(RECEIPT_BUCKET)
      .upload(filePath, dataUrlToArrayBuffer(receipt.dataUrl), {
        contentType: mimeType,
        upsert: false,
      });

    if (error) throw error;
    return filePath;
  }

  async function confirmPayment() {
    if (loading || submittingRef.current) return;
    setSubmitError('');

    if (!receipt) {
      alert('Please upload your payment receipt screenshot.');
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    if (!productIdValue) {
      alert('Missing product for this payment!');
      submittingRef.current = false;
      setLoading(false);
      return;
    }

    if (!userPhone) {
      router.push('/login');
      submittingRef.current = false;
      setLoading(false);
      return;
    }

    const cooldown = await checkPaymentCooldown(productIdValue, userPhone);
    if (!cooldown.allowed) {
      const message = `Please wait ${cooldown.waitSeconds} seconds before submitting payment again.`;
      setSubmitError(message);
      alert(message);
      submittingRef.current = false;
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
      submittingRef.current = false;
      setLoading(false);
      return;
    }

    if (product.status !== 'active') {
      alert('This draw is no longer active.');
      submittingRef.current = false;
      setLoading(false);
      return;
    }

    if ((product.current_entries || 0) >= product.max_entries) {
      alert('Sorry, this draw is full.');
      submittingRef.current = false;
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
      submittingRef.current = false;
      setLoading(false);
      return;
    }

    if (existing) {
      alert('You have already entered this draw!');
      submittingRef.current = false;
      setLoading(false);
      return;
    }

    const { data: pendingPayment, error: pendingError } = await supabase
      .from('transactions')
      .select('id')
      .eq('product_id', productIdValue)
      .eq('phone', userPhone)
      .eq('status', 'pending')
      .maybeSingle();

    if (pendingError) {
      alert('Unable to verify your payment status. Please try again.');
      submittingRef.current = false;
      setLoading(false);
      return;
    }

    if (pendingPayment) {
      alert('Your payment request is already pending admin approval.');
      submittingRef.current = false;
      setLoading(false);
      return;
    }

    try {
      await markPaymentSubmitAttempt(productIdValue, userPhone);
      const receiptPath = await uploadReceipt(productIdValue);
      const { error } = await supabase.from('transactions').insert({
        product_id: productIdValue,
        phone: userPhone,
        user_name: userName,
        amount: product.entry_fee || 1,
        jazzcash_txn_id: `RECEIPT-${Date.now()}`,
        payment_method: selectedMethod,
        sender_name: userName,
        sender_phone: userPhone,
        receipt_path: receiptPath,
        status: 'pending',
      });

      if (error) throw error;
      setStep('success');
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Payment submit failed.';
      setSubmitError(message);
      alert('Error: ' + message);
    }
    submittingRef.current = false;
    setLoading(false);
  }

  if (step === 'success') return (
    <View style={styles.container}>
      <View style={styles.successBox}>
        <PartyPopper color="#FFD700" size={80} />
        <Text style={styles.successTitle}>Payment Submitted!</Text>
        <Text style={styles.successText}>{t('goodLuck')}</Text>
        <Text style={styles.successSub}>Your entry will be added after admin approval.</Text>
      </View>
      <TouchableOpacity style={styles.homeBtn} onPress={() => router.push('/')}>
        <House color="white" size={18} /><Text style={styles.homeBtnText}>{t('backToHome')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← {t('back')}</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}><CreditCard color="#FFD700" size={20} /><Text style={styles.title}>{t('payment')}</Text></View>
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
            {account.method.includes('Bank')
              ? <Landmark color={account.color} size={30} />
              : <WalletCards color={account.color} size={30} />}
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
          <Text style={styles.step}>1. {t('openPaymentApp')}</Text>
          <Text style={styles.step}>2. Send any entry fee to the above accounts</Text>
          <Text style={styles.step}>3. Share transaction receipt screenshot</Text>
          <Text style={styles.step}>4. Upload it below and confirm</Text>
        </View>
      </View>

      <View style={styles.txnBox}>
        <Text style={styles.txnLabel}>Enter Screenshot:</Text>
        <TouchableOpacity style={styles.receiptButton} onPress={pickReceipt}>
          <Text style={styles.receiptButtonText}>{receipt ? 'Change Screenshot' : 'Upload Payment Screenshot'}</Text>
        </TouchableOpacity>
        {receipt && <Image source={{ uri: receipt.uri }} style={styles.receiptPreview} resizeMode="cover" />}
        {submitError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Payment submit failed</Text>
            <Text style={styles.errorText}>{submitError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={confirmPayment} disabled={loading}>
              <Text style={styles.retryButtonText}>{loading ? t('confirming') : t('tryAgain')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
          onPress={confirmPayment}
          disabled={loading}
        >
          {!loading && <CheckCircle2 color="#000" size={19} />}
          <Text style={styles.confirmBtnText}>{loading ? t('confirming') : t('confirmEntry')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.noteBox}>
        <View style={styles.noteTitleRow}><TriangleAlert color="#FFD700" size={17} /><Text style={styles.noteTitle}>{t('important')}:</Text></View>
        <Text style={styles.noteText}>• {t('paymentVerify')}</Text>
        <Text style={styles.noteText}>• Keep your transaction receipt ID safe</Text>
        <Text style={styles.noteText}>• {t('oneEntry')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  header: { backgroundColor: '#04140e', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  backBtn: { color: '#18a663', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dummy: { width: 50 },
  productBox: { backgroundColor: '#071b13', margin: 15, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#174a35', alignItems: 'center' },
  productName: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  entryFee: { fontSize: 16, color: '#FFD700', fontWeight: 'bold' },
  paymentBox: { margin: 15 },
  payTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 15 },
  methodCard: { backgroundColor: '#071b13', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 15, borderWidth: 1, borderColor: '#174a35' },
  methodCardSelected: { borderColor: '#FFD700', backgroundColor: '#2a2105' },
  methodInfo: { flex: 1 },
  methodName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  methodNumber: { color: '#FFD700', fontSize: 16, fontFamily: 'monospace', marginTop: 2 },
  methodAccount: { color: '#18a663', fontSize: 13, marginTop: 2 },
  copyHint: { color: '#777', fontSize: 11, width: 82, textAlign: 'right' },
  stepsBox: { backgroundColor: '#082d1e', borderRadius: 12, padding: 15, marginTop: 10, borderWidth: 1, borderColor: '#18a663' },
  stepsTitle: { color: '#18a663', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  step: { color: '#aaa', fontSize: 14, marginBottom: 6 },
  txnBox: { margin: 15 },
  txnLabel: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  txnInput: { backgroundColor: '#071b13', borderRadius: 10, borderWidth: 1, borderColor: '#FFD700', color: 'white', padding: 15, fontSize: 16, marginBottom: 15 },
  receiptButton: { backgroundColor: '#1a3a5c', borderColor: '#4a9eff', borderWidth: 1, borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 12 },
  receiptButtonText: { color: '#4a9eff', fontSize: 15, fontWeight: 'bold' },
  receiptPreview: { width: '100%', height: 180, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#174a35' },
  errorBox: { backgroundColor: '#2b0d0d', borderColor: '#ff4444', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  errorTitle: { color: '#ff7777', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  errorText: { color: '#ffd5d5', fontSize: 13, lineHeight: 18, marginBottom: 10 },
  retryButton: { backgroundColor: '#ff4444', borderRadius: 8, padding: 10, alignItems: 'center' },
  retryButtonText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  confirmBtn: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  confirmBtnDisabled: { backgroundColor: '#555' },
  confirmBtnText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  noteBox: { backgroundColor: '#071b13', margin: 15, borderRadius: 12, padding: 15, marginBottom: 40, borderWidth: 1, borderColor: '#174a35' },
  noteTitle: { color: '#FFD700', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  noteTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  noteText: { color: '#aaa', fontSize: 13, marginBottom: 4 },
  successBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 100 },
  successTitle: { fontSize: 28, fontWeight: 'bold', color: '#18a663', marginBottom: 10 },
  successText: { fontSize: 18, color: 'white', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#aaa' },
  homeBtn: { backgroundColor: '#18a663', margin: 15, padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  homeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
