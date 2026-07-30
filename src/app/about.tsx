import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
  Ban,
  Bell,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  ClipboardCheck,
  Compass,
  ContactRound,
  CreditCard,
  Database,
  Eye,
  EyeOff,
  ExternalLink,
  FileCheck2,
  Gift,
  Globe2,
  HeartHandshake,
  IdCard,
  Info,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Radio,
  RefreshCw,
  Rocket,
  Scale,
  ScrollText,
  Search,
  ShieldAlert,
  ShieldCheck,
  Siren,
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

const WHY_FAQS = [
  {
    icon: Eye,
    iconColor: '#3B82F6',
    question: '1. Transparent Process',
    answer:
      'Every campaign follows a clearly defined process from registration to prize delivery.\n\nParticipants can review:\n• Campaign details\n• Entry fee\n• Total participation spots\n• Confirmed entries\n• Remaining spots\n• Campaign progress\n• Draw schedule\n• Winner information\n• Prize-delivery status\n\nThis allows users to remain informed throughout the campaign journey.',
  },
  {
    icon: CreditCard,
    iconColor: '#10B981',
    question: '2. Verified Payment Process',
    answer:
      'Every submitted payment is manually reviewed before participation is confirmed.\n\nA campaign ticket is issued only after:\n• Payment details are received\n• Transaction information is checked\n• The payment is successfully verified\n• The entry is approved\n\nUnverified, failed, incomplete or rejected payments are not included in the draw.',
  },
  {
    icon: IdCard,
    iconColor: '#8B5CF6',
    question: '3. Permanent Member ID',
    answer:
      "Every registered JeetoBaz account receives a permanent and unique Member ID.\n\nThe Member ID helps connect the user's:\n• Account\n• Payments\n• Campaign entries\n• Ticket numbers\n• Support requests\n• Draw history\n• Winning records\n\nThis improves account identification, traceability and security.",
  },
  {
    icon: Ticket,
    iconColor: '#F59E0B',
    question: '4. Unique Ticket Numbers',
    answer:
      "Every successfully verified campaign entry receives a unique ticket number linked to the participant's Member ID.\n\nUsers can view their confirmed tickets through their JeetoBaz account.\n\nOnly valid and verified ticket numbers are included in the official draw.",
  },
  {
    icon: FileCheck2,
    iconColor: '#14B8A6',
    question: '5. Transparent Campaign Progress',
    answer:
      'Each campaign displays its participation progress, including:\n• Total available spots\n• Confirmed participants\n• Filled spots\n• Remaining spots\n• Completion percentage\n\nThe draw-scheduling process begins only after all campaign participation spots have been filled.',
  },
  {
    icon: CalendarClock,
    iconColor: '#3B82F6',
    question: '6. Advance Draw Scheduling',
    answer:
      'Once all participation spots are filled, the official draw is scheduled for: seven days later at 10:00 PM Pakistan Standard Time.\n\nThe scheduled date and time are displayed on the Platform and communicated through available official channels.',
  },
  {
    icon: Bell,
    iconColor: '#EC4899',
    question: '7. Fast Draw Notifications',
    answer:
      'Before the official draw, eligible participants may receive notifications through:\n• In-app notifications\n• Email\n• SMS\n• Platform announcements\n• Other official JeetoBaz communication channels\n\nUsers should keep their registered mobile number and email address accurate to receive important updates.',
  },
  {
    icon: Zap,
    iconColor: '#FFD700',
    question: '8. Automated Fair Draw',
    answer:
      'At the scheduled time, the JeetoBaz automated random draw system selects one eligible winning ticket from all verified campaign entries.\n\nThe draw may begin automatically or may be initiated by an authorized administrator where operationally required.\n\nHowever, the administrator cannot:\n• Choose the winning participant\n• Replace the winning ticket\n• Modify verified tickets\n• Change the completed result\n• Control which eligible ticket is selected\n\nEvery valid ticket receives an equal opportunity to win.',
  },
  {
    icon: Radio,
    iconColor: '#14B8A6',
    question: '9. Live Draw Experience',
    answer:
      "Active users can watch the official draw through the JeetoBaz Platform. The live draw experience is designed to allow participants to view the winner-selection process as it takes place.\n\nAfter the draw, JeetoBaz may also provide:\n• Live draw replay\n• Winning ticket number\n• Winner's first name\n• Winner's city\n• Prize information\n• Draw date\n• Verification status\n• Winner certificate\n• Prize-delivery evidence",
  },
  {
    icon: ShieldCheck,
    iconColor: '#10B981',
    question: '10. Verified Winners',
    answer:
      'Every selected winner must complete identity and eligibility verification before receiving a prize.\n\nThe verification process may include:\n• Account ownership\n• Member ID\n• Winning ticket\n• Registered mobile number\n• Registered email address\n• CNIC verification\n• Age verification\n• Payment record\n• Campaign eligibility\n• Compliance with campaign rules\n\nA selected participant is not treated as a fully verified winner until all required checks have been successfully completed.',
  },
  {
    icon: PackageCheck,
    iconColor: '#8B5CF6',
    question: '11. Secure Prize Delivery',
    answer:
      'After successful winner verification, JeetoBaz arranges prize delivery or official handover according to the prize category.\n\nSmall or Digital Prizes\nThese may be delivered through:\n• Courier\n• Digital delivery\n• An approved delivery method\n\nLarge or High-Value Prizes\nVehicles, premium products and other major prizes may require:\n• In-person verification\n• Original identification\n• Signed receiving documents\n• Legal or ownership formalities\n• Official handover\n• Delivery confirmation',
  },
  {
    icon: ClipboardCheck,
    iconColor: '#F59E0B',
    question: '12. Documented Prize Handover',
    answer:
      'JeetoBaz may document completed prize deliveries through:\n• Winner certificate\n• Prize-handover photograph\n• Prize-handover video\n• Delivery confirmation\n• Winner statement\n• Verified winner status\n\nThis helps maintain accountability and public trust.',
  },
  {
    icon: Lock,
    iconColor: '#EF4444',
    question: '13. Secure Platform',
    answer:
      'JeetoBaz uses controlled processes to protect:\n• User accounts\n• Payment records\n• Ticket information\n• Identity documents\n• Campaign data\n• Winner records\n• Administrative access\n\nSecurity monitoring and verification procedures may be used to prevent fraud, duplicate accounts, unauthorized payments and platform misuse.',
  },
  {
    icon: EyeOff,
    iconColor: '#8B5CF6',
    question: '14. Privacy Protection',
    answer:
      'Personal information, verification documents and payment-related records are handled according to the JeetoBaz Privacy Policy.\n\nSensitive information such as complete CNIC numbers, passwords, OTPs, residential addresses and payment credentials is not intended to be displayed publicly.',
  },
  {
    icon: ContactRound,
    iconColor: '#14B8A6',
    question: '15. Dedicated Customer Support',
    answer:
      'JeetoBaz provides official customer-support channels for assistance with:\n• Account registration\n• Login problems\n• Payment verification\n• Ticket confirmation\n• Campaign participation\n• Draw information\n• Winner verification\n• Prize claims\n• Delivery concerns\n• General platform inquiries\n\nUsers should contact JeetoBaz only through verified official channels.',
  },
  {
    icon: Sparkles,
    iconColor: '#EC4899',
    question: '16. User-Friendly Experience',
    answer:
      'JeetoBaz is designed to make participation simple and understandable.\n\nUsers can manage and review important information through their account, including:\n• Member ID\n• Campaign entries\n• Unique tickets\n• Payment status\n• Draw countdown\n• Notifications\n• Participation history\n• Winning status\n• Support requests',
  },
] as const;

