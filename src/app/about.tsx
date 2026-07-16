import { useEffect, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AppWindow,
  Award,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  ContactRound,
  ExternalLink,
  FileCheck2,
  Gift,
  Globe2,
  HeartHandshake,
  Info,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Rocket,
  Scale,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Trophy,
  UsersRound,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
  SnapchatIcon,
  XIcon,
  TelegramIcon,
} from '@/components/social-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WHY_ITEMS = [
  { title: 'Transparent Process', desc: 'Users can clearly view entry progress, draw status, winners and available proof related to completed campaigns.' },
  { title: 'Secure Platform', desc: 'JeetoBaz is designed with protected authentication, secure sessions and controlled access to user information.' },
  { title: 'Verified Winners', desc: 'Winner details, certificates and supporting proof can be published after verification and permission.' },
  { title: 'Live Draw Updates', desc: 'Users can receive timely information when a campaign completes and its draw is scheduled or conducted.' },
  { title: 'Dedicated Customer Support', desc: 'Users can contact JeetoBaz through available support channels for account, entry and payment-related assistance.' },
  { title: 'User-Friendly Experience', desc: 'The platform is designed to make browsing campaigns, purchasing entries and checking results simple.' },
  { title: 'Fast Notifications', desc: 'Important campaign, payment, draw and winner updates can be delivered through in-app and supported notification channels.' },
  { title: 'Fair Participation', desc: 'Entries are recorded with unique ticket numbers and all eligible entries follow the same draw process.' },
];

const TRUST_ITEMS = [
  { title: 'Secure Platform', desc: 'JeetoBaz uses protected systems and controlled access to reduce unauthorized activity.' },
  { title: 'Secure Login', desc: 'Account access is protected through verified authentication and secure session handling.' },
  { title: 'Privacy Protection', desc: 'Personal information is handled according to the platform privacy policy and is not displayed publicly without permission.' },
  { title: 'Fair Draw Process', desc: 'Every eligible entry is included under the same published campaign and draw conditions.' },
  { title: 'Verified Winners', desc: 'Winner identity and eligibility are checked before winner information or prize delivery is finalized.' },
  { title: 'Transparent Draw History', desc: 'Completed campaigns can display draw results, winning tickets, dates and available supporting proof.' },
  { title: 'Secure Payment Processing', desc: 'Payments are processed through approved payment channels, with transaction records stored for verification.' },
  { title: 'Data Protection', desc: 'Sensitive account and transaction information is protected using database permissions and security controls.' },
];

const SUPPORT_PHONE_DISPLAY = '+92 337 2561482';
const SUPPORT_PHONE = '923372561482';
const SUPPORT_EMAIL = 'complaintsjeetobaz@gmail.com';
const WEBSITE = 'https://jeetobaz.pk';

type SectionId =
  | 'about'
  | 'why'
  | 'works'
  | 'trust'
  | 'support'
  | 'legal'
  | 'social'
  | 'app';

const sections: Array<{ id: SectionId; title: string; subtitle: string }> = [
  { id: 'about', title: 'About JeetoBaz', subtitle: 'Our story, mission and vision' },
  { id: 'why', title: 'Why Choose JeetoBaz?', subtitle: 'A modern and user-focused experience' },
  { id: 'works', title: 'How JeetoBaz Works', subtitle: 'From campaign selection to prize delivery' },
  { id: 'trust', title: 'Trust & Security', subtitle: 'Protection, fairness and transparency' },
  { id: 'support', title: 'Support & Contact', subtitle: 'We are here when you need us' },
  { id: 'legal', title: 'Legal & Policies', subtitle: 'Important rules and responsible use' },
  { id: 'social', title: 'Follow JeetoBaz', subtitle: 'Connect with our official channels' },
  { id: 'app', title: 'App Information', subtitle: 'Version, platform and development details' },
];

const profileOnlySectionIds = new Set<SectionId>(['works', 'support', 'social']);
const aboutMenuSections = sections.filter((section) => !profileOnlySectionIds.has(section.id));

function isSectionId(value: string | undefined): value is SectionId {
  return sections.some((section) => section.id === value);
}

