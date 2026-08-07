import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { ReactNode } from 'react';

const GTM_CONTAINER_ID = 'GTM-TZR6W32B';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://jqjrfnhqqfymwfsdkwmv.supabase.co';
// GA4/GTM must never fire on routes that briefly carry live Supabase session tokens in the
// URL hash (magic-link callbacks). Checked at script-execution time against the real
// location.pathname (trailing slash normalized), not at build time — +html.tsx has no
// reliable route context of its own (it's excluded from Expo Router's route tree and
// receives `children` as an already-rendered prop, so hooks like usePathname() don't work
// here). No CSP is configured anywhere in this project (verified: no headers step in the
// GitHub Pages workflow — GitHub Pages itself doesn't support custom response headers —
// and no CSP meta tag anywhere), so there's no CSP compatibility concern for this inline
// script.
const GTM_BLOCKED_PATHS = ['/auth/callback', '/auth/reset-password'];
// Read directly here (not via the app's getStoredValue/AsyncStorage helper) because this script
// runs before React hydrates -- CookieConsentBanner's key ('cookieConsent') is read straight
// from localStorage since AsyncStorage's web backend is an unprefixed localStorage wrapper (see
// src/components/cookie-consent-banner.tsx). A first-ever pageview (no decision stored yet)
// still loads GTM, matching every other site's "on by default, opt out" cookie banner behavior;
// only an explicit "Reject" stops it from loading on subsequent page loads.

export default function Root({ children }: { children: ReactNode }) {
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } =
    useServerDocumentContext();

  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <script>
          {`(function(w,d,s,l,i){
            var p=location.pathname.replace(/\\/+$/,'')||'/';
            if (${JSON.stringify(GTM_BLOCKED_PATHS)}.indexOf(p) !== -1) return;
            try { if (w.localStorage.getItem('cookieConsent') === 'rejected') return; } catch (e) {}
            w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');`}
        </script>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <link rel="preconnect" href={SUPABASE_URL} />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <ScrollViewStyleReset />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            referrerPolicy="no-referrer"
          />
        </noscript>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
