import type { ImageSourcePropType } from 'react-native';

/**
 * QR codes are bundled image assets (`require()` needs a static string, so this
 * can't be data-driven). Keyed by payment method name so a database-driven
 * account list can still show the right bundled QR until an admin uploads a
 * replacement via `qrImageUrl`.
 */
export const PAYMENT_QR_FALLBACK: Record<string, ImageSourcePropType | null> = {
  JazzCash: require('@/assets/images/payment-qr/jazzcash.jpg'),
  Easypaisa: require('@/assets/images/payment-qr/easypaisa.jpg'),
  NayaPay: require('@/assets/images/payment-qr/nayapay.jpg'),
  UPaisa: require('@/assets/images/payment-qr/upaisa.jpg'),
  SadaPay: null,
  'JS Bank / Zindigi App': require('@/assets/images/payment-qr/zindigi.jpg'),
  'My ABL Allied Bank / Bank Transfer': require('@/assets/images/payment-qr/alliedbank.jpg'),
};
