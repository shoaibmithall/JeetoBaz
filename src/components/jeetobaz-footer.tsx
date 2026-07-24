import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions, Linking } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, ShieldCheck, LockKeyhole, Headphones, Heart, CheckCircle2, Award } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import {
  FacebookIcon, InstagramIcon, YouTubeIcon, TikTokIcon, XIcon, TelegramIcon, WhatsAppIcon,
} from '@/components/social-icons';

type FooterLink = {
  label: string;
  route?: string;
  external?: string;
};

type AccordionSection = {
  key: string;
  title: string;
  items: FooterLink[];
};

const QUICK_LINKS: FooterLink[] = [
  { label: 'All Draws', route: '/' },
  { label: 'How It Works', route: '/help' },
  { label: 'Past Winners', route: '/winner' },
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

const SOCIAL_LINKS: { icon: React.ReactNode; url: string; label: string }[] = [
  { icon: <FacebookIcon size={22} />, url: 'https://facebook.com/', label: 'Facebook' },
  { icon: <InstagramIcon size={22} />, url: 'https://instagram.com/', label: 'Instagram' },
  { icon: <YouTubeIcon size={22} />, url: 'https://youtube.com/', label: 'YouTube' },
  { icon: <TikTokIcon size={22} />, url: 'https://tiktok.com/', label: 'TikTok' },
  { icon: <XIcon size={22} />, url: 'https://x.com/', label: 'X' },
  { icon: <TelegramIcon size={22} />, url: 'https://t.me/', label: 'Telegram' },
  { icon: <WhatsAppIcon size={22} />, url: 'https://wa.me/', label: 'WhatsApp' },
];

const TRUST_ITEMS: { icon: React.ReactNode; label: string }[] = [
  { icon: <ShieldCheck size={14} />, label: 'Secure Payments' },
  { icon: <LockKeyhole size={14} />, label: 'Data Protection' },
  { icon: <Headphones size={14} />, label: '24/7 Support' },
  { icon: <Heart size={14} />, label: 'Made in Pakistan' },
  { icon: <CheckCircle2 size={14} />, label: 'Fair & Transparent' },
  { icon: <Award size={14} />, label: 'SSL Encrypted' },
];

const ACCORDION_SECTIONS: AccordionSection[] = [
  { key: 'quick', title: 'Quick Links', items: QUICK_LINKS },
  { key: 'help', title: 'Help & Support', items: HELP_LINKS },
  { key: 'categories', title: 'Categories', items: CATEGORY_ITEMS },
  { key: 'follow', title: 'Follow Us', items: [] },
];

const PAYMENT_METHODS = ['Visa', 'Mastercard', 'JazzCash', 'EasyPaisa', 'NayaPay', 'SadaPay'];

function FooterLinkItem({ link, onPress }: { link: FooterLink; onPress: (link: FooterLink) => void }) {
  const { theme } = useAppTheme();
  const isClickable = !!link.route || !!link.external;
  return (
    <TouchableOpacity
      onPress={() => onPress(link)}
      disabled={!isClickable}
      activeOpacity={isClickable ? 0.6 : 1}
      style={styles.linkItem}
    >
      <Text
        style={[
          styles.linkItemText,
          { color: isClickable ? theme.muted : theme.subtle },
          !isClickable && styles.linkItemTextDisabled,
        ]}
      >
        {link.label}
      </Text>
    </TouchableOpacity>
  );
}

function AccordionPanel({ section, onLinkPress, isOpen, onToggle }: {
  section: AccordionSection;
  onLinkPress: (link: FooterLink) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.accordionSection, { borderColor: theme.border }]}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={onToggle}
        activeOpacity={0.6}
      >
        <Text style={[styles.accordionTitle, { color: theme.text }]}>{section.title}</Text>
        {isOpen
          ? <ChevronUp color={theme.gold} size={18} />
          : <ChevronDown color={theme.subtle} size={18} />
        }
      </TouchableOpacity>
      {isOpen && section.items.length > 0 && (
        <View style={styles.accordionContent}>
          {section.items.map((link, idx) => (
            <FooterLinkItem key={idx} link={link} onPress={onLinkPress} />
          ))}
        </View>
      )}
      {isOpen && section.key === 'follow' && (
        <View style={styles.socialRowMobile}>
          {SOCIAL_LINKS.map((social, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => Linking.openURL(social.url)}
              activeOpacity={0.6}
              style={styles.socialIconBtn}
            >
              {social.icon}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function DesktopFooter({ onLinkPress }: { onLinkPress: (link: FooterLink) => void }) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.desktopGrid}>
      <View style={styles.footerColumn}>
        <JeetoBazBranding />
        <View style={styles.socialRowDesktop}>
          {SOCIAL_LINKS.map((social, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => Linking.openURL(social.url)}
              activeOpacity={0.6}
              style={styles.socialIconBtn}
            >
              {social.icon}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.footerColumn}>
        <Text style={[styles.columnTitle, { color: theme.gold }]}>Quick Links</Text>
        {QUICK_LINKS.map((link, idx) => (
          <FooterLinkItem key={idx} link={link} onPress={onLinkPress} />
        ))}
      </View>
      <View style={styles.footerColumn}>
        <Text style={[styles.columnTitle, { color: theme.gold }]}>Help & Support</Text>
        {HELP_LINKS.map((link, idx) => (
          <FooterLinkItem key={idx} link={link} onPress={onLinkPress} />
        ))}
      </View>
      <View style={styles.footerColumn}>
        <Text style={[styles.columnTitle, { color: theme.gold }]}>Categories</Text>
        {CATEGORY_ITEMS.map((link, idx) => (
          <FooterLinkItem key={idx} link={link} onPress={onLinkPress} />
        ))}
      </View>
      <View style={styles.footerColumn}>
        <Text style={[styles.columnTitle, { color: theme.gold }]}>Follow Us</Text>
        <View style={styles.socialRowDesktop}>
          {SOCIAL_LINKS.map((social, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => Linking.openURL(social.url)}
              activeOpacity={0.6}
              style={styles.socialIconBtn}
            >
              {social.icon}
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 20 }} />
        <Text style={[styles.columnTitle, { color: theme.gold }]}>We Accept</Text>
        <View style={styles.paymentRow}>
          {PAYMENT_METHODS.map((method, idx) => (
            <View key={idx} style={[styles.paymentBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.paymentBadgeText, { color: theme.muted }]}>{method}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function TabletFooter({ onLinkPress }: { onLinkPress: (link: FooterLink) => void }) {
  const { theme } = useAppTheme();
  return (
    <View>
      <View style={styles.tabletBrandRow}>
        <JeetoBazBranding />
      </View>
      <View style={styles.tabletColumnsRow}>
        <View style={styles.tabletColumn}>
          <Text style={[styles.columnTitle, { color: theme.gold }]}>Quick Links</Text>
          {QUICK_LINKS.map((link, idx) => (
            <FooterLinkItem key={idx} link={link} onPress={onLinkPress} />
          ))}
        </View>
        <View style={styles.tabletColumn}>
          <Text style={[styles.columnTitle, { color: theme.gold }]}>Help & Support</Text>
          {HELP_LINKS.map((link, idx) => (
            <FooterLinkItem key={idx} link={link} onPress={onLinkPress} />
          ))}
        </View>
        <View style={styles.tabletColumn}>
          <Text style={[styles.columnTitle, { color: theme.gold }]}>Categories</Text>
          {CATEGORY_ITEMS.map((link, idx) => (
            <FooterLinkItem key={idx} link={link} onPress={onLinkPress} />
          ))}
        </View>
      </View>
      <View style={styles.tabletSocialRow}>
        <View style={styles.socialRowDesktop}>
          {SOCIAL_LINKS.map((social, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => Linking.openURL(social.url)}
              activeOpacity={0.6}
              style={styles.socialIconBtn}
            >
              {social.icon}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.tabletPaymentRow}>
        <Text style={[styles.paymentLabel, { color: theme.gold }]}>We Accept</Text>
        <View style={styles.paymentRow}>
          {PAYMENT_METHODS.map((method, idx) => (
            <View key={idx} style={[styles.paymentBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.paymentBadgeText, { color: theme.muted }]}>{method}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function MobileFooter({ onLinkPress }: { onLinkPress: (link: FooterLink) => void }) {
  const { theme } = useAppTheme();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  return (
    <View>
      <View style={styles.mobileBrandRow}>
        <JeetoBazBranding />
      </View>
      {ACCORDION_SECTIONS.map((section) => (
        <AccordionPanel
          key={section.key}
          section={section}
          onLinkPress={onLinkPress}
          isOpen={openSection === section.key}
          onToggle={() => toggleSection(section.key)}
        />
      ))}
      <View style={[styles.mobilePaymentSection, { borderColor: theme.border }]}>
        <Text style={[styles.paymentLabel, { color: theme.gold, textAlign: 'center', marginBottom: 10 }]}>We Accept</Text>
        <View style={styles.paymentRow}>
          {PAYMENT_METHODS.map((method, idx) => (
            <View key={idx} style={[styles.paymentBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.paymentBadgeText, { color: theme.muted }]}>{method}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function TrustStrip() {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.trustStrip, { borderColor: theme.border }]}>
      <View style={styles.trustGrid}>
        {TRUST_ITEMS.map((item, idx) => (
          <View key={idx} style={styles.trustItem}>
            <View>{item.icon}</View>
            <Text style={[styles.trustItemLabel, { color: theme.muted }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function JeetoBazBranding() {
  const { theme } = useAppTheme();
  return (
    <View style={styles.brandingContainer}>
      <Image
        source={require('@/assets/images/icon.png')}
        style={styles.footerLogo}
        resizeMode="contain"
      />
      <Text style={[styles.brandName, { color: theme.gold }]}>JeetoBaz</Text>
      <Text style={[styles.brandTagline, { color: theme.muted }]}>
        Pakistan&apos;s most trusted transparent prize platform. Enter fair, win big!
      </Text>
    </View>
  );
}

function CopyrightBar() {
  const { theme } = useAppTheme();
  const year = new Date().getFullYear();
  return (
    <View style={[styles.copyrightBar, { borderColor: theme.border }]}>
      <Text style={[styles.copyrightText, { color: theme.subtle }]}>
        &copy; {year} JeetoBaz. All rights reserved.
      </Text>
      <Text style={[styles.copyrightText, { color: theme.subtle }]}>
        Made with <Heart size={10} color="#ff4d67" /> in Pakistan
      </Text>
    </View>
  );
}

export default function JeetoBazFooter() {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  const onLinkPress = useMemo(() => (link: FooterLink) => {
    if (link.external) {
      Linking.openURL(link.external);
    } else if (link.route) {
      router.push(link.route as any);
    }
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
      <View style={styles.inner}>
        {isDesktop && <DesktopFooter onLinkPress={onLinkPress} />}
        {isTablet && <TabletFooter onLinkPress={onLinkPress} />}
        {isMobile && <MobileFooter onLinkPress={onLinkPress} />}
      </View>
      <TrustStrip />
      <CopyrightBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    marginTop: 12,
  },
  inner: {
    padding: 20,
    paddingBottom: 8,
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  footerColumn: {
    flex: 1,
    minWidth: 160,
    maxWidth: 240,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  linkItem: {
    paddingVertical: 4,
  },
  linkItemText: {
    fontSize: 13,
    lineHeight: 20,
  },
  linkItemTextDisabled: {
    opacity: 0.5,
  },
  brandingContainer: {
    marginBottom: 16,
  },
  footerLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginBottom: 10,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  brandTagline: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  socialRowDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  socialIconBtn: {
    padding: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  paymentBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paymentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  paymentLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  trustStrip: {
    borderTopWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 140,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  trustItemLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  copyrightBar: {
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexWrap: 'wrap',
    gap: 6,
  },
  copyrightText: {
    fontSize: 11,
  },
  tabletBrandRow: {
    alignItems: 'center',
    marginBottom: 24,
  },
  tabletColumnsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  tabletColumn: {
    flex: 1,
  },
  tabletSocialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  tabletPaymentRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  mobileBrandRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  accordionSection: {
    borderTopWidth: 1,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  accordionContent: {
    paddingBottom: 10,
    paddingHorizontal: 4,
  },
  socialRowMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 14,
    paddingHorizontal: 4,
  },
  mobilePaymentSection: {
    borderTopWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
});
