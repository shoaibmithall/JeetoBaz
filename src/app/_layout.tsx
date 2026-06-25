import { Tabs } from 'expo-router';
import Head from 'expo-router/head';
import { Text } from 'react-native';

export default function RootLayout() {
  return (
    <>
      <Head>
        <title>JeetoBaz - Pakistan's No.1 Lucky Draw</title>
        <meta
          name="description"
          content="JeetoBaz is a transparent lucky draw platform for Pakistan with live draws, verified winners, and simple support."
        />
      </Head>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1a1a1a',
            borderTopColor: '#333',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: '#FFD700',
          tabBarInactiveTintColor: '#666',
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Draws', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏆</Text> }} />
        <Tabs.Screen name="entries" options={{ title: 'My Entries', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎯</Text> }} />
        <Tabs.Screen name="favorites" options={{ title: 'Favorites', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>❤️</Text> }} />
        <Tabs.Screen name="explore" options={{ title: 'Winners', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🥇</Text> }} />
        <Tabs.Screen name="login" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> }} />
        <Tabs.Screen name="admin" options={{ href: null }} />
        <Tabs.Screen name="draw" options={{ href: null }} />
        <Tabs.Screen name="winner" options={{ href: null }} />
        <Tabs.Screen name="payment" options={{ href: null }} />
        <Tabs.Screen name="terms" options={{ href: null }} />
        <Tabs.Screen name="help" options={{ href: null }} />
        <Tabs.Screen name="privacy" options={{ href: null }} />
      </Tabs>
    </>
  );
}
