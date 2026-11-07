import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { DarkTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import { useFonts } from 'expo-font';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces/400Regular_Italic';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_600SemiBold_Italic } from '@expo-google-fonts/fraunces/600SemiBold_Italic';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';

import { listenForForgeOpens, notifyUpdateReady } from '@/lib/notifications';
import { migrate } from '@/lib/store';
import { GameProvider, useGame } from '@/state/game';
import { palette } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: palette.bg,
    card: palette.raised,
    primary: palette.orange,
    text: palette.ink,
    border: palette.line,
    notification: palette.crimson,
  },
};

function UpdateNotice() {
  const updates = Updates.useUpdates();
  const told = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' || !Updates.isEnabled) return;
    const look = () => {
      void Updates.checkForUpdateAsync()
        .then((result) => {
          if (result.isAvailable) return Updates.fetchUpdateAsync();
        })
        .catch(() => undefined);
    };
    look();
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') look();
    });
    return () => app.remove();
  }, []);

  useEffect(() => {
    if (!updates.isUpdatePending) return;
    const id = updates.downloadedUpdate?.updateId ?? 'pending';
    if (told.current === id) return;
    told.current = id;
    void notifyUpdateReady();
  }, [updates.isUpdatePending, updates.downloadedUpdate]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let remove: () => void = () => undefined;
    void import('expo-notifications').then((Notifications) => {
      const sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.kind === 'update') void Updates.reloadAsync();
      });
      remove = () => sub.remove();
    });
    return () => remove();
  }, []);

  return null;
}

function ForgeNotifications() {
  const router = useRouter();
  const ready = useGame().ready;
  useEffect(() => {
    if (!ready) return;
    let remove: () => void = () => undefined;
    let alive = true;
    void listenForForgeOpens(() => {
      router.push('/forge');
    }).then((unsubscribe) => {
      if (!alive) unsubscribe();
      else remove = unsubscribe;
    });
    return () => {
      alive = false;
      remove();
    };
  }, [ready, router]);
  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular_Italic,
    Fraunces_600SemiBold,
    Fraunces_600SemiBold_Italic,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  if (!fontsLoaded && !fontError) return null;
  return (
    <ThemeProvider value={navigationTheme}>
      <SQLiteProvider databaseName="uyvo.db" onInit={migrate}>
        <GameProvider>
          <StatusBar style="dark" />
          <ForgeNotifications />
          <UpdateNotice />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} />
        </GameProvider>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
