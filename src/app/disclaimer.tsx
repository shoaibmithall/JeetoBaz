import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import { AlertTriangle, ChevronRight, Mail, MapPin, Phone } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/hooks/use-theme';
import { breadcrumbSchema, pageSchema } from '@/lib/structured-data';
import { showAlert } from '@/lib/alert';
import { useSafeBack } from '@/lib/safe-back';
import {
  COMPLAINTS_EMAIL,
  PRIVACY_EMAIL,
  SUPPORT_EMAIL,
  SUPPORT_PHONE as CONTACT_PHONE,
  SUPPORT_PHONE_DISPLAY as CONTACT_PHONE_DISPLAY,
} from '@/lib/contact-info';

// Matches the fix already applied to help.tsx: react-native-web's Linking.openURL() always opens
// a new tab, which leaves a stray blank tab behind for mailto: links when no mail app is
// registered to handle the handoff. Navigating in the same tab avoids that for mailto specifically.
async function openContactLink(url: string, errorMessage: string, sameTab = false) {
  try {
    if (sameTab && Platform.OS === 'web') {
      window.location.href = url;
      return;
    }
    await Linking.openURL(url);
  } catch {
    showAlert('Unable to open', errorMessage);
  }
}

// Content is added phase by phase as the source copy is reviewed and confirmed against real
// platform facts (see other legal pages: terms.tsx, refund-policy.tsx, shipping-policy.tsx).
// `tone` marks a paragraph as an important callout: 'gold' for an advisory/read-this note,
// 'red' for a critical/legal-consequence statement. Plain paragraphs render as normal body text.
type ContactItem =
  | { kind: 'email'; label: string; value: string; note: string }
  | { kind: 'phone'; label: string; value: string; note: string }
  | { kind: 'location'; label: string; value: string };

type DisclaimerBlock =
  | { type: 'paragraph'; text: string; tone?: 'gold' | 'red' }
  | {
      type: 'links';
      items: { label: string; description?: string; route: string; params?: Record<string, string> }[];
    }
  | { type: 'contact'; items: ContactItem[] };

type DisclaimerSection = {
  id: string;
  title: string;
  blocks: DisclaimerBlock[];
};

const LAST_UPDATED = 'August 8, 2026';

