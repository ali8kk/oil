import { Stack } from 'expo-router';
import { UserDataProvider } from '@/contexts/UserDataContext';

export default function RootLayout() {
  return (
    <UserDataProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="account-info" options={{ headerShown: false }} />
        <Stack.Screen name="app-settings" options={{ headerShown: false }} />
      </Stack>
    </UserDataProvider>
  );
}