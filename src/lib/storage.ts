import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getStoredValue(key: string) {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setStoredValue(key: string, value: string) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // silent fail
  }
}

export async function removeStoredValues(keys: string[]) {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch {
    // silent fail
  }
}

export async function getStoredStringArray(key: string) {
  const value = await getStoredValue(key);
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? parsed : [];
  } catch {
    return [];
  }
}
