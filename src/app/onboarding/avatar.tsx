import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { heroArt } from '@/art';
import { Banner, Button, Screen } from '@/components/ui';
import { Icon } from '@/components/icons';
import { PERSON_LABEL } from '@/domain/copy';
import { AVATARS, type AvatarId } from '@/domain/engine';
import { useGame } from '@/state/game';
import { font, palette } from '@/theme';

export default function AvatarScreen() {
  const game = useGame();
  const router = useRouter();
  const [avatar, setAvatar] = useState<AvatarId>(game.snap.profile?.avatarId ?? 'woman');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const name = game.snap.profile?.displayName ?? 'there';

  if (!game.ready) return null;
  if (game.snap.mode === 'signed_out') return <Redirect href="/sign-in" />;
  if (game.snap.profile?.onboardedAt) return <Redirect href="/forge" />;

  return (
    <Screen>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
          <Icon name="back" size={22} />
        </Pressable>
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotOn]} />
          <View style={styles.dot} />
        </View>
        <View style={styles.spacer} />
      </View>
      <Text style={styles.title}>Hi {name}.{'\n'}Pick your picture.</Text>
      <Text style={styles.sub}>Both start at Low. Food makes them stronger.</Text>
      {error ? <Banner tone="crimson">{error}</Banner> : null}
      <View style={styles.row}>
        {AVATARS.map((choice) => {
          const selected = avatar === choice;
          return (
            <Pressable
              key={choice}
              accessibilityRole="button"
              onPress={() => setAvatar(choice)}
              style={[styles.choice, selected ? styles.choiceOn : null]}>
              <Image source={heroArt[choice].pale} style={[styles.preview, selected ? styles.previewOn : null]} resizeMode="cover" />
              <View style={styles.choiceFoot}>
                <Text style={styles.label}>{PERSON_LABEL[choice]}</Text>
                {selected ? <Icon name="radio" size={22} /> : <View style={styles.radio} />}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.note}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>Low</Text>
        </View>
        <Text style={styles.noteText}>is where everyone begins</Text>
      </View>
      <Button
        label="Start today"
        disabled={busy}
        onPress={() => {
          setBusy(true);
          void game.saveAvatar(avatar).then((saveError) => {
            setBusy(false);
            if (saveError) setError(saveError);
            else router.replace('/forge');
          });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: { width: 44, height: 44 },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.line },
  dotOn: { width: 22, backgroundColor: palette.crimson },
  title: { color: palette.ink, fontFamily: font.display, fontSize: 36, lineHeight: 42 },
  sub: { color: palette.muted, fontFamily: font.text, fontSize: 16, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 12 },
  choice: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: palette.line,
    backgroundColor: palette.raised,
    overflow: 'hidden',
  },
  choiceOn: { borderColor: palette.crimson, borderWidth: 2.5 },
  preview: { width: '100%', height: 180, backgroundColor: palette.sunken },
  previewOn: { backgroundColor: palette.blush },
  choiceFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  label: { color: palette.ink, fontFamily: font.bold, fontSize: 16 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: palette.line },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: { backgroundColor: palette.blush, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { color: palette.crimson, fontFamily: font.bold, fontSize: 13 },
  noteText: { color: palette.muted, fontFamily: font.text, fontSize: 14 },
});
