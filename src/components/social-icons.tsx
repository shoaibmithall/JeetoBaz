import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';

type IconProps = { size?: number };

const SOCIAL_BRAND_ASSETS = {
  instagram: require('../../assets/images/social-brands/instagram.svg'),
  threads: require('../../assets/images/social-brands/threads.svg'),
  telegram: require('../../assets/images/social-brands/telegram.svg'),
  snapchat: require('../../assets/images/social-brands/snapchat.svg'),
} as const;

type BrandGlyphProps = IconProps & {
  source: ImageSource;
  backgroundColor: string;
  glyphColor: string;
  inset?: number;
};

function BrandGlyph({
  backgroundColor,
  glyphColor,
  inset = 5,
  size = 24,
  source,
}: BrandGlyphProps) {
  return (
    <View
      style={[
        styles.brandBadge,
        {
          backgroundColor,
          borderRadius: size / 2,
          height: size,
          width: size,
        },
      ]}>
      <Image
        contentFit="contain"
        source={source}
        style={{
          height: size - inset * 2,
          tintColor: glyphColor,
          width: size - inset * 2,
        }}
      />
    </View>
  );
}

export function FacebookIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill="#1877F2" />
      <Path
        d="M16.67 15.49l.54-3.53h-3.39v-2.29c0-.97.47-1.91 1.99-1.91h1.54V4.56s-1.4-.24-2.74-.24c-2.8 0-4.63 1.7-4.63 4.78v2.71H7.8v3.53h2.78v8.54a11.07 11.07 0 003.44 0v-8.54h2.65z"
        fill="white"
      />
    </Svg>
  );
}

export function InstagramIcon({ size = 24 }: IconProps) {
  return (
    <LinearGradient
      colors={['#833AB4', '#FD1D1D', '#FCAF45']}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={[styles.brandBadge, { borderRadius: size / 2, height: size, width: size }]}>
      <Image
        contentFit="contain"
        source={SOCIAL_BRAND_ASSETS.instagram}
        style={{ height: size - 9, tintColor: '#FFFFFF', width: size - 9 }}
      />
    </LinearGradient>
  );
}

export function ThreadsIcon({ size = 24 }: IconProps) {
  return (
    <BrandGlyph
      backgroundColor="#FFFFFF"
      glyphColor="#000000"
      inset={4}
      size={size}
      source={SOCIAL_BRAND_ASSETS.threads}
    />
  );
}

export function TikTokIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill="#010101" />
      <Path
        d="M16.6 5.82A4.28 4.28 0 0113.4 4h-2.7v10.32a2.58 2.58 0 01-2.58 2.52 2.58 2.58 0 01-2.58-2.52A2.58 2.58 0 018.12 12.2c.28 0 .55.04.8.11V9.6a5.28 5.28 0 00-.8-.06 5.26 5.26 0 00-5.26 5.26 5.26 5.26 0 005.26 5.26 5.26 5.26 0 005.26-5.26V9.42a7.08 7.08 0 004.14 1.34V8.06a4.28 4.28 0 01-.92-.24z"
        fill="white"
      />
      <Path
        d="M15.44 5.56l-.08.14a4.28 4.28 0 01-2.12 2.12l.08-.14a4.28 4.28 0 002.12-2.12z"
        fill="#25F4EE"
      />
      <Path
        d="M16.6 5.82a4.28 4.28 0 01-2.12 2.12l.08-.14a4.28 4.28 0 002.04-1.98z"
        fill="#FE2C55"
      />
    </Svg>
  );
}

export function YouTubeIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill="#FF0000" />
      <Path
        d="M18.87 8.16a2.34 2.34 0 00-1.65-1.65C15.73 6.17 12 6.17 12 6.17s-3.73 0-5.22.34a2.34 2.34 0 00-1.65 1.65C4.79 9.65 4.79 12 4.79 12s0 2.35.34 3.84a2.34 2.34 0 001.65 1.65c1.49.34 5.22.34 5.22.34s3.73 0 5.22-.34a2.34 2.34 0 001.65-1.65c.34-1.49.34-3.84.34-3.84s0-2.35-.34-3.84zM10.42 14.86v-5.72L15.26 12l-4.84 2.86z"
        fill="white"
      />
    </Svg>
  );
}

export function SnapchatIcon({ size = 24 }: IconProps) {
  return (
    <BrandGlyph
      backgroundColor="#FFFC00"
      glyphColor="#000000"
      inset={4}
      size={size}
      source={SOCIAL_BRAND_ASSETS.snapchat}
    />
  );
}

export function XIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill="#000000" />
      <Path
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        fill="white"
      />
    </Svg>
  );
}

export function TelegramIcon({ size = 24 }: IconProps) {
  return (
    <BrandGlyph
      backgroundColor="#26A5E4"
      glyphColor="#FFFFFF"
      inset={5}
      size={size}
      source={SOCIAL_BRAND_ASSETS.telegram}
    />
  );
}

const styles = StyleSheet.create({
  brandBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export function WhatsAppIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill="#25D366" />
      <Path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
        fill="white"
      />
      <Path
        d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.69 0-3.265-.46-4.61-1.262l-.33-.198-2.87.852.852-2.87-.198-.33A7.963 7.963 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"
        fill="#25D366"
      />
    </Svg>
  );
}
