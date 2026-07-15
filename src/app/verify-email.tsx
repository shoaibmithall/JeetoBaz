import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { signOut } from '@/lib/auth';
import { useAppTheme } from '@/hooks/use-theme';
import { Check, ChevronLeft, Mail, Send } from 'lucide-react-native';

export default function VerifyEmailScreen() {
  const { theme } = useAppTheme();
  const { user } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.replace('/login');
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.backBtn}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Email</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Mail color="#FFD700" size={60} />
        </View>

        <Text style={styles.title}>Check Your Email</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          We sent a verification link to:
        </Text>
        <Text style={styles.email}>{user?.email || 'your email'}</Text>

        <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.infoRow}>
            <Check color="#18a663" size={18} />
            <Text style={[styles.infoText, { color: theme.muted }]}>
              Click the link in the email to verify your account
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Check color="#18a663" size={18} />
            <Text style={[styles.infoText, { color: theme.muted }]}>
              The link expires in 24 hours
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Check color="#18a663" size={18} />
            <Text style={[styles.infoText, { color: theme.muted }]}>
              Check your spam folder if you don't see it
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            alert('A new verification email has been sent.');
          }}
        >
          <Send color="#000" size={18} />
          <Text style={styles.buttonText}>Resend Email</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.backLink}>← Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  header: { backgroundColor: '#04140e', borderBottomColor: '#FFD700', borderBottomWidth: 2, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  content: { flex: 1, padding: 30, alignItems: 'center', marginTop: 40 },
  iconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#071b13', borderWidth: 2, borderColor: '#FFD700', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#aaa', marginBottom: 8 },
  email: { fontSize: 16, fontWeight: '700', color: '#FFD700', marginBottom: 30 },
  infoBox: { backgroundColor: '#071b13', borderRadius: 12, borderWidth: 1, borderColor: '#174a35', padding: 18, width: '100%', marginBottom: 30, gap: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
  button: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20, flexDirection: 'row', gap: 8, width: '100%' },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  backLink: { color: '#18a663', fontSize: 14, fontWeight: '600' },
});
