import 'react-native-get-random-values';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { COLORS } from '@/constants/colors';
import { ErrorBoundary } from '@/components/ui';
import { useOffline, useProactiveNudges } from '@/hooks';
import { useUserStore } from '@/store';
import { setAppLanguage } from '@/i18n';
import { refreshWeather } from '@/services/weather';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  useOffline();
  useProactiveNudges();

  useEffect(() => {
    refreshWeather();
  }, []);

  const language = useUserStore((state) => state.language);
  useEffect(() => {
    setAppLanguage(language);
  }, [language]);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={COLORS.card} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="building/[id]"
            options={{
              headerShown: true,
              headerTitle: '',
              headerBackTitle: 'Back',
              headerTintColor: COLORS.primary,
              headerStyle: { backgroundColor: COLORS.card },
            }}
          />
          <Stack.Screen name="scan" options={{ presentation: 'modal' }} />
          <Stack.Screen name="snap" options={{ presentation: 'modal' }} />
          <Stack.Screen name="emergency" options={{ presentation: 'modal' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <Toast
          position="top"
          topOffset={50}
          visibilityTime={2000}
        />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
