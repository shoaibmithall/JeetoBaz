import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import Head from 'expo-router/head';
import { ClipboardList } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { breadcrumbSchema, pageSchema } from '@/lib/structured-data';
import { useSafeBack } from '@/lib/safe-back';
import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from '@/lib/contact-info';

const TERMS_FAQS = [
  {
    category: 'Overview',
    question: 'Introduction',
    answer:
      'Welcome to JeetoBaz.\n\nJeetoBaz is a Pakistan-based online prize draw platform that allows eligible participants to enter verified prize campaigns by purchasing entries through the official JeetoBaz website or mobile application. The platform operates using a Verified Fair Draw System, where winners are selected through a random system after all required participant spots have been filled for a campaign.\n\nThese Terms & Conditions ("Terms") govern your access to and use of JeetoBaz, including all products, prize campaigns, entries, features, services, mobile applications, websites, promotional campaigns and future services offered by JeetoBaz.\n\nBy creating an account, accessing the Platform, purchasing an entry, or participating in any prize draw, you confirm that:\n• You have read these Terms.\n• You understand these Terms.\n• You agree to be legally bound by these Terms.\n• You agree to comply with all applicable laws of Pakistan.\n\nIf you do not agree with these Terms, you must immediately discontinue using JeetoBaz.',
  },
  {
    category: 'Overview',
    question: 'Definitions',
    answer:
      'For the purposes of these Terms, the following definitions apply:\n\n"JeetoBaz" — Refers to the JeetoBaz platform, including its website, mobile applications, systems, services, software, employees, representatives and authorized partners.\n\n"Platform" — Means the JeetoBaz website, Android application, iOS application and any future digital service operated by JeetoBaz.\n\n"User" — Any individual visiting or using the Platform.\n\n"Participant" — A registered user who has successfully purchased one or more valid entries into a prize campaign.\n\n"Account" — The personal JeetoBaz account registered by a user.\n\n"Entry" — A valid participation purchased for a specific prize campaign. Each valid entry provides one chance to participate in the corresponding prize draw.\n\n"Prize Campaign" — A promotional campaign offering a specific prize in exchange for eligible entries.\n\n"Winner" — The participant selected by the Verified Fair Draw System after the applicable campaign\'s draw has been conducted.\n\n"Verified Fair Draw System" — The random winner selection process operated by JeetoBaz in which no administrator, employee or participant can manually alter the final draw result.\n\n"Wallet" — Any JeetoBaz Wallet service introduced now or in the future.\n\n"Services" — All products, features, campaigns, software, APIs, payment systems and related services provided by JeetoBaz.',
  },
  {
    category: 'Overview',
    question: 'Acceptance of Terms',
    answer:
      'By accessing or using JeetoBaz you confirm that:\n• You accept these Terms without modification.\n• You agree to all platform policies.\n• You agree to future policy updates.\n• You agree to electronic communication from JeetoBaz.\n• You agree to comply with all applicable Pakistani laws.\n\nThese Terms apply regardless of whether the Platform is accessed through:\n• Website\n• Android Application\n• iPhone Application\n• Tablet\n• Desktop\n• Mobile Browser\n• Future supported devices',
  },
  {
    category: 'Eligibility & Accounts',
    question: 'Eligibility',
    answer:
      'To participate on JeetoBaz you must satisfy all of the following conditions.\n\nAge Requirement\nParticipants must be at least 18 years of age. Users below 18 years are not permitted to create an account or participate in any prize campaign.\n\nResidency\nParticipation is available to:\n• Residents of Pakistan.\n• Overseas Pakistanis who are legally eligible to participate under applicable laws.\nParticipation by other foreign nationals is not currently permitted unless expressly announced by JeetoBaz.\n\nLegal Capacity\nEvery participant confirms that they:\n• are legally capable of entering into a binding agreement;\n• are using the Platform on their own behalf; and\n• are not prohibited by law from participating.',
  },
  {
    category: 'Eligibility & Accounts',
    question: 'Account Registration',
    answer:
      'A registered account is required before purchasing entries or participating in prize campaigns.\n\nDuring registration, users may be required to provide:\n• Full legal name\n• CNIC information\n• Mobile number\n• Email address\n• Date of birth\n• Residential information\n• Other information reasonably requested for verification purposes\n\nUsers agree that all information submitted is true, complete and accurate. Providing false or misleading information constitutes a violation of these Terms.',
  },
  {
    category: 'Eligibility & Accounts',
    question: 'One Account Policy',
    answer:
      'To maintain fairness and prevent abuse:\n• One individual may maintain only one JeetoBaz account.\n• One valid CNIC may be linked to only one account.\n• One mobile number may be linked to only one account.\n\nCreating or operating multiple accounts is strictly prohibited.\n\nWhere JeetoBaz reasonably determines that multiple accounts belong to the same individual, it may:\n• suspend or terminate the duplicate accounts;\n• invalidate affected entries where fraud or abuse is established;\n• restrict future access to the Platform; and\n• take any other action reasonably necessary to protect the integrity of the Platform.',
  },
  {
    category: 'Eligibility & Accounts',
    question: 'Identity Verification (KYC)',
    answer:
      'JeetoBaz may require identity verification before, during or after participation.\n\nVerification may include:\n• CNIC verification.\n• Mobile number verification.\n• Email verification.\n• Identity confirmation.\n• Address verification.\n• Selfie or biometric verification (where introduced).\n• Additional supporting documents for high-value prizes or where required by law.\n\nJeetoBaz reserves the right to request updated documentation at any time where reasonably necessary for security, fraud prevention or legal compliance. Failure to complete requested verification may result in restrictions on account access, participation or prize claims.',
  },
  {
    category: 'Eligibility & Accounts',
    question: 'Accuracy of Information',
    answer:
      'Users are solely responsible for ensuring that all information provided to JeetoBaz remains accurate and up to date. JeetoBaz shall not be responsible for any loss, delay or inability to provide services resulting from inaccurate or outdated information supplied by the user.\n\nUsers must promptly update any changes to:\n• Mobile number\n• Email address\n• Residential address\n• Identification details\n• Other relevant account information',
  },
  {
    category: 'Eligibility & Accounts',
    question: 'User Responsibilities',
    answer:
      'Every user agrees to:\n• Use JeetoBaz honestly and lawfully.\n• Maintain the confidentiality of account credentials.\n• Keep login information secure.\n• Report any unauthorized access immediately.\n• Follow all platform policies.\n• Respect the rights of other users.\n• Cooperate with verification requests.\n• Use the Platform only for legitimate personal purposes.\n\nUsers remain responsible for all activities conducted through their account unless they promptly report unauthorized access.',
  },
  {
    category: 'Fraud & Security',
    question: 'Prohibited Activities',
    answer:
      'The following activities are strictly prohibited on JeetoBaz:\n• Creating multiple accounts.\n• Using another person\'s identity or CNIC.\n• Providing false or misleading information.\n• Attempting to manipulate prize draws.\n• Circumventing platform security.\n• Using bots, scripts or automated software to access or interact with the Platform.\n• Exploiting software vulnerabilities.\n• Interfering with platform operations.\n• Engaging in fraudulent payment activities.\n• Attempting chargeback abuse.\n• Uploading malicious software or code.\n• Using the Platform for unlawful purposes.\n• Violating any applicable law or regulation.\n\nJeetoBaz reserves the right to investigate any suspected violation and take appropriate action, including suspension, termination of accounts, cancellation of entries where justified, and reporting unlawful conduct to the relevant authorities where required by law.',
  },
  {
    category: 'Fraud & Security',
    question: 'Account Suspension and Immediate Restrictions',
    answer:
      'JeetoBaz may temporarily restrict access to an account while investigating suspected:\n• Fraud\n• Identity theft\n• Payment disputes\n• Security incidents\n• Policy violations\n• Suspicious account activity\n\nTemporary restrictions do not necessarily indicate wrongdoing and may be applied to protect users, the Platform and the integrity of prize campaigns while investigations are completed.',
  },
  {
    category: 'Entries & Campaigns',
    question: 'Prize Campaigns',
    answer:
      'JeetoBaz offers promotional prize campaigns through which eligible participants may obtain chances to win advertised prizes by purchasing valid entries.\n\nEach campaign displayed on the Platform includes information such as:\n• Prize description\n• Entry fee\n• Total participant spots\n• Campaign status\n• Campaign rules\n• Draw scheduling information\n• Other applicable conditions\n\nAll campaign information published on the Platform forms part of these Terms.',
  },
  {
    category: 'Entries & Campaigns',
    question: 'Entry Purchases',
    answer:
      'Participation requires the successful purchase of one or more valid entries for a specific prize campaign.\n\nAn entry is considered valid only when:\n• Payment has been successfully received by JeetoBaz;\n• The transaction has been successfully recorded;\n• The participant receives confirmation of the entry; and\n• The entry is successfully linked to the relevant campaign.\n\nIf payment is unsuccessful or incomplete, no valid entry shall be created.',
  },
  {
    category: 'Entries & Campaigns',
    question: 'Entry Fees',
    answer:
      'Each prize campaign has its own entry fee displayed before purchase. The published entry fee applies only to that specific campaign.\n\nJeetoBaz will not increase or modify the advertised entry fee after a participant has successfully purchased an entry for that campaign. Entry fees are non-transferable except where expressly permitted under these Terms or applicable law.',
  },
  {
    category: 'Entries & Campaigns',
    question: 'Entry Confirmation',
    answer:
      'After a successful purchase, participants may receive confirmation through one or more of the following:\n• In-app confirmation\n• Website confirmation\n• SMS\n• Email\n• Push notification\n• Wallet history\n• Transaction history\n\nParticipants are responsible for reviewing their account to ensure that purchased entries have been correctly recorded.',
  },
  {
    category: 'Entries & Campaigns',
    question: 'Entry Validity',
    answer:
      'Each purchased entry is valid only for the specific prize campaign for which it was purchased.\n\nEntries:\n• cannot be transferred to another user;\n• cannot be exchanged for another campaign;\n• cannot be sold to another participant; and\n• cannot be reused after the applicable draw has concluded.',
  },
  {
    category: 'Entries & Campaigns',
    question: 'Campaign Capacity',
    answer:
      'Every prize campaign has a predetermined number of participant spots.\n\nOnce all available spots have been filled:\n• no additional entries will be accepted;\n• the campaign will close to new participants; and\n• the draw scheduling process will begin in accordance with JeetoBaz procedures.',
  },
  {
    category: 'Draws & Winners',
    question: 'Draw Scheduling',
    answer:
      'The draw for a prize campaign is scheduled only after all required participant spots have been filled. JeetoBaz may announce the scheduled draw date and time through the Platform or other official communication channels.\n\nJeetoBaz reserves the right to adjust the scheduled draw time where reasonably necessary due to:\n• technical maintenance;\n• operational requirements;\n• legal or regulatory obligations;\n• force majeure events; or\n• other circumstances beyond its reasonable control.\n\nAny material changes will be communicated through official JeetoBaz channels where practicable.',
  },
  {
    category: 'Draws & Winners',
    question: 'Verified Fair Draw System',
    answer:
      'JeetoBaz operates a Verified Fair Draw System designed to ensure fairness, transparency and equal opportunity for all eligible participants.\n\nThe system is intended to operate so that:\n• all valid entries have an equal opportunity within the applicable campaign;\n• the winner is selected through a random process;\n• no administrator or employee may manually alter the outcome; and\n• the integrity of the draw is protected through technical and administrative safeguards.',
  },
  {
    category: 'Draws & Winners',
    question: 'Winner Selection',
    answer:
      'After the draw is conducted, the Platform will identify one eligible winning entry for the relevant campaign.\n\nTo remain eligible, the selected participant must:\n• have a valid account;\n• have complied with these Terms;\n• complete any required verification;\n• provide accurate information; and\n• satisfy all applicable eligibility requirements.\n\nFailure to satisfy these requirements may result in disqualification, after which JeetoBaz may proceed in accordance with its documented procedures and applicable law.',
  },
  {
    category: 'Draws & Winners',
    question: 'Verification Before Prize Release',
    answer:
      'Before releasing any prize, JeetoBaz may require verification including, where applicable:\n• CNIC verification;\n• mobile verification;\n• email verification;\n• ownership confirmation;\n• proof of eligibility;\n• address verification;\n• additional supporting documentation for high-value prizes.\n\nNo prize will be released until the required verification process has been completed to JeetoBaz\'s reasonable satisfaction.',
  },
  {
    category: 'Draws & Winners',
    question: 'Prize Substitution',
    answer:
      'JeetoBaz aims to award the advertised prize. However, if an advertised prize becomes unavailable due to circumstances beyond JeetoBaz\'s reasonable control (including discontinuation by the manufacturer or supplier), JeetoBaz may provide:\n• the same model (if available);\n• a newer model;\n• a model with substantially equivalent or superior specifications; or\n• another prize of comparable value.\n\nAny substitution will be made in good faith and without reducing the overall value of the prize.',
  },
  {
    category: 'Draws & Winners',
    question: 'Prize Acceptance',
    answer:
      'By accepting a prize, the winner agrees to:\n• complete the required verification process;\n• provide accurate delivery or collection information;\n• cooperate with reasonable administrative requirements; and\n• comply with applicable laws.\n\nWhere required by law, taxes, registration fees, customs duties or other statutory charges associated with ownership or transfer of the prize shall be the responsibility of the winner unless expressly stated otherwise by JeetoBaz.',
  },
  {
    category: 'Payments',
    question: 'Payments',
    answer:
      'JeetoBaz may accept payments through approved payment methods made available on the Platform, which may include:\n• bank transfers;\n• debit or credit cards;\n• digital wallets;\n• mobile wallets;\n• instant payment systems;\n• other payment methods introduced in the future.\n\nAvailability of payment methods may change from time to time.',
  },
  {
    category: 'Payments',
    question: 'Payment Security',
    answer:
      'JeetoBaz takes reasonable measures to protect payment transactions. However:\n• payment processing may involve third-party payment service providers;\n• JeetoBaz does not store payment credentials beyond what is necessary and permitted by applicable law and its Privacy Policy; and\n• users are responsible for ensuring the accuracy of payment information they provide.',
  },
  {
    category: 'Payments',
    question: 'Failed or Interrupted Payments',
    answer:
      'If a payment:\n• fails,\n• is declined,\n• is reversed,\n• is interrupted, or\n• cannot be confirmed,\n\nthe corresponding entry will not be treated as valid unless and until successful payment is confirmed.\n\nWhere payment is successfully received but the entry is not recorded due to a verified technical issue, JeetoBaz will investigate the matter and, where appropriate, resolve it in accordance with its Refund & Cancellation Policy.',
  },
  {
    category: 'Fraud & Security',
    question: 'Fraudulent Payments',
    answer:
      'JeetoBaz maintains a zero-tolerance approach toward payment fraud.\n\nThe following are prohibited:\n• use of stolen payment methods;\n• unauthorized payment instruments;\n• identity fraud;\n• payment manipulation;\n• money laundering activities;\n• chargeback abuse; and\n• any other unlawful financial activity.\n\nWhere fraudulent activity is reasonably suspected, JeetoBaz may:\n• suspend the account;\n• cancel affected entries where justified;\n• withhold prize distribution pending investigation; and\n• cooperate with relevant financial institutions and competent authorities as required by law.',
  },
  {
    category: 'Entries & Campaigns',
    question: 'Campaign Modifications',
    answer:
      'JeetoBaz may modify, postpone, suspend or cancel a prize campaign where reasonably necessary due to:\n• technical failures;\n• legal requirements;\n• regulatory changes;\n• security concerns;\n• force majeure events; or\n• other exceptional circumstances beyond its reasonable control.\n\nWhere a campaign is cancelled, JeetoBaz will process eligible participant remedies in accordance with its Refund & Cancellation Policy and applicable law.',
  },
  {
    category: 'Overview',
    question: 'Official Communications',
    answer:
      'Participants should rely only on official JeetoBaz communication channels for information relating to:\n• prize campaigns;\n• draw schedules;\n• winner announcements;\n• payment instructions;\n• verification requests; and\n• policy updates.\n\nJeetoBaz shall not be responsible for information published by unofficial or unauthorized third parties.',
  },
  {
    category: 'Refunds',
    question: 'Refund & Cancellation',
    answer:
      'Except where expressly provided in these Terms or required by applicable law, all entry purchases are final. Participants acknowledge that an entry represents participation in a specific prize campaign and cannot ordinarily be cancelled after successful purchase.\n\nRefunds may be available only in circumstances approved under the JeetoBaz Refund & Cancellation Policy.',
  },
  {
    category: 'Refunds',
    question: 'Eligible Refund Circumstances',
    answer:
      'A participant may become eligible for a refund where:\n• JeetoBaz officially cancels a prize campaign;\n• a verified technical failure results in payment being successfully received but no valid entry being issued;\n• applicable law requires a refund; or\n• JeetoBaz otherwise determines, in its reasonable discretion, that a refund is appropriate.\n\nRefunds may be issued to:\n• the original payment method;\n• the participant\'s JeetoBaz Wallet (where available); or\n• another method determined by JeetoBaz.',
  },
  {
    category: 'Refunds',
    question: 'No Refund Circumstances',
    answer:
      'Refunds will generally not be provided where:\n• a participant changes their mind;\n• an entry has already been successfully issued;\n• the participant fails to win a prize;\n• the participant fails identity verification;\n• the participant provides incorrect payment information;\n• the participant violates these Terms; or\n• the participant is disqualified due to fraud or misconduct.',
  },
  {
    category: 'Refunds',
    question: 'Duplicate or Incorrect Payments',
    answer:
      'If duplicate payments occur due to a verified system or processing error, JeetoBaz will investigate the matter and provide an appropriate remedy where justified.\n\nWhere duplicate payments arise from participant error, JeetoBaz will review each case individually and determine the appropriate outcome in accordance with its policies and applicable law.',
  },
  {
    category: 'Prize Delivery',
    question: 'Prize Delivery',
    answer:
      'JeetoBaz currently delivers prizes within Pakistan only.\n\nPrize delivery methods depend on the nature of the prize and may include:\n• courier delivery;\n• registered logistics providers;\n• in-person collection;\n• official handover ceremonies; or\n• other secure delivery methods determined by JeetoBaz.',
  },
  {
    category: 'Prize Delivery',
    question: 'Shipping Costs',
    answer:
      'Unless expressly stated otherwise, JeetoBaz will bear the reasonable shipping costs for delivering eligible prizes within Pakistan.\n\nHowever, any taxes, registration fees, transfer fees or other statutory charges imposed by law remain the responsibility of the winner unless JeetoBaz expressly agrees otherwise.',
  },
  {
    category: 'Prize Delivery',
    question: 'Prize Verification Before Delivery',
    answer:
      'Before any prize is released, winners may be required to complete verification including:\n• CNIC verification;\n• identity confirmation;\n• mobile verification;\n• address confirmation;\n• proof of eligibility; and\n• any additional documentation reasonably requested by JeetoBaz.\n\nFailure to complete verification may delay or prevent prize delivery.',
  },
  {
    category: 'Special Prizes',
    question: 'Vehicle Prize Rules',
    answer:
      'For vehicle prizes, including cars and motorcycles:\n• ownership transfer shall take place after successful verification;\n• registration shall be completed in accordance with Pakistani law; and\n• government taxes, registration charges, token taxes, withholding taxes and similar statutory obligations shall be the responsibility of the winner unless otherwise announced.',
  },
  {
    category: 'Special Prizes',
    question: 'House Prize Rules',
    answer:
      'Where a campaign offers a residential property:\n• the property shall be provided in accordance with the specific campaign terms;\n• the winner may be offered the option to receive the property in the announced city or, where the campaign permits, another agreed location within Pakistan;\n• property documentation shall be completed after successful verification; and\n• any government duties or taxes required by law shall remain the responsibility of the winner unless otherwise stated.',
  },
  {
    category: 'Special Prizes',
    question: 'Umrah Prize Rules',
    answer:
      'Where an Umrah package is offered, the package may include components specifically described in the relevant campaign.\n\nTravel remains subject to:\n• Saudi Arabian regulations;\n• airline availability;\n• visa approval;\n• health requirements;\n• travel restrictions; and\n• applicable government policies.\n\nJeetoBaz cannot guarantee visa issuance or travel approvals where these depend upon governmental authorities.',
  },
  {
    category: 'Prize Delivery',
    question: 'Damaged or Lost Deliveries',
    answer:
      'If a prize delivered by courier is:\n• damaged;\n• materially defective upon delivery; or\n• lost while under the responsibility of the delivery provider,\n\nthe winner should notify JeetoBaz as soon as reasonably practicable and provide appropriate supporting evidence.\n\nFollowing verification, JeetoBaz may, where appropriate:\n• replace the prize;\n• repair the prize;\n• provide an equivalent replacement; or\n• determine another appropriate resolution.',
  },
  {
    category: 'Prize Delivery',
    question: 'Prize Claim Period',
    answer:
      'Winners should claim their prize within 7 days after receiving official notification, unless a different period is announced for a specific campaign.\n\nWhere a winner does not respond within the applicable claim period, JeetoBaz may:\n• make reasonable additional attempts to contact the winner through available communication channels; and\n• thereafter deal with the unclaimed prize in accordance with its documented policies and applicable law.',
  },
  {
    category: 'Fraud & Security',
    question: 'User Conduct',
    answer:
      'Users must always:\n• behave honestly;\n• provide accurate information;\n• comply with these Terms;\n• avoid abusive conduct;\n• respect JeetoBaz employees and other users; and\n• use the Platform responsibly.',
  },
  {
    category: 'Fraud & Security',
    question: 'Fraud Prevention',
    answer:
      'To protect all participants, JeetoBaz actively monitors for suspicious activity.\n\nExamples include:\n• fake identities;\n• forged documents;\n• multiple accounts;\n• payment fraud;\n• referral abuse;\n• ticket manipulation;\n• automated participation;\n• account sharing;\n• identity theft;\n• suspicious transaction patterns.\n\nJeetoBaz may use automated systems and manual review processes to detect potentially fraudulent activity.',
  },
  {
    category: 'Fraud & Security',
    question: 'Security Monitoring',
    answer:
      'For security purposes, JeetoBaz may monitor:\n• login activity;\n• device information;\n• IP addresses;\n• browser information;\n• operating system information;\n• security events; and\n• transaction history,\n\nto the extent reasonably necessary for fraud prevention, platform security and legal compliance.',
  },
  {
    category: 'Fraud & Security',
    question: 'Investigations',
    answer:
      'Where JeetoBaz reasonably suspects fraud, policy violations or unlawful conduct, it may:\n• conduct internal investigations;\n• request additional verification;\n• temporarily restrict account functionality;\n• suspend prize distribution pending investigation; and\n• cooperate with banks, payment providers and competent authorities where required by law.\n\nThe participant is expected to cooperate reasonably during such investigations.',
  },
  {
    category: 'Fraud & Security',
    question: 'Suspension of Accounts',
    answer:
      'JeetoBaz may temporarily suspend an account where reasonably necessary to:\n• investigate suspected fraud;\n• protect the Platform;\n• comply with legal obligations;\n• resolve payment disputes;\n• verify identity; or\n• maintain the integrity of prize campaigns.\n\nA suspension does not necessarily imply that the participant has committed wrongdoing.',
  },
  {
    category: 'Fraud & Security',
    question: 'Permanent Account Termination',
    answer:
      'JeetoBaz may permanently terminate an account where a participant:\n• creates multiple accounts;\n• submits fraudulent documents;\n• uses another person\'s identity;\n• engages in payment fraud;\n• attempts to manipulate prize campaigns;\n• repeatedly violates these Terms; or\n• otherwise engages in serious misconduct.\n\nTermination may result in loss of access to the Platform and future participation, subject to applicable law and any accrued legal rights.',
  },
  {
    category: 'Fraud & Security',
    question: 'Effect of Suspension or Termination',
    answer:
      'Following suspension or termination, JeetoBaz may, where appropriate:\n• disable account access;\n• cancel future participation;\n• refuse future registrations;\n• preserve records for legal and regulatory purposes; and\n• take any additional action permitted by law.\n\nNothing in this section limits any legal rights or obligations that survive suspension or termination.',
  },
  {
    category: 'Fraud & Security',
    question: 'Reporting Misuse',
    answer:
      'Users are encouraged to promptly report:\n• fake accounts;\n• impersonation;\n• suspicious activity;\n• payment scams;\n• technical vulnerabilities; or\n• other security concerns,\n\nthrough JeetoBaz\'s official support channels. Reports should be made in good faith and supported by available information.',
  },
  {
    category: 'Legal',
    question: 'Intellectual Property Rights',
    answer:
      'All intellectual property rights relating to JeetoBaz are owned by JeetoBaz or its respective licensors unless otherwise stated.\n\nThese rights include, but are not limited to: JeetoBaz name, JeetoBaz logo, Trademarks, Brand identity, Website design, Mobile application, User interface (UI), User experience (UX), Graphics, Icons, Animations, Images, Videos, Product listings, Software, Source code, Databases, Text content, Documentation, Marketing materials, Audio content, Designs, Draw systems, Algorithms (to the extent protected by law), Other proprietary materials.\n\nNothing in these Terms transfers ownership of any intellectual property to a user.',
  },
  {
    category: 'Legal',
    question: 'Permitted Use',
    answer:
      'Users are granted a limited, non-exclusive, non-transferable and revocable license to access and use JeetoBaz solely for lawful personal use.\n\nThis license does not permit users to: copy; reproduce; republish; modify; distribute; sell; sublicense; reverse engineer (except where prohibited by law); create derivative works from; or commercially exploit any JeetoBaz content without prior written permission.',
  },
  {
    category: 'Legal',
    question: 'User Content',
    answer:
      'Where users submit reviews, comments, suggestions, photographs or other content to JeetoBaz, they confirm that:\n• they have the legal right to submit such content;\n• the content does not infringe third-party rights;\n• the content is not unlawful, abusive or misleading; and\n• the content complies with applicable laws.\n\nBy submitting such content, the user grants JeetoBaz a non-exclusive, worldwide, royalty-free license to use, reproduce, display and distribute that content for operating, improving and promoting the Platform, subject to applicable law and the Privacy Policy.',
  },
  {
    category: 'Legal',
    question: 'Winner Publicity',
    answer:
      'Subject to applicable law, winners agree that JeetoBaz may use their first name, city, photographs, videos, prize collection images, interviews, and related promotional material for marketing, advertising and promotional purposes without additional compensation, unless prohibited by law or otherwise agreed by JeetoBaz.\n\nJeetoBaz will not publish sensitive personal information (such as CNIC numbers or residential addresses) without a lawful basis or the individual\'s consent.',
  },
  {
    category: 'Legal',
    question: 'Privacy & Data Protection',
    answer:
      'JeetoBaz collects, uses, stores and processes personal information in accordance with its Privacy Policy and applicable Pakistani laws.\n\nPersonal information may be used for purposes including: account administration; identity verification; fraud prevention; payment processing; customer support; prize delivery; legal compliance; platform security; and service improvement.\n\nUsers are encouraged to review the JeetoBaz Privacy Policy for detailed information regarding data handling practices.',
  },
  {
    category: 'Legal',
    question: 'Electronic Communications',
    answer:
      'By using JeetoBaz, users consent to receive communications electronically, including through: email; SMS; push notifications; in-app notifications; website notices; and other official digital communication channels.\n\nElectronic communications shall satisfy any legal requirement that such communications be in writing, where permitted by applicable law.',
  },
  {
    category: 'Legal',
    question: 'Third-Party Services',
    answer:
      'JeetoBaz may integrate with third-party providers, including: payment gateways; courier services; SMS providers; email providers; analytics services; identity verification providers; and other technology partners.\n\nJeetoBaz is not responsible for delays, interruptions or failures caused solely by independent third-party services beyond its reasonable control, although it will make reasonable efforts to assist users where appropriate.',
  },
  {
    category: 'Legal',
    question: 'Disclaimer',
    answer:
      'JeetoBaz provides the Platform on an "as available" and "as applicable" basis.\n\nWhile JeetoBaz aims to maintain reliable services, it does not guarantee that: the Platform will operate without interruption; every feature will always be available; the Platform will always be free from technical issues; or temporary maintenance or updates will never occur.\n\nNothing in these Terms excludes rights that cannot lawfully be excluded under applicable law.',
  },
  {
    category: 'Legal',
    question: 'Limitation of Liability',
    answer:
      'To the maximum extent permitted by applicable law: JeetoBaz, its directors, employees, officers, representatives and affiliates shall not be liable for indirect, incidental, consequential, special or punitive losses arising from: interruption of services; technical failures; internet outages; third-party failures; unauthorized access not resulting from JeetoBaz\'s negligence; user errors; or circumstances beyond JeetoBaz\'s reasonable control.\n\nNothing in these Terms limits liability where such limitation is prohibited by law.',
  },
  {
    category: 'Legal',
    question: 'Indemnification',
    answer:
      'Users agree to indemnify and hold harmless JeetoBaz and its officers, employees, affiliates and representatives against reasonable claims, losses, damages, liabilities and expenses arising from: violation of these Terms; unlawful conduct; infringement of third-party rights; or misuse of the Platform.\n\nThis provision applies only to the extent permitted by applicable law.',
  },
  {
    category: 'Legal',
    question: 'Force Majeure',
    answer:
      'JeetoBaz shall not be responsible for delays or failures resulting from events beyond its reasonable control, including: natural disasters; floods; earthquakes; fires; pandemics; epidemics; war; terrorism; civil unrest; government restrictions; power failures; internet outages; cyber incidents; strikes; or other force majeure events.\n\nWhere possible, JeetoBaz will make reasonable efforts to resume normal operations promptly.',
  },
  {
    category: 'Policy & Support',
    question: 'Changes to the Platform',
    answer:
      'JeetoBaz may, from time to time: introduce new features; discontinue features; update services; improve security; modify technology; or enhance user experience.\n\nSuch changes may occur without prior notice where necessary for security, maintenance or legal compliance.',
  },
  {
    category: 'Policy & Support',
    question: 'Amendments to these Terms',
    answer:
      'JeetoBaz reserves the right to amend these Terms where reasonably necessary. Updated Terms will be published on the Platform with a revised "Last Updated" date.\n\nContinued use of the Platform after updated Terms become effective constitutes acceptance of the revised Terms.',
  },
  {
    category: 'Legal',
    question: 'Governing Law',
    answer:
      'These Terms shall be governed by and interpreted in accordance with the laws of the Islamic Republic of Pakistan.',
  },
  {
    category: 'Legal',
    question: 'Dispute Resolution',
    answer:
      'JeetoBaz encourages users to first contact Customer Support to resolve any dispute amicably.\n\nIf a dispute cannot be resolved through good-faith discussions, it shall be subject to the competent courts of Hyderabad, Sindh, Pakistan, unless applicable law requires otherwise.\n\nNothing in this clause prevents either party from seeking urgent interim relief where permitted by law.',
  },
  {
    category: 'Legal',
    question: 'Severability',
    answer:
      'If any provision of these Terms is determined by a court of competent jurisdiction to be invalid, illegal or unenforceable, the remaining provisions shall continue in full force and effect to the maximum extent permitted by law.',
  },
  {
    category: 'Legal',
    question: 'Waiver',
    answer:
      'Failure by JeetoBaz to enforce any provision of these Terms shall not constitute a waiver of that provision or of any other rights available under these Terms or applicable law.',
  },
  {
    category: 'Policy & Support',
    question: 'Entire Agreement',
    answer:
      'These Terms, together with the following documents, constitute the entire agreement between JeetoBaz and the user regarding use of the Platform:\n• Privacy Policy\n• Refund & Cancellation Policy\n• Shipping Policy\n• Community Guidelines\n• Responsible Gaming Policy\n• KYC Verification Policy\n• AML Policy\n• Cookie Policy\n• Fair Draw & Winner Selection Policy\n• Any campaign-specific rules published by JeetoBaz\n\nIn the event of a conflict, campaign-specific rules shall apply only to the relevant campaign, while these Terms shall continue to govern all other aspects of the Platform unless otherwise required by law.',
  },
  {
    category: 'Policy & Support',
    question: 'Contact Information',
    answer:
      `For questions, complaints or legal notices, users may contact JeetoBaz through its official channels:\n\nBusiness Name: JeetoBaz\nEmail: ${SUPPORT_EMAIL}\nPhone: ${SUPPORT_PHONE_DISPLAY.replace('+92 ', '0').replace(/ /g, '-')}\nWebsite: https://jeetobaz.pk\nOffice Address: Hyderabad, Sindh, Pakistan\n\nOfficial announcements and policy updates will be published through JeetoBaz's authorized communication channels.`,
  },
  {
    category: 'Policy & Support',
    question: 'Effective Date',
    answer:
      'These Terms & Conditions become effective from the date published on the JeetoBaz Platform and remain in force until amended or replaced by JeetoBaz in accordance with applicable law.',
  },
] as const;