const responsibleUseRules = [
  {
    title: '1. Fair Participation',
    text: 'Users must provide accurate information during registration and participation. Any attempt to manipulate, exploit or interfere with the platform or a promotional campaign is strictly prohibited.',
  },
  {
    title: '2. One Account Per User',
    text: 'Each individual may maintain only one personal account unless JeetoBaz provides written authorization otherwise.',
  },
  {
    title: '3. Accurate Information',
    text: 'Users are responsible for keeping their name, phone number and other account information accurate and up to date.',
  },
  {
    title: '4. Prohibited Activities',
    text: 'Users must not create fake or duplicate accounts; use bots, scripts or unauthorized automation; attempt unauthorized access; abuse users or support staff; upload harmful content; or use JeetoBaz for fraud or any unlawful purpose.',
  },
  {
    title: '5. Account Security',
    text: 'Users must protect their login credentials and promptly report suspected unauthorized access. JeetoBaz applies appropriate safeguards and investigates reported account-security concerns.',
  },
  {
    title: '6. Promotional Campaigns',
    text: 'Every campaign is subject to its published rules, eligibility requirements and applicable law. JeetoBaz may verify identity, participation and eligibility before confirming an entry or awarding a prize.',
  },
  {
    title: '7. Suspension and Termination',
    text: 'JeetoBaz may investigate suspected violations and may restrict, suspend or terminate an account where a violation of this policy, campaign rules or applicable law is reasonably established.',
  },
  {
    title: '8. Policy Updates',
    text: 'This policy may be updated periodically. Material updates will be communicated through the app where appropriate. Continued use after an update means the revised policy applies.',
  },
];

