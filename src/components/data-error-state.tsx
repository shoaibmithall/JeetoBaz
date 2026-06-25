import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type DataErrorStateProps = {
  message?: string;
  onRetry: () => void;
};

export function DataErrorState({ message = 'Something went wrong. Please try again.', onRetry }: DataErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Unable to load data</Text>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 360, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#0a0a0a' },
  icon: { fontSize: 48, marginBottom: 14 },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  message: { color: '#aaa', fontSize: 14, lineHeight: 20, marginBottom: 22, textAlign: 'center' },
  button: { backgroundColor: '#1DB954', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 13 },
  buttonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});
