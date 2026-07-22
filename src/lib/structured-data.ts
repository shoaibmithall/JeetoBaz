const BASE_URL = 'https://jeetobaz.pk';

export const ORG_ID = BASE_URL + '/#organization';
export const SITE_ID = BASE_URL + '/#website';

export function pageSchema(
  type: string,
  path: string,
  name: string,
  description: string,
): Record<string, unknown> {
  const url = BASE_URL + path;
  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': url + '#webpage',
    name,
    url,
    description,
    isPartOf: { '@id': SITE_ID },
  };
}
