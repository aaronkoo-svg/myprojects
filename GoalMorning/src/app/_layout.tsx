import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ConfirmProvider } from '@/components/confirm-dialog';
import { Colors, FontFiles } from '@/constants/theme';
import { StoreProvider, useStore } from '@/data/store';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [fontsLoaded, fontError] = useFonts(FontFiles);

  const c = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: c.accent,
      background: c.canvas,
      card: c.surface,
      text: c.textStrong,
      border: c.line,
    },
  };

  return (
    <StoreProvider>
      <ThemeProvider value={navTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <ConfirmProvider>
          <Gate fontsReady={fontsLoaded || !!fontError} />
        </ConfirmProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}

// 폰트와 저장된 데이터가 모두 준비될 때까지 스플래시 화면 유지
function Gate({ fontsReady }: { fontsReady: boolean }) {
  const { ready } = useStore();
  const allReady = fontsReady && ready;

  useEffect(() => {
    if (allReady) SplashScreen.hideAsync();
  }, [allReady]);

  if (!allReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="goal/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
