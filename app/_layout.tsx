import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

// Use a custom Head component for meta tags on web
function CustomHead() {
  if (Platform.OS !== 'web') return null;
  return (
    <head>
      <title>Oil Salary Manager</title>
      <meta name="description" content="تطبيق إدارة الرواتب والحوافز والأرباح" />
      <meta name="keywords" content="رواتب, حوافز, أرباح, إدارة, مالية, نفط" />
      <meta name="theme-color" content="#6B46C1" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="icon" href="/assets/images/oil.png" sizes="192x192" />
      <link rel="apple-touch-icon" href="/assets/images/oil.png" sizes="192x192" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Oil Salary" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="application-name" content="Oil Salary" />
      <meta name="msapplication-TileColor" content="#6B46C1" />
    </head>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Register service worker for PWA functionality
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return (
    <>
      <CustomHead />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="account-info" options={{ headerShown: false }} />
        <Stack.Screen name="app-settings" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}