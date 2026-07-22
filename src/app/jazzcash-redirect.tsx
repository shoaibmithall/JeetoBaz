import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { ShieldCheck } from 'lucide-react-native';

const JAZZCASH_CHECKOUT_URL =
  'https://jqjrfnhqqfymwfsdkwmv.supabase.co/functions/v1/jazzcash-payment';

type CheckoutPayload = {
  action?: string;
  fields?: Record<string, string>;
  error?: string;
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function JazzCashRedirectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    productId?: string | string[];
    phone?: string | string[];
    name?: string | string[];
  }>();
  const [error, setError] = useState('');

  useEffect(() => {
    async function openCheckout() {
      try {
        const requestUrl = new URL(JAZZCASH_CHECKOUT_URL);
        requestUrl.searchParams.set('productId', firstValue(params.productId) || '');
        requestUrl.searchParams.set('phone', firstValue(params.phone) || '');
        requestUrl.searchParams.set('name', firstValue(params.name) || '');

        const response = await fetch(requestUrl.toString(), {
          headers: { Accept: 'application/json' },
        });
        const payload = (await response.json()) as CheckoutPayload;
        if (!response.ok || !payload.action || !payload.fields) {
          throw new Error(payload.error || 'Unable to prepare JazzCash checkout.');
        }

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = payload.action;
        Object.entries(payload.fields).forEach(([name, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      } catch (checkoutError) {
        setError(
          checkoutError instanceof Error
            ? checkoutError.message
            : 'Unable to prepare JazzCash checkout.',
        );
      }
    }

    openCheckout();
  }, [params.name, params.phone, params.productId]);

  return (
    <>
    <Head>
      <title>JazzCash Checkout | JeetoBaz</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="Complete your secure JazzCash payment for JeetoBaz prize campaign entry." />
    </Head>
    <View style={styles.screen}>
      <View style={styles.card}>
        <ShieldCheck color="#18a663" size={42} />
        <Text style={styles.title}>{error ? 'Checkout unavailable' : 'Opening JazzCash'}</Text>
        <Text style={styles.message}>
          {error || 'Your secure sandbox checkout is being prepared.'}
        </Text>
        {error ? (
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Return to JeetoBaz</Text>
          </TouchableOpacity>
        ) : (
          <ActivityIndicator color="#FFD700" size="large" />
        )}
      </View>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: '#020d09',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#071b13',
    borderWidth: 1,
    borderColor: '#174a35',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
  },
  title: { color: '#FFD700', fontSize: 24, fontWeight: '800', marginTop: 15 },
  message: { color: '#aab7af', fontSize: 15, lineHeight: 22, textAlign: 'center', marginVertical: 18 },
  button: { width: '100%', backgroundColor: '#FFD700', borderRadius: 12, padding: 15, alignItems: 'center' },
  buttonText: { color: '#07130c', fontSize: 16, fontWeight: '800' },
});
