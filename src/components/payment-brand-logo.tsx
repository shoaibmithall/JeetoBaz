import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

type PaymentBrandLogoProps = {
  brand: string;
  size?: number;
};

export function PaymentBrandLogo({ brand, size = 42 }: PaymentBrandLogoProps) {
  const common = { width: size, height: size, viewBox: '0 0 48 48' } as const;

  if (brand === 'JazzCash') return (
    <Svg {...common} accessibilityLabel="JazzCash logo">
      <Rect width="48" height="48" rx="12" fill="#ED1C24" />
      <Path d="M14 13h20v9c0 9-5 14-10 16-5-2-10-7-10-16v-9Z" fill="#FFF" />
      <Path d="M19 16v8c0 4 2 7 5 9 3-2 5-5 5-9v-8h-10Z" fill="#F6A800" />
    </Svg>
  );

  if (brand === 'Easypaisa') return (
    <Svg {...common} accessibilityLabel="Easypaisa logo">
      <Circle cx="24" cy="24" r="23" fill="#00A651" />
      <Path d="M13 17c6-5 16-5 22 0-2 3-5 5-11 5s-9-2-11-5Zm3 8c5 3 11 3 16 0-1 7-4 11-8 11s-7-4-8-11Z" fill="#FFF" />
    </Svg>
  );

  if (brand.includes('ABL')) return (
    <Svg {...common} accessibilityLabel="Allied Bank logo">
      <Rect width="48" height="48" rx="10" fill="#075AAA" />
      <Path d="M9 20 24 10l15 10H9Zm4 4h4v12h-4V24Zm9 0h4v12h-4V24Zm9 0h4v12h-4V24ZM9 39h30v3H9v-3Z" fill="#FFF" />
    </Svg>
  );

  if (brand === 'NayaPay') return (
    <Svg {...common} accessibilityLabel="NayaPay logo">
      <Rect width="48" height="48" rx="12" fill="#6639B7" />
      <Path d="M12 34V14h6l12 12V14h6v20h-6L18 22v12h-6Z" fill="#FFF" />
    </Svg>
  );

  if (brand === 'UPaisa') return (
    <Svg {...common} accessibilityLabel="UPaisa logo">
      <Rect width="48" height="48" rx="12" fill="#FFF" />
      <Path d="M10 12h8v15c0 4 2 6 6 6s6-2 6-6V12h8v15c0 9-5 14-14 14S10 36 10 27V12Z" fill="#F58220" />
      <Circle cx="35" cy="10" r="4" fill="#1A4F91" />
    </Svg>
  );

  if (brand === 'SadaPay') return (
    <Svg {...common} accessibilityLabel="SadaPay logo">
      <Rect width="48" height="48" rx="12" fill="#FFF" />
      <Path d="M12 15c5-5 13-5 18 0l6 6-7 7-6-6c-2-2-5-2-7 0l-4-7Z" fill="#EF6F61" />
      <Path d="M36 33c-5 5-13 5-18 0l-6-6 7-7 6 6c2 2 5 2 7 0l4 7Z" fill="#25B7A8" />
    </Svg>
  );

  return (
    <Svg {...common} accessibilityLabel="Zindigi by JS Bank logo">
      <Rect width="48" height="48" rx="12" fill="#161B2F" />
      <G fill="none" stroke="#41E6C1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 15h24L12 33h24" />
        <Path d="m29 12 7 3-4 7" />
      </G>
      <SvgText x="24" y="43" fill="#FFF" fontSize="6" fontWeight="700" textAnchor="middle">ZINDIGI</SvgText>
    </Svg>
  );
}