export default function TermsScreen() {
  const goBack = useSafeBack();
  const { theme } = useAppTheme();

  const termsSchema = pageSchema('WebPage', '/terms', 'Terms & Conditions', 'Review the Terms and Conditions governing JeetoBaz accounts, prize campaigns, entries, payments, draws, platform use, and user responsibilities.');
  const breadcrumb = breadcrumbSchema([{ name: 'Terms & Conditions', path: '/terms' }]);
  return (
    <>
    <Head>
      <title>Terms &amp; Conditions | JeetoBaz</title>
      <meta name="robots" content="index, follow" />
      <meta name="description" content="Review the Terms and Conditions governing JeetoBaz accounts, prize campaigns, entries, payments, draws, platform use, and user responsibilities." />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Terms &amp; Conditions | JeetoBaz" />
      <meta property="og:description" content="Review the Terms and Conditions governing JeetoBaz accounts, prize campaigns, entries, payments, draws, platform use, and user responsibilities." />
      <meta property="og:url" content="https://jeetobaz.pk/terms" />
      <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
      <meta property="og:image:alt" content="JeetoBaz — Pakistan's trusted prize draw platform" />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta property="og:locale" content="en_PK" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content="Terms &amp; Conditions | JeetoBaz" />
      <meta name="twitter:description" content="Review the Terms and Conditions governing JeetoBaz accounts, prize campaigns, entries, payments, draws, platform use, and user responsibilities." />
      <meta name="twitter:image" content="https://jeetobaz.pk/twitter-image.png" />
      <link rel="canonical" href="https://jeetobaz.pk/terms" />
      <script type="application/ld+json">{JSON.stringify(termsSchema)}</script>
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
          <ClipboardList color={theme.gold} size={22} />
          <Text style={[styles.headerTitle, { color: theme.gold }]}>Terms</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.hero}>
        <Text role="heading" aria-level={1} style={[styles.heroTitle, { color: theme.gold }]}>Terms & Conditions</Text>
        <Text style={[styles.heroText, { color: theme.muted }]}>
          JeetoBaz is a Lucky Draw platform. Please read all terms carefully before participating.
        </Text>
      </View>

      <View style={styles.list}>
        {TERMS_FAQS.map((item, index) => (
          <View
            key={item.question}
            style={[
              styles.section,
              { borderBottomColor: theme.border },
              index === TERMS_FAQS.length - 1 && styles.sectionLast,
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.gold }]}>{index + 1}. {item.question}</Text>
            <Text style={[styles.sectionAnswer, { color: theme.muted }]}>{item.answer}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.finalBox, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
        <Text style={[styles.finalText, { color: theme.primary }]}>
          By participating in JeetoBaz draws, you confirm that you have read, understood, and agreed to all the above Terms & Conditions.
        </Text>
      </View>

      <Text style={[styles.lastUpdated, { color: theme.subtle }]}>Last Updated: 2026</Text>
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
  finalBox: { borderRadius: 12, padding: 18, marginHorizontal: 15, marginTop: 14, borderWidth: 1 },
  finalText: { fontSize: 15, lineHeight: 24, textAlign: 'center' },
  lastUpdated: { fontSize: 12, marginTop: 18, marginBottom: 4, textAlign: 'center' },
});
