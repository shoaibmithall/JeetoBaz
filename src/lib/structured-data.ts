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

// `items` excludes Home -- every caller's trail starts there, so callers just list the page(s)
// after it (e.g. a single { name, path } for a top-level page, matching product/[slug].tsx's
// existing Home > Explore > Product pattern for a two-level trail).
export function breadcrumbSchema(items: Array<{ name: string; path: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL + '/' },
      ...items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.name,
        item: BASE_URL + item.path,
      })),
    ],
  };
}
