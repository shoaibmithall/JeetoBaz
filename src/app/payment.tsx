import { Alert, Image, Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import { useAppTheme } from '@/hooks/use-theme';
import { getStoredValue, setStoredValue } from '@/lib/storage';
import { useAuth } from '@/providers/AuthProvider';
import { checkPaymentCooldown, markPaymentSubmitAttempt } from '@/lib/rate-limit';
import { PaymentBrandLogo } from '@/components/payment-brand-logo';
import { CheckCircle2, CreditCard, House, PartyPopper, TriangleAlert, Wallet, Zap } from 'lucide-react-native';
import { useSafeBack } from '@/lib/safe-back';

const RECEIPT_BUCKET = 'payment-receipts';
const PAYMENT_ACCOUNTS = [
  { method: 'JazzCash', number: '03706814892', accountTitle: 'Shoaib Ahmed', qrImage: require('@/assets/images/payment-qr/jazzcash.jpg') },
  { method: 'Easypaisa', number: '03706814892', accountTitle: 'Shoaib Ahmed', qrImage: require('@/assets/images/payment-qr/easypaisa.jpg') },
  { method: 'NayaPay', number: '03706814892', accountTitle: 'Shoaib Ahmed', qrImage: require('@/assets/images/payment-qr/nayapay.jpg') },
  { method: 'UPaisa', number: '03706814892', accountTitle: 'Shoaib Ahmed', qrImage: require('@/assets/images/payment-qr/upaisa.jpg') },
  { method: 'SadaPay', number: '03706814892', accountTitle: 'Shoaib Ahmed', qrImage: null },
  { method: 'JS Bank / Zindigi App', number: '03706814892', accountTitle: 'Shoaib Ahmed', qrImage: require('@/assets/images/payment-qr/zindigi.jpg') },
  { method: 'My ABL Allied Bank / Bank Transfer', number: '08530010142159150013', accountTitle: 'Shoaib Ahmed', qrImage: require('@/assets/images/payment-qr/alliedbank.jpg') },
];

function subscribeToHydration() {
  return () => {};
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

type ReceiptAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  dataUrl?: string | null;
};

function firstParam(value: string | string[] | undefined, fallback = '') {
  if (Array.isArray(value)) return value[0] || fallback;
  return value || fallback;
}

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
  const { theme } = useAppTheme();
  const router = useRouter();
  const goBack = useSafeBack();
  const { user } = useAuth();
  const { productId, productName, entryFee } = useLocalSearchParams();
  const hasHydratedParams = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const productIdValue = hasHydratedParams ? firstParam(productId) : '';
  const productNameValue = hasHydratedParams ? firstParam(productName, 'Selected draw') : 'Selected draw';
  const entryFeeValue = hasHydratedParams ? firstParam(entryFee, '1') : '1';
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_ACCOUNTS[0].method);
  const [receipt, setReceipt] = useState<ReceiptAsset | null>(null);
  const [receiptPreviewError, setReceiptPreviewError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('payment');
  const [submitError, setSubmitError] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletSubmitting, setWalletSubmitting] = useState(false);
  const [walletError, setWalletError] = useState('');
  const [paidVia, setPaidVia] = useState<'wallet' | 'manual'>('manual');
  const [qrPreview, setQrPreview] = useState<typeof PAYMENT_ACCOUNTS[number] | null>(null);
  const submittingRef = useRef(false);
  const canSubmit = Boolean(receipt && productIdValue && !loading);
  const entryFeeNumber = Number(entryFeeValue) || 0;

  useEffect(() => {
    Promise.all([getStoredValue('userPhone'), getStoredValue('userName')]).then(
      async ([storedPhone, storedName]) => {
        let phone = storedPhone || '';
        let name = storedName || '';
        if (!phone && user?.id) {
          const { data: profile } = await supabase
            .from('users')
            .select('phone, name')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          if (profile?.phone) {
            phone = profile.phone;
            name = profile.name || '';
            setStoredValue('userPhone', phone);
            setStoredValue('userName', name);
          }
        }
        setUserPhone(phone);
        setUserName(name);
        if (phone) {
          const { data: walletRow } = await supabase.from('wallets').select('balance').eq('phone', phone).maybeSingle();
          setWalletBalance(walletRow?.balance ?? 0);
        }
      },
    );
  }, [user]);

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
      setReceiptPreviewError('');
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

  async function confirmWalletEntry() {
    if (walletSubmitting || submittingRef.current) return;
    setWalletError('');

    if (!productIdValue) {
      alert('Missing product for this payment!');
      return;
    }

    if (!userPhone) {
      router.push('/login');
      return;
    }

    submittingRef.current = true;
    setWalletSubmitting(true);

    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('enter_draw_from_wallet_atomic', {
        p_product_id: productIdValue,
        p_phone: userPhone,
        p_name: userName?.trim() || undefined,
      })
      .single();

    if (rpcError || !rpcResult?.ok) {
      const message = rpcError?.message || rpcResult?.error || 'Wallet entry failed.';
      setWalletError(message);
      alert('Error: ' + message);
      submittingRef.current = false;
      setWalletSubmitting(false);
      return;
    }

    setWalletBalance(rpcResult.new_balance ?? null);
    setPaidVia('wallet');
    setStep('success');
    submittingRef.current = false;
    setWalletSubmitting(false);
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

    const { data: existing, error: existingError } = await supabase.rpc('check_entry_exists', {
      p_product_id: productIdValue,
      p_phone: userPhone,
    });

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

    const { data: pendingPayment, error: pendingError } = await supabase.rpc('check_pending_transaction_exists', {
      p_product_id: productIdValue,
      p_phone: userPhone,
    });

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
        user_name: userName?.trim() || null,
        amount: product.entry_fee || 1,
        jazzcash_txn_id: `RECEIPT-${Date.now()}`,
        payment_method: selectedMethod,
        sender_name: userName?.trim() || null,
        sender_phone: userPhone,
        receipt_path: receiptPath,
        status: 'pending',
      });

      if (error) {
        await supabase.storage.from(RECEIPT_BUCKET).remove([receiptPath]).catch(() => {});
        throw error;
      }
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
    <>
    <Head>
      <title>Payment | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="Submit your JeetoBaz prize campaign payment and upload payment receipt." />
    </Head>
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.successBox}>
        <PartyPopper color={theme.gold} size={80} />
        <Text style={[styles.successTitle, { color: theme.primary }]}>{paidVia === 'wallet' ? 'Entry Confirmed!' : 'Payment Submitted!'}</Text>
        <Text style={[styles.successText, { color: theme.text }]}>{t('goodLuck')}</Text>
        <Text style={[styles.successSub, { color: theme.muted }]}>
          {paidVia === 'wallet' ? 'Paid instantly from your wallet — no approval wait!' : 'Your entry will be added after admin approval.'}
        </Text>
      </View>
      <TouchableOpacity style={styles.homeBtn} onPress={() => router.push('/')}>
        <House color="white" size={18} /><Text style={styles.homeBtnText}>{t('backToHome')}</Text>
      </TouchableOpacity>
    </View>
    </>
  );

  return (
    <>
    <Head>
      <title>Payment | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="Submit your JeetoBaz prize campaign payment and upload payment receipt." />
    </Head>
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surfaceAlt, borderBottomColor: theme.gold }]}>
        <TouchableOpacity onPress={goBack}>
          <Text style={[styles.backBtn, { color: theme.primary }]}>← {t('back')}</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}><CreditCard color={theme.gold} size={20} /><Text style={[styles.title, { color: theme.gold }]}>{t('payment')}</Text></View>
        <Text style={styles.dummy}></Text>
      </View>

      <View style={[styles.productBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.productName, { color: theme.text }]}>{productNameValue}</Text>
        <Text style={[styles.entryFee, { color: theme.gold }]}>{t('entryFee')}: Rs. {entryFeeValue}</Text>
      </View>

      {userPhone && walletBalance !== null ? (
        <View style={[styles.walletBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.walletHeaderRow}>
            <Wallet color={theme.gold} size={20} />
            <Text style={[styles.walletTitle, { color: theme.text }]}>Pay from Wallet</Text>
          </View>
          <Text style={[styles.walletBalanceText, { color: theme.muted }]}>Balance: Rs. {walletBalance.toLocaleString()}</Text>
          {walletBalance >= entryFeeNumber ? (
            <TouchableOpacity style={styles.walletPayBtn} onPress={confirmWalletEntry} disabled={walletSubmitting}>
              <Zap color="#000" size={18} />
              <Text style={styles.walletPayBtnText}>{walletSubmitting ? t('confirming') : `Pay Rs. ${entryFeeValue} Instantly`}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.walletTopupLink} onPress={() => router.push({ pathname: '/wallet-topup', params: { from: '/payment' } })}>
              <Text style={[styles.walletTopupLinkText, { color: theme.info }]}>Insufficient balance — Top up your wallet →</Text>
            </TouchableOpacity>
          )}
          {walletError ? <Text style={styles.walletErrorText}>{walletError}</Text> : null}
        </View>
      ) : null}

      {userPhone && walletBalance !== null ? (
        <View style={styles.orDivider}>
          <View style={[styles.orDividerLine, { backgroundColor: theme.border }]} />
          <Text style={[styles.orDividerText, { color: theme.subtle }]}>OR PAY MANUALLY</Text>
          <View style={[styles.orDividerLine, { backgroundColor: theme.border }]} />
        </View>
      ) : null}

      <View style={styles.paymentBox}>
        <Text style={[styles.payTitle, { color: theme.text }]}>{t('sendPaymentTo')}:</Text>

        {PAYMENT_ACCOUNTS.map((account) => (
          <TouchableOpacity
            key={account.method}
            style={[
              styles.methodCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
              selectedMethod === account.method && { borderColor: theme.gold, backgroundColor: theme.goldSoft },
            ]}
            onPress={() => setSelectedMethod(account.method)}
            activeOpacity={0.85}
          >
            <PaymentBrandLogo brand={account.method} />
            <View style={styles.methodInfo}>
              <Text style={[styles.methodName, { color: theme.text }]}>{account.method}</Text>
              <TouchableOpacity onPress={() => copyAccountNumber(account.number)}>
                <Text style={[styles.methodNumber, { color: theme.gold }]}>{account.number}</Text>
              </TouchableOpacity>
              <Text style={[styles.methodAccount, { color: theme.primary }]}>{account.accountTitle}</Text>
              <Text style={[styles.copyHint, { color: theme.subtle }]}>{account.qrImage ? 'Tap number to copy, or tap QR to enlarge' : 'Tap number to copy'}</Text>
            </View>
            {account.qrImage && (
              <TouchableOpacity style={styles.methodQrBox} onPress={() => setQrPreview(account)} accessibilityRole="button" accessibilityLabel={`Enlarge ${account.method} payment QR code`}>
                <Image source={account.qrImage} style={styles.methodQrImage} resizeMode="contain" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}

        <View style={[styles.stepsBox, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
          <Text style={[styles.stepsTitle, { color: theme.primary }]}>{t('howToPay')}:</Text>
          <Text style={[styles.step, { color: theme.muted }]}>1. Open your preferred wallet or banking app</Text>
          <Text style={[styles.step, { color: theme.muted }]}>2. Send any entry fee to the above accounts</Text>
          <Text style={[styles.step, { color: theme.muted }]}>3. Share transaction receipt screenshot</Text>
          <Text style={[styles.step, { color: theme.muted }]}>4. Upload it below and confirm</Text>
        </View>
      </View>

      <View style={styles.txnBox}>
        <Text style={[styles.txnLabel, { color: theme.text }]}>Enter Screenshot:</Text>
        <Text style={[styles.receiptHelpText, { color: theme.muted }]}>Upload a clear screenshot of your payment receipt for admin approval.</Text>
        <TouchableOpacity style={[styles.receiptButton, { backgroundColor: theme.infoSoft, borderColor: theme.info }]} onPress={pickReceipt}>
          <Text style={[styles.receiptButtonText, { color: theme.info }]}>{receipt ? 'Change Screenshot' : 'Upload Payment Screenshot'}</Text>
        </TouchableOpacity>
        {receipt ? (
          <>
            <Image
              source={{ uri: receipt.uri }}
              style={[styles.receiptPreview, { borderColor: theme.border }]}
              resizeMode="cover"
              onError={() => setReceiptPreviewError('Receipt preview could not load. You can choose the screenshot again.')}
            />
            <View style={styles.receiptSelectedRow}>
              <CheckCircle2 color="#18a663" size={16} />
            <Text style={[styles.receiptSelectedText, { color: theme.primary }]}>Screenshot selected</Text>
            </View>
          </>
        ) : null}
        {receiptPreviewError ? <Text style={styles.receiptErrorText}>{receiptPreviewError}</Text> : null}
        {!productIdValue ? (
          <View style={[styles.warningBox, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}>
            <TriangleAlert color={theme.gold} size={17} />
            <Text style={[styles.warningText, { color: theme.text }]}>Please open payment from a draw again so the product can be verified.</Text>
          </View>
        ) : null}
        {submitError ? (
          <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
            <Text style={[styles.errorTitle, { color: theme.danger }]}>Payment submit failed</Text>
            <Text style={[styles.errorText, { color: theme.text }]}>{submitError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={confirmPayment} disabled={loading}>
              <Text style={styles.retryButtonText}>{loading ? t('confirming') : t('tryAgain')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.confirmBtn, !canSubmit && styles.confirmBtnDisabled]}
          onPress={confirmPayment}
          disabled={!canSubmit}
        >
          {!loading && <CheckCircle2 color="#000" size={19} />}
          <Text style={styles.confirmBtnText}>{loading ? t('confirming') : t('confirmEntry')}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.noteBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.noteTitleRow}><TriangleAlert color={theme.gold} size={17} /><Text style={[styles.noteTitle, { color: theme.gold }]}>{t('important')}:</Text></View>
        <Text style={[styles.noteText, { color: theme.muted }]}>• {t('paymentVerify')}</Text>
        <Text style={[styles.noteText, { color: theme.muted }]}>• Keep your transaction receipt ID safe</Text>
        <Text style={[styles.noteText, { color: theme.muted }]}>• {t('oneEntry')}</Text>
      </View>
    </ScrollView>

    <Modal visible={!!qrPreview} transparent animationType="fade" onRequestClose={() => setQrPreview(null)}>
      <TouchableOpacity style={styles.qrModalBackdrop} activeOpacity={1} onPress={() => setQrPreview(null)}>
        <View style={styles.qrModalCard}>
          <Text style={styles.qrModalTitle}>{qrPreview?.method}</Text>
          {qrPreview?.qrImage ? (
            <Image source={qrPreview.qrImage} style={styles.qrModalImage} resizeMode="contain" accessibilityLabel={`${qrPreview.method} payment QR code`} />
          ) : null}
          <TouchableOpacity style={styles.qrModalCloseBtn} onPress={() => setQrPreview(null)}>
            <Text style={styles.qrModalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
    </>
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
  walletBox: { backgroundColor: '#071b13', marginHorizontal: 15, marginTop: 15, borderRadius: 15, padding: 18, borderWidth: 1, borderColor: '#174a35' },
  walletHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  walletTitle: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  walletBalanceText: { fontSize: 13, color: '#aaa', marginBottom: 12 },
  walletPayBtn: { backgroundColor: '#FFD700', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  walletPayBtnText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  walletTopupLink: { padding: 12, alignItems: 'center' },
  walletTopupLinkText: { fontSize: 14, fontWeight: 'bold' },
  walletErrorText: { color: '#ffb4b4', fontSize: 12, lineHeight: 17, marginTop: 10 },
  orDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 15, marginTop: 20 },
  orDividerLine: { flex: 1, height: 1 },
  orDividerText: { fontSize: 11, fontWeight: 'bold' },
  paymentBox: { margin: 15 },
  payTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 15 },
  methodCard: { backgroundColor: '#071b13', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 15, borderWidth: 1, borderColor: '#174a35' },
  methodCardSelected: { borderColor: '#FFD700', backgroundColor: '#2a2105' },
  methodInfo: { flex: 1 },
  methodName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  methodNumber: { color: '#FFD700', fontSize: 16, fontFamily: 'monospace', marginTop: 2 },
  methodAccount: { color: '#18a663', fontSize: 13, marginTop: 2 },
  copyHint: { color: '#777', fontSize: 11, marginTop: 4 },
  methodQrBox: { backgroundColor: 'white', borderRadius: 8, padding: 4, width: 68, height: 68 },
  methodQrImage: { width: '100%', height: '100%' },
  qrModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  qrModalCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, alignItems: 'center', width: '100%', maxWidth: 380 },
  qrModalTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 14 },
  qrModalImage: { width: 300, height: 300 },
  qrModalCloseBtn: { marginTop: 16, backgroundColor: '#071b13', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },
  qrModalCloseText: { color: '#18a663', fontWeight: 'bold', fontSize: 14 },
  stepsBox: { backgroundColor: '#082d1e', borderRadius: 12, padding: 15, marginTop: 10, borderWidth: 1, borderColor: '#18a663' },
  stepsTitle: { color: '#18a663', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  step: { color: '#aaa', fontSize: 14, marginBottom: 6 },
  txnBox: { margin: 15 },
  txnLabel: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  receiptHelpText: { color: '#9fb7ad', fontSize: 13, lineHeight: 18, marginBottom: 10 },
  receiptButton: { backgroundColor: '#1a3a5c', borderColor: '#4a9eff', borderWidth: 1, borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 12 },
  receiptButtonText: { color: '#4a9eff', fontSize: 15, fontWeight: 'bold' },
  receiptPreview: { width: '100%', height: 180, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#174a35' },
  receiptSelectedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  receiptSelectedText: { color: '#18a663', fontWeight: 'bold', fontSize: 13 },
  receiptErrorText: { color: '#ffb4b4', fontSize: 12, lineHeight: 17, marginBottom: 12 },
  warningBox: { backgroundColor: '#2a2105', borderColor: '#FFD700', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12, flexDirection: 'row', gap: 8, alignItems: 'center' },
  warningText: { color: '#ffe88a', fontSize: 13, lineHeight: 18, flex: 1 },
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
