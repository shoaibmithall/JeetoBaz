import { Alert, Platform } from 'react-native';

/**
 * react-native-web's Alert.alert() is a no-op (it does nothing at all), so any
 * Alert.alert() call is silently swallowed in the web build. This wraps it with a
 * window.alert() fallback on web so validation/error messages are actually visible.
 */
export function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
