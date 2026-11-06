import { useEffect } from 'react';
import { DarkTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { listenForForgeOpens } from '@/lib/notifications';
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
    text: palette.cream,
    border: palette.line,
    notification: palette.crimson,
  },
};

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
  return (
    <ThemeProvider value={navigationTheme}>
      <SQLiteProvider databaseName="uyvo.db" onInit={migrate}>
        <GameProvider>
          <StatusBar style="light" />
          <ForgeNotifications />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} />
        </GameProvider>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
