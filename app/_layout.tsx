import { useEffect, useState } from 'react';
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
import { View, Text, TouchableOpacity } from 'react-native';
import { Platform } from 'react-native';

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

  // --- PWA Install Prompt ---
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Only run PWA install prompt logic in web environment
    if (typeof window === 'undefined' || !window.addEventListener) return;
    
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setShowInstallPrompt(false);
      });
    }
  };
  // --- End PWA Install Prompt ---

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore splash screen errors
      });
    }
  }, [fontsLoaded, fontError]);

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
      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <View style={{ position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#222', borderRadius: 12, padding: 16, zIndex: 9999, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>يمكنك تثبيت التطبيق على الشاشة الرئيسية!</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={handleInstall} style={{ backgroundColor: '#4CAF50', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8, marginRight: 8 }}>
              <Text style={{ color: '#fff', fontSize: 15 }}>تثبيت</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowInstallPrompt(false)} style={{ backgroundColor: '#888', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontSize: 15 }}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* End PWA Install Prompt */}
    </UserDataProvider>
  );
}