const WHY_TRUST_ITEMS = [
  { title: 'Secure Payment Verification', desc: 'Every payment is reviewed before a valid ticket is issued.' },
  { title: 'Unique Member Identity', desc: 'Every registered account receives a permanent Member ID.' },
  { title: 'Unique Campaign Tickets', desc: "Every verified entry receives a unique ticket linked to the participant's account." },
  { title: 'Transparent Progress', desc: 'Campaign completion information remains visible to participants.' },
  { title: 'Advance Draw Notice', desc: 'The official draw date is announced seven days before the draw.' },
  { title: 'Automated Random Selection', desc: 'The winning ticket is selected by the JeetoBaz automated random draw system.' },
  { title: 'Live Draw Access', desc: 'Active users can watch the draw through the JeetoBaz Platform.' },
  { title: 'Verified Winners', desc: 'Identity and eligibility checks are completed before prize release.' },
  { title: 'Documented Results', desc: 'Draw records, certificates and prize-delivery evidence may be published.' },
  { title: 'Official Support', desc: 'Participants can receive assistance through verified JeetoBaz support channels.' },
];

const WHY_QUICK_FACTS: Array<[string, string]> = [
  ['Business Name', 'JeetoBaz'],
  ['Founded', '2026'],
  ['Country', 'Pakistan'],
  ['Business Type', 'Registered Digital Platform'],
  ['Payment Verification', 'Manual Verification'],
  ['Member Identification', 'Permanent Member ID'],
  ['Ticket Issuance', 'After Payment Verification'],
  ['Draw Scheduling', 'Seven Days After All Spots Are Filled'],
  ['Draw Time', '10:00 PM Pakistan Standard Time'],
  ['Draw Method', 'Automated Random Winner Selection'],
  ['Live Draw', 'Available Through JeetoBaz'],
  ['Winner Verification', 'Required'],
  ['Prize Delivery', 'Verified and Documented'],
  ['Notifications', 'In-App, Email and SMS'],
  ['Customer Support', 'Available Through Official Channels'],
];

