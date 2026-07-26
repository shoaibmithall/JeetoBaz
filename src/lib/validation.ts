export function normalizePakistaniMobile(value: string) {
  const digits = value.replace(/\D/g, '');
  const withoutCountryCode = digits.startsWith('92') ? digits.slice(2) : digits;
  const withoutLeadingZero = withoutCountryCode.startsWith('0') ? withoutCountryCode.slice(1) : withoutCountryCode;
  return withoutLeadingZero.slice(0, 10);
}

export function isValidPakistaniMobile(value: string) {
  return /^3\d{9}$/.test(value);
}

export function normalizePersonName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeTransactionId(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidTransactionId(value: string) {
  return /^[A-Z0-9/_-]{6,50}$/.test(value);
}

const DIACRITIC_MARKS = /[̀-ͯ]/g;

export function slugify(value: string): string {
  const withoutDiacritics = value.normalize('NFKD').replace(DIACRITIC_MARKS, '');
  return withoutDiacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
}
