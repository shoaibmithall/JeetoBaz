import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function WinnerScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.congrats}>MUBARAK HO!</Text>
        <Text style={styles.subtitle}>Draw Ka Nateeja Aa Gaya!</Text>
      </View>

      <View style={styles.winnerCard}>
        <Text style={styles.winnerLabel}>🎯 Lucky Winner</Text>
        <Text style={styles.winnerName}>Shoaib Mithal</Text>
        <Text style={styles.winnerPhone}>+92 300 ****567</Text>
        <View style={styles.divider} />
        <Text style={styles.productLabel}>Jeeti Hui Cheez</Text>
        <Text style={styles.productName}>🏍️ Honda 70 Bike</Text>
        <Text style={styles.productPrice}>Qeemat: Rs. 2,20,000</Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>📊 Draw Ki Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Entries</Text>
          <Text style={styles.detailValue}>5,00,000</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Draw Ki Tarikh</Text>
          <Text style={styles.detailValue}>21 June 2026</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Draw Number</Text>
          <Text style={styles.detailValue}>#JB-2026-001</Text>
        </View>
      </View>

      <View style={styles.verifyCard}>
        <Text style={styles.verifyTitle}>✅ Draw 100% Fair Tha</Text>
        <Text style={styles.verifyText}>
          Ye draw computer se random nikala gaya. Koi bhi is result ko verify kar sakta hai.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/')}>
        <Text style={styles.buttonText}>🎯 Nayi Draw Mein Shamil Ho!</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>JeetoBaz — Pakistan Ka No.1 Lucky Draw 🇵🇰</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { backgroundColor: '#1DB954', padding: 40, alignItems: 'center' },
  trophy: { fontSize: 80 },
  congrats: { fontSize: 32, fontWeight: 'bold', color: '#FFD700', marginTop: 10 },
  subtitle: { fontSize: 16, color: 'white', marginTop: 5 },
  winnerCard: { backgroundColor: '#1a1a1a', margin: 15, borderRadius: 15, padding: 25, borderWidth: 2, borderColor: '#FFD700', alignItems: 'center' },
  winnerLabel: { fontSize: 14, color: '#FFD700', marginBottom: 10 },
  winnerName: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  winnerPhone: { fontSize: 16, color: '#aaa', marginTop: 5 },
  divider: { height: 1, backgroundColor: '#333', width: '100%', marginVertical: 15 },
  productLabel: { fontSize: 14, color: '#aaa' },
  productName: { fontSize: 24, fontWeight: 'bold', color: '#1DB954', marginTop: 5 },
  productPrice: { fontSize: 16, color: '#FFD700', marginTop: 5 },
  detailCard: { backgroundColor: '#1a1a1a', margin: 15, borderRadius: 15, padding: 20 },
  detailTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 15 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { color: '#aaa', fontSize: 14 },
  detailValue: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  verifyCard: { backgroundColor: '#0d2b1a', margin: 15, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#1DB954' },
  verifyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1DB954', marginBottom: 8 },
  verifyText: { color: '#aaa', fontSize: 14, lineHeight: 22 },
  button: { backgroundColor: '#FFD700', margin: 15, padding: 18, borderRadius: 12, alignItems: 'center' },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  footer: { textAlign: 'center', color: '#444', fontSize: 12, marginBottom: 30 },
});