const SECURITY_FAQS = [
  {
    icon: Lock,
    iconColor: '#EF4444',
    question: '1. Secure Platform',
    answer:
      'JeetoBaz uses controlled technical and administrative measures designed to protect its website, applications, databases and campaign systems.\n\nThese measures may include:\n• Secure encrypted connections\n• Restricted administrative access\n• Role-based permissions\n• Activity monitoring\n• Security logging\n• Database access controls\n• Regular software updates\n• Backup and recovery procedures\n• Fraud-detection checks\n\nNo online system can guarantee complete security, but JeetoBaz continuously works to reduce risks and strengthen platform protection.',
  },
  {
    icon: KeyRound,
    iconColor: '#3B82F6',
    question: '2. Secure Account Access',
    answer:
      'Users may access JeetoBaz through supported login methods, including mobile number, email and approved social-login providers.\n\nAccount-security measures may include:\n• OTP verification\n• Login-session controls\n• Registered mobile and email verification\n• Suspicious-login detection\n• Account-recovery checks\n• Identity verification for sensitive changes\n• Automatic session expiry where appropriate\n\nUsers must never share their password, OTP or account-access details with another person.',
  },
  {
    icon: IdCard,
    iconColor: '#8B5CF6',
    question: '3. Unique Member Identification',
    answer:
      'Every registered account receives a permanent and unique Member ID and account reference number.\n\nThese identifiers help JeetoBaz accurately connect:\n• Account information\n• Verified payments\n• Campaign entries\n• Ticket numbers\n• Support requests\n• Draw history\n• Winner records\n\nA unique member identity also helps detect duplicate or unauthorized accounts.',
  },
  {
    icon: EyeOff,
    iconColor: '#EC4899',
    question: '4. Privacy Protection',
    answer:
      'JeetoBaz collects and processes only the information reasonably required to operate accounts, verify payments, manage campaigns, confirm winners and deliver prizes.\n\nPersonal information may include:\n• Name\n• Mobile number\n• Email address\n• CNIC and verification details\n• Payment references\n• Campaign participation\n• Delivery information\n\nSensitive information is restricted to authorized personnel and approved service providers where operationally necessary.\n\nJeetoBaz does not intend to publicly display complete CNIC numbers, passwords, OTPs, full residential addresses or payment credentials.',
  },
  {
    icon: CreditCard,
    iconColor: '#10B981',
    question: '5. Manual Payment Verification',
    answer:
      'Every submitted payment is manually reviewed before a campaign entry is approved.\n\nThe verification process may include checking:\n• Transaction reference\n• Payment amount\n• Payment date and time\n• Payment method\n• Receipt or supporting evidence\n• Registered account details\n• Duplicate or suspicious transactions\n\nA unique ticket is issued only after successful payment verification.\n\nUnverified, failed, incomplete, duplicate, reversed or rejected payments are not included in the draw.',
  },
  {
    icon: Ticket,
    iconColor: '#F59E0B',
    question: '6. Unique Ticket Protection',
    answer:
      "Every approved campaign entry receives a unique ticket number linked to the participant's Member ID and selected campaign.\n\nTicket records are maintained to help prevent:\n• Duplicate ticket issuance\n• Unauthorized ticket modification\n• Invalid draw participation\n• Manual ticket replacement\n• Entry ownership disputes\n\nOnly verified and eligible tickets are included in the official draw.",
  },
  {
    icon: Scale,
    iconColor: '#3B82F6',
    question: '7. Fair Draw Process',
    answer:
      'Once all available campaign spots are filled, the official draw is scheduled seven days later at 10:00 PM Pakistan Standard Time.\n\nAt the scheduled time, the JeetoBaz automated random draw system selects one eligible ticket from all verified campaign entries.\n\nThe draw may start automatically or be initiated by an authorized administrator where operationally required. However, the administrator cannot:\n• Select a preferred winner\n• Replace the winning ticket\n• Add an unverified ticket\n• Remove an eligible ticket without a valid recorded reason\n• Modify the completed result\n\nEvery eligible ticket receives an equal opportunity to be selected.',
  },
  {
    icon: Radio,
    iconColor: '#14B8A6',
    question: '8. Live Draw Transparency',
    answer:
      "Eligible active users can view the official draw through the JeetoBaz Platform.\n\nBefore the draw, JeetoBaz may send updates through:\n• In-app notifications\n• Email\n• SMS\n• Platform announcements\n\nAfter completion, the campaign record may include:\n• Winning ticket number\n• Winner's first name\n• Winner's city\n• Prize name\n• Draw date\n• Verification status\n• Winner certificate\n• Live video or replay\n\nThis creates a reviewable record of the winner-selection process.",
  },
  {
    icon: ShieldCheck,
    iconColor: '#10B981',
    question: '9. Verified Winners',
    answer:
      'A selected participant is initially treated as a pending winner until verification is successfully completed.\n\nWinner verification may include:\n• Account ownership\n• Member ID\n• Winning ticket\n• Registered mobile number\n• Registered email address\n• CNIC verification\n• Age and eligibility\n• Payment record\n• Campaign-rule compliance\n\nA prize is released only after the required identity and eligibility checks have been completed.',
  },
  {
    icon: FileCheck2,
    iconColor: '#8B5CF6',
    question: '10. Transparent Draw History',
    answer:
      "Completed campaigns remain available through JeetoBaz's draw or past-winners records where appropriate.\n\nA completed campaign may display:\n• Campaign name\n• Prize\n• Draw date\n• Winning ticket\n• Winner's first name\n• Winner's city\n• Verification status\n• Winner certificate\n• Draw replay\n• Prize-delivery evidence\n\nJeetoBaz does not intentionally publish unnecessary sensitive personal information.",
  },
  {
    icon: ShieldAlert,
    iconColor: '#EF4444',
    question: '11. Fraud Prevention',
    answer:
      'JeetoBaz may use automated checks and manual reviews to detect:\n• Multiple accounts\n• False identities\n• Altered documents\n• Unauthorized payments\n• Stolen payment methods\n• Chargeback abuse\n• Automated bots\n• Referral abuse\n• Account takeover\n• Ticket manipulation\n• Suspicious login activity\n• Attempts to interfere with a draw\n\nAccounts linked to suspicious activity may be temporarily restricted while a review is completed.',
  },
  {
    icon: Database,
    iconColor: '#3B82F6',
    question: '12. Data Protection',
    answer:
      'Personal information and platform records are stored using controlled systems and authorized technology providers.\n\nProtection measures may include:\n• Encrypted data transmission\n• Access restrictions\n• Authentication controls\n• Administrative permissions\n• Security logs\n• Protected backups\n• Database monitoring\n• Incident-response procedures\n\nInformation is retained only for as long as reasonably necessary for platform operations, legal compliance, accounting, fraud prevention and dispute resolution.',
  },
  {
    icon: PackageCheck,
    iconColor: '#FFD700',
    question: '13. Secure Prize Release',
    answer:
      'Prizes are released only after winner verification.\n\nDepending on the prize category, JeetoBaz may require:\n• Original identification\n• Signed receiving documents\n• Address confirmation\n• Legal ownership formalities\n• Delivery confirmation\n• Official handover documentation\n\nHigh-value prizes may involve additional checks to protect both the winner and JeetoBaz.',
  },
  {
    icon: Siren,
    iconColor: '#F97316',
    question: '14. Security Incident Response',
    answer:
      'Where JeetoBaz becomes aware of a confirmed security incident, it may:\n• Investigate affected systems\n• Restrict compromised access\n• Preserve relevant evidence\n• Reset or suspend affected accounts\n• Strengthen technical controls\n• Inform affected users where appropriate\n• Cooperate with authorized service providers or authorities where legally required',
  },
] as const;

