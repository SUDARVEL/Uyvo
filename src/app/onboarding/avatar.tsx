import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { HeroFigure } from '@/components/hero';
import { Banner, Body, Button, Screen, Title } from '@/components/ui';
import { RIBBON_LABEL } from '@/domain/copy';
import { AVATARS, type AvatarId } from '@/domain/engine';
import { useGame } from '@/state/game';
import { palette, sashColor } from '@/theme';

export default function AvatarScreen() {
  const game = useGame();
  const router = useRouter();
  const [avatar, setAvatar] = useState<AvatarId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const name = game.snap.profile?.displayName ?? 'Hero';

  if (!game.ready) return null;
  if (game.snap.mode === 'signed_out') return <Redirect href="/sign-in" />;
  if (game.snap.profile?.onboardedAt) return <Redirect href="/forge" />;

  return (
    <Screen>
      <Title>Pick a color</Title>
      <Body>The color is a ribbon. Food changes the picture.</Body>
      {error ? <Banner tone="crimson">{error}</Banner> : null}
      <View style={styles.row}>
        {AVATARS.map((choice) => {
          const selected = avatar === choice;
          return (
            <Pressable
              key={choice}
              accessibilityRole="button"
              onPress={() => setAvatar(choice)}
              style={[styles.choice, { borderColor: selected ? sashColor[choice] : palette.line }]}>
              <Text style={{ color: sashColor[choice], fontWeight: '800' }}>{RIBBON_LABEL[choice]}</Text>
            </Pressable>
          );
        })}
      </View>
      {avatar ? <HeroFigure state="pale" avatar={avatar} name={name} /> : null}
      <Button
        label="Start today"
        disabled={!avatar || busy}
        onPress={() => {
          if (!avatar) return;
          setBusy(true);
          void game.saveAvatar(avatar).then((saveError) => {
            setBusy(false);
            if (saveError) setError(saveError);
            else router.replace('/forge');
          });
        }}
      />
      <Button label="Back" tone="quiet" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  choice: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: palette.raised,
  },
});
