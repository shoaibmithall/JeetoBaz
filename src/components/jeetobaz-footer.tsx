import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Grid2X2,
  Headphones,
  Heart,
  Link2,
  LockKeyhole,
  Scale,
  ShieldCheck,
  UsersRound,
} from 'lucide-react-native';
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from '@/components/social-icons';
import { useAppTheme } from '@/hooks/use-theme';

type FooterLink = {
  label: string;
  route?: string;
  external?: string;
};

type FooterSection = {
  key: 'quick' | 'help' | 'categories' | 'follow';
  title: string;
  icon: (color: string) => ReactNode;
  items: FooterLink[];
};

type TrustItem = {
  title: string;
  subtitle: string;
  icon: (color: string) => ReactNode;
};

const COLORS = {
  background: '#001b14',
  backgroundDeep: '#001710',
  panel: '#00261c',
  panelSoft: '#073426',
  border: '#305c46',
  borderGold: 'rgba(201, 160, 0, 0.38)',
  gold: '#ffd400',
  brandGold: '#d8a900',
  green: '#79df50',
  text: '#ffffff',
  muted: '#d0d9d4',
  subtle: '#a8b8b0',
};

type FooterColors = typeof COLORS;

const FooterThemeContext = createContext<FooterColors>(COLORS);

function useFooterColors() {
  return useContext(FooterThemeContext);
}

const QUICK_LINKS: FooterLink[] = [
  { label: 'All Draws', route: '/' },
  { label: 'How It Works', route: '/help' },
  { label: 'Past Winners', route: '/explore' },
  { label: 'FAQs', route: '/faq' },
  { label: 'Contact Us', route: '/help' },
];

const HELP_LINKS: FooterLink[] = [
  { label: 'Terms & Conditions', route: '/terms' },
  { label: 'Privacy Policy', route: '/privacy' },
  { label: 'Refund & Cancellation' },
  { label: 'Shipping Policy' },
  { label: 'Support Center', route: '/help' },
];

const CATEGORY_ITEMS: FooterLink[] = [
  { label: 'Mobiles' },
  { label: 'Laptops' },
  { label: 'Smart Watches' },
  { label: 'TVs & Electronics' },
  { label: 'Vehicles' },
  { label: 'Travel Packages' },
  { label: 'And More' },
];

const SOCIAL_LINKS: { icon: ReactNode; url: string; label: string }[] = [
  { icon: <FacebookIcon size={38} />, url: 'https://facebook.com/', label: 'Facebook' },
  { icon: <InstagramIcon size={38} />, url: 'https://instagram.com/', label: 'Instagram' },
  { icon: <TikTokIcon size={38} />, url: 'https://tiktok.com/', label: 'TikTok' },
  { icon: <YouTubeIcon size={38} />, url: 'https://youtube.com/', label: 'YouTube' },
  { icon: <WhatsAppIcon size={38} />, url: 'https://wa.me/', label: 'WhatsApp' },
];

const TRUST_ITEMS: TrustItem[] = [
  {
    icon: (color) => <LockKeyhole color={color} size={25} strokeWidth={1.8} />,
    title: 'Secure Payments',
    subtitle: '100% Secure & Safe',
  },
  {
    icon: (color) => <ShieldCheck color={color} size={25} strokeWidth={1.8} />,
    title: 'Data Protection',
    subtitle: 'Your data is protected',
  },
  {
    icon: (color) => <Headphones color={color} size={25} strokeWidth={1.8} />,
    title: '24/7 Support',
    subtitle: "We're here to help",
  },
  {
    icon: () => <Text style={{ fontSize: 24, lineHeight: 28 }}>🇵🇰</Text>,
    title: 'Made in Pakistan',
    subtitle: 'Proudly built in Pakistan',
  },
  {
    icon: (color) => <Scale color={color} size={25} strokeWidth={1.8} />,
    title: 'Fair & Transparent',
    subtitle: 'Trust is our priority',
  },
  {
    icon: (color) => <LockKeyhole color={color} size={25} strokeWidth={1.8} />,
    title: 'SSL Encrypted',
    subtitle: 'Secure connections',
  },
];

