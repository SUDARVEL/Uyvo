import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { heroArt } from '@/art';
import { Banner, Body, Button, Mark, Screen, Title } from '@/components/ui';
import { PERSON_LABEL } from '@/domain/copy';
import { AVATARS, type AvatarId } from '@/domain/engine';
import { useGame } from '@/state/game';
import { palette } from '@/theme';

export default function AvatarScreen() {
  const game = useGame();
  const router = useRouter();
  const [avatar, setAvatar] = useState<AvatarId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!game.ready) return null;
  if (game.snap.mode === 'signed_out') return <Redirect href="/sign-in" />;
  if (game.snap.profile?.onboardedAt) return <Redirect href="/forge" />;

  return (
    <Screen>
      <Mark size={168} />
      <Title>Who are you?</Title>
      <Body>Food changes the picture.</Body>
      {error ? <Banner tone="crimson">{error}</Banner> : null}
      <View style={styles.row}>
        {AVATARS.map((choice) => {
          const selected = avatar === choice;
          return (
            <Pressable
              key={choice}
              accessibilityRole="button"
              onPress={() => setAvatar(choice)}
              style={[styles.choice, { borderColor: selected ? palette.crimson : palette.line }]}>
              <Image source={heroArt[choice].pale} style={styles.preview} resizeMode="cover" />
              <Text style={styles.label}>{PERSON_LABEL[choice]}</Text>
            </Pressable>
          );
        })}
      </View>
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
  row: { flexDirection: 'row', gap: 12 },
  choice: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 18,
    padding: 10,
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.raised,
  },
  preview: { width: '100%', height: 168, borderRadius: 12, backgroundColor: palette.cream },
  label: { color: palette.ink, fontSize: 18, fontWeight: '600' },
});