const SECURITY_RESPONSIBILITIES =
  'Users also play an important role in account security.\n\nParticipants should:\n• Keep passwords and OTPs private\n• Use only official JeetoBaz channels\n• Avoid unofficial payment requests\n• Keep registered contact details updated\n• Log out from shared devices\n• Report suspicious activity promptly\n• Never publicly share CNIC or payment details\n• Verify the website address before signing in\n\nJeetoBaz will never ask users to share an OTP publicly or send a password through social media comments.';

const SECURITY_COMMITMENT =
  'JeetoBaz is committed to:\n• Protecting participant accounts\n• Verifying every valid payment\n• Issuing traceable unique tickets\n• Preventing duplicate and fraudulent participation\n• Conducting transparent automated draws\n• Verifying every selected winner\n• Protecting sensitive personal information\n• Maintaining documented draw and delivery records\n• Continuously improving platform security';

const TRUST_BADGES = [
  'OTP-Protected Login',
  'Manual Payment Verification',
  'Unique Member ID',
  'Unique Ticket Number',
  'Automated Random Draw',
  'Live Draw Access',
  'Verified Winners',
  'Protected Personal Data',
  'Documented Prize Delivery',
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
  { id: 'legal', title: 'Responsible Use Policy', subtitle: 'Important rules and responsible use' },
  { id: 'social', title: 'Follow JeetoBaz', subtitle: 'Connect with our official channels' },
  { id: 'app', title: 'App Information', subtitle: 'Version, platform and development details' },
];

const profileOnlySectionIds = new Set<SectionId>(['works', 'support', 'social']);
const aboutMenuSections = sections.filter((section) => !profileOnlySectionIds.has(section.id));

function isSectionId(value: string | undefined): value is SectionId {
  return sections.some((section) => section.id === value);
}

