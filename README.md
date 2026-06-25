# JeetoBaz

JeetoBaz is a Pakistan-focused lucky draw app built with Expo Router, React Native, and Supabase.

## Current App Areas

- Draws and active prize listings
- My Entries
- Favorites
- Past Winners
- Profile/login
- Payment entry form
- Help Center with WhatsApp, email, and ticket flow
- Terms & Conditions
- Privacy Policy and account deletion request
- Hidden admin panel

## Run Locally

```bash
npm install
npx expo start
```

## Web Build

```bash
npx expo export -p web
```

The web build is exported to `dist/`.

## Checks Before Deploy

```bash
npx tsc --noEmit
npx expo install --check
npx expo export -p web
```

## Deployment

Netlify is configured to build the web app with:

```bash
npx expo export -p web
```

and publish:

```text
dist
```

## Launch Notes

- Support WhatsApp: `+92 337 2561482`
- Support email: `complaintsjeetobaz@gmail.com`
- Website: `jeetobaz-pk.netlify.app`

## End-Phase Paid/Security Work

The following items are intentionally left for the final paid/security phase:

- Phone OTP login
- Production admin authentication
- Supabase RLS policy review
- Server-side payment verification
- Server-side draw completion/winner writes