const MOBILE_SECTIONS: FooterSection[] = [
  {
    key: 'quick',
    title: 'Quick Links',
    icon: (color) => <Link2 color={color} size={18} />,
    items: QUICK_LINKS,
  },
  {
    key: 'help',
    title: 'Help & Support',
    icon: (color) => <Headphones color={color} size={18} />,
    items: HELP_LINKS,
  },
  {
    key: 'categories',
    title: 'Categories',
    icon: (color) => <Grid2X2 color={color} size={18} />,
    items: CATEGORY_ITEMS,
  },
  {
    key: 'follow',
    title: 'Follow Us',
    icon: (color) => <UsersRound color={color} size={18} />,
    items: [],
  },
];

function FooterLinkItem({
  link,
  onPress,
  showChevron = true,
}: {
  link: FooterLink;
  onPress: (link: FooterLink) => void;
  showChevron?: boolean;
}) {
  const isClickable = Boolean(link.route || link.external);
  const colors = useFooterColors();

  return (
    <TouchableOpacity
      accessibilityRole={isClickable ? 'link' : undefined}
      activeOpacity={isClickable ? 0.65 : 1}
      disabled={!isClickable}
      onPress={() => onPress(link)}
      style={styles.linkItem}
    >
      <Text
        style={[
          styles.linkText,
          { color: colors.text },
          !isClickable && styles.disabledLink,
          !isClickable && { color: colors.muted },
        ]}
      >
        {link.label}
      </Text>
      {showChevron && isClickable ? (
        <ChevronRight color={colors.green} size={15} strokeWidth={2.2} />
      ) : null}
    </TouchableOpacity>
  );
}

function LinkColumn({
  title,
  links,
  onLinkPress,
  bordered,
}: {
  title: string;
  links: FooterLink[];
  onLinkPress: (link: FooterLink) => void;
  bordered?: boolean;
}) {
  const colors = useFooterColors();

  return (
    <View
      style={[
        styles.linkColumn,
        bordered && styles.columnDivider,
        bordered && { borderLeftColor: colors.borderGold },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: colors.gold }]}>{title}</Text>
      <View style={styles.linkList}>
        {links.map((link) => (
          <FooterLinkItem key={link.label} link={link} onPress={onLinkPress} />
        ))}
      </View>
    </View>
  );
}

