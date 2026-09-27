import { Baloo2_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { Caveat_700Bold } from '@expo-google-fonts/caveat';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { envReady } from '../src/lib/env';
import { initSentry, reportError, Sentry } from '../src/lib/sentry';
import { AppProvider } from '../src/state/AppStore';
import { AuthProvider } from '../src/state/AuthProvider';
import { colors, fonts, s } from '../src/theme/tokens';

initSentry();
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30 * 1000, retry: 1 },
    mutations: { onError: (e) => reportError(e, { where: 'mutation' }) },
  },
});

const sheet = {
  presentation: 'transparentModal' as const,
  animation: 'fade' as const,
  contentStyle: { backgroundColor: 'transparent' },
};

function RootLayout() {
  const [loaded, error] = useFonts({
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    Caveat_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  if (!envReady) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingTitle}>Supabase keys missing</Text>
        <Text style={styles.missingBody}>
          Copy .env.example to .env.development, add your dev project's URL and anon key, then restart
          `npx expo start --clear`.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Screen name="index" options={{ animation: 'fade' }} />
              <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="paywall" options={{ gestureEnabled: false }} />
              <Stack.Screen name="filters" options={sheet} />
              <Stack.Screen name="send-request/[id]" options={sheet} />
            </Stack>
          </AppProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);

const styles = StyleSheet.create({
  missing: { flex: 1, justifyContent: 'center', padding: s(28), backgroundColor: colors.bg },
  missingTitle: { fontFamily: fonts.display, fontSize: s(24), color: colors.ink },
  missingBody: { fontFamily: fonts.body, fontSize: s(16), lineHeight: s(23), color: colors.text, marginTop: s(8) },
});
