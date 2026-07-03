import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/use-theme';

type PaymentResponseParams = {
  verified?: string | string[];
  pp_ResponseCode?: string | string[];
  pp_ResponseMessage?: string | string[];
  pp_TxnRef?: string | string[];
  status?: string | string[];
  transactionStatus?: string | string[];
  transaction_id?: string | string[];
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function PaymentResponseScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const params = useLocalSearchParams<PaymentResponseParams>();

  const response = useMemo(() => {
    const responseCode = firstValue(params.pp_ResponseCode);
    const verified = firstValue(params.verified) === '1';
    const rawStatus =
      firstValue(params.transactionStatus) ||
      firstValue(params.status) ||
      responseCode;
    const normalizedStatus = rawStatus?.trim().toLowerCase();
    const successful =
      verified && (
      responseCode === '000' ||
      normalizedStatus === 'success' ||
      normalizedStatus === 'successful' ||
      normalizedStatus === 'completed');

    return {
      successful,
      message:
        firstValue(params.pp_ResponseMessage) ||
        (successful
          ? 'Your payment was received successfully.'
          : 'Your payment response has been received.'),
      transactionReference:
        firstValue(params.pp_TxnRef) ||
        firstValue(params.transaction_id),
      statusLabel: successful
        ? 'Successful'
        : rawStatus || 'Received',
    };
  }, [params]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View
          style={[
            styles.statusMark,
            { borderColor: response.successful ? theme.primary : theme.gold },
          ]}
        >
          <View
            style={[
              styles.statusMarkInner,
              { backgroundColor: response.successful ? theme.primary : theme.gold },
            ]}
          />
        </View>

        <Text selectable style={[styles.title, { color: theme.gold }]}>
          Payment Response Received
        </Text>
        <Text selectable style={[styles.description, { color: theme.muted }]}>
          {response.message} Please return to the JeetoBaz app.
        </Text>

        <View style={[styles.details, { borderColor: theme.border }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtle }]}>Status</Text>
            <Text
              selectable
              style={[
                styles.detailValue,
                { color: response.successful ? theme.primary : theme.text },
              ]}
            >
              {response.statusLabel}
            </Text>
          </View>

          {response.transactionReference ? (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.subtle }]}>
                Transaction reference
              </Text>
              <Text
                selectable
                style={[styles.detailValue, styles.reference, { color: theme.text }]}
              >
                {response.transactionReference}
              </Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.button, { backgroundColor: theme.gold }]}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.buttonText}>Return to JeetoBaz</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    padding: 28,
    gap: 18,
  },
  statusMark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusMarkInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    maxWidth: 430,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  details: {
    width: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 14,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  detailLabel: {
    flexShrink: 0,
    fontSize: 14,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  reference: {
    fontFamily: 'monospace',
  },
  button: {
    minHeight: 50,
    width: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#07130c',
    fontSize: 16,
    fontWeight: '800',
  },
});