function BrandBlock({ compact = false }: { compact?: boolean }) {
  const colors = useFooterColors();

  return (
    <View style={[styles.brandBlock, compact && styles.brandBlockCompact]}>
      {compact ? (
        <View style={styles.mobileBrandLockup}>
          <Image
            accessibilityLabel="JeetoBaz logo"
            contentFit="contain"
            source={require('@/assets/images/icon.png')}
            style={styles.mobileBrandLogo}
          />
          <Text style={styles.mobileBrandName}>
            <Text style={{ color: colors.gold }}>Jeeto</Text>
            <Text style={{ color: colors.text }}>Baz</Text>
          </Text>
        </View>
      ) : (
        <Text style={[styles.sectionTitle, { color: colors.gold }]}>JeetoBaz</Text>
      )}

      <Text
        style={[
          styles.brandDescription,
          { color: colors.text },
          compact && styles.brandDescriptionCompact,
        ]}
      >
        Pakistan&apos;s most trusted{'\n'}transparent prize platform.
      </Text>
      <Text style={[styles.brandPromise, compact && styles.brandPromiseCompact]}>
        <Text style={{ color: colors.gold }}>Enter</Text>
        <Text style={{ color: colors.text }}> fair, win big!</Text>
      </Text>

      {!compact ? (
        <View style={styles.brandLockup}>
          <Image
            accessibilityLabel="JeetoBaz logo"
            contentFit="contain"
            source={require('@/assets/images/icon.png')}
            style={styles.brandLogo}
          />
          <Text style={styles.brandName}>
            <Text style={{ color: colors.gold }}>Jeeto</Text>
            <Text style={{ color: colors.text }}>Baz</Text>
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function SocialLinks({ showLabels }: { showLabels: boolean }) {
  const colors = useFooterColors();

  return (
    <View style={styles.socialRow}>
      {SOCIAL_LINKS.map((social) => (
        <TouchableOpacity
          accessibilityLabel={`Follow JeetoBaz on ${social.label}`}
          accessibilityRole="link"
          activeOpacity={0.7}
          key={social.label}
          onPress={() => Linking.openURL(social.url)}
          style={styles.socialItem}
        >
          {social.icon}
          {showLabels ? (
            <Text style={[styles.socialLabel, { color: colors.text }]}>{social.label}</Text>
          ) : null}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const PAYMENT_LOGO_SOURCES = {
  JazzCash: require('@/assets/images/payments/jazzcash.jpeg'),
  easypaisa: require('@/assets/images/payments/easypaisa.webp'),
  SadaPay: require('@/assets/images/payments/sadapay.jpg'),
  UPaisa: require('@/assets/images/payments/upaisa.jpg'),
  NayaPay: require('@/assets/images/payments/nayapay.jpg'),
  'JS Bank': require('@/assets/images/payments/jsbank.jpg'),
  'Allied Bank': require('@/assets/images/payments/alliedbank.jpg'),
} as const;

type PaymentBrand = keyof typeof PAYMENT_LOGO_SOURCES;

function PaymentLogo({ brand }: { brand: PaymentBrand }) {
  return (
    <View style={styles.paymentLogo}>
      <Image
        source={PAYMENT_LOGO_SOURCES[brand]}
        style={styles.paymentLogoImage}
        contentFit="contain"
        accessibilityLabel={`${brand} logo`}
      />
    </View>
  );
}

function PaymentMethods() {
  return (
    <View style={styles.paymentRow}>
      {(Object.keys(PAYMENT_LOGO_SOURCES) as PaymentBrand[]).map((brand) => (
        <PaymentLogo key={brand} brand={brand} />
      ))}
    </View>
  );
}

function FollowAndPayments({ desktop }: { desktop: boolean }) {
  const colors = useFooterColors();

  return (
    <View
      style={[
        styles.followPayments,
        desktop && styles.columnDivider,
        desktop && { borderLeftColor: colors.borderGold },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: colors.gold }]}>Follow Us</Text>
      <SocialLinks showLabels={desktop} />
      <Text style={[styles.sectionTitle, styles.acceptTitle, { color: colors.gold }]}>We Accept</Text>
      <PaymentMethods />
    </View>
  );
}

function DesktopFooter({ onLinkPress }: { onLinkPress: (link: FooterLink) => void }) {
  return (
    <View style={styles.desktopTop}>
      <View style={styles.desktopBrandColumn}>
        <BrandBlock />
      </View>
      <LinkColumn bordered title="Quick Links" links={QUICK_LINKS} onLinkPress={onLinkPress} />
      <LinkColumn bordered title="Help & Support" links={HELP_LINKS} onLinkPress={onLinkPress} />
      <LinkColumn bordered title="Categories" links={CATEGORY_ITEMS} onLinkPress={onLinkPress} />
      <FollowAndPayments desktop />
    </View>
  );
}

function TabletFooter({ onLinkPress }: { onLinkPress: (link: FooterLink) => void }) {
  const colors = useFooterColors();

  return (
    <>
      <View style={styles.tabletTop}>
        <View style={styles.tabletBrandColumn}>
          <BrandBlock />
        </View>
        <LinkColumn bordered title="Quick Links" links={QUICK_LINKS} onLinkPress={onLinkPress} />
        <LinkColumn bordered title="Help & Support" links={HELP_LINKS} onLinkPress={onLinkPress} />
        <LinkColumn bordered title="Categories" links={CATEGORY_ITEMS} onLinkPress={onLinkPress} />
      </View>
      <View style={[styles.tabletFollowRow, { borderTopColor: colors.borderGold }]}>
        <View style={styles.tabletFollowBlock}>
          <Text style={[styles.sectionTitle, { color: colors.gold }]}>Follow Us</Text>
          <SocialLinks showLabels />
        </View>
        <View style={[styles.tabletPaymentBlock, { borderLeftColor: colors.borderGold }]}>
          <Text style={[styles.sectionTitle, { color: colors.gold }]}>We Accept</Text>
          <PaymentMethods />
        </View>
      </View>
    </>
  );
}

function MobileAccordion({
  section,
  isOpen,
  onLinkPress,
  onToggle,
}: {
  section: FooterSection;
  isOpen: boolean;
  onLinkPress: (link: FooterLink) => void;
  onToggle: () => void;
}) {
  const colors = useFooterColors();

  return (
    <View style={[styles.mobileAccordion, { borderBottomColor: colors.borderGold }]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        activeOpacity={0.7}
        onPress={onToggle}
        style={styles.mobileAccordionHeader}
      >
        <View style={styles.mobileAccordionTitleRow}>
          {section.icon(colors.gold)}
          <Text style={[styles.mobileAccordionTitle, { color: colors.text }]}>
            {section.title}
          </Text>
        </View>
        {isOpen ? (
          <ChevronUp color={colors.gold} size={18} />
        ) : (
          <ChevronDown color={colors.gold} size={18} />
        )}
      </TouchableOpacity>

      {isOpen ? (
        <View style={styles.mobileAccordionContent}>
          {section.key === 'follow' ? (
            <SocialLinks showLabels={false} />
          ) : (
            section.items.map((link) => (
              <FooterLinkItem
                key={link.label}
                link={link}
                onPress={onLinkPress}
                showChevron={false}
              />
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

function MobileFooter({ onLinkPress }: { onLinkPress: (link: FooterLink) => void }) {
  const [openSection, setOpenSection] = useState<FooterSection['key'] | null>(null);
  const colors = useFooterColors();

  return (
    <View style={styles.mobileTop}>
      <BrandBlock compact />
      <View style={[styles.mobileAccordionList, { borderTopColor: colors.borderGold }]}>
        {MOBILE_SECTIONS.map((section) => (
          <MobileAccordion
            isOpen={openSection === section.key}
            key={section.key}
            onLinkPress={onLinkPress}
            onToggle={() => {
              setOpenSection((current) => (current === section.key ? null : section.key));
            }}
            section={section}
          />
        ))}
      </View>
      <View style={styles.mobilePaymentBlock}>
        <Text style={[styles.sectionTitle, { color: colors.gold }]}>We Accept</Text>
        <PaymentMethods />
      </View>
    </View>
  );
}

function TrustStrip({ mobile, tablet }: { mobile: boolean; tablet: boolean }) {
  const colors = useFooterColors();

  return (
    <View
      style={[
        styles.trustStrip,
        { borderTopColor: colors.borderGold },
        mobile && styles.trustStripMobile,
      ]}
    >
      {TRUST_ITEMS.map((item, index) => (
        <View
          key={item.title}
          style={[
            styles.trustItem,
            tablet && styles.trustItemTablet,
            mobile && styles.trustItemMobile,
            !mobile && !tablet && index > 0 && styles.trustDivider,
            !mobile && !tablet && index > 0 && { borderLeftColor: colors.borderGold },
          ]}
        >
          <View
            style={[
              styles.trustIconCircle,
              { borderColor: colors.brandGold },
              mobile && styles.trustIconCircleMobile,
            ]}
          >
            {item.icon(colors.gold)}
          </View>
          <View style={styles.trustCopy}>
            <Text
              style={[
                styles.trustTitle,
                { color: colors.text },
                mobile && styles.trustTitleMobile,
              ]}
            >
              {item.title}
            </Text>
            <Text
              style={[
                styles.trustSubtitle,
                { color: colors.muted },
                mobile && styles.trustSubtitleMobile,
              ]}
            >
              {item.subtitle}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function CopyrightBar({ mobile }: { mobile: boolean }) {
  const year = new Date().getFullYear();
  const colors = useFooterColors();

  return (
    <View
      style={[
        styles.copyrightBar,
        { borderTopColor: colors.borderGold },
        mobile && styles.copyrightBarMobile,
      ]}
    >
      <Text style={[styles.copyrightText, { color: colors.subtle }]}>
        © {year} JeetoBaz. All rights reserved.
      </Text>
      <View style={styles.madeWithRow}>
        <Text style={[styles.copyrightText, { color: colors.subtle }]}>Made with </Text>
        <Heart color="#ff4d67" fill="#ff4d67" size={11} />
        <Text style={[styles.copyrightText, { color: colors.subtle }]}> in Pakistan</Text>
      </View>
    </View>
  );
}

export default function JeetoBazFooter() {
  const { width } = useWindowDimensions();
  // `useWindowDimensions()` has no real viewport during server-side static rendering, so it
  // reports a value that differs from the client's actual width — without this guard, the
  // isMobile/isTablet branch below (and therefore BrandBlock's Image-vs-Text output) could differ
  // between server and client, causing a hydration mismatch. `useLayoutEffect` (not `useEffect`)
  // flips to the real width synchronously before the browser paints, so the fixed-width first
  // render is never actually shown on screen, matching the pattern's intent more precisely than
  // a plain `useEffect` would (which would paint the wrong-width layout for one frame first).
  const [hasHydratedLayout, setHasHydratedLayout] = useState(false);
  useLayoutEffect(() => {
    setHasHydratedLayout(true);
  }, []);
  const responsiveWidth = hasHydratedLayout ? width : 390;
  const router = useRouter();
  const { mode, theme } = useAppTheme();
  const isMobile = responsiveWidth < 768;
  const isTablet = responsiveWidth >= 768 && responsiveWidth < 1200;
  const footerColors = useMemo<FooterColors>(
    () =>
      mode === 'light'
        ? {
            background: theme.surface,
            backgroundDeep: theme.background,
            panel: theme.surfaceAlt,
            panelSoft: theme.primarySoft,
            border: theme.border,
            borderGold: 'rgba(179, 138, 0, 0.34)',
            gold: theme.gold,
            brandGold: theme.gold,
            green: theme.primary,
            text: theme.text,
            muted: theme.muted,
            subtle: theme.subtle,
          }
        : COLORS,
    [mode, theme],
  );

  const onLinkPress = useMemo(
    () => (link: FooterLink) => {
      if (link.external) {
        Linking.openURL(link.external);
      } else if (link.route) {
        router.push(link.route as never);
      }
    },
    [router],
  );

  return (
    <FooterThemeContext.Provider value={footerColors}>
      <View style={[styles.outer, { backgroundColor: footerColors.backgroundDeep }]}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: footerColors.background,
              borderColor: footerColors.border,
            },
            isMobile && styles.containerMobile,
          ]}
        >
          <View style={[styles.mainArea, isMobile && styles.mainAreaMobile]}>
            {isMobile ? (
              <MobileFooter onLinkPress={onLinkPress} />
            ) : isTablet ? (
              <TabletFooter onLinkPress={onLinkPress} />
            ) : (
              <DesktopFooter onLinkPress={onLinkPress} />
            )}
          </View>
          <TrustStrip mobile={isMobile} tablet={isTablet} />
          <CopyrightBar mobile={isMobile} />
        </View>
      </View>
    </FooterThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: COLORS.backgroundDeep,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  container: {
    alignSelf: 'center',
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 1600,
    overflow: 'hidden',
    width: '100%',
  },
  containerMobile: {
    borderRadius: 18,
  },
  mainArea: {
    paddingHorizontal: 48,
    paddingVertical: 36,
  },
  mainAreaMobile: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 0,
  },
  desktopTop: {
    flexDirection: 'row',
  },
  desktopBrandColumn: {
    flex: 1.05,
    minWidth: 190,
    paddingRight: 34,
  },
  linkColumn: {
    flex: 0.9,
    minWidth: 160,
    paddingHorizontal: 34,
  },
  columnDivider: {
    borderLeftColor: COLORS.borderGold,
    borderLeftWidth: 1,
  },
  sectionTitle: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 15,
  },
  linkList: {
    gap: 5,
  },
  linkItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 27,
  },
  linkText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  disabledLink: {
    color: COLORS.muted,
    opacity: 0.7,
  },
  brandBlock: {
    flex: 1,
  },
  brandBlockCompact: {
    alignItems: 'center',
  },
  brandDescription: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 7,
  },
  brandDescriptionCompact: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 5,
    textAlign: 'center',
  },
  brandPromise: {
    fontSize: 14,
    lineHeight: 21,
  },
  brandPromiseCompact: {
    marginBottom: 15,
    textAlign: 'center',
  },
  brandGold: {
    color: COLORS.gold,
  },
  brandWhite: {
    color: COLORS.text,
  },
  brandLockup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 26,
  },
  brandLogo: {
    borderColor: COLORS.brandGold,
    borderRadius: 13,
    borderWidth: 1,
    height: 80,
    width: 68,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  mobileBrandLockup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  mobileBrandLogo: {
    borderColor: COLORS.brandGold,
    borderRadius: 9,
    borderWidth: 1,
    height: 54,
    width: 46,
  },
  mobileBrandName: {
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  followPayments: {
    flex: 1.45,
    minWidth: 270,
    paddingLeft: 34,
  },
  socialRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 20,
  },
  socialItem: {
    alignItems: 'center',
    gap: 7,
  },
  socialLabel: {
    color: COLORS.text,
    fontSize: 12,
  },
  acceptTitle: {
    marginBottom: 13,
    marginTop: 33,
  },
  paymentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paymentLogo: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 5,
    height: 44,
    justifyContent: 'center',
    minWidth: 82,
    overflow: 'hidden',
    paddingHorizontal: 8,
  },
  paymentLogoImage: {
    height: 26,
    width: 66,
  },
  tabletTop: {
    flexDirection: 'row',
  },
  tabletBrandColumn: {
    flex: 1.1,
    minWidth: 180,
    paddingRight: 25,
  },
  tabletFollowRow: {
    borderTopColor: COLORS.borderGold,
    borderTopWidth: 1,
    flexDirection: 'row',
    marginHorizontal: -48,
    marginTop: 32,
    paddingHorizontal: 48,
    paddingTop: 24,
  },
  tabletFollowBlock: {
    flex: 1,
    paddingRight: 26,
  },
  tabletPaymentBlock: {
    borderLeftColor: COLORS.borderGold,
    borderLeftWidth: 1,
    flex: 1.05,
    paddingLeft: 28,
  },
  mobileTop: {
    width: '100%',
  },
  mobileAccordionList: {
    borderTopColor: COLORS.borderGold,
    borderTopWidth: 1,
  },
  mobileAccordion: {
    borderBottomColor: COLORS.borderGold,
    borderBottomWidth: 1,
  },
  mobileAccordionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 51,
    paddingHorizontal: 7,
  },
  mobileAccordionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  mobileAccordionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  mobileAccordionContent: {
    paddingBottom: 12,
    paddingHorizontal: 39,
  },
  mobilePaymentBlock: {
    paddingHorizontal: 7,
    paddingVertical: 18,
  },
  trustStrip: {
    borderTopColor: COLORS.borderGold,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 36,
    paddingVertical: 19,
  },
  trustStripMobile: {
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  trustItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    minWidth: 170,
    paddingHorizontal: 16,
  },
  trustItemTablet: {
    flexBasis: '33.333%',
    minHeight: 78,
  },
  trustItemMobile: {
    flexBasis: '50%',
    gap: 8,
    minHeight: 62,
    minWidth: 0,
    paddingHorizontal: 5,
  },
  trustDivider: {
    borderLeftColor: COLORS.borderGold,
    borderLeftWidth: 1,
  },
  trustIconCircle: {
    alignItems: 'center',
    borderColor: COLORS.brandGold,
    borderRadius: 25,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  trustIconCircleMobile: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  flagIcon: {
    fontSize: 24,
  },
  trustCopy: {
    flex: 1,
  },
  trustTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  trustTitleMobile: {
    fontSize: 11,
    lineHeight: 14,
  },
  trustSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  trustSubtitleMobile: {
    fontSize: 9,
    lineHeight: 12,
  },
  copyrightBar: {
    alignItems: 'center',
    borderTopColor: COLORS.borderGold,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 34,
  },
  copyrightBarMobile: {
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
    minHeight: 62,
  },
  copyrightText: {
    color: COLORS.subtle,
    fontSize: 11,
  },
  madeWithRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