const DISCLAIMER_SECTIONS: DisclaimerSection[] = [
  {
    id: 'general-information',
    title: 'General Information',
    blocks: [
      {
        type: 'paragraph',
        text: 'This Disclaimer applies to the JeetoBaz website available at https://jeetobaz.pk (the "Website"), including the information, content, services, features, and other materials made available through the Website.',
      },
      {
        type: 'paragraph',
        text: 'JeetoBaz is operated from Hyderabad, Sindh, Pakistan. The Website is intended to provide users with general information about the JeetoBaz platform, its features, prize draw information, products, winners, support resources, and other related content.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'The information provided on the Website is made available for general informational and platform-related purposes. While JeetoBaz makes reasonable efforts to keep the Website updated and to provide information that is clear and accurate, users should read and understand the applicable Terms & Conditions and other relevant policies before using any feature or participating in any activity offered through the Website.',
      },
      {
        type: 'paragraph',
        text: 'This Disclaimer should be read together with the following documents, which govern different aspects of the Website and its services:',
      },
      {
        type: 'links',
        items: [
          { label: 'Terms & Conditions', route: '/terms' },
          { label: 'Refund Policy', route: '/refund-policy' },
          { label: 'Shipping Policy', route: '/shipping-policy' },
          { label: 'Responsible Use Policy', route: '/about', params: { section: 'legal' } },
          { label: 'Privacy Policy', route: '/privacy' },
        ],
      },
      {
        type: 'paragraph',
        text: 'Each of these documents addresses specific matters and forms part of the overall framework governing the use of the JeetoBaz Website.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'Nothing contained in this Disclaimer should be interpreted as replacing, modifying, or overriding the provisions of the applicable Terms & Conditions or other policies published on the Website. If there is any inconsistency between this Disclaimer and another applicable policy, the relevant policy will apply to the subject matter it specifically governs.',
      },
      {
        type: 'paragraph',
        text: 'Users are encouraged to review the latest version of this Disclaimer and the related policies before relying on information published on the Website or using the Website\'s features.',
      },
      {
        type: 'paragraph',
        text: 'JeetoBaz may update the information available on the Website from time to time to reflect operational changes, updates to services, or other relevant developments. The presence of information on the Website does not create any representation beyond what is expressly stated in the applicable policies and published materials.',
      },
    ],
  },
  {
    id: 'accuracy-of-information',
    title: 'Accuracy of Information',
    blocks: [
      {
        type: 'paragraph',
        text: 'JeetoBaz makes reasonable efforts to ensure that the information published on the Website is accurate, clear, relevant, and kept reasonably up to date. However, information available on the Website may occasionally contain typographical errors, omissions, formatting issues, outdated information, or other unintentional inaccuracies.',
      },
      {
        type: 'paragraph',
        text: 'Information published on the Website may also change from time to time as products, services, platform features, draw information, availability, dates, or other operational details are updated.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'JeetoBaz reserves the right to correct, update, modify, replace, or remove inaccurate, incomplete, outdated, or otherwise incorrect information at any time without prior notice.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'Although reasonable care is taken when preparing and publishing Website content, JeetoBaz does not represent or warrant that every piece of information available on the Website will always be complete, current, error-free, or suitable for every user\'s particular circumstances.',
      },
      {
        type: 'paragraph',
        text: 'Where information is subject to change, users should refer to the latest information displayed on the Website and the applicable Terms & Conditions or relevant policy before relying on that information.',
      },
      {
        type: 'paragraph',
        text: 'If a user identifies an apparent error or inaccurate information on the Website, they may report it to JeetoBaz through the contact information provided in this Disclaimer. JeetoBaz may review the reported information and make corrections where appropriate.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'A correction or update to Website content does not, by itself, modify any rights, obligations, eligibility requirements, refund conditions, shipping conditions, or other terms that are governed by the applicable policies of JeetoBaz.',
      },
    ],
  },
  {
    id: 'website-availability-technical-issues',
    title: 'Website Availability & Technical Issues',
    blocks: [
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'JeetoBaz makes reasonable efforts to keep the Website available, functional, secure, and accessible. However, continuous or uninterrupted availability of the Website cannot be guaranteed.',
      },
      {
        type: 'paragraph',
        text: 'The Website may occasionally become temporarily unavailable or experience reduced functionality due to scheduled maintenance, updates, technical improvements, server or hosting issues, network interruptions, security measures, unexpected system failures, or other circumstances beyond the reasonable control of JeetoBaz.',
      },
      {
        type: 'paragraph',
        text: 'Users may also experience technical difficulties caused by factors outside the Website itself, including internet connectivity, mobile or desktop devices, operating systems, web browsers, telecommunications networks, third-party services, or other technical infrastructure.',
      },
      {
        type: 'paragraph',
        text: 'Certain Website features may depend on third-party technology, services, APIs, payment infrastructure, hosting services, email services, authentication systems, or other external systems. A temporary interruption, delay, error, or failure affecting such a service may consequently affect the availability or functionality of the corresponding Website feature.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'JeetoBaz may temporarily suspend, restrict, modify, or disable access to any part of the Website where reasonably necessary for maintenance, security, troubleshooting, updates, technical improvements, or other operational reasons.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'JeetoBaz will make reasonable efforts to restore affected Website functionality when practical, but does not guarantee a specific restoration time or that every technical issue can be resolved immediately.',
      },
      {
        type: 'paragraph',
        text: 'Users should ensure that they are using a compatible and reasonably up-to-date device, browser, operating system, and internet connection when accessing the Website.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'Where a technical issue affects a specific transaction, account activity, entry, payment, refund, delivery, or other matter governed by a separate JeetoBaz policy, the applicable Terms & Conditions or relevant policy will govern that matter.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'Technical interruptions or temporary Website unavailability should not be interpreted as a permanent discontinuation of the JeetoBaz platform unless JeetoBaz expressly communicates such a decision.',
      },
    ],
  },
  {
    id: 'prize-product-information',
    title: 'Prize & Product Information',
    blocks: [
      {
        type: 'paragraph',
        text: 'JeetoBaz makes reasonable efforts to ensure that prize and product information displayed on the Website is clear, accurate, and representative of the relevant prize or product.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'Prize images displayed on the Website are intended to represent the corresponding prize or product. While JeetoBaz generally uses images of the actual or intended prize where available, the appearance of a prize received by a winner may vary from the image displayed on the Website due to factors such as lighting, photography, screen settings, packaging, manufacturing variations, product revisions, available color options, or other circumstances beyond the control of JeetoBaz.',
      },
      {
        type: 'paragraph',
        text: 'Product names, specifications, colors, dimensions, accessories, packaging, model details, and other product characteristics may be subject to availability or manufacturer and supplier changes. Where applicable, the information displayed on the Website should be read together with the specific information provided for the relevant prize or draw.',
      },
      {
        type: 'paragraph',
        text: 'The availability of a particular product, model, color, configuration, or specification may change after information has been published on the Website. JeetoBaz may update the relevant information when such changes become known.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'Where the exact model, configuration, color, specification, or other characteristic of a prize cannot reasonably be provided as originally displayed or described, any applicable replacement, substitution, or alternative arrangement will be handled in accordance with the applicable JeetoBaz Terms & Conditions and policies.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'Images, illustrations, graphics, or other visual materials should not be interpreted as creating a guarantee that every visual characteristic of the delivered prize will be identical to the image displayed on the Website.',
      },
      {
        type: 'paragraph',
        text: 'JeetoBaz does not intentionally publish misleading prize or product information. If a user identifies an apparent discrepancy between published information and the information applicable to a particular prize, the user may contact JeetoBaz using the contact information provided on the Website so that the matter can be reviewed.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'Nothing in this section changes or overrides any specific rights, conditions, obligations, or procedures relating to prizes that are expressly provided in the JeetoBaz Terms & Conditions, Refund Policy, Shipping Policy, or any other applicable policy.',
      },
    ],
  },
  {
    id: 'draw-information-no-guarantee',
    title: 'Draw Information & No Guarantee of Winning',
    blocks: [
      {
        type: 'paragraph',
        text: 'Information published on the Website regarding draws is provided to explain the relevant draw, its status, applicable conditions, and other information made available by JeetoBaz.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'Participation in a draw does not constitute a guarantee that a participant will receive, obtain, or win a prize. No particular outcome, prize, result, or benefit is guaranteed to any participant solely by participating in a draw.',
      },
      {
        type: 'paragraph',
        text: 'Where a draw involves a selection process, the applicable selection process and conditions are governed by the relevant JeetoBaz Terms & Conditions and any draw-specific information published on the Website.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'Draw dates, schedules, status, availability, participation conditions, and other related information may be updated or changed where permitted under the applicable Terms & Conditions. Users should refer to the latest information available on the Website before relying on previously published draw information.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'Any winner announcement made by JeetoBaz is subject to the applicable verification and eligibility requirements described in the relevant Terms & Conditions. Being identified or announced as a potential or selected winner does not necessarily remove any applicable verification or eligibility requirements.',
      },
      {
        type: 'paragraph',
        text: 'Where winner information is published on the Website, such information is provided for transparency and informational purposes in accordance with the applicable JeetoBaz policies and privacy requirements.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'JeetoBaz does not represent or guarantee that participation in any particular draw will result in a specific outcome for an individual participant.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'Nothing in this section should be interpreted as changing, replacing, or overriding the specific draw rules, eligibility requirements, winner-verification procedures, refund conditions, or other provisions contained in the applicable JeetoBaz Terms & Conditions or other relevant policies.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'Users should carefully review the applicable Terms & Conditions and draw-specific information before participating in any activity offered through the Website.',
      },
    ],
  },
  {
    id: 'third-party-services-external-links-content',
    title: 'Third-Party Services, External Links & Content',
    blocks: [
      {
        type: 'paragraph',
        text: 'The JeetoBaz Website may contain links, references, integrations, embedded content, or connections to third-party websites, platforms, services, applications, payment providers, communication services, social media platforms, or other external resources.',
      },
      {
        type: 'paragraph',
        text: 'These third-party services and resources are operated independently from JeetoBaz and may be subject to their own terms, policies, privacy practices, availability, and operating conditions.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'A link or reference to a third-party website or service does not necessarily mean that JeetoBaz endorses, guarantees, sponsors, controls, or accepts responsibility for the third party, its content, products, services, practices, availability, or representations.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'JeetoBaz does not control the content, security, privacy practices, availability, accuracy, or continued operation of external websites and services. Users who access a third-party website or service through a link provided on the JeetoBaz Website do so subject to the terms and policies applicable to that third party.',
      },
      {
        type: 'paragraph',
        text: 'Third-party links may change, become unavailable, be redirected, or lead to content that has been updated since the link was originally published. JeetoBaz may remove, update, replace, or add external links when reasonably necessary.',
      },
      {
        type: 'paragraph',
        text: 'The Website may also use third-party technical services to support certain functionality, including hosting, authentication, communications, analytics, payment processing, security, or other technical operations. The availability or performance of a Website feature may therefore depend partly on the availability and proper functioning of the relevant third-party service.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'Where a payment, communication, verification, delivery, or other service is provided or processed through a third-party provider, the provider\'s applicable terms and policies may also apply to that service.',
      },
      {
        type: 'paragraph',
        text: 'JeetoBaz may publish references, sources, citations, or other external information in future Website content, including blog articles or educational materials. Such references are intended to provide additional information and do not necessarily constitute an endorsement of every statement, product, service, or organization mentioned by an external source.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'Users should independently review the terms, privacy policies, security information, and other relevant conditions of third-party websites or services before using them or providing information to them.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'JeetoBaz is not responsible for changes, interruptions, inaccuracies, security incidents, privacy practices, or other matters occurring solely within a third-party website or service, except to the extent otherwise required by applicable law or expressly provided in an applicable JeetoBaz policy.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'Nothing in this section changes or overrides any rights or obligations specifically established under the JeetoBaz Terms & Conditions, Privacy Policy, Refund Policy, Shipping Policy, or other applicable policies.',
      },
    ],
  },
  {
    id: 'user-responsibility-related-policies',
    title: 'User Responsibility & Related Policies',
    blocks: [
      {
        type: 'paragraph',
        text: 'Users are responsible for reviewing the information available on the JeetoBaz Website and understanding the terms and conditions that apply to their use of the Website and its features.',
      },
      {
        type: 'paragraph',
        text: 'Before using a particular feature, service, or participating in an activity through the Website, users should review the applicable JeetoBaz policies and any specific information provided for that activity.',
      },
      {
        type: 'paragraph',
        text: 'The following documents provide additional terms and information relating to different aspects of the JeetoBaz platform:',
      },
      {
        type: 'links',
        items: [
          {
            label: 'Terms & Conditions',
            description: 'Sets out the terms governing use of the Website and applicable participation conditions.',
            route: '/terms',
          },
          {
            label: 'Refund Policy',
            description: 'Provides information regarding applicable refund procedures and conditions.',
            route: '/refund-policy',
          },
          {
            label: 'Shipping Policy',
            description: 'Provides information relating to the delivery of physical prizes or products where applicable.',
            route: '/shipping-policy',
          },
          {
            label: 'Responsible Use Policy',
            description: 'Provides information concerning responsible use of the JeetoBaz platform.',
            route: '/about',
            params: { section: 'legal' },
          },
          {
            label: 'Privacy Policy',
            description: 'Explains how personal information is handled in accordance with the applicable privacy practices of JeetoBaz.',
            route: '/privacy',
          },
        ],
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'Users are responsible for ensuring that the information they provide to JeetoBaz is accurate, complete, and up to date where such information is required for the relevant Website feature or service.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'Users should also ensure that they satisfy all applicable eligibility requirements before using a feature or participating in an activity. Eligibility requirements, age restrictions, participation conditions, verification requirements, and other applicable conditions are governed by the relevant JeetoBaz Terms & Conditions and should not be inferred solely from information contained in this Disclaimer.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'Users should not rely solely on summaries, promotional materials, search results, third-party references, or previously viewed Website content when making decisions concerning their use of the JeetoBaz platform. The latest applicable information and official JeetoBaz policies should be consulted.',
      },
      {
        type: 'paragraph',
        text: 'If a user is uncertain about the meaning or application of a particular requirement, they may contact JeetoBaz through the official contact information provided on the Website before proceeding.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'This Disclaimer does not create additional eligibility rights, participation rights, refund rights, delivery rights, or other contractual rights beyond those expressly provided under the applicable JeetoBaz Terms & Conditions and policies.',
      },
      {
        type: 'paragraph',
        text: 'Where another JeetoBaz policy specifically addresses a matter covered by that policy, that policy should be consulted for the complete requirements applicable to that matter.',
      },
    ],
  },
  {
    id: 'intellectual-property-website-content',
    title: 'Intellectual Property & Website Content',
    blocks: [
      {
        type: 'paragraph',
        text: 'Unless otherwise stated, the JeetoBaz name, logo, branding, website design, graphics, written content, and other original materials on the Website are the intellectual property of JeetoBaz. Full ownership and permitted-use details are set out in the applicable Terms & Conditions.',
      },
      {
        type: 'links',
        items: [
          {
            label: 'Terms & Conditions',
            description: 'See "Intellectual Property Rights" and "Permitted Use" for the complete ownership and usage terms.',
            route: '/terms',
          },
        ],
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'The Website may contain trademarks, logos, product names, images, or other materials belonging to third parties. Such materials remain the property of their respective owners. The appearance of third-party materials on the Website does not by itself mean that JeetoBaz owns those materials or that the relevant third party endorses JeetoBaz.',
      },
      {
        type: 'paragraph',
        text: 'Product names, brand names, trademarks, logos, photographs, and other third-party materials may be displayed where reasonably necessary to identify or describe a relevant product, service, prize, reference, or other content. Any rights associated with such third-party materials remain with their respective owners.',
      },
      {
        type: 'paragraph',
        text: 'JeetoBaz may use photographs, product images, graphics, promotional materials, or other visual content obtained from manufacturers, suppliers, authorized sources, licensed resources, or other permitted sources. Ownership and usage rights for such third-party materials remain subject to the rights and permissions applicable to those materials.',
      },
      {
        type: 'paragraph',
        text: 'Where Website content includes information, quotations, references, links, or materials originating from third parties, such content should not be interpreted as being owned by JeetoBaz unless expressly stated otherwise.',
      },
      {
        type: 'paragraph',
        text: 'JeetoBaz may update, replace, remove, or modify its Website content, branding, graphics, design, and other materials from time to time without prior notice.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'Nothing in this Disclaimer grants users a licence or other right to use JeetoBaz intellectual property except where such use is expressly permitted by JeetoBaz or applicable law.',
      },
      {
        type: 'paragraph',
        text: 'If a user believes that content appearing on the Website infringes their intellectual property rights, they may contact JeetoBaz using the official contact information provided on the Website with sufficient information to allow the matter to be reviewed.',
      },
    ],
  },
  {
    id: 'limitation-of-liability',
    title: 'Limitation of Liability',
    blocks: [
      {
        type: 'paragraph',
        tone: 'red',
        text: 'To the extent permitted by applicable law, JeetoBaz will not be responsible for losses, damages, costs, or consequences arising solely from a user\'s reliance on general information published on the Website where that information was not intended to constitute a specific representation, professional advice, or contractual commitment.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'The Website and its information may occasionally contain errors, omissions, temporary inaccuracies, technical issues, interruptions, or outdated information. To the extent permitted by applicable law, JeetoBaz will not be liable for losses arising solely from a user\'s reliance on information that was subsequently corrected, updated, withdrawn, or identified as inaccurate.',
      },
      {
        type: 'paragraph',
        text: 'To the extent permitted by applicable law, JeetoBaz will not be responsible for interruptions, delays, failures, or inaccuracies caused solely by circumstances outside JeetoBaz\'s reasonable control, including certain internet, telecommunications, hosting, third-party service, infrastructure, or technical failures.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'JeetoBaz is not responsible for the content, actions, omissions, availability, security, privacy practices, or services of independent third parties solely because a third-party website, service, link, integration, or reference is accessible through or mentioned on the Website, except where responsibility is imposed by applicable law or an applicable agreement.',
      },
      {
        type: 'paragraph',
        text: 'Users are responsible for reviewing the information and applicable policies relevant to their use of the Website before relying on that information or using a particular feature.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'Nothing in this Disclaimer excludes or limits any liability, responsibility, right, remedy, or protection that cannot lawfully be excluded or limited under applicable law.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'Nothing in this section is intended to exclude liability for matters that applicable law does not permit JeetoBaz to exclude or limit.',
      },
      {
        type: 'paragraph',
        text: 'Where the JeetoBaz Terms & Conditions or another applicable policy contains specific provisions governing liability, remedies, refunds, payments, delivery, participation, or other contractual matters, those provisions will apply to the extent applicable.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'This limitation of liability is intended to operate only to the extent permitted by applicable law and should not be interpreted as removing any mandatory legal rights or protections available to users.',
      },
    ],
  },
  {
    id: 'changes-to-this-disclaimer',
    title: 'Changes to This Disclaimer',
    blocks: [
      {
        type: 'paragraph',
        text: 'JeetoBaz may update, revise, modify, expand, or otherwise change this Disclaimer from time to time to reflect changes in the Website, its features, services, operational practices, applicable requirements, or other relevant circumstances.',
      },
      {
        type: 'paragraph',
        text: 'When changes are made, JeetoBaz may update the "Last Updated" date displayed at the beginning of this Disclaimer to indicate that the content has been revised.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'Users are encouraged to review this Disclaimer periodically to remain informed about the information and notices applicable to their use of the Website.',
      },
      {
        type: 'paragraph',
        text: 'Unless otherwise stated, the updated version of this Disclaimer will become effective when it is published on the Website.',
      },
      {
        type: 'paragraph',
        tone: 'gold',
        text: 'Where a change to this Disclaimer materially affects information that should reasonably be brought to users\' attention, JeetoBaz may provide an additional notice through the Website or another appropriate communication channel where reasonably practicable.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'The continued use of the Website after an updated version of this Disclaimer has been published may indicate that the user has had an opportunity to review the updated information. However, nothing in this section is intended to modify or override any rights, obligations, contractual terms, or legal requirements that cannot be modified in this manner.',
      },
      {
        type: 'paragraph',
        text: 'Previous versions of this Disclaimer may be retained by JeetoBaz for administrative, compliance, or record-keeping purposes.',
      },
      {
        type: 'paragraph',
        text: 'If a user does not understand a material change or has questions regarding the updated Disclaimer, they may contact JeetoBaz using the official contact information provided on the Website.',
      },
    ],
  },
  {
    id: 'contact-us',
    title: 'Contact Us',
    blocks: [
      {
        type: 'paragraph',
        text: 'If you have questions about this Disclaimer, believe that information published on the Website may be inaccurate, or wish to report an issue relating to Website content, you may contact JeetoBaz through the official contact details provided below.',
      },
      {
        type: 'contact',
        items: [
          {
            kind: 'email',
            label: 'General Support',
            value: SUPPORT_EMAIL,
            note: 'For general questions and Website-related assistance, users may contact JeetoBaz through the support email address.',
          },
          {
            kind: 'email',
            label: 'Complaints',
            value: COMPLAINTS_EMAIL,
            note: 'For complaints or matters requiring formal attention, users may contact JeetoBaz through the complaints email address.',
          },
          {
            kind: 'email',
            label: 'Privacy Matters',
            value: PRIVACY_EMAIL,
            note: 'For privacy-related questions or matters, users may contact JeetoBaz through the dedicated privacy contact address.',
          },
          {
            kind: 'phone',
            label: 'Phone',
            value: CONTACT_PHONE_DISPLAY,
            note: 'Users may contact JeetoBaz through the above telephone number for appropriate support or assistance.',
          },
          {
            kind: 'location',
            label: 'Business Location',
            value: 'Hyderabad, Sindh, Pakistan',
          },
        ],
      },
      {
        type: 'paragraph',
        text: 'Users should provide sufficient information when contacting JeetoBaz so that the relevant matter can be properly understood and reviewed. Where appropriate, this may include the relevant Website page or URL, a description of the issue, and any other information reasonably necessary to investigate the matter.',
      },
      {
        type: 'paragraph',
        text: 'JeetoBaz may review reported errors, inaccurate information, broken links, or other Website-related issues and may correct, update, remove, or otherwise address the relevant content where appropriate.',
      },
      {
        type: 'paragraph',
        tone: 'red',
        text: 'Submitting a complaint, correction request, or other communication does not by itself create a right to a particular outcome, response time, correction, refund, compensation, or other remedy unless such right is expressly provided under an applicable JeetoBaz policy or required by applicable law.',
      },
      {
        type: 'paragraph',
        text: 'For matters specifically governed by the Terms & Conditions, Refund Policy, Shipping Policy, Responsible Use Policy, Privacy Policy, or another applicable JeetoBaz policy, users should also refer to the relevant policy and follow the applicable procedure described there.',
      },
    ],
  },
];

