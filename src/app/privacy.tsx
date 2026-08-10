import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';
import Head from 'expo-router/head';
import { Lock } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { breadcrumbSchema, pageSchema } from '@/lib/structured-data';
import { getStoredValue } from '@/lib/storage';
import { useSafeBack } from '@/lib/safe-back';

const SUPPORT_EMAIL = 'privacy@jeetobaz.pk';
const SUPPORT_WHATSAPP = '+92 337 2561482';
const SUPPORT_WHATSAPP_LINK = 'https://wa.me/923372561482';

const PRIVACY_FAQS = [
  {
    category: 'Overview',
    question: 'Introduction',
    answer:
      "Welcome to JeetoBaz.\n\nYour privacy is important to us. This Privacy Policy explains how JeetoBaz collects, uses, stores, protects, shares and processes your personal information when you access or use our website, mobile applications, products, prize campaigns and related services.\n\nJeetoBaz is committed to protecting your personal information while providing a secure, transparent and trusted platform for participating in verified prize campaigns through our Verified Fair Draw System.\n\nBy using JeetoBaz, creating an account, purchasing entries or accessing any part of the Platform, you acknowledge that you have read and understood this Privacy Policy.\n\nIf you do not agree with this Privacy Policy, you should discontinue using the Platform.",
  },
  {
    category: 'Overview',
    question: 'Scope of this Privacy Policy',
    answer:
      'This Privacy Policy applies to all JeetoBaz services including:\n• Official Website\n• Android Application\n• iOS Application\n• Mobile Website\n• Desktop Website\n• Customer Support\n• Admin-managed Services\n• Prize Campaigns\n• Winner Verification\n• Payment Verification\n• Future Wallet Services\n• Future Referral Program\n• Future Features and Services introduced by JeetoBaz\n\nThis Privacy Policy applies regardless of the device you use.',
  },
  {
    category: 'Overview',
    question: 'Who We Are',
    answer:
      'JeetoBaz is a Pakistan-based online prize draw platform that enables eligible users to participate in prize campaigns through verified entries.\n\nOur Platform is designed to provide transparent prize campaigns where winners are selected through a random system after campaign requirements are fulfilled.',
  },
  {
    category: 'Information We Collect',
    question: 'Information We Collect',
    answer:
      'Depending on how you use JeetoBaz, we may collect different categories of information.\n\n4.1 Personal Information\nWe may collect personal information including: Full Name, Mobile Number, Email Address, Date of Birth, CNIC Number, Residential Address, Province, City, Postal Code, Nationality, Gender (where applicable), Profile Photo (optional), Verification Documents, Selfie Verification (if introduced in the future).\n\n4.2 Account Information\nWhen you create a JeetoBaz account, we may collect: Username, User ID, Registration Date, Login History, Account Status, Referral Code, Referral History, Wallet Information (when available), Account Preferences.\n\n4.3 Identity Verification Information (KYC)\nTo maintain platform security and comply with legal requirements, JeetoBaz may collect: CNIC images, CNIC number, Identity verification results, Selfie verification, Address verification, Supporting documents, Additional verification information where reasonably required. Verification information is collected solely for security, fraud prevention and legal compliance.\n\n4.4 Prize Participation Information\nWhen participating in prize campaigns, we may collect: Prize Campaign Joined, Entry Numbers, Ticket Numbers, Purchase History, Draw Participation History, Winning History, Prize Claim Information, Prize Delivery Status, Verification Status.\n\n4.5 Payment Information\nWhen payments are made through JeetoBaz, we may collect information necessary to process and verify transactions, including: Transaction ID, Payment Method, Payment Amount, Transaction Date, Payment Status, Payment Reference Number, Payment Verification Details, Receipt or Screenshot (where required for verification). JeetoBaz does not intentionally store complete payment card information unless required by law or processed by an authorized payment provider.',
  },
  {
    category: 'Information We Collect',
    question: 'Information Collected Automatically',
    answer:
      'When you use the Platform, certain technical information may be collected automatically.\n\nThis may include: Device Type, Device Model, Operating System, Browser Type, Browser Version, Language Preference, Screen Resolution, Time Zone, Login Date and Time, Session Information, IP Address, Network Information, App Version, Crash Logs, Performance Information, Security Events.\n\nThis information helps us improve platform performance, detect fraud and maintain security.',
  },
  {
    category: 'Information We Collect',
    question: 'Login Information',
    answer:
      'JeetoBaz currently supports or may support the following authentication methods: Mobile Number Login, Email Login, Google Login, Apple Login, Facebook Login.\n\nTo verify user identity, JeetoBaz may send One-Time Passwords (OTPs) or authentication requests using one or more trusted service providers. The providers used may change over time without affecting this Privacy Policy.',
  },
  {
    category: 'Information We Collect',
    question: 'Cookies and Similar Technologies',
    answer:
      'JeetoBaz uses cookies and similar technologies to improve functionality, security and user experience. Depending on the Platform, cookies may be categorized as:\n\nEssential Cookies\nThese cookies are required for the Platform to function properly. They may be used for: User authentication, Login sessions, Security, Fraud prevention, Language preferences, Essential platform functionality. These cookies cannot generally be disabled without affecting the operation of the Platform.\n\nAnalytics Cookies\nAnalytics cookies help JeetoBaz understand how visitors interact with the Platform. They may collect information such as: Page visits, Navigation patterns, Session duration, Device information, Performance statistics. This information helps improve the quality, performance and usability of JeetoBaz.\n\nMarketing Cookies\nMarketing cookies may be used to: Display relevant promotions, Measure campaign performance, Improve advertising effectiveness, Prevent repetitive advertisements, Understand user interests. Marketing cookies will always be used in accordance with applicable law.',
  },
  {
    category: 'Information We Collect',
    question: 'Device Permissions',
    answer:
      'Depending on your device and the features you use, JeetoBaz may request permission to access: Camera, Photo Gallery, Storage, Notifications, Phone State (where necessary), Internet Connection.\n\nPermissions are requested only when required for the relevant feature, such as uploading verification documents, claiming prizes or receiving important notifications.\n\nUsers may manage permissions through their device settings, although disabling certain permissions may limit some Platform functionality.',
  },
  {
    category: 'Information We Collect',
    question: 'Accuracy of Information',
    answer:
      'Users are responsible for ensuring that the personal information they provide is accurate, complete and up to date.\n\nProviding false, incomplete or misleading information may:\n• delay verification;\n• affect prize claims;\n• restrict account access; or\n• result in action under the JeetoBaz Terms & Conditions.',
  },
  {
    category: 'How We Use Data',
    question: 'How We Use Your Information',
    answer:
      'JeetoBaz may use personal information for the following purposes:\n• Creating and managing user accounts\n• Verifying mobile numbers and email addresses\n• Authenticating users\n• Conducting identity and KYC verification\n• Processing prize campaign entries\n• Generating entry and ticket numbers\n• Confirming payments\n• Maintaining transaction records\n• Scheduling and conducting prize draws\n• Verifying winners\n• Delivering or handing over prizes\n• Responding to support requests\n• Preventing fraud and platform misuse\n• Detecting duplicate or suspicious accounts\n• Securing the Platform\n• Complying with legal obligations\n• Improving services and user experience\n• Sending operational and promotional communications\n• Managing referrals, wallets and future Platform features\n\nJeetoBaz will only use personal information for legitimate business, security, contractual and legal purposes connected with operating the Platform.',
  },
  {
    category: 'How We Use Data',
    question: 'Account Administration',
    answer:
      'We may process personal information to:\n• Register your account\n• Confirm your identity\n• Maintain your profile\n• Recover account access\n• Reset passwords or authentication credentials\n• Verify account ownership\n• Update contact information\n• Manage account restrictions\n• Process account deletion requests\n• Investigate unauthorized access\n\nWhere one CNIC or mobile number is limited to one account, information may also be checked to prevent duplicate registrations and misuse.',
  },
  {
    category: 'How We Use Data',
    question: 'Prize Campaign Participation',
    answer:
      'JeetoBaz may use your information to manage participation in prize campaigns, including:\n• Recording purchased entries\n• Assigning unique ticket numbers\n• Linking entries to the correct campaign\n• Showing participation history\n• Confirming whether an entry is valid\n• Preventing duplicate or unauthorized participation\n• Conducting the relevant draw\n• Maintaining draw and winner records\n• Resolving campaign disputes\n\nCampaign information may be retained where reasonably necessary for transparency, record keeping, fraud prevention and legal compliance.',
  },
  {
    category: 'How We Use Data',
    question: 'Payment Processing and Verification',
    answer:
      'Payment information may be used to:\n• Initiate or confirm transactions\n• Match payments with user accounts\n• Verify receipts and transaction references\n• Create valid prize campaign entries\n• Detect failed or duplicate payments\n• Process eligible refunds\n• Issue wallet credit where available\n• Resolve payment disputes\n• Investigate chargebacks or fraud\n• Maintain financial and accounting records\n\nJeetoBaz may share limited transaction information with authorized payment providers, banks, wallets and financial institutions where required to process or investigate a transaction.\n\nComplete card credentials are generally processed directly by authorized payment providers and are not intended to be stored by JeetoBaz.',
  },
  {
    category: 'How We Use Data',
    question: 'Identity and Winner Verification',
    answer:
      'JeetoBaz may process identity information before allowing certain account activities or releasing a prize.\n\nThis may include verification of: Full legal name, Age, CNIC, Mobile number, Email address, Residential address, Account ownership, Eligibility to participate, Winning ticket ownership, Supporting documents.\n\nWinner verification helps ensure that prizes are issued only to eligible and genuine participants. High-value prizes may require additional verification, documentation or in-person confirmation.',
  },
  {
    category: 'How We Use Data',
    question: 'Fraud Prevention and Platform Security',
    answer:
      'JeetoBaz may use personal, technical and transaction information to detect and prevent: Multiple accounts, Identity theft, Fake or altered documents, Unauthorized payments, Stolen payment methods, Chargeback abuse, Automated bots or scripts, Referral abuse, Account takeover, Suspicious login activity, Ticket manipulation, Draw interference, Other unlawful or abusive conduct.\n\nSecurity reviews may involve automated checks and manual investigation. Where suspicious activity is detected, JeetoBaz may temporarily restrict an account, request additional verification or take other action permitted by its Terms & Conditions and applicable law.',
  },
  {
    category: 'How We Use Data',
    question: 'Customer Support',
    answer:
      'When users contact JeetoBaz support, we may use and retain: Name, Account details, Contact information, Subject and message, Screenshots, Payment evidence, Device information, Support history, Call, email or chat correspondence, Other information voluntarily provided.\n\nThis information may be used to investigate and resolve the request, maintain service quality and prevent repeated fraud or misuse. Users should avoid sending unnecessary sensitive information through support channels.',
  },
  {
    category: 'How We Use Data',
    question: 'Service Improvement and Analytics',
    answer:
      'JeetoBaz may use technical, usage and analytics information to: Understand how users interact with the Platform, Identify popular features, Improve navigation and usability, Diagnose errors, Monitor page and app performance, Improve accessibility, Test new features, Prevent service interruptions, Measure campaign effectiveness, Improve overall Platform security.\n\nAnalytics data may be aggregated or anonymized where reasonably possible. Analytics tools may place cookies or collect technical identifiers subject to user consent and applicable cookie settings.',
  },
  {
    category: 'How We Use Data',
    question: 'Legal Bases and Grounds for Processing',
    answer:
      'JeetoBaz may process personal information on one or more of the following grounds:\n\nPerformance of a Contract\nProcessing may be necessary to: Create and manage an account, Process entries, Confirm payments, Operate prize campaigns, Verify winners, Deliver prizes, Provide customer support.\n\nConsent\nConsent may be relied upon for activities such as: Marketing communications, Non-essential cookies, Promotional photographs or videos, Optional device permissions, Certain future features. Users may withdraw consent where applicable, although withdrawal will not affect processing already lawfully completed.\n\nLegitimate Business Interests\nJeetoBaz may process information where reasonably necessary to: Secure the Platform, Prevent fraud, Improve services, Resolve disputes, Maintain accurate records, Protect users and business operations.\n\nLegal Obligations\nInformation may be processed where necessary to comply with: Court orders, Government requirements, Tax obligations, Financial reporting requirements, Law-enforcement requests, Other applicable legal duties.',
  },
  {
    category: 'Communications',
    question: 'Communications and Notifications',
    answer:
      'JeetoBaz may communicate with users through: SMS, Email, WhatsApp, Push notifications, In-app notifications, Phone calls, Website notices, Other official communication channels.\n\nCommunications may include: OTP and login messages, Payment confirmations, Entry confirmations, Draw updates, Draw scheduling notices, Winner notifications, Prize verification requests, Delivery updates, Account security alerts, Support responses, Policy updates, New draw announcements, Promotional offers.\n\nUsers are responsible for maintaining accurate contact information.',
  },
  {
    category: 'Communications',
    question: 'Essential Communications',
    answer:
      'Some communications are necessary for operating the Platform and cannot ordinarily be disabled while an account remains active.\n\nThese may include: OTP messages, Login alerts, Payment confirmations, Security warnings, Entry confirmations, Winner notifications, Prize claim instructions, Account or policy notices, Support responses, Legal communications.\n\nThese messages are operational rather than promotional.',
  },
  {
    category: 'Communications',
    question: 'Marketing Communications',
    answer:
      'With user consent or where otherwise permitted by law, JeetoBaz may send marketing communications concerning: New prize campaigns, Promotional offers, Featured prizes, Referral programs, Special events, Platform announcements, User engagement campaigns.\n\nMarketing messages may be personalized based on account preferences, activity or general interests.\n\nJeetoBaz will not require users to accept optional marketing communications as a condition of receiving essential Platform services, except where a communication is directly related to the service requested.',
  },
  {
    category: 'Communications',
    question: 'Marketing Preferences and Opt-Out',
    answer:
      'Users may withdraw from optional marketing communications through: An unsubscribe link, Notification settings, Account preferences, Contacting Customer Support, Replying with an available opt-out instruction, Device notification settings.\n\nAfter an opt-out request, JeetoBaz may require a reasonable period to update its communication systems. Users may continue to receive essential operational, security, payment and legal communications.',
  },
  {
    category: 'Sharing & Third Parties',
    question: 'Sharing of Personal Information',
    answer:
      'JeetoBaz does not sell personal information. Personal information may be shared only where reasonably necessary with authorized recipients, including: Payment gateways, Banks and wallet providers, Courier and logistics companies, SMS and OTP providers, Email service providers, WhatsApp communication providers, Hosting and database providers, Identity verification providers, Cloud and security providers, Customer support tools, Professional advisers, Government authorities, Courts and law-enforcement agencies.\n\nOnly information reasonably required for the relevant purpose should be shared.',
  },
  {
    category: 'Sharing & Third Parties',
    question: 'Payment Providers',
    answer:
      'Payment providers may receive information such as: Name, Mobile number, Email address, Payment amount, Order or transaction reference, Campaign reference, Payment status, Technical transaction information.\n\nPayment providers operate under their own privacy policies and legal obligations. JeetoBaz is not responsible for independent processing performed solely by a payment provider outside JeetoBaz\'s control, but will select providers with reasonable attention to security and reliability.',
  },
  {
    category: 'Sharing & Third Parties',
    question: 'OTP and Communication Providers',
    answer:
      'JeetoBaz may use multiple providers to deliver: OTP messages, SMS alerts, Email messages, WhatsApp messages, Push notifications, Security notifications.\n\nThese providers may receive limited information such as: Mobile number, Email address, Message content, Delivery status, Device token, Communication timestamp.\n\nProviders may change over time based on availability, reliability, cost, security or operational requirements.',
  },
  {
    category: 'Sharing & Third Parties',
    question: 'Courier and Prize Delivery Partners',
    answer:
      'Where a user wins a physical prize, JeetoBaz may share information with an authorized delivery or logistics provider.\n\nThis may include: Winner\'s name, Mobile number, Delivery address, City, Delivery instructions, Prize description, Verification or collection reference.\n\nCourier partners should use this information only for delivery, communication, identity confirmation and related logistics purposes.',
  },
  {
    category: 'Sharing & Third Parties',
    question: 'Hosting, Database and Technology Providers',
    answer:
      'JeetoBaz may use third-party providers for: Website hosting, Application hosting, Databases, Authentication, Cloud infrastructure, File storage, Backups, Security monitoring, Error reporting, Customer support, Communication delivery.\n\nThese providers may process information on JeetoBaz\'s behalf under contractual, technical or legal safeguards. The identity of individual service providers may change as the Platform develops.',
  },
  {
    category: 'Sharing & Third Parties',
    question: 'Social Login Providers',
    answer:
      'Where a user chooses to sign in through Google, Apple or Facebook, JeetoBaz may receive information permitted by the user and the relevant provider.\n\nThis may include: Name, Email address, Provider account identifier, Profile image, Authentication token, Other approved profile information.\n\nJeetoBaz does not receive the user\'s password for the third-party account. The third-party provider separately processes information under its own privacy policy.',
  },
  {
    category: 'Sharing & Third Parties',
    question: 'Legal and Government Disclosures',
    answer:
      'JeetoBaz may disclose personal information where it reasonably believes disclosure is necessary to: Comply with Pakistani law, Respond to a lawful court order, Cooperate with competent authorities, Investigate fraud or financial crime, Enforce Terms & Conditions, Protect Platform security, Protect the rights or safety of users, Establish, exercise or defend legal claims, Fulfil tax, audit or reporting obligations.\n\nJeetoBaz will seek to disclose only information reasonably relevant to the lawful request.',
  },
  {
    category: 'Sharing & Third Parties',
    question: 'Business Reorganization',
    answer:
      'If JeetoBaz undergoes a lawful Merger, Acquisition, Investment, Restructuring, Sale of business assets, or Transfer of operations, personal information may be reviewed or transferred as part of the transaction, subject to confidentiality, applicable law and reasonable privacy safeguards.\n\nAny successor operating JeetoBaz would be expected to continue handling information consistently with this Privacy Policy or provide notice of material changes.',
  },
  {
    category: 'Storage & Security',
    question: 'Data Storage',
    answer:
      'JeetoBaz may store personal information using secure servers, cloud infrastructure, databases, authentication systems and authorized service providers.\n\nInformation may be stored in one or more locations depending on: the service being used; the selected technology provider; operational requirements; security needs; backup arrangements; and legal or regulatory obligations.\n\nJeetoBaz does not guarantee that all information will remain stored in Pakistan. Some authorized service providers may process or store information in other countries.',
  },
  {
    category: 'Storage & Security',
    question: 'Data Security',
    answer:
      'JeetoBaz uses reasonable administrative, technical and organizational safeguards designed to protect personal information against: unauthorized access; accidental loss; misuse; alteration; destruction; disclosure; account takeover; fraudulent activity; and other security threats.\n\nSecurity measures may include: encrypted communications; access controls; password protection; authentication controls; OTP verification; role-based permissions; database security; monitoring and logging; software updates; fraud detection; restricted administrative access; backup procedures; and security reviews.\n\nNo internet-based platform or electronic storage system can be guaranteed to be completely secure. Users should also take reasonable steps to protect their accounts and devices.',
  },
  {
    category: 'Storage & Security',
    question: 'User Security Responsibilities',
    answer:
      'Users are responsible for: keeping passwords, OTPs and login credentials confidential; using secure devices and internet connections; not sharing account access; keeping registered contact details updated; logging out from shared devices; avoiding suspicious links and unofficial payment requests; promptly reporting unauthorized activity; and protecting their email, mobile and social-login accounts.\n\nJeetoBaz will never ask users to publicly disclose their password or OTP.',
  },
  {
    category: 'Storage & Security',
    question: 'Security Incident Response',
    answer:
      'Where JeetoBaz becomes aware of a confirmed security incident involving personal information, it may: investigate the incident; restrict affected systems; take corrective security measures; preserve relevant evidence; notify affected users where reasonably necessary; notify service providers or competent authorities where required; and take steps to reduce further risk.\n\nThe nature and timing of any notification will depend on the circumstances, available information and applicable legal requirements.',
  },
  {
    category: 'Storage & Security',
    question: 'International Data Transfers',
    answer:
      'Some service providers used by JeetoBaz may operate servers or processing facilities outside Pakistan. As a result, personal information may be transferred to, stored in or processed in another country.\n\nWhere such transfers occur, JeetoBaz will take reasonable steps to use reputable providers and appropriate contractual, technical or organizational safeguards. Users acknowledge that privacy and data-protection laws may differ between countries.',
  },
  {
    category: 'Data Retention',
    question: 'Data Retention',
    answer:
      'JeetoBaz retains personal information only for as long as reasonably necessary for the purpose for which it was collected or as required for legitimate business, security, contractual or legal reasons.\n\nRetention periods may depend on: account status; campaign participation; transaction history; prize claims; support matters; fraud investigations; tax and accounting requirements; legal disputes; regulatory obligations; and security requirements.\n\nDifferent categories of information may be retained for different periods.',
  },
  {
    category: 'Data Retention',
    question: 'Account Information Retention',
    answer:
      'While an account remains active, JeetoBaz may retain the information required to operate and secure that account.\n\nAfter account closure or deletion, JeetoBaz may retain limited information where reasonably necessary to: complete pending transactions; resolve prize or payment matters; prevent fraud; comply with legal duties; maintain accounting records; enforce agreements; defend legal claims; and prevent repeated misuse or unauthorized re-registration.\n\nAccount deletion does not necessarily require immediate deletion of every record where retention is legally or operationally justified.',
  },
  {
    category: 'Data Retention',
    question: 'Transaction and Campaign Records',
    answer:
      'JeetoBaz may retain records relating to: payments; refunds; wallet adjustments; campaign entries; ticket numbers; draw participation; winner selection; prize delivery; and dispute resolution.\n\nThese records may be retained to support transparency, accounting, auditing, fraud prevention and legal compliance.',
  },
  {
    category: 'Data Retention',
    question: 'KYC and Verification Records',
    answer:
      'Identity and KYC information may be retained for as long as reasonably necessary to: verify account ownership; validate eligibility; confirm winners; prevent duplicate accounts; investigate fraud; comply with legal obligations; and resolve disputes.\n\nWhere full verification documents are no longer required, JeetoBaz may retain limited verification results or audit records instead of complete copies, where operationally appropriate.',
  },
  {
    category: 'Data Retention',
    question: 'Backup Copies',
    answer:
      'Deleted or updated information may remain temporarily in secure backup systems until normal backup-rotation or deletion processes are completed.\n\nBackup copies are generally not used for ordinary business operations and may be retained for system recovery, continuity and security purposes.',
  },
  {
    category: 'Public Info & Children',
    question: 'Public Winner Information',
    answer:
      'To maintain transparency and demonstrate genuine prize delivery, JeetoBaz may publish limited winner information.\n\nThis may include: first name; city; campaign or prize name; winning ticket reference; winner photograph; prize-handover photograph or video; winner statement or interview; and draw date.\n\nJeetoBaz will not intentionally publish sensitive details such as: full CNIC number; complete residential address; payment credentials; private account credentials; or other unnecessary sensitive information.\n\nWinner publicity remains subject to the Terms & Conditions, applicable consent requirements and law.',
  },
  {
    category: 'Public Info & Children',
    question: "Children's Privacy",
    answer:
      'JeetoBaz is intended only for individuals who are 18 years of age or older. Individuals below 18 years are not permitted to: create an account; purchase entries; participate in prize campaigns; or claim prizes through the Platform.\n\nJeetoBaz does not knowingly seek to collect personal information from children. Where JeetoBaz becomes aware that an account belongs to a person below the permitted age, it may: restrict or close the account; investigate the registration; remove information where appropriate; and take other action under its Terms & Conditions.\n\nA parent or legal guardian who believes that a minor has provided information may contact JeetoBaz through the official privacy contact.',
  },
  {
    category: 'Your Rights & Choices',
    question: 'Your Privacy Rights',
    answer:
      'Subject to applicable law, verification requirements and legitimate exceptions, users may request to: access personal information held by JeetoBaz; receive information about how their data is used; correct inaccurate or incomplete information; update account details; request deletion of an account; withdraw optional marketing consent; manage cookie preferences; object to certain optional processing; request a copy of selected account information; and submit a privacy complaint.\n\nThese rights are not absolute and may be limited where JeetoBaz must retain or process information for legal, security, contractual or fraud-prevention reasons.',
  },
  {
    category: 'Your Rights & Choices',
    question: 'Access Requests',
    answer:
      'Users may request information about the personal data associated with their account.\n\nBefore responding, JeetoBaz may require verification to confirm: identity; account ownership; registered mobile number; registered email address; or other relevant details.\n\nJeetoBaz may refuse or limit a request where it is: fraudulent; abusive; excessive; technically disproportionate; connected to another person\'s privacy; prohibited by law; or likely to compromise security or fraud-detection systems.',
  },
  {
    category: 'Your Rights & Choices',
    question: 'Correction and Update Requests',
    answer:
      'Users may update certain information directly through account settings where available. For information that cannot be edited directly, users may contact support and request correction.\n\nJeetoBaz may request evidence before changing important information such as: legal name; CNIC details; date of birth; registered mobile number; account ownership; or verified address.\n\nHistorical transaction, entry and draw records may not be altered merely because a user later changes profile information.',
  },
  {
    category: 'Your Rights & Choices',
    question: 'Account Deletion',
    answer:
      'JeetoBaz will provide an account-deletion option within the Platform where technically available. Users may also request deletion through an official support or privacy channel.\n\nBefore processing a deletion request, JeetoBaz may require identity and account-ownership verification.\n\nDeletion requests may be delayed or restricted where the account has: an active prize campaign entry; a pending payment or refund; an unresolved dispute; a pending prize claim; an active fraud or security investigation; legal or regulatory obligations; or records that must be retained.\n\nYou can send a deletion request using the buttons at the bottom of this page.',
  },
  {
    category: 'Your Rights & Choices',
    question: 'Effect of Account Deletion',
    answer:
      'After an eligible deletion request is completed:\n• access to the account may be permanently disabled;\n• profile information may be deleted, anonymized or restricted;\n• marketing communications should stop, subject to processing time;\n• unused optional features may become unavailable;\n• future participation may require a new lawful registration, if permitted; and\n• retained legal, transaction or anti-fraud records may remain stored.\n\nAccount deletion does not automatically cancel completed transactions, campaign records, lawful obligations or valid claims that arose before deletion.',
  },
  {
    category: 'Your Rights & Choices',
    question: 'Withdrawal of Consent',
    answer:
      'Where processing is based on consent, users may withdraw that consent through: account settings; notification settings; cookie preferences; unsubscribe controls; device settings; Customer Support; or the official privacy contact.\n\nWithdrawal applies to future processing and does not make earlier lawful processing invalid. Withdrawing consent for an essential function may prevent JeetoBaz from providing the related service.',
  },
  {
    category: 'Your Rights & Choices',
    question: 'Cookie Preferences',
    answer:
      'Users may manage non-essential cookies through available cookie controls or browser settings.\n\nDisabling analytics or marketing cookies may reduce personalization or measurement but should not normally prevent access to basic Platform functions.\n\nEssential cookies may remain active because they support: login; security; session management; fraud prevention; and core Platform operations.',
  },
  {
    category: 'Your Rights & Choices',
    question: 'Notification Controls',
    answer:
      'Users may manage optional promotional notifications through: account settings; application settings; device settings; unsubscribe links; SMS opt-out instructions; or support requests.\n\nOperational and security messages may continue where required to provide the service or protect the account.',
  },
  {
    category: 'Your Rights & Choices',
    question: 'Privacy Complaints',
    answer:
      'Users may submit a privacy complaint where they believe that personal information has been: used incorrectly; disclosed without authority; retained unnecessarily; left inaccurate; inadequately protected; or processed inconsistently with this Privacy Policy.\n\nComplaints should include enough information for JeetoBaz to understand and investigate the concern. JeetoBaz may request identity verification before discussing account-specific information.',
  },
  {
    category: 'Your Rights & Choices',
    question: 'Response Time',
    answer:
      'JeetoBaz will aim to respond to valid privacy and account-deletion requests within a reasonable period.\n\nResponse time may depend on: the nature of the request; identity verification; technical complexity; the amount of information involved; security considerations; pending investigations; and applicable legal requirements.\n\nWhere additional time is reasonably required, JeetoBaz may inform the user.',
  },
  {
    category: 'Third-Party & Advertising',
    question: 'Third-Party Websites and Services',
    answer:
      'The JeetoBaz Platform may contain links to third-party websites, applications, payment pages, social networks or external services. These third parties may include: payment gateways; banks and wallet providers; courier companies; social media platforms; identity-verification providers; communication services; advertising platforms; analytics providers; app stores; and other technology partners.\n\nJeetoBaz does not control the independent privacy practices of third parties. When users leave JeetoBaz or interact directly with a third-party service, the third party\'s own terms and privacy policy may apply. Users should review those policies before providing personal information.',
  },
  {
    category: 'Third-Party & Advertising',
    question: 'Social Media Platforms',
    answer:
      'JeetoBaz may maintain official pages, profiles, groups or channels on platforms such as: Facebook; Instagram; YouTube; WhatsApp; TikTok; X; LinkedIn; and other social or communication platforms.\n\nWhen users interact with JeetoBaz through these platforms, both JeetoBaz and the relevant platform may process information. This may include: public profile information; comments; reactions; messages; usernames; uploaded content; communication history; and engagement information.\n\nThe social platform independently controls its own processing under its privacy policy. Users should avoid publicly posting sensitive information such as CNIC numbers, payment details, passwords, OTPs or residential addresses.',
  },
  {
    category: 'Third-Party & Advertising',
    question: 'Social Login and Linked Accounts',
    answer:
      'Where JeetoBaz supports login through Google, Apple or Facebook, users may choose to connect an external account.\n\nJeetoBaz may receive limited information authorized by the user and the external provider, such as: name; email address; profile image; external account identifier; and authentication information. JeetoBaz does not receive the user\'s password for the external account.\n\nUsers may be able to disconnect a linked account through JeetoBaz settings or the relevant provider\'s account controls. Disconnecting an account may affect the ability to log in unless another authentication method has been added.',
  },
  {
    category: 'Third-Party & Advertising',
    question: 'Automated Processing and Security Decisions',
    answer:
      'JeetoBaz may use automated systems, rules and security checks to help: detect duplicate accounts; identify suspicious logins; monitor unusual transactions; prevent payment fraud; detect referral abuse; identify automated bot activity; protect prize campaigns; prioritize support cases; and reduce platform misuse.\n\nAutomated processing may result in actions such as: requesting additional verification; delaying a transaction; restricting certain functions; flagging an account for manual review; or temporarily suspending activity.\n\nWhere reasonably appropriate, important decisions affecting eligibility, prize claims or permanent account access may be reviewed by authorized personnel. Users may contact JeetoBaz to ask for clarification about a significant account decision, subject to security, confidentiality and fraud-prevention limitations.',
  },
  {
    category: 'Third-Party & Advertising',
    question: 'Profiling and Personalization',
    answer:
      'JeetoBaz may use limited account and activity information to personalize: prize recommendations; campaign displays; notifications; promotions; customer-support responses; and Platform content.\n\nPersonalization may be based on information such as: previous campaign participation; viewed prize categories; general location; device type; notification preferences; and engagement history.\n\nUsers may be able to limit certain personalization through cookie, marketing or notification settings. JeetoBaz will not use sensitive identity documents solely for advertising personalization.',
  },
  {
    category: 'Third-Party & Advertising',
    question: 'Advertising and Marketing Partners',
    answer:
      'Where marketing cookies or advertising tools are enabled with appropriate consent, JeetoBaz may work with advertising or campaign-measurement providers.\n\nThese providers may process information such as: cookie identifiers; device identifiers; browser information; page visits; advertisement interactions; campaign source; general location; and conversion events.\n\nJeetoBaz does not authorize advertising partners to receive CNIC copies, payment credentials or other unnecessary sensitive verification information for advertising purposes. Users may withdraw optional marketing-cookie consent through available cookie settings.',
  },
  {
    category: 'Third-Party & Advertising',
    question: 'Aggregated and Anonymized Information',
    answer:
      'JeetoBaz may create aggregated, statistical or anonymized information that does not reasonably identify an individual.\n\nThis information may be used for: business analysis; platform improvement; performance reporting; security research; campaign planning; service development; and internal reporting.\n\nWhere information has been properly anonymized, it may no longer be treated as personal information under this Privacy Policy. JeetoBaz will not knowingly attempt to re-identify properly anonymized information except where required for security testing or permitted by law.',
  },
  {
    category: 'Third-Party & Advertising',
    question: 'Public Campaign and Draw Records',
    answer:
      'To support transparency, JeetoBaz may publish or retain limited records relating to prize campaigns and completed draws.\n\nThese records may include: campaign name; prize description; draw date; number of valid entries; winning ticket reference; first name of the winner; winner\'s city; verification status; winner photograph or video; and prize handover evidence.\n\nJeetoBaz\'s Platform presents itself as a transparent, Pakistan-focused prize platform using a Verified Fair Draw System. Sensitive personal data will not intentionally be included in public draw records unless legally required or specifically authorized.',
  },
  {
    category: 'Third-Party & Advertising',
    question: 'Confidentiality of Verification Information',
    answer:
      'CNIC records, identity documents, payment evidence and security information are treated as confidential.\n\nAccess should be limited to authorized personnel and service providers who reasonably require the information for: identity verification; winner verification; fraud prevention; payment investigation; legal compliance; prize delivery; or security operations.\n\nUsers must not upload or send verification documents through unofficial JeetoBaz pages, social media comments or unverified contacts.',
  },
  {
    category: 'Legal Compliance',
    question: 'Law-Enforcement and Regulatory Requests',
    answer:
      'JeetoBaz may preserve or disclose personal information when responding to a valid legal, judicial, regulatory or law-enforcement request.\n\nBefore disclosure, JeetoBaz may assess: the authority making the request; the legal basis of the request; the type of information requested; whether the request is sufficiently specific; and whether disclosure is required or permitted by law.\n\nWhere permitted, JeetoBaz will seek to limit disclosure to information reasonably connected to the lawful request. JeetoBaz may be unable to notify a user where notification is prohibited by law or could compromise an investigation.',
  },
  {
    category: 'Legal Compliance',
    question: 'Tax, Accounting and Audit Records',
    answer:
      'JeetoBaz may retain and process transaction information for: accounting; tax reporting; audits; payment reconciliation; financial controls; fraud investigation; and compliance with lawful business-record requirements.\n\nThese records may remain after account deletion where retention is required or reasonably necessary. Financial records will be restricted to authorized personnel and professional advisers as appropriate.',
  },
  {
    category: 'Legal Compliance',
    question: 'Corporate Transactions',
    answer:
      'If JeetoBaz is involved in a lawful merger, acquisition, financing, restructuring, partnership, sale of assets or transfer of operations, personal information may be reviewed or transferred as part of the transaction.\n\nJeetoBaz will take reasonable steps to: maintain confidentiality during the transaction; disclose only information reasonably necessary; require appropriate privacy safeguards; and provide notice where a material change affects users\' information.\n\nA successor organization may continue processing personal information in accordance with this Privacy Policy unless users are informed otherwise.',
  },
  {
    category: 'Policy & Support',
    question: 'Changes to this Privacy Policy',
    answer:
      'JeetoBaz may update this Privacy Policy from time to time to reflect: new services; new technology; legal developments; regulatory requirements; changes in data practices; security improvements; new payment or communication providers; or business changes.\n\nThe updated policy will display a revised Last Updated date.\n\nWhere a change is material, JeetoBaz may provide notice through: the website; the mobile application; email; SMS; push notification; in-app message; or another official communication channel.',
  },
  {
    category: 'Policy & Support',
    question: 'Continued Use After Updates',
    answer:
      'Continued use of JeetoBaz after an updated Privacy Policy becomes effective means that the user acknowledges the revised policy.\n\nWhere consent is legally required for a new optional activity, JeetoBaz will seek appropriate consent rather than relying solely on continued use.\n\nUsers who do not agree with a revised policy may stop using the Platform and request account deletion, subject to lawful retention requirements.',
  },
  {
    category: 'Policy & Support',
    question: 'Relationship with the Terms & Conditions',
    answer:
      'This Privacy Policy should be read together with the JeetoBaz Terms & Conditions and other applicable policies, including: Refund & Cancellation Policy; Shipping Policy; KYC Verification Policy; Cookie Policy; Fair Draw & Winner Selection Policy; Community Guidelines; Responsible Use Policy; AML Policy; and campaign-specific terms.\n\nThe Terms & Conditions govern use of the Platform, while this Privacy Policy explains how personal information is handled. If a conflict arises, the document specifically addressing the relevant subject should apply, subject to applicable law.',
  },
  {
    category: 'Policy & Support',
    question: 'Governing Law',
    answer:
      'This Privacy Policy is governed by and interpreted in accordance with the laws of the Islamic Republic of Pakistan.\n\nNothing in this Privacy Policy limits any privacy, consumer or legal rights that cannot lawfully be excluded.',
  },
  {
    category: 'Policy & Support',
    question: 'Privacy Complaints and Informal Resolution',
    answer:
      'Users are encouraged to contact JeetoBaz first regarding any privacy concern.\n\nA privacy complaint should preferably include: full name; registered mobile number or email; account identifier, where available; description of the concern; relevant dates; supporting screenshots or documents; and the requested resolution.\n\nJeetoBaz may verify the complainant\'s identity before disclosing account-specific information. The parties should make reasonable efforts to resolve the concern through good-faith communication.',
  },
  {
    category: 'Policy & Support',
    question: 'Jurisdiction',
    answer:
      'Where a privacy dispute cannot be resolved informally, it will be subject to the competent courts of Hyderabad, Sindh, Pakistan, unless applicable law requires another forum.\n\nNothing in this section prevents either party from seeking urgent legal relief where permitted by law.',
  },
  {
    category: 'Policy & Support',
    question: 'No Waiver',
    answer:
      'Failure by JeetoBaz to exercise or enforce any right under this Privacy Policy does not amount to a waiver of that right.\n\nA waiver will be effective only where clearly made by an authorized representative and permitted by law.',
  },
  {
    category: 'Policy & Support',
    question: 'Severability',
    answer:
      'If any provision of this Privacy Policy is held to be invalid, unlawful or unenforceable by a competent authority, the remaining provisions will continue to apply to the maximum extent permitted by law.\n\nThe affected provision should be interpreted or modified as narrowly as necessary to make it enforceable where legally possible.',
  },
  {
    category: 'Policy & Support',
    question: 'Language and Interpretation',
    answer:
      'This Privacy Policy may be made available in English, Urdu, Roman Urdu or other languages for user convenience.\n\nWhere legally permitted and a difference in interpretation arises, the English version will control unless JeetoBaz expressly states otherwise.\n\nHeadings are provided for convenience and do not limit the meaning of any provision. Words such as "including" are illustrative and do not create an exhaustive list.',
  },
  {
    category: 'Policy & Support',
    question: 'Contact Information',
    answer:
      'For privacy questions, account-data requests, correction requests, account deletion or complaints, users may contact JeetoBaz through its official channels.\n\nBusiness Name: JeetoBaz\nSupport Email: support@jeetobaz.pk\nPrivacy Email: privacy@jeetobaz.pk\nPhone: 0337 2561482\nWebsite: https://jeetobaz.pk\nOffice Address: Hyderabad, Sindh, Pakistan\n\nUsers should not send passwords, OTPs or complete payment-card credentials by email, WhatsApp or support chat.',
  },
] as const;

