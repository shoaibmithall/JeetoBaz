import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { pageSchema } from '@/lib/structured-data';
import {
  AppWindow,
  Award,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  ClipboardCheck,
  Compass,
  ContactRound,
  CreditCard,
  Eye,
  ExternalLink,
  FileCheck2,
  Gift,
  Globe2,
  HeartHandshake,
  Info,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Rocket,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Ticket,
  TriangleAlert,
  Trophy,
  UserPlus,
  UsersRound,
  Zap,
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

const CORE_VALUES = [
  { icon: Eye, iconColor: '#3B82F6', title: 'Transparency', desc: 'Campaign details, participation progress, draw schedules, winner records and prize-delivery updates are presented clearly.' },
  { icon: Scale, iconColor: '#F59E0B', title: 'Fairness', desc: 'Every verified ticket included in a campaign draw receives an equal opportunity to be selected.' },
  { icon: ShieldCheck, iconColor: '#10B981', title: 'Security', desc: 'Accounts, payments, entries and verification records are handled through controlled processes designed to protect users and the Platform.' },
  { icon: ClipboardCheck, iconColor: '#8B5CF6', title: 'Accountability', desc: 'Completed draws, winner verification and prize delivery are documented to maintain transparency and public trust.' },
  { icon: HeartHandshake, iconColor: '#EC4899', title: 'Customer Trust', desc: 'JeetoBaz aims to provide clear information, responsive support and reliable communication throughout the user journey.' },
];

const DIFFERENTIATORS = [
  { icon: UserPlus, iconColor: '#3B82F6', title: 'Unique Member Identity', desc: 'Every registered user receives a permanent Member ID and account reference number.' },
  { icon: Ticket, iconColor: '#EC4899', title: 'Verified Ticket Issuance', desc: 'A unique ticket is generated only after the submitted payment has been manually reviewed and approved.' },
  { icon: FileCheck2, iconColor: '#10B981', title: 'Transparent Campaign Progress', desc: 'Users can view total participation spots, confirmed entries, remaining spots and campaign completion percentage.' },
  { icon: CalendarClock, iconColor: '#F59E0B', title: 'Scheduled Public Draws', desc: 'Once all campaign spots are filled, the draw is scheduled seven days later at 10:00 PM Pakistan Standard Time.' },
  { icon: Zap, iconColor: '#FFD700', title: 'Automated Winner Selection', desc: 'The winning ticket is selected randomly through the JeetoBaz automated algorithm. An authorized administrator may initiate the process where required but cannot manually select or modify the winner.' },
  { icon: Eye, iconColor: '#3B82F6', title: 'Live Draw Experience', desc: 'Active users can view the official draw through the JeetoBaz Platform. Draw notifications may also be sent through in-app alerts, email and SMS.' },
  { icon: PackageCheck, iconColor: '#8B5CF6', title: 'Verified Prize Delivery', desc: 'The selected winner completes identity and eligibility verification before the prize is released or officially handed over.' },
];

const WORKS_STEPS = [
  {
    icon: UserPlus,
    iconColor: '#3B82F6',
    title: '1. Create Your JeetoBaz Account',
    text: 'Register using your mobile number, email address or an available social login method.\n\nAfter successful registration, your account receives a permanent and unique:\n• Member ID\n• Account reference number\n\nThese identifiers help JeetoBaz securely manage your participation, payments, support requests and winning records.',
  },
  {
    icon: Gift,
    iconColor: '#EC4899',
    title: '2. Select a Prize Campaign',
    text: 'Explore active prize campaigns and review the complete campaign information, including:\n• Prize details\n• Entry fee\n• Total participation spots\n• Available spots\n• Campaign terms\n• Eligibility requirements\n• Participation progress\n\nSelect the campaign you wish to join and submit your participation request.',
  },
  {
    icon: CreditCard,
    iconColor: '#F59E0B',
    title: '3. Submit Your Payment',
    text: "Complete the payment using an available JeetoBaz payment method and provide the required transaction details or payment receipt.\n\nSubmitting a payment does not immediately create a valid campaign entry. Every payment is reviewed through JeetoBaz's manual payment-verification process.",
  },
  {
    icon: FileCheck2,
    iconColor: '#10B981',
    title: '4. Payment Verification and Ticket Issuance',
    text: 'The JeetoBaz team checks the submitted payment information and confirms whether the transaction is valid.\n\nAfter successful verification:\n• Your participation is confirmed\n• A unique ticket number is generated\n• The ticket is linked to your Member ID\n• The ticket appears in your account\n• You become eligible for the selected campaign draw\n\nA ticket number is not issued for an unverified, failed, incomplete or rejected payment.',
  },
  {
    icon: UsersRound,
    iconColor: '#8B5CF6',
    title: '5. Campaign Spots Are Filled',
    text: 'Each campaign has a fixed number of participation spots.\n\nThe campaign page displays:\n• Total participation spots\n• Confirmed participants\n• Remaining spots\n• Completion percentage\n\nThe draw-scheduling process begins only after all available participation spots have been filled by verified entries.',
  },
  {
    icon: CalendarClock,
    iconColor: '#3B82F6',
    title: '6. Draw Scheduling',
    text: 'Once all participation spots are filled, JeetoBaz schedules the official draw for: seven days after campaign completion at 10:00 PM Pakistan Standard Time.\n\nThe scheduled date and time are displayed through:\n• Campaign page\n• User dashboard\n• Draw countdown\n• In-app notifications\n• Email\n• SMS\n• Other official JeetoBaz communication channels\n\nUsers should keep their registered contact information accurate to receive important draw updates.',
  },
  {
    icon: Zap,
    iconColor: '#FFD700',
    title: '7. Live Automated Draw',
    text: 'At the scheduled time, the draw takes place publicly within the JeetoBaz system.\n\nThe draw may begin automatically at the scheduled time or may be initiated by an authorized administrator where operationally required. However, the administrator cannot select, replace or control the winning ticket.\n\nThe JeetoBaz automated algorithm randomly selects one eligible ticket from all verified campaign entries. Every valid ticket has an equal opportunity to be selected.',
  },
  {
    icon: Eye,
    iconColor: '#14B8A6',
    title: '8. Live Viewing and Draw Record',
    text: "Active users can watch the draw through the JeetoBaz platform as it takes place.\n\nAfter completion, JeetoBaz may publish:\n• Live draw recording\n• Draw replay\n• Winning ticket\n• Winner's first name\n• Winner's city\n• Prize name\n• Draw date\n• Verification status\n• Winner certificate\n• Prize-delivery evidence\n\nThis record helps participants review the completed campaign and winner-selection process.",
  },
  {
    icon: ShieldCheck,
    iconColor: '#10B981',
    title: '9. Winner Verification',
    text: 'The selected participant is initially marked as a Pending Verification Winner.\n\nJeetoBaz contacts the selected winner and verifies:\n• Account ownership\n• Member ID\n• Winning ticket\n• Registered mobile number\n• Registered email address\n• CNIC and identity information\n• Age and eligibility\n• Payment and participation records\n• Compliance with campaign rules\n\nThe prize is released only after successful verification. Where the selected participant fails verification or is found ineligible, JeetoBaz may take action according to the applicable Terms and Conditions and campaign rules.',
  },
  {
    icon: Trophy,
    iconColor: '#F97316',
    title: '10. Winner Announcement',
    text: "After verification, the winner's public campaign record may display:\n• First name\n• City\n• Winning ticket number\n• Prize\n• Draw date\n• Verification status\n• Winner certificate\n• Live draw video or replay\n\nSensitive information such as the winner's complete CNIC number, full residential address or payment credentials will not be displayed publicly.",
  },
  {
    icon: PackageCheck,
    iconColor: '#EC4899',
    title: '11. Prize Delivery or Official Handover',
    text: 'After successful verification, JeetoBaz arranges the prize according to its category.\n\nSmall or Digital Prizes\nEligible small or digital prizes may be delivered through:\n• Courier\n• Digital delivery\n• Another approved delivery method\n\nLarge Physical Prizes\nVehicles, high-value items and other major prizes may be delivered or handed over through an official and documented process. The winner may be required to:\n• Present original identification\n• Sign receiving documents\n• Complete applicable legal formalities\n• Provide delivery confirmation\n• Participate in authorized winner documentation',
  },
] as const;

const DRAW_TIMELINE = [
  'Account Registration',
  'Member ID and Reference Number Issued',
  'Campaign Selected',
  'Payment Submitted',
  'Manual Payment Verification',
  'Unique Ticket Issued',
  'All Participation Spots Filled',
  'Seven-Day Draw Countdown',
  'Official Draw at 10:00 PM PKT',
  'Automated Random Winner Selection',
  'Winner Verification',
  'Winner Certificate and Public Result',
  'Prize Delivery or Official Handover',
];

const TRUST_PROCESS_ITEMS = [
  { title: 'Unique Member Identity', desc: 'Every registered account receives a permanent Member ID and reference number.' },
  { title: 'Verified Payments', desc: 'Only successfully verified payments create valid campaign entries.' },
  { title: 'Unique Ticket Numbers', desc: "Every confirmed entry receives a unique ticket linked to the participant's account." },
  { title: 'Transparent Campaign Progress', desc: 'Users can see total spots, filled spots, remaining spots and campaign completion progress.' },
  { title: 'Advance Draw Notice', desc: 'The draw is scheduled seven days after all spots are filled, giving participants advance notice.' },
  { title: 'Automated Winner Selection', desc: 'The winning ticket is randomly selected by the JeetoBaz algorithm rather than manually chosen by an administrator.' },
  { title: 'Public Draw Access', desc: 'Active users can watch the official draw through the JeetoBaz platform.' },
  { title: 'Verified Winners', desc: 'Every selected winner must complete identity and eligibility verification before receiving the prize.' },
  { title: 'Documented Results', desc: 'Completed draws may include a replay, winner certificate, verification status and prize-delivery evidence.' },
];

const WORKS_IMPORTANT_INFO = [
  'Creating an account does not automatically create a campaign entry.',
  'Submitting a payment does not guarantee payment approval.',
  'A unique ticket is issued only after successful payment verification.',
  'Only verified tickets are included in the draw.',
  'The draw is scheduled after all campaign participation spots are filled.',
  'The official draw takes place seven days later at 10:00 PM Pakistan Standard Time.',
  'Every eligible ticket has an equal chance of being selected.',
  'An administrator may initiate the draw where required but cannot choose or modify the winning ticket.',
  'The selected winner must complete verification before receiving the prize.',
  'Prize delivery remains subject to JeetoBaz policies and campaign-specific terms.',
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
  const [worksQuery, setWorksQuery] = useState('');
  const [openWorksStep, setOpenWorksStep] = useState<string | null>(null);

  const filteredWorksSteps = useMemo(() => {
    const search = worksQuery.trim().toLowerCase();
    if (!search) return WORKS_STEPS;
    return WORKS_STEPS.filter(
      (step) => step.title.toLowerCase().includes(search) || step.text.toLowerCase().includes(search),
    );
  }, [worksQuery]);

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
            JeetoBaz is a Pakistan-based registered digital platform, founded in 2026, to provide eligible users with a secure, transparent and convenient way to participate in promotional prize campaigns.
          </Text>
          <Text selectable style={[styles.bodyText, { color: theme.muted }]}>
            Our platform brings together verified payments, unique ticket numbers, transparent campaign progress, scheduled public draws, automated random winner selection and documented prize delivery.{'\n\n'}
            From account registration to prize handover, every stage is designed to remain clear, trackable and trustworthy.
          </Text>

          <SectionCard title="Our Mission" icon={<Target color="#FF6B6B" size={22} />}>
            {"To build Pakistan's most trusted digital prize campaign platform by providing every eligible participant with a fair, secure and transparent participation experience.\n\nWe aim to maintain trust through:\n• Verified campaign entries\n• Manual payment verification\n• Unique ticket numbers\n• Transparent campaign progress\n• Advance draw notifications\n• Automated random winner selection\n• Verified winners\n• Documented prize delivery"}
          </SectionCard>

          <SectionCard title="Our Vision" icon={<Award color="#F59E0B" size={22} />}>
            {"To become Pakistan's leading digital prize campaign platform, recognized for transparency, innovation, responsible operations, customer trust and a reliable user experience.\n\nOur long-term vision is to create a platform where every participant can clearly track their entry, ticket, campaign progress, draw schedule, winner verification and prize delivery."}
          </SectionCard>

          <Text selectable style={[styles.subheading, { color: theme.gold }]}>Our Core Values</Text>
          {CORE_VALUES.map((value) => (
            <View key={value.title} style={[styles.valueCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.valueIcon, { backgroundColor: theme.primarySoft }]}>
                <value.icon color={value.iconColor} size={20} />
              </View>
              <View style={styles.valueText}>
                <Text selectable style={[styles.valueTitle, { color: theme.gold }]}>{value.title}</Text>
                <Text selectable style={[styles.valueDesc, { color: theme.muted }]}>{value.desc}</Text>
              </View>
            </View>
          ))}

          <Text selectable style={[styles.subheading, { color: theme.gold }]}>What Makes JeetoBaz Different?</Text>
          {DIFFERENTIATORS.map((item) => (
            <View key={item.title} style={[styles.valueCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.valueIcon, { backgroundColor: theme.primarySoft }]}>
                <item.icon color={item.iconColor} size={20} />
              </View>
              <View style={styles.valueText}>
                <Text selectable style={[styles.valueTitle, { color: theme.gold }]}>{item.title}</Text>
                <Text selectable style={[styles.valueDesc, { color: theme.muted }]}>{item.desc}</Text>
              </View>
            </View>
          ))}

          <SectionCard title="Our Commitment" icon={<HeartHandshake color="#14B8A6" size={22} />}>
            {'JeetoBaz is committed to providing:\n• Clear campaign information\n• Secure participation\n• Accurate payment verification\n• Fair winner selection\n• Timely user communication\n• Verified winner records\n• Documented prize delivery\n• Continuous platform improvement\n\nWe continuously work to strengthen security, transparency, customer support and the overall participant experience.'}
          </SectionCard>

          <Text selectable style={[styles.subheading, { color: theme.gold }]}>Company Information</Text>
          <InfoLine label="Business Name" value="JeetoBaz" />
          <InfoLine label="Business Type" value="Pakistan-Based Registered Digital Platform" />
          <InfoLine label="Founded" value="2026" />
          <InfoLine label="Website" value="jeetobaz.pk" />

          <Text selectable style={[styles.subheading, { color: theme.gold }]}>Explore More</Text>
          <TouchableOpacity style={[styles.navButtonRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => router.push('/')}>
            <View style={[styles.navButtonIcon, { backgroundColor: theme.primarySoft }]}><Compass color="#3B82F6" size={21} /></View>
            <Text style={[styles.navButtonText, { color: theme.gold }]}>Explore Campaigns</Text>
            <ChevronRight color={theme.subtle} size={19} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navButtonRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setSelected('works')}>
            <View style={[styles.navButtonIcon, { backgroundColor: theme.primarySoft }]}><Rocket color="#F97316" size={21} /></View>
            <Text style={[styles.navButtonText, { color: theme.gold }]}>How JeetoBaz Works</Text>
            <ChevronRight color={theme.subtle} size={19} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navButtonRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setSelected('support')}>
            <View style={[styles.navButtonIcon, { backgroundColor: theme.primarySoft }]}><ContactRound color="#8B5CF6" size={21} /></View>
            <Text style={[styles.navButtonText, { color: theme.gold }]}>Contact Support</Text>
            <ChevronRight color={theme.subtle} size={19} />
          </TouchableOpacity>
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
          <Text selectable style={[styles.leadText, { color: theme.text }]}>
            Transparent Participation. Verified Draw. Secure Prize Delivery.
          </Text>
          <Text selectable style={[styles.bodyText, { color: theme.muted, marginBottom: 16 }]}>
            JeetoBaz follows a clear and documented process from account registration to prize delivery. Every verified participant receives a unique ticket, and each winner is selected through the JeetoBaz automated random draw system.
          </Text>

          <View style={[styles.worksSearchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Search color={theme.subtle} size={20} />
            <TextInput
              value={worksQuery}
              onChangeText={setWorksQuery}
              placeholder="Search the process..."
              placeholderTextColor={theme.subtle}
              style={[styles.worksSearchInput, { color: theme.text }]}
            />
          </View>

          <View style={styles.worksList}>
            {filteredWorksSteps.map((step) => {
              const expanded = openWorksStep === step.title;
              const Icon = step.icon;
              return (
                <View
                  key={step.title}
                  style={[styles.worksCard, { backgroundColor: theme.surface, borderColor: expanded ? theme.gold : theme.border }]}
                >
                  <TouchableOpacity
                    style={styles.worksQuestionRow}
                    onPress={() => setOpenWorksStep(expanded ? null : step.title)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                  >
                    <View style={[styles.worksIconBox, { backgroundColor: theme.background }]}>
                      <Icon color={step.iconColor} size={20} />
                    </View>
                    <Text style={[styles.worksQuestionText, { color: theme.gold, flex: 1 }]}>{step.title}</Text>
                    {expanded ? (
                      <ChevronDown color={theme.gold} size={21} />
                    ) : (
                      <ChevronRight color={theme.subtle} size={21} />
                    )}
                  </TouchableOpacity>
                  {expanded ? (
                    <View style={[styles.worksAnswerBox, { borderTopColor: theme.border }]}>
                      <Text selectable style={[styles.worksAnswerText, { color: theme.muted }]}>{step.text}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {filteredWorksSteps.length === 0 ? (
            <View style={styles.worksEmpty}>
              <Text style={[styles.worksEmptyTitle, { color: theme.gold }]}>No matching step found</Text>
            </View>
          ) : null}

          <View style={[styles.timelineSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text selectable style={[styles.timelineTitle, { color: theme.gold }]}>Draw Timeline</Text>
            {DRAW_TIMELINE.map((node, index) => (
              <View key={node} style={styles.timelineNodeWrap}>
                <View style={[styles.timelineNode, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
                  <Text selectable style={[styles.timelineNodeText, { color: theme.text }]}>{node}</Text>
                </View>
                {index < DRAW_TIMELINE.length - 1 ? (
                  <ChevronDown color={theme.subtle} size={20} style={styles.timelineArrow} />
                ) : null}
              </View>
            ))}
          </View>

          <View style={styles.trustSection}>
            <Text selectable style={[styles.trustSectionTitle, { color: theme.gold }]}>Why Participants Can Trust the Process</Text>
            {TRUST_PROCESS_ITEMS.map((item) => (
              <View key={item.title} style={[styles.trustCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <ShieldCheck color={theme.gold} size={20} />
                <View style={styles.trustCardText}>
                  <Text selectable style={[styles.trustCardTitle, { color: theme.gold }]}>{item.title}</Text>
                  <Text selectable style={[styles.trustCardDesc, { color: theme.muted }]}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.worksImportantBox, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}>
            <View style={styles.worksImportantTitleRow}>
              <TriangleAlert color={theme.gold} size={18} />
              <Text style={[styles.worksImportantTitle, { color: theme.gold }]}>Important Information</Text>
            </View>
            {WORKS_IMPORTANT_INFO.map((line) => (
              <View key={line} style={styles.worksImportantRow}>
                <Text style={[styles.worksImportantBullet, { color: theme.gold }]}>•</Text>
                <Text selectable style={[styles.worksImportantText, { color: theme.muted }]}>{line}</Text>
              </View>
            ))}
          </View>
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
        <Text role="heading" aria-level={1} selectable style={[styles.detailTitle, { color: theme.gold }]}>{title}</Text>
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
        <Text selectable style={[styles.infoLabel, { color: theme.gold }]}>{label}</Text>
        <Text selectable style={[styles.infoValue, { color: theme.muted }]}>{value}</Text>
      </View>
    );
  }

  const aboutSchema = pageSchema('AboutPage', '/about', 'About Us', 'Learn about JeetoBaz, its mission, transparent prize campaign process, trust features, and commitment to providing a reliable experience in Pakistan.');
  return (
    <>
    <Head>
      <title>About Us | JeetoBaz</title>
      <meta name="robots" content="index, follow" />
      <meta name="description" content="Learn about JeetoBaz, its mission, transparent prize campaign process, trust features, and commitment to providing a reliable experience in Pakistan." />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="About Us | JeetoBaz" />
      <meta property="og:description" content="Learn about JeetoBaz, its mission, transparent prize campaign process, trust features, and commitment to providing a reliable experience in Pakistan." />
      <meta property="og:url" content="https://jeetobaz.pk/about" />
      <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content="About Us | JeetoBaz" />
      <meta name="twitter:description" content="Learn about JeetoBaz, its mission, transparent prize campaign process, trust features, and commitment to providing a reliable experience in Pakistan." />
      <meta name="twitter:image" content="https://jeetobaz.pk/twitter-image.png" />
      <link rel="canonical" href="https://jeetobaz.pk/about" />
      <script type="application/ld+json">{JSON.stringify(aboutSchema)}</script>
    </Head>
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
              <Text role="heading" aria-level={2} selectable style={[styles.introTitle, { color: theme.gold }]}>Discover JeetoBaz</Text>
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
    </>
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
  worksSearchBox: { borderWidth: 1, borderRadius: 12, minHeight: 52, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  worksSearchInput: { flex: 1, fontSize: 15, paddingVertical: 12, outlineStyle: 'none' } as never,
  worksList: { gap: 10 },
  worksCard: { borderWidth: 1, borderRadius: 13, overflow: 'hidden' },
  worksQuestionRow: { minHeight: 72, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  worksIconBox: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  worksQuestionText: { fontSize: 15, fontWeight: '700', lineHeight: 21 },
  worksAnswerBox: { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 15 },
  worksAnswerText: { fontSize: 14, lineHeight: 22 },
  worksEmpty: { alignItems: 'center', padding: 30 },
  worksEmptyTitle: { fontSize: 16, fontWeight: '700' },
  timelineSection: { borderWidth: 1, borderRadius: 18, padding: 18, marginTop: 22, alignItems: 'center' },
  timelineTitle: { fontSize: 19, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  timelineNodeWrap: { alignItems: 'center', width: '100%' },
  timelineNode: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', width: '100%', maxWidth: 460 },
  timelineNodeText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  timelineArrow: { marginVertical: 3 },
  trustSection: { marginTop: 22 },
  trustSectionTitle: { fontSize: 19, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  trustCard: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  trustCardText: { flex: 1 },
  trustCardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  trustCardDesc: { fontSize: 14, lineHeight: 21 },
  worksImportantBox: { borderWidth: 1, borderRadius: 14, padding: 16, marginTop: 22 },
  worksImportantTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  worksImportantTitle: { fontSize: 16, fontWeight: '800' },
  worksImportantRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  worksImportantBullet: { fontSize: 14, lineHeight: 21 },
  worksImportantText: { flex: 1, fontSize: 14, lineHeight: 21 },
  subheading: { fontSize: 19, fontWeight: '800', marginTop: 22, marginBottom: 10 },
  valueCard: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  valueIcon: { width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  valueText: { flex: 1 },
  valueTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  valueDesc: { fontSize: 14, lineHeight: 21 },
  navButtonRow: { minHeight: 66, borderWidth: 1, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  navButtonIcon: { width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  navButtonText: { flex: 1, fontSize: 15, fontWeight: '700' },
});
