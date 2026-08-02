// IndexNow lets us proactively tell Bing (and other participating search engines) about a
// new/updated URL instead of waiting for them to recrawl the sitemap on their own schedule.
// The key file at INDEXNOW_KEY_LOCATION proves we control the domain — see public/<key>.txt.
const INDEXNOW_KEY = 'dd09ae446ce579bbbd7990dfa20c2009';
const INDEXNOW_HOST = 'jeetobaz.pk';
const INDEXNOW_KEY_LOCATION = `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

// Fire-and-forget: never blocks or fails the admin save flow this is called from.
export function pingIndexNow(path: string) {
  if (typeof fetch !== 'function') return;

  const url = `https://${INDEXNOW_HOST}${path.startsWith('/') ? path : `/${path}`}`;
  const params = new URLSearchParams({
    url,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
  });

  fetch(`${INDEXNOW_ENDPOINT}?${params.toString()}`, { mode: 'no-cors' }).catch(() => {
    // Best-effort only — IndexNow is a nice-to-have, not required for the save to succeed.
  });
}
