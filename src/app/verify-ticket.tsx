import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/hooks/use-theme';
import { BadgeCheck, CircleAlert, ShieldCheck, Ticket, Trophy } from 'lucide-react-native';

type TicketResult = {
  product_name: string;
  product_slug: string | null;
  product_status: string;
  entry_created_at: string;
  is_winner: boolean;
  drawn_at: string | null;
};

export default function VerifyTicketScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { ticket: ticketParam } = useLocalSearchParams<{ ticket?: string }>();
  const [ticketNumber, setTicketNumber] = useState('');
  const [result, setResult] = useState<TicketResult | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ticketParam) {
      setTicketNumber(ticketParam);
      lookup(ticketParam);
    }
  }, [ticketParam]);

  async function lookup(value: string) {
    const normalized = value.trim().toUpperCase();
    if (!normalized) return;
    setLoading(true);
    setResult(undefined);
    const { data } = await supabase.rpc('verify_ticket', { p_ticket_number: normalized });
    setResult(data?.[0] || null);
    setLoading(false);
  }

  function getDrawStatusLabel(status: string) {
    if (status === 'active') return 'Draw in progress';
    if (status === 'completed') return 'Draw completed';
    return status;
  }

  return (
    <>
      <Head>
        <title>Verify Ticket | JeetoBaz</title>
        <meta name="robots" content="noindex, follow" />
        <meta name="description" content="Verify a JeetoBaz entry ticket number and check its draw status." />
      </Head>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
          <View style={styles.titleRow}><Ticket color={theme.gold} size={26} /><Text style={[styles.title, { color: theme.text }]}>Verify Your Ticket</Text></View>
          <Text style={[styles.subtitle, { color: theme.muted }]}>Enter your ticket number to confirm it's registered and check its draw status.</Text>
        </View>

        <View style={styles.body}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            placeholder="JB-XXXXXXXX"
            placeholderTextColor={theme.subtle}
            autoCapitalize="characters"
            value={ticketNumber}
            onChangeText={setTicketNumber}
          />
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.gold }]} onPress={() => lookup(ticketNumber)} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Checking...' : 'Verify Ticket'}</Text>
          </TouchableOpacity>

          {result === null && (
            <View style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.resultTitleRow}><CircleAlert color="#ff4444" size={19} /><Text style={[styles.resultTitle, { color: theme.text }]}>Ticket Not Found</Text></View>
              <Text style={[styles.resultText, { color: theme.muted }]}>No entry matches this ticket number. Double-check the number and try again.</Text>
            </View>
          )}

          {result && (
            <View style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: result.is_winner ? theme.gold : theme.border }]}>
              <View style={styles.resultTitleRow}>
                <BadgeCheck color="#18a663" size={19} />
                <Text style={[styles.resultTitle, { color: theme.text }]}>Ticket Verified</Text>
              </View>
              {result.product_slug ? (
                <Link href={`/product/${result.product_slug}`} asChild>
                  <TouchableOpacity accessibilityRole="link">
                    <Text style={[styles.productName, { color: theme.primary }]}>{result.product_name}</Text>
                  </TouchableOpacity>
                </Link>
              ) : (
                <Text style={[styles.productName, { color: theme.text }]}>{result.product_name}</Text>
              )}
              <Text style={[styles.resultText, { color: theme.muted }]}>{getDrawStatusLabel(result.product_status)}</Text>
              <Text style={[styles.resultText, { color: theme.muted }]}>
                Entered: {new Date(result.entry_created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
              {result.is_winner && (
                <View style={styles.winnerBanner}>
                  <Trophy color="#FFD700" size={17} /><Text style={styles.winnerText}>This ticket won its draw!</Text>
                </View>
              )}
            </View>
          )}

          <View style={[styles.verifyCard, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
            <View style={styles.verifyTitleRow}><ShieldCheck color={theme.primary} size={18} /><Text style={[styles.verifyTitle, { color: theme.primary }]}>Why this doesn't show a name</Text></View>
            <Text style={[styles.resultText, { color: theme.muted }]}>
              To protect entrants' privacy, ticket verification only confirms the draw and status — never a name or phone number, even for your own ticket.
            </Text>
          </View>

          <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={() => router.push('/')}>
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 30, alignItems: 'center', borderBottomWidth: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  body: { padding: 15 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12 },
  button: { padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  resultCard: { borderRadius: 15, padding: 20, borderWidth: 1, marginTop: 15 },
  resultTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  resultTitle: { fontSize: 16, fontWeight: 'bold' },
  productName: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  resultText: { fontSize: 14, lineHeight: 20 },
  winnerBanner: { backgroundColor: '#2a2105', borderWidth: 1, borderColor: '#FFD700', borderRadius: 8, padding: 10, marginTop: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  winnerText: { color: '#FFD700', fontWeight: 'bold', fontSize: 15 },
  verifyCard: { borderRadius: 15, padding: 18, borderWidth: 1, marginTop: 15 },
  verifyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  verifyTitle: { fontSize: 14, fontWeight: 'bold' },
  secondaryButton: { padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, marginTop: 15, marginBottom: 30 },
  secondaryButtonText: { fontSize: 15, fontWeight: 'bold' },
});
