import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.108.2';

const JAZZCASH_SANDBOX_URL =
  'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/';
const WEBSITE_RESPONSE_URL = 'https://jeetobaz.pk/payment-response';

function getRequiredSecret(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function getSupabaseSecretKey() {
  const direct =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
    Deno.env.get('SUPABASE_SECRET_KEY');
  if (direct) return direct;

  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (secretKeys) {
    const parsed = JSON.parse(secretKeys) as Record<string, string>;
    const entries = Object.entries(parsed);
    const value =
      entries.find(([name]) => /service.?role|secret/i.test(name))?.[1] ||
      entries.find(([, candidate]) => candidate.startsWith('sb_secret_'))?.[1] ||
      entries[0]?.[1];
    if (value) return value;
  }

  throw new Error('Supabase server secret is unavailable');
}

function pakistanTimestamp(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}`;
}

async function createSecureHash(fields: Record<string, string>, integritySalt: string) {
  const values = Object.keys(fields)
    .filter((key) => key !== 'pp_SecureHash' && fields[key] !== '')
    .sort()
    .map((key) => fields[key]);
  const hashInput = `${integritySalt}&${values.join('&')}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(integritySalt),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(hashInput),
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

function redirectToWebsite(params: Record<string, string>) {
  const url = new URL(WEBSITE_RESPONSE_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return Response.redirect(url.toString(), 303);
}

function checkoutResponse(fields: Record<string, string>) {
  return new Response(
    JSON.stringify({ action: JAZZCASH_SANDBOX_URL, fields }),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'access-control-allow-origin': 'https://jeetobaz.pk',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer',
      },
    },
  );
}

function checkoutError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': 'https://jeetobaz.pk',
      'cache-control': 'no-store',
    },
  });
}