function DisclaimerParagraph({ block }: { block: Extract<DisclaimerBlock, { type: 'paragraph' }> }) {
  const { theme } = useAppTheme();

  if (!block.tone) {
    return <Text style={[styles.paragraph, { color: theme.text }]}>{block.text}</Text>;
  }

  const isRed = block.tone === 'red';
  return (
    <View
      style={[
        styles.calloutBox,
        {
          backgroundColor: isRed ? theme.dangerSoft : theme.goldSoft,
          borderLeftColor: isRed ? theme.danger : theme.gold,
        },
      ]}
    >
      <Text style={[styles.paragraph, styles.calloutText, { color: theme.text }]}>{block.text}</Text>
    </View>
  );
}

function DisclaimerLinks({ block }: { block: Extract<DisclaimerBlock, { type: 'links' }> }) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.linksBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {block.items.map((item, index) => (
        <Link
          key={item.label}
          href={(item.params ? { pathname: item.route, params: item.params } : item.route) as never}
          asChild
        >
          <TouchableOpacity
            accessibilityRole="link"
            style={StyleSheet.flatten([
              styles.linkRow,
              index < block.items.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 },
            ])}
          >
            <View style={styles.linkCopy}>
              <Text style={[styles.linkText, { color: theme.primary }]}>{item.label}</Text>
              {item.description ? (
                <Text style={[styles.linkDescription, { color: theme.muted }]}>{item.description}</Text>
              ) : null}
            </View>
            <ChevronRight color={theme.subtle} size={17} />
          </TouchableOpacity>
        </Link>
      ))}
    </View>
  );
}

