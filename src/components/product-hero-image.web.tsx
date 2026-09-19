type ProductHeroImageProps = {
  sourceUri: string;
  alt: string;
};

// expo-image's web output is optimized for the app runtime, but it is not consistently exposed
// as a crawlable <img> in the statically exported product HTML. Product pages use this web-only
// implementation so search engines and link-preview crawlers can discover the real prize image.
export function ProductHeroImage({ sourceUri, alt }: ProductHeroImageProps) {
  return (
    <img
      src={sourceUri}
      alt={alt}
      width={1200}
      height={1200}
      loading="eager"
      decoding="async"
      style={{ width: '100%', height: 260, objectFit: 'contain', display: 'block' }}
    />
  );
}
