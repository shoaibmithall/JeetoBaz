import { Image, type ImageSource } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Path, Rect, Text as SvgText } from 'react-native-svg';

type PaymentBrandLogoProps = {
  brand: string;
  size?: number;
};

type PaymentLogoAsset = {
  accessibilityLabel: string;
  source: ImageSource;
};

const PAYMENT_LOGO_ASSETS = {
  JazzCash: {
    accessibilityLabel: 'JazzCash logo',
    source: require('../../assets/images/payment-methods/jazzcash.png'),
  },
  Easypaisa: {
    accessibilityLabel: 'Easypaisa logo',
    source: require('../../assets/images/payment-methods/easypaisa.jpg'),
  },
  NayaPay: {
    accessibilityLabel: 'NayaPay logo',
    source: require('../../assets/images/payment-methods/nayapay.jpg'),
  },
  UPaisa: {
    accessibilityLabel: 'UPaisa logo',
    source: require('../../assets/images/payment-methods/upaisa.png'),
  },
  SadaPay: {
    accessibilityLabel: 'SadaPay logo',
    source: require('../../assets/images/payment-methods/sadapay.jpg'),
  },
  AlliedBank: {
    accessibilityLabel: 'Allied Bank logo',
    source: require('../../assets/images/payment-methods/allied-bank.png'),
  },
} satisfies Record<string, PaymentLogoAsset>;

function getPaymentLogoAsset(brand: string): PaymentLogoAsset | null {
  if (brand === 'JazzCash') return PAYMENT_LOGO_ASSETS.JazzCash;
  if (brand === 'Easypaisa') return PAYMENT_LOGO_ASSETS.Easypaisa;
  if (brand === 'NayaPay') return PAYMENT_LOGO_ASSETS.NayaPay;
  if (brand === 'UPaisa') return PAYMENT_LOGO_ASSETS.UPaisa;
  if (brand === 'SadaPay') return PAYMENT_LOGO_ASSETS.SadaPay;
  if (brand.includes('ABL')) return PAYMENT_LOGO_ASSETS.AlliedBank;
  return null;
}

export function PaymentBrandLogo({ brand, size = 42 }: PaymentBrandLogoProps) {
  const logoAsset = getPaymentLogoAsset(brand);

  if (logoAsset) {
    return (
      <View
        style={[
          styles.logoBadge,
          {
            borderRadius: Math.max(8, Math.round(size * 0.22)),
            height: size,
            width: size,
          },
        ]}>
        <Image
          accessibilityLabel={logoAsset.accessibilityLabel}
          contentFit="contain"
          source={logoAsset.source}
          style={styles.logoImage}
        />
      </View>
    );
  }

  return (
    <Svg
      accessibilityLabel="Zindigi by JS Bank logo"
      height={size}
      viewBox="0 0 48 48"
      width={size}>
      <Rect width="48" height="48" rx="12" fill="#161B2F" />
      <G
        fill="none"
        stroke="#41E6C1"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round">
        <Path d="M12 15h24L12 33h24" />
        <Path d="m29 12 7 3-4 7" />
      </G>
      <SvgText
        x="24"
        y="43"
        fill="#FFF"
        fontSize="6"
        fontWeight="700"
        textAnchor="middle">
        ZINDIGI
      </SvgText>
    </Svg>
  );
}

const styles = StyleSheet.create({
  logoBadge: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    height: '100%',
    width: '100%',
  },
});