Deno.serve(async (request) => {
  try {
    const merchantId = getRequiredSecret('JAZZCASH_MERCHANT_ID');
    const password = getRequiredSecret('JAZZCASH_PASSWORD');
    const integritySalt = getRequiredSecret('JAZZCASH_INTEGRITY_SALT');
    const supabaseUrl = getRequiredSecret('SUPABASE_URL');
    const callbackUrl = `${supabaseUrl}/functions/v1/jazzcash-payment`;
    const supabase = createClient(supabaseUrl, getSupabaseSecretKey(), {
      auth: { persistSession: false },
    });

    if (request.method === 'POST') {
      const formData = await request.formData();
      const responseFields: Record<string, string> = {};
      formData.forEach((value, key) => {
        if (typeof value === 'string') responseFields[key] = value;
      });

      const receivedHash = responseFields.pp_SecureHash?.toUpperCase() || '';
      const expectedHash = await createSecureHash(responseFields, integritySalt);
      const txnReference = responseFields.pp_TxnRefNo || '';
      const responseCode = responseFields.pp_ResponseCode || '999';
      const responseMessage = responseFields.pp_ResponseMessage || 'Payment response received';
      const amount = Number(responseFields.pp_Amount || 0);
      const verifiedHash = Boolean(receivedHash) && safeEqual(receivedHash, expectedHash);

      const { data: transaction } = await supabase
        .from('transactions')
        .select('id, amount, status')
        .eq('jazzcash_txn_id', txnReference)
        .maybeSingle();

      const verifiedAmount =
        transaction && Number.isFinite(amount) && Math.round(transaction.amount * 100) === amount;
      const successful = verifiedHash && verifiedAmount && responseCode === '000';

      if (transaction && transaction.status === 'initiated') {
        await supabase
          .from('transactions')
          .update({ status: successful ? 'pending' : 'failed' })
          .eq('id', transaction.id)
          .eq('status', 'initiated');
      }

      return redirectToWebsite({
        verified: successful ? '1' : '0',
        pp_ResponseCode: responseCode,
        pp_ResponseMessage: successful
          ? responseMessage
          : verifiedHash
            ? responseMessage
            : 'Payment response verification failed',
        pp_TxnRef: txnReference,
      });
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    const requestUrl = new URL(request.url);
    const productId = requestUrl.searchParams.get('productId')?.trim() || '';
    const phone = requestUrl.searchParams.get('phone')?.trim() || '';
    const userName = requestUrl.searchParams.get('name')?.trim().slice(0, 60) || '';

    if (!/^[0-9a-f-]{36}$/i.test(productId) || !/^\+923\d{9}$/.test(phone)) {
      return checkoutError('Invalid checkout request');
    }

    const [{ data: user }, { data: product }, { data: existingEntry }] = await Promise.all([
      supabase.from('users').select('id').eq('phone', phone).maybeSingle(),
      supabase
        .from('products')
        .select('id, name, entry_fee, status, current_entries, max_entries')
        .eq('id', productId)
        .maybeSingle(),
      supabase
        .from('entries')
        .select('id')
        .eq('product_id', productId)
        .eq('phone', phone)
        .maybeSingle(),
    ]);

    if (!user || !product || product.status !== 'active' || existingEntry) {
      return checkoutError(
        existingEntry
          ? 'You already have an entry in this draw'
          : 'This checkout is not available',
      );
    }

    if ((product.current_entries || 0) >= product.max_entries) {
      return checkoutError('This draw is full');
    }

    const { data: pendingTransaction } = await supabase
      .from('transactions')
      .select('id, status, jazzcash_txn_id, created_at')
      .eq('product_id', productId)
      .eq('phone', phone)
      .in('status', ['initiated', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingTransaction?.status === 'pending') {
      return checkoutError('Your payment is already waiting for approval');
    }

    const now = new Date();
    const txnDateTime = pakistanTimestamp(now);
    const expiryDateTime = pakistanTimestamp(new Date(now.getTime() + 60 * 60 * 1000));
    const reusableTransaction =
      pendingTransaction?.status === 'initiated' &&
      now.getTime() - new Date(pendingTransaction.created_at).getTime() < 15 * 60 * 1000
        ? pendingTransaction
        : null;
    const txnReference =
      reusableTransaction?.jazzcash_txn_id ||
      `T${txnDateTime}${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
    const amountRupees = Number(product.entry_fee || 1);
    const amountPaisa = String(Math.round(amountRupees * 100));

    if (!reusableTransaction) {
      if (pendingTransaction?.status === 'initiated') {
        await supabase
          .from('transactions')
          .update({ status: 'failed' })
          .eq('id', pendingTransaction.id)
          .eq('status', 'initiated');
      }

      const { error: insertError } = await supabase.from('transactions').insert({
        product_id: productId,
        phone,
        user_name: userName || null,
        amount: amountRupees,
        jazzcash_txn_id: txnReference,
        payment_method: 'JazzCash Online',
        sender_name: userName || null,
        sender_phone: phone,
        receipt_path: null,
        status: 'initiated',
      });

      if (insertError) throw insertError;
    }

    const fields: Record<string, string> = {
      pp_Amount: amountPaisa,
      pp_BankID: 'TBANK',
      pp_BillReference: txnReference,
      pp_Description: `JeetoBaz entry for ${product.name}`.slice(0, 100),
      pp_Language: 'EN',
      pp_MerchantID: merchantId,
      pp_Password: password,
      pp_ProductID: 'RETL',
      pp_ReturnURL: callbackUrl,
      pp_SubMerchantID: '',
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: txnDateTime,
      pp_TxnExpiryDateTime: expiryDateTime,
      pp_TxnRefNo: txnReference,
      pp_TxnType: 'MWALLET',
      pp_Version: '1.1',
      ppmpf_1: productId,
      ppmpf_2: phone,
      ppmpf_3: '',
      ppmpf_4: '',
      ppmpf_5: '',
    };
    fields.pp_SecureHash = await createSecureHash(fields, integritySalt);

    return checkoutResponse(fields);
  } catch (error) {
    console.error('JazzCash payment error', error);
    if (request.method === 'GET') {
      return checkoutError('JazzCash checkout is temporarily unavailable', 500);
    }
    return redirectToWebsite({
      verified: '0',
      pp_ResponseMessage: 'JazzCash checkout is temporarily unavailable',
    });
  }
});
