import { Tabs } from 'expo-router';
import Head from 'expo-router/head';
import { Text } from 'react-native';
import { useLanguage } from '@/lib/i18n';
import { useAppTheme } from '@/hooks/use-theme';

export default function RootLayout() {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const siteUrl = 'https://jeetobaz.pk/';
  const siteTitle = 'JeetoBaz - Pakistan Lucky Draw Platform';
  const siteDescription = 'JeetoBaz is a transparent lucky draw platform for Pakistan with live draws, verified winners, simple support, and secure payment verification.';

  return (
    <>
      <Head>
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
        <meta name="theme-color" content="#1DB954" />
        <link rel="canonical" href={siteUrl} />
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
            paddingBottom: 8,
          },
          tabBarActiveTintColor: theme.gold,
          tabBarInactiveTintColor: theme.subtle,
        }}
      >
        <Tabs.Screen name="index" options={{ title: t('activeDraws'), tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏆</Text> }} />
        <Tabs.Screen name="entries" options={{ title: t('myEntries'), tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎯</Text> }} />
        <Tabs.Screen name="favorites" options={{ title: t('favorites'), tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>❤️</Text> }} />
        <Tabs.Screen name="explore" options={{ title: t('pastWinners'), tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🥇</Text> }} />
        <Tabs.Screen name="login" options={{ title: t('profile'), tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> }} />
        <Tabs.Screen name="share" options={{ title: t('share'), tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📤</Text> }} />
        <Tabs.Screen name="admin" options={{ href: null }} />
        <Tabs.Screen name="draw" options={{ href: null }} />
        <Tabs.Screen name="winner" options={{ href: null }} />
        <Tabs.Screen name="payment" options={{ href: null }} />
        <Tabs.Screen name="terms" options={{ href: null }} />
        <Tabs.Screen name="help" options={{ href: null }} />
        <Tabs.Screen name="privacy" options={{ href: null }} />
        <Tabs.Screen name="language" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
      </Tabs>
    </>
  );
}