function DisclaimerContact({ block }: { block: Extract<DisclaimerBlock, { type: 'contact' }> }) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.linksBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {block.items.map((item, index) => {
        const isLast = index === block.items.length - 1;
        const rowStyle = StyleSheet.flatten([
          styles.contactRow,
          !isLast && { borderBottomColor: theme.border, borderBottomWidth: 1 },
        ]);

        if (item.kind === 'location') {
          return (
            <View key={item.label} style={rowStyle}>
              <View style={[styles.contactIconBox, { backgroundColor: theme.background }]}>
                <MapPin color={theme.primary} size={18} />
              </View>
              <View style={styles.contactCopy}>
                <Text style={[styles.contactLabel, { color: theme.subtle }]}>{item.label}</Text>
                <Text style={[styles.contactValue, { color: theme.text }]}>{item.value}</Text>
              </View>
            </View>
          );
        }

        const Icon = item.kind === 'email' ? Mail : Phone;
        const onPress =
          item.kind === 'email'
            ? () =>
                openContactLink(
                  `mailto:${item.value}?subject=${encodeURIComponent('JeetoBaz Disclaimer Inquiry')}`,
                  `Please email us at ${item.value}.`,
                  true,
                )
            : () => openContactLink(`tel:+${CONTACT_PHONE}`, `Please call us at ${item.value}.`);

        return (
          <TouchableOpacity key={item.label} accessibilityRole="link" onPress={onPress} style={rowStyle}>
            <View style={[styles.contactIconBox, { backgroundColor: theme.background }]}>
              <Icon color={theme.primary} size={18} />
            </View>
            <View style={styles.contactCopy}>
              <Text style={[styles.contactLabel, { color: theme.subtle }]}>{item.label}</Text>
              <Text style={[styles.contactValue, { color: theme.primary }]}>{item.value}</Text>
              <Text style={[styles.contactNote, { color: theme.muted }]}>{item.note}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function DisclaimerScreen() {
  const goBack = useSafeBack();
  const { theme } = useAppTheme();

  const schema = pageSchema(
    'WebPage',
    '/disclaimer',
    'Disclaimer',
    'Important information about how to use the JeetoBaz website and platform, and how this Disclaimer relates to the Terms & Conditions, Refund Policy, Shipping Policy, Responsible Use Policy, and Privacy Policy.',
  );
  const breadcrumb = breadcrumbSchema([{ name: 'Disclaimer', path: '/disclaimer' }]);

  return (
    <>
      <Head>
        <title>Disclaimer | JeetoBaz</title>
        <meta name="robots" content="index, follow" />
        <meta
          name="description"
          content="Important information about how to use the JeetoBaz website and platform, and how this Disclaimer relates to our other policies."
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Disclaimer | JeetoBaz" />
        <meta
          property="og:description"
          content="Important information about how to use the JeetoBaz website and platform, and how this Disclaimer relates to our other policies."
        />
        <meta property="og:url" content="https://jeetobaz.pk/disclaimer" />
        <meta property="og:image" content="https://jeetobaz.pk/og-image.png" />
        <meta property="og:image:alt" content="JeetoBaz — Pakistan's trusted prize draw platform" />
        <meta property="og:site_name" content="JeetoBaz" />
        <meta property="og:locale" content="en_PK" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@jeetobaz" />
        <meta name="twitter:title" content="Disclaimer | JeetoBaz" />
        <meta
          name="twitter:description"
          content="Important information about how to use the JeetoBaz website and platform, and how this Disclaimer relates to our other policies."
        />
        <meta name="twitter:image" content="https://jeetobaz.pk/twitter-image.png" />
        <link rel="canonical" href="https://jeetobaz.pk/disclaimer" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
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
          <Text style={[styles.headerTitle, { color: theme.gold }]}>Disclaimer</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.hero}>
          <LinearGradient
            colors={[theme.gold, theme.danger]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroBadge}
          >
            <AlertTriangle color="#ffffff" size={22} strokeWidth={2.4} />
            <Text style={styles.heroBadgeText}>DISCLAIMER</Text>
          </LinearGradient>
          <Text style={[styles.heroUpdated, { color: theme.subtle }]}>Last Updated: {LAST_UPDATED}</Text>
        </View>

        <View style={styles.sections}>
          {DISCLAIMER_SECTIONS.map((section) => (
            <View key={section.id} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.gold }]}>{section.title}</Text>
              <View style={styles.blockList}>
                {section.blocks.map((block, index) =>
                  block.type === 'paragraph' ? (
                    <DisclaimerParagraph key={index} block={block} />
                  ) : block.type === 'links' ? (
                    <DisclaimerLinks key={index} block={block} />
                  ) : (
                    <DisclaimerContact key={index} block={block} />
                  ),
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 40 },
  header: {
    borderBottomWidth: 2,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { fontSize: 16, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSpacer: { width: 48 },
  hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 12, gap: 10 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  heroBadgeText: { fontSize: 17, fontWeight: '900', letterSpacing: 1, color: '#ffffff' },
  heroUpdated: { fontSize: 13, fontWeight: '600' },
  sections: { paddingHorizontal: 18, paddingTop: 18, gap: 26, maxWidth: 760, width: '100%', alignSelf: 'center' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 19, fontWeight: '800' },
  blockList: { gap: 12 },
  paragraph: { fontSize: 14.5, lineHeight: 23 },
  calloutBox: { borderLeftWidth: 3, borderRadius: 8, padding: 14 },
  calloutText: { fontWeight: '500' },
  linksBox: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  linkCopy: { flex: 1, gap: 3, paddingRight: 12 },
  linkText: { fontSize: 14.5, fontWeight: '700' },
  linkDescription: { fontSize: 12.5, lineHeight: 17 },
  contactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, padding: 16 },
  contactIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  contactCopy: { flex: 1, gap: 2 },
  contactLabel: { fontSize: 11.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  contactValue: { fontSize: 15, fontWeight: '700' },
  contactNote: { fontSize: 12.5, lineHeight: 17, marginTop: 2 },
});
