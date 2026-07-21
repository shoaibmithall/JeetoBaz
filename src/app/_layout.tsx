import { Tabs } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Heart, House, Medal, UserRound } from 'lucide-react-native';
import { useLanguage } from '@/lib/i18n';
import { useAppTheme } from '@/hooks/use-theme';
import { requestHomeScrollToTop } from '@/lib/home-scroll';
import { AuthProvider } from '@/providers/AuthProvider';
import { TawkToWidget } from '@/components/TawkToWidget';

export default function RootLayout() {
  const { t } = useLanguage();
  const { theme, ready: themeReady } = useAppTheme();
  const { width } = useWindowDimensions();
  const [hasHydratedLayout, setHasHydratedLayout] = useState(false);
  const isCompact = !hasHydratedLayout || width < 480;
  const siteUrl = 'https://jeetobaz.pk/';
  const siteTitle = 'JeetoBaz - Pakistan\u2019s Most Trusted Premium Rewards Platform';
  const siteDescription = 'JeetoBaz is a transparent lucky draw platform for Pakistan with live draws, verified winners, simple support, and secure payment verification.';
  const iconVersion = '20260710';

  useEffect(() => {
    setHasHydratedLayout(true);
  }, []);

  useEffect(() => {
    if (!themeReady || process.env.EXPO_OS !== 'web') return;
    document.documentElement.classList.add('jeetobaz-theme-ready');
  }, [themeReady]);

  return (
    <AuthProvider>
    <>
      <TawkToWidget />
      <Head>
        <title>{siteTitle}</title>
        <style>{`
          html:not(.jeetobaz-theme-ready) #root { visibility: hidden; }
          html:not(.jeetobaz-theme-ready) body::before {
            align-items: center;
            background: #f4f7f5;
            color: #b38a00;
            content: 'Loading JeetoBaz...';
            display: flex;
            font: 800 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            inset: 0;
            justify-content: center;
            position: fixed;
            z-index: 2147483647;
          }
        `}</style>
        <meta name="description" content={siteDescription} />
        <meta name="facebook-domain-verification" content="gct7fv6xph27g30vlhgynl91csagj1" />
        <meta name="theme-color" content={theme.background} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="JeetoBaz" />
        <link rel="canonical" href={siteUrl} />
        <link rel="manifest" href={`/manifest.json?v=${iconVersion}`} />
        <link rel="icon" type="image/png" sizes="48x48" href={`/favicon.png?v=${iconVersion}`} />
        <link rel="apple-touch-icon" sizes="180x180" href={`/apple-touch-icon.png?v=${iconVersion}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="JeetoBaz" />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:url" content={siteUrl} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteDescription} />
      </Head>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            borderTopWidth: 1,
            height: isCompact ? 66 : 60,
            paddingBottom: isCompact ? 6 : 8,
            paddingTop: isCompact ? 3 : 0,
          },
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: isCompact ? 10 : 12,
            fontWeight: '600',
            marginTop: isCompact ? 1 : 0,
          },
          tabBarIconStyle: isCompact ? { marginTop: 3 } : undefined,
          tabBarActiveTintColor: theme.gold,
          tabBarInactiveTintColor: theme.subtle,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Home', tabBarIcon: ({ color }) => <House color={color} size={21} /> }}
          listeners={{
            tabPress: () => {
              requestHomeScrollToTop();
            },
          }}
        />
        <Tabs.Screen name="favorites" options={{ title: t('favorites'), tabBarIcon: ({ color }) => <Heart color={color} size={21} /> }} />
        <Tabs.Screen name="explore" options={{ title: t('pastWinners'), tabBarIcon: ({ color }) => <Medal color={color} size={21} /> }} />
        <Tabs.Screen name="login" options={{ title: t('profile'), tabBarIcon: ({ color }) => <UserRound color={color} size={21} /> }} />
        <Tabs.Screen name="entries" options={{ href: null }} />
        <Tabs.Screen name="share" options={{ href: null }} />
        <Tabs.Screen name="admin" options={{ href: null }} />
        <Tabs.Screen name="draw" options={{ href: null }} />
        <Tabs.Screen name="winner" options={{ href: null }} />
        <Tabs.Screen name="payment" options={{ href: null }} />
        <Tabs.Screen name="payment-response" options={{ href: null }} />
        <Tabs.Screen name="terms" options={{ href: null }} />
        <Tabs.Screen name="help" options={{ href: null }} />
        <Tabs.Screen name="faq" options={{ href: null }} />
        <Tabs.Screen name="jazzcash-redirect" options={{ href: null }} />
        <Tabs.Screen name="privacy" options={{ href: null }} />
        <Tabs.Screen name="language" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="about" options={{ href: null }} />
        <Tabs.Screen name="referral" options={{ href: null }} />
        <Tabs.Screen name="signup" options={{ href: null }} />
        <Tabs.Screen name="verify-email" options={{ href: null }} />
        <Tabs.Screen name="forgot-password" options={{ href: null }} />
        <Tabs.Screen name="verify-reset-otp" options={{ href: null }} />
        <Tabs.Screen name="reset-password" options={{ href: null }} />
        <Tabs.Screen name="profile-setup" options={{ href: null }} />
        <Tabs.Screen name="auth/callback" options={{ href: null }} />
        <Tabs.Screen name="auth/reset-password" options={{ href: null }} />
      </Tabs>
    </>
    </AuthProvider>
  );
}
