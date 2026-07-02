import { Tabs } from 'expo-router';
import Head from 'expo-router/head';
import { useWindowDimensions } from 'react-native';
import { Heart, House, Medal, Share2, Target, UserRound } from 'lucide-react-native';
import { useLanguage } from '@/lib/i18n';
import { useAppTheme } from '@/hooks/use-theme';

export default function RootLayout() {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 480;
  const siteUrl = 'https://jeetobaz.pk/';
  const siteTitle = 'JeetoBaz - Pakistan Lucky Draw Platform';
  const siteDescription = 'JeetoBaz is a transparent lucky draw platform for Pakistan with live draws, verified winners, simple support, and secure payment verification.';

  return (
    <>
      <Head>
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
        <meta name="facebook-domain-verification" content="gct7fv6xph27g30vlhgynl91csagj1" />
        <meta name="theme-color" content="#020d09" />
        <link rel="canonical" href={siteUrl} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/jeetobaz-icon.png" />
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
            height: 60,
            paddingBottom: isCompact ? 5 : 8,
          },
          tabBarShowLabel: !isCompact,
          tabBarIconStyle: isCompact ? { marginTop: 5 } : undefined,
          tabBarActiveTintColor: theme.gold,
          tabBarInactiveTintColor: theme.subtle,
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <House color={color} size={21} /> }} />
        <Tabs.Screen name="entries" options={{ title: t('myEntries'), tabBarIcon: ({ color }) => <Target color={color} size={21} /> }} />
        <Tabs.Screen name="favorites" options={{ title: t('favorites'), tabBarIcon: ({ color }) => <Heart color={color} size={21} /> }} />
        <Tabs.Screen name="explore" options={{ title: t('pastWinners'), tabBarIcon: ({ color }) => <Medal color={color} size={21} /> }} />
        <Tabs.Screen name="login" options={{ title: t('profile'), tabBarIcon: ({ color }) => <UserRound color={color} size={21} /> }} />
        <Tabs.Screen name="share" options={{ title: t('share'), tabBarIcon: ({ color }) => <Share2 color={color} size={21} /> }} />
        <Tabs.Screen name="admin" options={{ href: null }} />
        <Tabs.Screen name="draw" options={{ href: null }} />
        <Tabs.Screen name="winner" options={{ href: null }} />
        <Tabs.Screen name="payment" options={{ href: null }} />
        <Tabs.Screen name="terms" options={{ href: null }} />
        <Tabs.Screen name="help" options={{ href: null }} />
        <Tabs.Screen name="privacy" options={{ href: null }} />
        <Tabs.Screen name="language" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="about" options={{ href: null }} />
        <Tabs.Screen name="referral" options={{ href: null }} />
      </Tabs>
    </>
  );
}
