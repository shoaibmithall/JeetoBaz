// Shared source of truth for JeetoBaz's contact details and social links, which used to be
// hand-typed as local constants (and inline literals inside legal-page copy) independently in
// several files -- login.tsx, help.tsx, disclaimer.tsx, privacy.tsx, about.tsx, terms.tsx,
// jeetobaz-footer.tsx, index.tsx -- risking drift between copies. support@, privacy@, and
// complaintsjeetobaz@ are three distinct, intentional addresses (all forward to the same
// monitored Gmail account per Cloudflare Email Routing), not accidental duplicates of one value.

export const SUPPORT_EMAIL = 'support@jeetobaz.pk';
export const PRIVACY_EMAIL = 'privacy@jeetobaz.pk';
export const COMPLAINTS_EMAIL = 'complaintsjeetobaz@gmail.com';

export const SUPPORT_PHONE_DISPLAY = '+92 337 2561482';
export const SUPPORT_PHONE = '923372561482';
export const SUPPORT_WHATSAPP_LINK = 'https://wa.me/923372561482';

export const WEBSITE_URL = 'https://jeetobaz.pk';

export const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/share/17uAJE6AQY/?mibextid=wwXIfr',
  instagram: 'https://www.instagram.com/jeetobaz?igsh=ZWZpaGxyajY4Mmxy&utm_source=qr',
  tiktok: 'https://www.tiktok.com/@jeetobaz?_r=1&_t=ZS-97wXLf85a2G',
  youtube: 'https://youtube.com/@jeetobaz?si=XIzw2WyovPCZZjv8',
} as const;
