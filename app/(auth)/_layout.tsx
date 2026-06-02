// app/_layout.tsx

import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  // Swapped isLoading to loading to match your AuthContext properties
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Block redirects until Auth is finished loading AND the navigation frame is mounted
    if (loading || !navigationState?.key) return;

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/departments');
    }
  }, [user, loading, segments, navigationState?.key]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}