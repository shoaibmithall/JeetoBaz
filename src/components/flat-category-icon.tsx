import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';
import { CATEGORY_ICON_IMAGES } from '@/lib/category-icon-images';

export function FlatCategoryIcon({ categoryKey, size = 20 }: { categoryKey: string; size?: number }) {
  const source = CATEGORY_ICON_IMAGES[categoryKey] || CATEGORY_ICON_IMAGES.all;
  return (
    <Image
      source={source}
      style={[styles.image, { width: size, height: size, borderRadius: size * 0.28 }]}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  image: {
    overflow: 'hidden',
  },
});