export default function AboutJeetoBazScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string; source?: string }>();
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const [selected, setSelected] = useState<SectionId | null>(() => {
    const sectionParam = typeof params.section === 'string' ? params.section : undefined;
    return isSectionId(sectionParam) ? sectionParam : null;
  });
  const contentWidth = Math.min(width - 30, 920);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  function toggleExpand(title: string) {
    LayoutAnimation.configureNext(LayoutAnimation.create(
      220,
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.opacity,
    ));
    setExpandedItem((prev) => (prev === title ? null : title));
  }

  useEffect(() => {
    const sectionParam = typeof params.section === 'string' ? params.section : undefined;
    if (isSectionId(sectionParam)) {
      setSelected(sectionParam);
    } else {
      setSelected(null);
    }
  }, [params.section]);

  async function openLink(url: string, fallback: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open', fallback);
    }
  }

  function goBack() {
    if (selected) {
      const sectionParam = typeof params.section === 'string' ? params.section : undefined;
      if (params.source === 'profile' && isSectionId(sectionParam)) {
        router.replace('/login');
        return;
      }
      setSelected(null);
      return;
    }
    if (params.source === 'profile') {
      router.replace('/login');
      return;
    }
    router.back();
  }

  function sectionIcon(id: SectionId, size = 22) {
    const colors: Record<string, string> = {
      about: '#3B82F6',
      why: '#FBBF24',
      works: '#F97316',
      trust: '#10B981',
      support: '#8B5CF6',
      legal: '#6366F1',
      social: '#EC4899',
      info: '#14B8A6',
    };
    const c = colors[id] || '#3B82F6';
    if (id === 'about') return <Info color={c} size={size} />;
    if (id === 'why') return <Sparkles color={c} size={size} />;
    if (id === 'works') return <Rocket color={c} size={size} />;
    if (id === 'trust') return <ShieldCheck color={c} size={size} />;
    if (id === 'support') return <ContactRound color={c} size={size} />;
    if (id === 'legal') return <Scale color={c} size={size} />;
    if (id === 'social') return <UsersRound color={c} size={size} />;
    return <AppWindow color={c} size={size} />;
  }

  function Bullet({ children }: { children: string }) {
    return (
      <View style={styles.bulletRow}>
        <CircleCheck color={theme.gold} size={18} />
        <Text selectable style={[styles.bulletText, { color: theme.gold }]}>{children}</Text>
      </View>
    );
  }

  function ExpandableBullet({ title, desc }: { title: string; desc: string }) {
    const isOpen = expandedItem === title;
    return (
      <View style={styles.expandableWrapper}>
        <TouchableOpacity
          style={styles.bulletRow}
          onPress={() => toggleExpand(title)}
          activeOpacity={0.7}
        >
          <CircleCheck color={theme.gold} size={18} />
          <Text selectable style={[styles.bulletText, { color: theme.gold, flex: 1 }]}>{title}</Text>
          <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
            <ChevronDown color={theme.subtle} size={18} />
          </View>
        </TouchableOpacity>
        {isOpen ? (
          <Text selectable style={[styles.expandableDesc, { color: theme.muted, borderLeftColor: theme.border }]}>
            {desc}
          </Text>
        ) : null}
      </View>
    );
  }

  function Step({
    icon,
    title,
    text,
  }: {
    icon: React.ReactNode;
    title: string;
    text: string;
  }) {
    return (
      <View style={[styles.stepCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.stepIcon, { backgroundColor: theme.primarySoft }]}>{icon}</View>
        <View style={styles.stepContent}>
          <Text selectable style={[styles.stepTitle, { color: theme.gold }]}>{title}</Text>
          <Text selectable style={[styles.bodyText, { color: theme.muted }]}>{text}</Text>
        </View>
      </View>
    );
  }

  function renderDetail() {
    if (selected === 'about') {
      return (
        <>
          <DetailHero icon={<Trophy color="#FFD700" size={38} />} title="About JeetoBaz" />
          <Text selectable style={[styles.leadText, { color: theme.text }]}>
            JeetoBaz is a modern digital platform designed to provide users with a simple, secure and transparent experience through promotional prize campaigns.
          </Text>
          <Text selectable style={[styles.bodyText, { color: theme.muted }]}>
            We combine technology, fair participation and a user-friendly mobile experience to make campaign discovery, participation updates and prize delivery clear and convenient.
          </Text>
          <SectionCard title="Our Mission" icon={<Target color="#FF6B6B" size={22} />}>
            To create Pakistan&apos;s most trusted and transparent digital promotional platform, where every eligible participant receives a fair opportunity through secure and technology-driven processes.
          </SectionCard>
          <SectionCard title="Our Vision" icon={<Award color="#F59E0B" size={22} />}>
            To become Pakistan&apos;s leading digital promotional platform, recognized for innovation, transparency, customer trust and an outstanding user experience.
          </SectionCard>
        </>
      );
    }

    if (selected === 'why') {
      return (
        <>
          <DetailHero icon={<Sparkles color="#FBBF24" size={38} />} title="Why Choose JeetoBaz?" />
          <Text selectable style={[styles.leadText, { color: theme.text }]}>
            JeetoBaz is being built around the features that matter most to participants.
          </Text>
          {WHY_ITEMS.map((item) => (
            <ExpandableBullet key={item.title} title={item.title} desc={item.desc} />
          ))}
        </>
      );
    }

    if (selected === 'works') {
      return (
        <>
          <DetailHero icon={<Rocket color="#F97316" size={38} />} title="How JeetoBaz Works" />
          <Step icon={<Gift color="#EC4899" size={23} />} title="1. Select a Campaign" text="Explore active promotional campaigns and review the prize, participation details, available spots and campaign conditions." />
          <Step icon={<Smartphone color="#3B82F6" size={23} />} title="2. Participate" text="Choose an eligible campaign, complete the required details and submit your participation request through the JeetoBaz app." />
          <Step icon={<FileCheck2 color="#10B981" size={23} />} title="3. Payment Verification" text="Your submitted payment details and receipt are reviewed. A confirmed entry and ticket are added only after successful verification." />
          <Step icon={<Trophy color="#FFD700" size={23} />} title="4. Draw Process" text="After the published participation conditions are met, the draw is scheduled and an eligible winner is selected through the JeetoBaz draw process." />
          <Step icon={<Award color="#F59E0B" size={23} />} title="5. Winner Verification" text="The selected winner is contacted and verified according to the campaign rules before a prize is released." />
          <Step icon={<PackageCheck color="#8B5CF6" size={23} />} title="6. Prize Delivery" text="Eligible small or digital prizes may be delivered online. Larger physical prizes are handed over or delivered through a verified physical-delivery process, with appropriate confirmation and winner consent." />
        </>
      );
    }

    if (selected === 'trust') {
      return (
        <>
          <DetailHero icon={<ShieldCheck color="#10B981" size={38} />} title="Trust & Security" />
          <Text selectable style={[styles.leadText, { color: theme.text }]}>
            Trust is central to the JeetoBaz experience. Our platform is being developed with security, privacy and transparent participation in mind.
          </Text>
          {TRUST_ITEMS.map((item) => (
            <ExpandableBullet key={item.title} title={item.title} desc={item.desc} />
          ))}
        </>
      );
    }

    if (selected === 'support') {
      return (
        <>
          <DetailHero icon={<HeartHandshake color="#14B8A6" size={38} />} title="Support & Contact" />
          <ContactButton
            icon={<MessageCircle color="#25D366" size={23} />}
            title="WhatsApp Support"
            value={SUPPORT_PHONE_DISPLAY}
            onPress={() => openLink(`https://wa.me/${SUPPORT_PHONE}`, `Contact us at ${SUPPORT_PHONE_DISPLAY}.`)}
          />
          <ContactButton
            icon={<Mail color="#4a9eff" size={23} />}
            title="Email Support"
            value={SUPPORT_EMAIL}
            onPress={() => openLink(`mailto:${SUPPORT_EMAIL}`, `Email us at ${SUPPORT_EMAIL}.`)}
          />
          <ContactButton
            icon={<Globe2 color="#3B82F6" size={23} />}
            title="Website"
            value="www.jeetobaz.pk"
            onPress={() => openLink(WEBSITE, 'Visit www.jeetobaz.pk.')}
          />
          <SectionCard title="In-App Support" icon={<MessageCircle color="#25D366" size={22} />}>
            Users can access the Help Center and submit a support request from within JeetoBaz.
          </SectionCard>
          <SectionCard title="Support Hours" icon={<ContactRound color="#8B5CF6" size={22} />}>
            Monday–Saturday, 9:00 AM–9:00 PM. Our target response time is within 24 hours.
          </SectionCard>
          <SectionCard title="Office Address" icon={<MapPin color="#FF6B6B" size={22} />}>
            Qasimabad, Hyderabad, Sindh, Pakistan.
          </SectionCard>
        </>
      );
    }

    if (selected === 'legal') {
      return (
        <>
          <DetailHero icon={<Scale color="#6366F1" size={38} />} title="Legal & Policies" />
          <TouchableOpacity style={[styles.linkRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => router.push('/privacy')}>
            <LockKeyhole color="#EC4899" size={22} />
            <Text style={[styles.linkText, { color: theme.gold }]}>Privacy Policy</Text>
            <ChevronRight color={theme.subtle} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => router.push('/terms')}>
            <FileCheck2 color="#10B981" size={22} />
            <Text style={[styles.linkText, { color: theme.gold }]}>Terms & Conditions</Text>
            <ChevronRight color={theme.subtle} size={20} />
          </TouchableOpacity>
          <View style={[styles.policyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text selectable style={[styles.policyTitle, { color: theme.gold }]}>Responsible Use Policy</Text>
            <Text selectable style={[styles.policyDate, { color: theme.gold }]}>Effective from Official Launch</Text>
            <Text selectable style={[styles.bodyText, { color: theme.muted }]}>
              JeetoBaz is committed to providing a secure, transparent and enjoyable experience. By using JeetoBaz, users agree to use the platform responsibly, follow applicable laws and comply with these guidelines.
            </Text>
            {responsibleUseRules.map((rule) => (
              <View key={rule.title} style={styles.policyRule}>
                <Text selectable style={[styles.policyRuleTitle, { color: theme.gold }]}>{rule.title}</Text>
                <Text selectable style={[styles.bodyText, { color: theme.muted }]}>{rule.text}</Text>
              </View>
            ))}
            <Text selectable style={[styles.bodyText, { color: theme.muted }]}>
              Questions about this policy can be sent to {SUPPORT_EMAIL}.
            </Text>
          </View>
        </>
      );
    }

    if (selected === 'social') {
      const socialLinks: Array<{
        name: string;
        url: string;
        icon: React.ReactNode;
        color: string;
      }> = [
        {
          name: 'Facebook',
          url: 'https://www.facebook.com/share/17uAJE6AQY/?mibextid=wwXIfr',
          icon: <FacebookIcon size={36} />,
          color: '#1877F2',
        },
        {
          name: 'Instagram',
          url: 'https://www.instagram.com/jeetobaz?igsh=ZWZpaGxyajY4Mmxy&utm_source=qr',
          icon: <InstagramIcon size={36} />,
          color: '#E4405F',
        },
        {
          name: 'TikTok',
          url: 'https://www.tiktok.com/@jeetobaz?_r=1&_t=ZS-97wXLf85a2G',
          icon: <TikTokIcon size={36} />,
          color: '#010101',
        },
        {
          name: 'YouTube',
          url: 'https://youtube.com/@jeetobaz?si=XIzw2WyovPCZZjv8',
          icon: <YouTubeIcon size={36} />,
          color: '#FF0000',
        },
        {
          name: 'Snapchat',
          url: 'https://snapchat.com/t/ZM4Q6K11',
          icon: <SnapchatIcon size={36} />,
          color: '#FFFC00',
        },
        {
          name: 'X (Twitter)',
          url: 'https://x.com/jeetobaz?s=11',
          icon: <XIcon size={36} />,
          color: '#000000',
        },
        {
          name: 'Telegram',
          url: 'https://t.me/jeetobaz',
          icon: <TelegramIcon size={36} />,
          color: '#0088CC',
        },
      ];
      return (
        <>
          <DetailHero icon={<UsersRound color="#EC4899" size={38} />} title="Follow JeetoBaz" />
          <Text selectable style={[styles.leadText, { color: theme.text }]}>
            Follow JeetoBaz for campaign announcements, winner updates, product news and important platform information.
          </Text>
          {socialLinks.map((social) => (
            <TouchableOpacity
              key={social.name}
              style={[styles.socialRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => openLink(social.url, `Follow us on ${social.name}`)}
              activeOpacity={0.7}
            >
              {social.icon}
              <Text style={[styles.linkText, { color: theme.gold }]}>{social.name}</Text>
              <ExternalLink color={theme.subtle} size={18} />
            </TouchableOpacity>
          ))}
          <ContactButton
            icon={<MessageCircle color="#25D366" size={23} />}
            title="WhatsApp"
            value={SUPPORT_PHONE_DISPLAY}
            onPress={() => openLink(`https://wa.me/${SUPPORT_PHONE}`, `Contact us at ${SUPPORT_PHONE_DISPLAY}.`)}
          />
        </>
      );
    }

    return (
      <>
        <DetailHero icon={<AppWindow color="#14B8A6" size={38} />} title="App Information" />
        <InfoLine label="Application Name" value="JeetoBaz" />
        <InfoLine label="Version" value="1.0.0" />
        <InfoLine label="Platforms" value="Android & iOS" />
        <InfoLine label="Website" value="www.jeetobaz.pk" />
        <InfoLine label="Country" value="Pakistan" />
        <InfoLine label="Development" value="Developed in Pakistan" />
      </>
    );
  }

  function DetailHero({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
      <View style={[styles.detailHero, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
        {icon}
        <Text selectable style={[styles.detailTitle, { color: theme.gold }]}>{title}</Text>
      </View>
    );
  }

  function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: string }) {
    return (
      <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.sectionTitleRow}>
          {icon}
          <Text selectable style={[styles.sectionCardTitle, { color: theme.gold }]}>{title}</Text>
        </View>
        <Text selectable style={[styles.bodyText, { color: theme.muted }]}>{children}</Text>
      </View>
    );
  }

  function ContactButton({
    icon,
    title,
    value,
    onPress,
  }: {
    icon: React.ReactNode;
    title: string;
    value: string;
    onPress: () => void;
  }) {
    return (
      <TouchableOpacity style={[styles.contactRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={onPress}>
        <View style={[styles.contactIcon, { backgroundColor: theme.primarySoft }]}>{icon}</View>
        <View style={styles.contactText}>
          <Text style={[styles.contactTitle, { color: theme.gold }]}>{title}</Text>
          <Text selectable style={[styles.contactValue, { color: theme.muted }]}>{value}</Text>
        </View>
        <ExternalLink color={theme.subtle} size={19} />
      </TouchableOpacity>
    );
  }

  function InfoLine({ label, value }: { label: string; value: string }) {
    return (
      <View style={[styles.infoLine, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text selectable style={[styles.infoLabel, { color: theme.muted }]}>{label}</Text>
        <Text selectable style={[styles.infoValue, { color: theme.gold }]}>{value}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <TouchableOpacity style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
          <ChevronLeft color={theme.primary} size={24} />
          <Text style={[styles.backText, { color: theme.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.gold }]}>{selected ? sections.find((section) => section.id === selected)?.title : 'About JeetoBaz'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.content, { width: contentWidth }]}>
        {selected ? renderDetail() : (
          <>
            <View style={[styles.introCard, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
              <Trophy color={theme.gold} size={42} />
              <Text selectable style={[styles.introTitle, { color: theme.gold }]}>Discover JeetoBaz</Text>
              <Text selectable style={[styles.introText, { color: theme.muted }]}>
                Learn about our purpose, platform, trust standards, support and policies.
              </Text>
            </View>
            <View style={[styles.menu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {aboutMenuSections.map((section, index) => (
                <View key={section.id}>
                  <TouchableOpacity
                    style={styles.menuRow}
                    onPress={() => setSelected(section.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${section.title}`}
                  >
                    <View style={[styles.menuIcon, { backgroundColor: theme.primarySoft }]}>{sectionIcon(section.id)}</View>
                    <View style={styles.menuTextWrap}>
                      <Text style={[styles.menuTitle, { color: theme.gold }]}>{section.title}</Text>
                      <Text style={[styles.menuSubtitle, { color: theme.muted }]}>{section.subtitle}</Text>
                    </View>
                    <ChevronRight color={theme.subtle} size={21} />
                  </TouchableOpacity>
                  {index < aboutMenuSections.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 50 },
  header: { minHeight: 68, borderBottomWidth: 2, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { minWidth: 74, minHeight: 44, flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, fontWeight: '700' },
  headerTitle: { flex: 1, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  headerSpacer: { width: 74 },
  content: { alignSelf: 'center', paddingTop: 18 },
  introCard: { borderWidth: 1, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
  introTitle: { fontSize: 25, fontWeight: '800', marginTop: 10 },
  introText: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 6, maxWidth: 560 },
  menu: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  menuRow: { minHeight: 82, padding: 14, flexDirection: 'row', alignItems: 'center' },
  menuIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  menuTextWrap: { flex: 1, paddingHorizontal: 12 },
  menuTitle: { fontSize: 16, fontWeight: '700' },
  menuSubtitle: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  divider: { height: 1, marginHorizontal: 15 },
  detailHero: { borderWidth: 1, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 18 },
  detailTitle: { fontSize: 27, fontWeight: '800', textAlign: 'center', marginTop: 9 },
  leadText: { fontSize: 17, lineHeight: 26, fontWeight: '600', marginBottom: 12 },
  bodyText: { fontSize: 15, lineHeight: 23 },
  sectionCard: { borderWidth: 1, borderRadius: 16, padding: 18, marginTop: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 9 },
  sectionCardTitle: { fontSize: 18, fontWeight: '800' },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  bulletText: { flex: 1, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  expandableWrapper: { marginBottom: 2 },
  expandableDesc: { fontSize: 14, lineHeight: 22, marginLeft: 28, paddingLeft: 12, paddingVertical: 8, borderLeftWidth: 2 },
  stepCard: { borderWidth: 1, borderRadius: 16, padding: 16, flexDirection: 'row', marginBottom: 12 },
  stepIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepContent: { flex: 1, paddingLeft: 13 },
  stepTitle: { fontSize: 16, fontWeight: '800', marginBottom: 5 },
  contactRow: { minHeight: 76, borderWidth: 1, borderRadius: 15, padding: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 11 },
  contactIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  contactText: { flex: 1, paddingHorizontal: 12 },
  contactTitle: { fontSize: 16, fontWeight: '700' },
  contactValue: { fontSize: 13, marginTop: 3 },
  linkRow: { minHeight: 68, borderWidth: 1, borderRadius: 14, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  linkText: { flex: 1, fontSize: 16, fontWeight: '700', paddingHorizontal: 11 },
  policyCard: { borderWidth: 1, borderRadius: 18, padding: 19, marginTop: 8 },
  policyTitle: { fontSize: 22, fontWeight: '800' },
  policyDate: { fontSize: 13, fontWeight: '700', marginTop: 5, marginBottom: 13 },
  policyRule: { paddingTop: 16 },
  policyRuleTitle: { fontSize: 16, fontWeight: '800', marginBottom: 5 },
  socialRow: { minHeight: 68, borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12 },
  infoLine: { minHeight: 70, borderWidth: 1, borderRadius: 14, padding: 15, marginBottom: 10 },
  infoLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  infoValue: { fontSize: 17, fontWeight: '700', marginTop: 5 },
});
