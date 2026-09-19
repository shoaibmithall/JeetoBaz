import { Image as ExpoImage } from 'expo-image';

type ProductHeroImageProps = {
  sourceUri: string;
  alt: string;
};

export function ProductHeroImage({ sourceUri, alt }: ProductHeroImageProps) {
  return (
    <ExpoImage
      source={{ uri: sourceUri }}
      accessibilityLabel={alt}
      contentFit="contain"
      cachePolicy="disk"
      style={{ width: '100%', height: 260 }}
    />
  );
}
