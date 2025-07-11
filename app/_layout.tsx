import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Cairo_400Regular,
  Cairo_600SemiBold,
  Cairo_700Bold,
} from '@expo-google-fonts/cairo';
import * as SplashScreen from 'expo-splash-screen';
import { I18nManager } from 'react-native';
import { UserDataProvider } from '@/contexts/UserDataContext';
import SyncIndicator from '@/components/SyncIndicator';
import { View, Text } from 'react-native';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Enable RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Cairo-Regular': Cairo_400Regular,
    'Cairo-SemiBold': Cairo_600SemiBold,
    'Cairo-Bold': Cairo_700Bold,
  }, {
    display: 'swap',
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore splash screen errors
      });
    }
  }, [fontsLoaded, fontError]);

  // Show error if fonts failed to load
  if (fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error loading fonts</Text>
      </View>
    );
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <UserDataProvider>
      <SyncIndicator />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="account-info" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </UserDataProvider>
  );
}