const LEGAL_FAQS = [
  {
    icon: Info,
    iconColor: '#3B82F6',
    question: '1. Introduction',
    answer:
      'This Responsible Use Policy explains the standards of conduct expected from every person who accesses or uses JeetoBaz.\n\nBy creating an account, joining a promotional prize campaign, submitting a payment, contacting support or using any JeetoBaz service, you agree to:\n• use the Platform responsibly;\n• provide accurate information;\n• comply with applicable laws;\n• respect other users and JeetoBaz personnel; and\n• follow all published campaign rules, policies and instructions.\n\nThis Policy should be read together with the JeetoBaz Terms & Conditions, Privacy Policy and other applicable policies.',
  },
  {
    icon: Scale,
    iconColor: '#F59E0B',
    question: '2. Fair Participation',
    answer:
      'Users must participate honestly and fairly.\n\nYou must not:\n• manipulate or attempt to manipulate a campaign;\n• interfere with campaign progress or draw operations;\n• obtain an unfair advantage over other participants;\n• exploit errors, bugs or technical weaknesses;\n• submit invalid or unauthorized entries;\n• encourage another person to violate campaign rules; or\n• misrepresent your eligibility or identity.\n\nEvery verified participant must follow the same published campaign requirements.',
  },
  {
    icon: UserPlus,
    iconColor: '#8B5CF6',
    question: '3. One Account per User',
    answer:
      "Each individual may maintain only one personal JeetoBaz account unless JeetoBaz provides written authorization otherwise.\n\nUsers must not:\n• create duplicate accounts;\n• use another person's identity;\n• register accounts using false information;\n• control multiple accounts through different mobile numbers or email addresses;\n• create accounts to avoid restrictions or suspension; or\n• allow another person to use their account.\n\nJeetoBaz may compare account, identity, device, payment and activity information to detect duplicate or unauthorized accounts.",
  },
  {
    icon: FileCheck2,
    iconColor: '#10B981',
    question: '4. Accurate Information',
    answer:
      'Users must provide complete, accurate and current information during registration, payment submission, KYC verification, prize claims and support requests.\n\nThis may include:\n• full legal name;\n• date of birth;\n• mobile number;\n• email address;\n• CNIC details;\n• residential address;\n• payment information; and\n• other information reasonably required by JeetoBaz.\n\nFalse, incomplete, altered or misleading information may result in delayed verification, rejected participation, account restriction or disqualification.',
  },
  {
    icon: Lock,
    iconColor: '#EF4444',
    question: '5. Account Security',
    answer:
      'Users are responsible for protecting their account and authentication details.\n\nYou must:\n• keep passwords and OTPs confidential;\n• use only official JeetoBaz login pages;\n• protect your registered mobile number and email account;\n• avoid logging in through untrusted devices;\n• log out from shared devices;\n• report suspected unauthorized access promptly; and\n• keep contact information updated.\n\nYou must not share your account, password or OTP with another person.\n\nJeetoBaz will not ask users to publicly disclose an OTP or password.',
  },
  {
    icon: CreditCard,
    iconColor: '#14B8A6',
    question: '6. Payment Responsibility',
    answer:
      "All submitted payments must be genuine, authorized and connected to the relevant participant.\n\nUsers must not:\n• submit fake or edited payment receipts;\n• provide false transaction references;\n• use stolen or unauthorized payment methods;\n• submit the same payment for multiple entries;\n• deliberately reverse or dispute a valid payment after receiving participation;\n• conceal the real source of funds;\n• submit another user's transaction as their own; or\n• interfere with payment verification.\n\nJeetoBaz manually reviews submitted payments before confirming participation.\n\nA unique ticket is issued only after successful payment verification.",
  },
  {
    icon: Ticket,
    iconColor: '#F59E0B',
    question: '7. Ticket Integrity',
    answer:
      "Every verified campaign ticket is linked to a specific JeetoBaz account and Member ID.\n\nUsers must not:\n• alter a ticket number;\n• create a fake ticket;\n• copy or duplicate another participant's ticket;\n• claim ownership of another user's entry;\n• transfer or sell a ticket unless expressly permitted;\n• interfere with ticket records; or\n• attempt to add an unverified ticket to a draw.\n\nOnly valid, verified and eligible tickets are included in the official draw.",
  },
  {
    icon: ShieldCheck,
    iconColor: '#10B981',
    question: '8. Fair Draw Conduct',
    answer:
      'Users must respect the integrity of the JeetoBaz draw process.\n\nYou must not:\n• attempt to influence winner selection;\n• interfere with the automated draw system;\n• manipulate campaign data;\n• access restricted draw controls;\n• pressure employees or support personnel to change a result;\n• disrupt a live draw;\n• submit false claims about a completed draw; or\n• attempt to replace, remove or add tickets without authorization.\n\nThe winning ticket is selected through the JeetoBaz automated random draw system from eligible verified tickets.\n\nAn authorized administrator may initiate the draw where operationally required but cannot manually select or modify the winner.',
  },
  {
    icon: ShieldAlert,
    iconColor: '#EF4444',
    question: '9. Prohibited Technical Activities',
    answer:
      'Users must not attempt to damage, overload, bypass or interfere with the Platform.\n\nProhibited activities include:\n• bots or automated scripts;\n• scraping without authorization;\n• unauthorized API access;\n• hacking attempts;\n• malware distribution;\n• credential theft;\n• bypassing security controls;\n• exploiting software vulnerabilities;\n• denial-of-service activity;\n• reverse engineering where prohibited;\n• unauthorized access to accounts or databases; and\n• manipulation of campaign, ticket or payment records.\n\nSecurity weaknesses should be reported privately through an official JeetoBaz support channel.',
  },
  {
    icon: Siren,
    iconColor: '#F97316',
    question: '10. Fraudulent and Unlawful Activity',
    answer:
      'JeetoBaz must not be used for fraud or any unlawful purpose.\n\nUsers must not engage in:\n• identity theft;\n• forged KYC documents;\n• impersonation;\n• payment fraud;\n• money laundering;\n• proceeds-of-crime activity;\n• chargeback abuse;\n• referral fraud;\n• organized account manipulation;\n• fraudulent prize claims;\n• unlawful financial activity; or\n• any conduct prohibited by applicable law.\n\nJeetoBaz may preserve relevant records and cooperate with authorized authorities where legally required.',
  },
  {
    icon: UsersRound,
    iconColor: '#EC4899',
    question: '11. Respectful Community Behaviour',
    answer:
      "Users must communicate respectfully with other participants, winners, JeetoBaz employees and support personnel.\n\nUsers must not:\n• threaten or harass another person;\n• use abusive or discriminatory language;\n• publish another person's private information;\n• impersonate JeetoBaz staff;\n• spread knowingly false information;\n• pressure or intimidate winners;\n• send repeated spam messages;\n• disrupt customer-support services; or\n• upload harmful, illegal or offensive content.\n\nJeetoBaz may remove content or restrict users who violate these standards.",
  },
  {
    icon: Gift,
    iconColor: '#FFD700',
    question: '12. Promotional Campaign Rules',
    answer:
      'Every campaign is governed by its published details and campaign-specific conditions.\n\nUsers are responsible for reviewing:\n• eligibility requirements;\n• entry fee;\n• total participation spots;\n• entry limitations;\n• prize details;\n• draw conditions;\n• winner-verification requirements;\n• delivery conditions; and\n• other applicable campaign rules.\n\nParticipation does not guarantee winning.\n\nThe draw-scheduling process begins only after all required participation spots are filled.',
  },
  {
    icon: Trophy,
    iconColor: '#F59E0B',
    question: '13. Winner Responsibilities',
    answer:
      "A selected participant must cooperate with JeetoBaz's winner-verification and prize-release process.\n\nThe selected winner may be required to:\n• confirm account ownership;\n• present the winning ticket;\n• provide the permanent Member ID;\n• complete CNIC and age verification;\n• confirm payment records;\n• provide delivery information;\n• sign receiving documents;\n• complete applicable ownership formalities;\n• pay legally applicable government taxes or charges where required; and\n• comply with campaign-specific prize conditions.\n\nFailure to complete verification within the permitted period may affect prize eligibility under the Terms & Conditions.",
  },
  {
    icon: ClipboardCheck,
    iconColor: '#8B5CF6',
    question: '14. Content and Document Uploads',
    answer:
      "Users must upload only genuine, relevant and lawful content.\n\nYou must not upload:\n• forged documents;\n• altered receipts;\n• malware;\n• unlawful content;\n• another person's identity documents without authority;\n• misleading evidence;\n• confidential information belonging to another person; or\n• content that violates intellectual-property rights.\n\nUsers should not upload passwords, OTPs or complete payment-card credentials.",
  },
  {
    icon: Eye,
    iconColor: '#3B82F6',
    question: '15. Fraud Prevention and Investigations',
    answer:
      'JeetoBaz may use manual reviews, automated checks and security monitoring to investigate suspicious activity.\n\nThis may include reviewing:\n• account information;\n• Member IDs;\n• devices and network activity;\n• login history;\n• payment records;\n• KYC documents;\n• ticket activity;\n• campaign participation;\n• support communications; and\n• other relevant records.\n\nDuring an investigation, JeetoBaz may request additional information or temporarily restrict account functions.',
  },
  {
    icon: KeyRound,
    iconColor: '#EF4444',
    question: '16. Account Restrictions',
    answer:
      'Where reasonably necessary, JeetoBaz may:\n• delay payment verification;\n• withhold ticket issuance;\n• restrict campaign participation;\n• require additional identity verification;\n• suspend certain account features;\n• place an account under review;\n• block suspicious transactions; or\n• prevent prize release until verification is completed.\n\nA temporary restriction does not automatically mean that a violation has been confirmed.',
  },
  {
    icon: Ban,
    iconColor: '#EF4444',
    question: '17. Suspension, Disqualification and Termination',
    answer:
      'JeetoBaz may restrict, suspend or permanently terminate an account where there is reasonable evidence of:\n• duplicate accounts;\n• fraudulent payments;\n• fake or altered documents;\n• unauthorized access;\n• campaign manipulation;\n• abusive conduct;\n• serious security violations;\n• unlawful activity;\n• repeated policy violations; or\n• attempts to avoid an existing restriction.\n\nA violation may also result in:\n• rejection of participation;\n• cancellation of invalid tickets;\n• campaign disqualification;\n• cancellation of prize eligibility;\n• withholding of a prize pending investigation; or\n• legal or regulatory reporting where permitted.\n\nAny action will be subject to applicable law, campaign rules and the JeetoBaz Terms & Conditions.',
  },
  {
    icon: MessageCircle,
    iconColor: '#14B8A6',
    question: '18. Reporting Misuse',
    answer:
      'Users should promptly report:\n• suspected fraud;\n• fake JeetoBaz accounts;\n• unauthorized payment requests;\n• account compromise;\n• security weaknesses;\n• impersonation;\n• suspicious tickets;\n• harassment; or\n• other policy violations.\n\nReports should include enough information for JeetoBaz to investigate, such as relevant dates, screenshots, transaction references or account details.\n\nReports must be made honestly. Knowingly false or malicious reports may themselves violate this Policy.',
  },
  {
    icon: RefreshCw,
    iconColor: '#3B82F6',
    question: '19. Policy Updates',
    answer:
      'JeetoBaz may update this Responsible Use Policy to reflect:\n• new services;\n• security improvements;\n• legal requirements;\n• operational changes;\n• new campaign processes; or\n• identified forms of abuse.\n\nThe revised Policy will display an updated date.\n\nMaterial changes may be communicated through the Platform, email, SMS, in-app notification or another official channel.\n\nContinued use after the updated Policy takes effect means that the revised Policy applies, subject to applicable law.',
  },
  {
    icon: ScrollText,
    iconColor: '#8B5CF6',
    question: '20. Relationship with Other Policies',
    answer:
      'This Responsible Use Policy should be read together with:\n• Terms & Conditions;\n• Privacy Policy;\n• Refund & Cancellation Policy;\n• Shipping Policy;\n• Fair Draw & Winner Selection Policy;\n• KYC Verification Policy;\n• AML & Fraud Prevention Policy;\n• Community Guidelines;\n• Cookie Policy; and\n• campaign-specific rules.\n\nWhere a subject is addressed by a more specific policy, that policy will apply to that subject.',
  },
  {
    icon: TriangleAlert,
    iconColor: '#FFD700',
    question: '21. Important Notice',
    answer:
      'Violation of this Responsible Use Policy may result in payment rejection, ticket cancellation, campaign disqualification, account restriction, suspension, permanent termination, cancellation of prize eligibility or legal action where permitted by applicable law.',
  },
  {
    icon: ContactRound,
    iconColor: '#10B981',
    question: '22. Contact Information',
    answer:
      'Questions, reports or concerns regarding this Policy may be submitted through the official JeetoBaz contact channels.\n\nBusiness Name: JeetoBaz\nFounded: 2026\nSupport Email: support@jeetobaz.pk\nPrivacy Email: privacy@jeetobaz.pk\nPhone: 0337 2561482\nWebsite: jeetobaz.pk\nOffice Address: Hyderabad, Sindh, Pakistan\n\nUntil a dedicated privacy email is active, the official support email may be used for both support and privacy matters.\n\nUsers must never send passwords, OTPs or complete card credentials through email, support chat or social media.',
  },
] as const;

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
  const [worksQuery, setWorksQuery] = useState('');
  const [openWorksStep, setOpenWorksStep] = useState<string | null>(null);
  const [whyQuery, setWhyQuery] = useState('');
  const [openWhyItem, setOpenWhyItem] = useState<string | null>(null);

  const filteredWorksSteps = useMemo(() => {
    const search = worksQuery.trim().toLowerCase();
    if (!search) return WORKS_STEPS;
    return WORKS_STEPS.filter(
      (step) => step.title.toLowerCase().includes(search) || step.text.toLowerCase().includes(search),
    );
  }, [worksQuery]);

  const filteredWhyFaqs = useMemo(() => {
    const search = whyQuery.trim().toLowerCase();
    if (!search) return WHY_FAQS;
    return WHY_FAQS.filter(
      (item) => item.question.toLowerCase().includes(search) || item.answer.toLowerCase().includes(search),
    );
  }, [whyQuery]);

  const [securityQuery, setSecurityQuery] = useState('');
  const [openSecurityItem, setOpenSecurityItem] = useState<string | null>(null);

  const filteredSecurityFaqs = useMemo(() => {
    const search = securityQuery.trim().toLowerCase();
    if (!search) return SECURITY_FAQS;
    return SECURITY_FAQS.filter(
      (item) => item.question.toLowerCase().includes(search) || item.answer.toLowerCase().includes(search),
    );
  }, [securityQuery]);

  const [legalQuery, setLegalQuery] = useState('');
  const [openLegalItem, setOpenLegalItem] = useState<string | null>(null);

  const filteredLegalFaqs = useMemo(() => {
    const search = legalQuery.trim().toLowerCase();
    if (!search) return LEGAL_FAQS;
    return LEGAL_FAQS.filter(
      (item) => item.question.toLowerCase().includes(search) || item.answer.toLowerCase().includes(search),
    );
  }, [legalQuery]);

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
            Built on Transparency, Security and Fairness
          </Text>
          <Text selectable style={[styles.bodyText, { color: theme.muted, marginBottom: 16 }]}>
            JeetoBaz is designed to provide eligible participants with a clear, secure and trustworthy prize campaign experience.{'\n\n'}
            From account registration and payment verification to live winner selection and documented prize delivery, every stage follows a transparent and structured process.
          </Text>

          <View style={[styles.promiseBox, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
            <View style={styles.promiseTitleRow}>
              <Award color={theme.primary} size={19} />
              <Text style={[styles.promiseTitle, { color: theme.primary }]}>Our Promise</Text>
            </View>
            <Text selectable style={[styles.promiseText, { color: theme.text }]}>
              Every verified participant receives an equal opportunity to win.{'\n\n'}
              JeetoBaz does not manually choose winners, modify verified tickets or alter completed draw results. Winners are selected through the JeetoBaz automated random draw system from all eligible campaign tickets.
            </Text>
          </View>

          <View style={[styles.worksSearchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Search color={theme.subtle} size={20} />
            <TextInput
              value={whyQuery}
              onChangeText={setWhyQuery}
              placeholder="Search why JeetoBaz..."
              placeholderTextColor={theme.subtle}
              style={[styles.worksSearchInput, { color: theme.text }]}
            />
          </View>

          <View style={styles.worksList}>
            {filteredWhyFaqs.map((item) => {
              const expanded = openWhyItem === item.question;
              const Icon = item.icon;
              return (
                <View
                  key={item.question}
                  style={[styles.worksCard, { backgroundColor: theme.surface, borderColor: expanded ? theme.gold : theme.border }]}
                >
                  <TouchableOpacity
                    style={styles.worksQuestionRow}
                    onPress={() => setOpenWhyItem(expanded ? null : item.question)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                  >
                    <View style={[styles.worksIconBox, { backgroundColor: theme.background }]}>
                      <Icon color={item.iconColor} size={20} />
                    </View>
                    <Text style={[styles.worksQuestionText, { color: theme.gold, flex: 1 }]}>{item.question}</Text>
                    {expanded ? (
                      <ChevronDown color={theme.gold} size={21} />
                    ) : (
                      <ChevronRight color={theme.subtle} size={21} />
                    )}
                  </TouchableOpacity>
                  {expanded ? (
                    <View style={[styles.worksAnswerBox, { borderTopColor: theme.border }]}>
                      <Text selectable style={[styles.worksAnswerText, { color: theme.muted }]}>{item.answer}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {filteredWhyFaqs.length === 0 ? (
            <View style={styles.worksEmpty}>
              <Text style={[styles.worksEmptyTitle, { color: theme.gold }]}>No matching reason found</Text>
            </View>
          ) : null}

          <Text selectable style={[styles.subheading, { color: theme.gold }]}>Why Participants Can Trust JeetoBaz</Text>
          {WHY_TRUST_ITEMS.map((item) => (
            <View key={item.title} style={[styles.trustCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <ShieldCheck color={theme.gold} size={20} />
              <View style={styles.trustCardText}>
                <Text selectable style={[styles.trustCardTitle, { color: theme.gold }]}>{item.title}</Text>
                <Text selectable style={[styles.trustCardDesc, { color: theme.muted }]}>{item.desc}</Text>
              </View>
            </View>
          ))}

          <Text selectable style={[styles.subheading, { color: theme.gold }]}>Quick Facts</Text>
          {WHY_QUICK_FACTS.map(([label, value]) => (
            <InfoLine key={label} label={label} value={value} />
          ))}

          <SectionCard title="Our Commitment to Every Participant" icon={<HeartHandshake color="#14B8A6" size={22} />}>
            {'JeetoBaz is committed to operating with transparency, fairness, security and accountability.\n\nWe aim to provide every verified participant with:\n• Clear campaign information\n• Accurate payment verification\n• A unique ticket number\n• Transparent campaign progress\n• Advance draw notifications\n• Equal participation opportunity\n• Automated winner selection\n• Verified winner records\n• Secure prize delivery\n• Reliable customer support'}
          </SectionCard>

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
          <TouchableOpacity style={[styles.navButtonRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => router.push('/explore')}>
            <View style={[styles.navButtonIcon, { backgroundColor: theme.primarySoft }]}><Trophy color="#FFD700" size={21} /></View>
            <Text style={[styles.navButtonText, { color: theme.gold }]}>View Past Winners</Text>
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

          <View style={[styles.statusStrip, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
            <Text style={[styles.statusStripText, { color: theme.primary }]}>Secure Accounts · Verified Payments · Fair Draws · Protected Data</Text>
          </View>

          <Text selectable style={[styles.leadText, { color: theme.text }]}>
            Built to Protect Every Participant
          </Text>
          <Text selectable style={[styles.bodyText, { color: theme.text, marginBottom: 16 }]}>
            Trust is central to the JeetoBaz experience. Our platform is designed around secure account access, controlled payment verification, privacy protection, transparent campaign records and fair winner selection.{'\n\n'}
            We use structured processes to protect participants from unauthorized access, fraudulent activity, duplicate accounts, invalid payments and manipulation of campaign results.
          </Text>

          <View style={[styles.worksSearchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Search color={theme.subtle} size={20} />
            <TextInput
              value={securityQuery}
              onChangeText={setSecurityQuery}
              placeholder="Search trust & security..."
              placeholderTextColor={theme.subtle}
              style={[styles.worksSearchInput, { color: theme.text }]}
            />
          </View>

          <View style={styles.worksList}>
            {filteredSecurityFaqs.map((item) => {
              const expanded = openSecurityItem === item.question;
              const Icon = item.icon;
              return (
                <View
                  key={item.question}
                  style={[styles.worksCard, { backgroundColor: theme.surface, borderColor: expanded ? theme.gold : theme.border }]}
                >
                  <TouchableOpacity
                    style={styles.worksQuestionRow}
                    onPress={() => setOpenSecurityItem(expanded ? null : item.question)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                  >
                    <View style={[styles.worksIconBox, { backgroundColor: theme.background }]}>
                      <Icon color={item.iconColor} size={20} />
                    </View>
                    <Text style={[styles.worksQuestionText, { color: theme.gold, flex: 1 }]}>{item.question}</Text>
                    {expanded ? (
                      <ChevronDown color={theme.gold} size={21} />
                    ) : (
                      <ChevronRight color={theme.subtle} size={21} />
                    )}
                  </TouchableOpacity>
                  {expanded ? (
                    <View style={[styles.worksAnswerBox, { borderTopColor: theme.border }]}>
                      <Text selectable style={[styles.worksAnswerText, { color: theme.text }]}>{item.answer}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {filteredSecurityFaqs.length === 0 ? (
            <View style={styles.worksEmpty}>
              <Text style={[styles.worksEmptyTitle, { color: theme.gold }]}>No matching topic found</Text>
            </View>
          ) : null}

          <SectionCard title="Your Security Responsibilities" icon={<ShieldCheck color="#10B981" size={22} />}>
            {SECURITY_RESPONSIBILITIES}
          </SectionCard>

          <SectionCard title="Our Security Commitment" icon={<HeartHandshake color="#14B8A6" size={22} />}>
            {SECURITY_COMMITMENT}
          </SectionCard>

          <Text selectable style={[styles.subheading, { color: theme.gold }]}>Trust Badges</Text>
          <View style={styles.badgesRow}>
            {TRUST_BADGES.map((badge) => (
              <View key={badge} style={[styles.badge, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
                <CircleCheck color={theme.primary} size={14} />
                <Text style={[styles.badgeText, { color: theme.primary }]}>{badge}</Text>
              </View>
            ))}
          </View>

          <Text selectable style={[styles.subheading, { color: theme.gold }]}>Explore More</Text>
          <TouchableOpacity style={[styles.navButtonRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => router.push('/privacy')}>
            <View style={[styles.navButtonIcon, { backgroundColor: theme.primarySoft }]}><Lock color="#3B82F6" size={21} /></View>
            <Text style={[styles.navButtonText, { color: theme.gold }]}>Read Privacy Policy</Text>
            <ChevronRight color={theme.subtle} size={19} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navButtonRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setSelected('works')}>
            <View style={[styles.navButtonIcon, { backgroundColor: theme.primarySoft }]}><Rocket color="#F97316" size={21} /></View>
            <Text style={[styles.navButtonText, { color: theme.gold }]}>How the Draw Works</Text>
            <ChevronRight color={theme.subtle} size={19} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navButtonRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setSelected('support')}>
            <View style={[styles.navButtonIcon, { backgroundColor: theme.primarySoft }]}><ShieldAlert color="#EF4444" size={21} /></View>
            <Text style={[styles.navButtonText, { color: theme.gold }]}>Report a Security Concern</Text>
            <ChevronRight color={theme.subtle} size={19} />
          </TouchableOpacity>
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
          <DetailHero icon={<Scale color="#6366F1" size={38} />} title="Responsible Use Policy" />
          <Text selectable style={[styles.policyDate, { color: theme.gold, marginBottom: 16 }]}>Last Updated: 2026</Text>

          <View style={[styles.worksSearchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Search color={theme.subtle} size={20} />
            <TextInput
              value={legalQuery}
              onChangeText={setLegalQuery}
              placeholder="Search Responsible Use Policy..."
              placeholderTextColor={theme.subtle}
              style={[styles.worksSearchInput, { color: theme.text }]}
            />
          </View>

          <View style={styles.worksList}>
            {filteredLegalFaqs.map((item) => {
              const expanded = openLegalItem === item.question;
              const Icon = item.icon;
              return (
                <View
                  key={item.question}
                  style={[styles.worksCard, { backgroundColor: theme.surface, borderColor: expanded ? theme.gold : theme.border }]}
                >
                  <TouchableOpacity
                    style={styles.worksQuestionRow}
                    onPress={() => setOpenLegalItem(expanded ? null : item.question)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                  >
                    <View style={[styles.worksIconBox, { backgroundColor: theme.background }]}>
                      <Icon color={item.iconColor} size={20} />
                    </View>
                    <Text style={[styles.worksQuestionText, { color: theme.gold, flex: 1 }]}>{item.question}</Text>
                    {expanded ? (
                      <ChevronDown color={theme.gold} size={21} />
                    ) : (
                      <ChevronRight color={theme.subtle} size={21} />
                    )}
                  </TouchableOpacity>
                  {expanded ? (
                    <View style={[styles.worksAnswerBox, { borderTopColor: theme.border }]}>
                      <Text selectable style={[styles.worksAnswerText, { color: theme.muted }]}>{item.answer}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {filteredLegalFaqs.length === 0 ? (
            <View style={styles.worksEmpty}>
              <Text style={[styles.worksEmptyTitle, { color: theme.gold }]}>No matching section found</Text>
            </View>
          ) : null}

          <Text selectable style={[styles.subheading, { color: theme.gold }]}>Explore More</Text>
          <TouchableOpacity style={[styles.navButtonRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => router.push('/terms')}>
            <View style={[styles.navButtonIcon, { backgroundColor: theme.primarySoft }]}><ScrollText color="#3B82F6" size={21} /></View>
            <Text style={[styles.navButtonText, { color: theme.gold }]}>Read Terms & Conditions</Text>
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
  policyDate: { fontSize: 13, fontWeight: '700', marginTop: 5, marginBottom: 13 },
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
  promiseBox: { borderWidth: 1, borderRadius: 16, padding: 18, marginBottom: 16 },
  promiseTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 },
  promiseTitle: { fontSize: 17, fontWeight: '800' },
  promiseText: { fontSize: 14, lineHeight: 22 },
  statusStrip: { borderWidth: 1, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14, alignItems: 'center', marginBottom: 16 },
  statusStripText: { fontSize: 12, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
});
