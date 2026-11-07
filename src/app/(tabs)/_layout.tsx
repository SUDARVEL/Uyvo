import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FullWeek } from '@/components/full-week';
import { Icon, type IconName } from '@/components/icons';
import { useGame } from '@/state/game';
import { font, palette } from '@/theme';

function tabIcon(on: IconName, off: IconName) {
  return ({ focused }: { focused: boolean }) => (
    <View
      style={{
        backgroundColor: focused ? palette.blush : 'transparent',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 4,
      }}>
      <Icon name={focused ? on : off} size={22} />
    </View>
  );
}

export default function TabsLayout() {
  const game = useGame();
  const insets = useSafeAreaInsets();
  if (!game.ready) return null;
  if (game.snap.mode === 'signed_out') return <Redirect href="/sign-in" />;
  if (!game.snap.profile?.onboardedAt) return <Redirect href="/onboarding/name" />;
  const week = game.notice?.toLowerCase().includes('red fruit') ?? false;
  const tabInset = Math.max(insets.bottom, 8);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: palette.raised,
            borderTopColor: palette.line,
            height: 64 + tabInset,
            paddingTop: 8,
            paddingBottom: tabInset,
          },
          tabBarActiveTintColor: palette.crimson,
          tabBarInactiveTintColor: palette.tertiary,
          tabBarLabelStyle: { fontFamily: font.bold, fontSize: 12 },
        }}>
        <Tabs.Screen name="forge" options={{ title: 'Today', tabBarIcon: tabIcon('sunOn', 'sunMuted') }} />
        <Tabs.Screen name="vein-train" options={{ title: 'Days', tabBarIcon: tabIcon('sprout', 'sproutMuted') }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: tabIcon('slidersOn', 'sliders') }} />
      </Tabs>
      {week ? <FullWeek fruitCount={game.snap.tree.fruitCount} onClose={game.clearNotice} /> : null}
    </View>
  );
}