export default function PrivacyScreen() {
  const [userName, setUserName] = useState('Not provided');
  const [userPhone, setUserPhone] = useState('Not provided');
  const goBack = useSafeBack();
  const { theme } = useAppTheme();

  useEffect(() => {
    Promise.all([getStoredValue('userName'), getStoredValue('userPhone')]).then(([name, phone]) => {
      setUserName(name || 'Not provided');
      setUserPhone(phone || 'Not provided');
    });
  }, []);

  async function requestAccountDeletion() {
    const subject = encodeURIComponent('[Account Deletion Request] JeetoBaz');
    const body = encodeURIComponent(
      `I request deletion of my JeetoBaz account and associated personal data.\n\nName: ${userName}\nRegistered phone: ${userPhone}\n\nPlease contact me to verify this request and confirm completion.`
    );

    try {
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
    } catch {
      Alert.alert('Unable to open email', `Please email your deletion request to ${SUPPORT_EMAIL}.`);
    }
  }

  async function openWhatsAppDeletionRequest() {
    const message = encodeURIComponent(
      `JeetoBaz account deletion request\n\nName: ${userName}\nRegistered phone: ${userPhone}\n\nPlease verify my account and guide me for deletion.`
    );

    try {
      await Linking.openURL(`${SUPPORT_WHATSAPP_LINK}?text=${message}`);
    } catch {
      Alert.alert('Unable to open WhatsApp', `Please contact JeetoBaz at ${SUPPORT_WHATSAPP}.`);
    }
  }

  const privacySchema = pageSchema('WebPage', '/privacy', 'Privacy Policy', 'Read how JeetoBaz collects, uses, stores, and protects personal information when you access accounts, campaigns, payments, and platform services.');
  const breadcrumb = breadcrumbSchema([{ name: 'Privacy Policy', path: '/privacy' }]);
  return (
    <>
    <Head>
      <title>Privacy Policy | JeetoBaz</title>
      <meta name="robots" content="index, follow" />
      <meta name="description" content="Read how JeetoBaz collects, uses, stores, and protects personal information when you access accounts, campaigns, payments, and platform services." />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Privacy Policy | JeetoBaz" />
      <meta property="og:description" content="Read how JeetoBaz collects, uses, stores, and protects personal information when you access accounts, campaigns, payments, and platform services." />
      <meta property="og:url" content="https://jeetobaz.pk/privacy" />
      <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
      <meta property="og:image:alt" content="JeetoBaz — Pakistan's trusted prize draw platform" />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta property="og:locale" content="en_PK" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content="Privacy Policy | JeetoBaz" />
      <meta name="twitter:description" content="Read how JeetoBaz collects, uses, stores, and protects personal information when you access accounts, campaigns, payments, and platform services." />
      <meta name="twitter:image" content="https://jeetobaz.pk/twitter-image.png" />
      <link rel="canonical" href="https://jeetobaz.pk/privacy" />
      <script type="application/ld+json">{JSON.stringify(privacySchema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
    </Head>
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.gold }]}>
        <TouchableOpacity onPress={goBack}>
          <Text style={[styles.back, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Lock color={theme.gold} size={22} />
          <Text style={[styles.headerTitle, { color: theme.gold }]}>Privacy</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.hero}>
        <Text role="heading" aria-level={1} style={[styles.heroTitle, { color: theme.gold }]}>Privacy Policy</Text>
        <Text style={[styles.heroText, { color: theme.muted }]}>
          This Privacy Policy explains how JeetoBaz collects, uses, stores, and protects information when you use the app or website.
        </Text>
      </View>

      <View style={styles.list}>
        {PRIVACY_FAQS.map((item, index) => (
          <View
            key={item.question}
            style={[
              styles.section,
              { borderBottomColor: theme.border },
              index === PRIVACY_FAQS.length - 1 && styles.sectionLast,
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.gold }]}>{index + 1}. {item.question}</Text>
            <Text style={[styles.sectionAnswer, { color: theme.muted }]}>{item.answer}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.deletionBox, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
        <Text style={[styles.deletionTitle, { color: theme.gold }]}>Delete Your Account</Text>
        <Text style={[styles.deletionText, { color: theme.muted }]}>
          Send a deletion request from your email app. Our support team will verify the account and confirm when the request is completed.
        </Text>
        <TouchableOpacity style={[styles.deleteButton, { backgroundColor: theme.danger }]} onPress={requestAccountDeletion}>
          <Text style={styles.deleteButtonText}>Request by Email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.whatsAppButton, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]} onPress={openWhatsAppDeletionRequest}>
          <Text style={[styles.whatsAppButtonText, { color: theme.primary }]}>Request by WhatsApp</Text>
        </TouchableOpacity>
        <Text style={[styles.emailText, { color: theme.subtle }]}>Privacy Email: {SUPPORT_EMAIL}</Text>
        <Text style={[styles.emailText, { color: theme.subtle }]}>WhatsApp: {SUPPORT_WHATSAPP}</Text>
      </View>

      <Text style={[styles.lastUpdated, { color: theme.subtle }]}>Effective date: June 24, 2026</Text>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 40 },
  header: { borderBottomWidth: 2, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { fontSize: 16, fontWeight: '700' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSpacer: { width: 48 },
  hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 34, paddingBottom: 20 },
  heroTitle: { fontSize: 40, fontWeight: '900', textAlign: 'center' },
  heroText: { fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 680, marginTop: 10 },
  list: { marginHorizontal: 20, marginTop: 10 },
  section: { borderBottomWidth: 1, paddingVertical: 28 },
  sectionLast: { borderBottomWidth: 0 },
  sectionTitle: { fontSize: 28, fontWeight: '900', marginBottom: 12 },
  sectionAnswer: { fontSize: 16, lineHeight: 26 },
  deletionBox: { borderWidth: 1, borderRadius: 12, padding: 18, marginHorizontal: 15, marginTop: 14 },
  deletionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  deletionText: { fontSize: 14, lineHeight: 21 },
  deleteButton: { borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 16 },
  deleteButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  whatsAppButton: { borderWidth: 1, borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 10 },
  whatsAppButtonText: { fontSize: 15, fontWeight: 'bold' },
  emailText: { fontSize: 12, textAlign: 'center', marginTop: 12 },
  lastUpdated: { fontSize: 12, marginTop: 18, marginBottom: 4, textAlign: 'center' },
});
