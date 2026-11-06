import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { useGame } from '@/state/game';
import { palette } from '@/theme';

export default function TabsLayout() {
  const game = useGame();
  if (!game.ready) return null;
  if (game.snap.mode === 'signed_out') return <Redirect href="/sign-in" />;
  if (!game.snap.profile?.onboardedAt) return <Redirect href="/onboarding/name" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: palette.raised, borderTopColor: palette.line },
        tabBarActiveTintColor: palette.orange,
        tabBarInactiveTintColor: palette.muted,
      }}>
      <Tabs.Screen name="forge" options={{ title: 'Today' }} />
      <Tabs.Screen name="vein-train" options={{ title: 'Days' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
