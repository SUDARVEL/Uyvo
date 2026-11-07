import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { Banner, Button, Screen } from '@/components/ui';
import { Icon } from '@/components/icons';
import { validateName } from '@/domain/engine';
import { useGame } from '@/state/game';
import { font, palette } from '@/theme';

function Dots({ step }: { step: 1 | 2 }) {
  return (
    <View style={styles.dots}>
      {[0, 1, 2].map((index) => (
        <View key={index} style={[styles.dot, index === step - 1 ? styles.dotOn : null]} />
      ))}
    </View>
  );
}

export default function NameScreen() {
  const game = useGame();
  const router = useRouter();
  const [name, setName] = useState(game.snap.profile?.displayName === 'Hero' ? '' : (game.snap.profile?.displayName ?? ''));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nameError = name.trim().length === 0 ? null : validateName(name);

  if (!game.ready) return null;
  if (game.snap.mode === 'signed_out') return <Redirect href="/sign-in" />;
  if (game.snap.profile?.onboardedAt) return <Redirect href="/forge" />;

  return (
    <Screen>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => {
            void game.signOut().then(() => router.replace('/sign-in'));
          }}
          style={styles.back}>
          <Icon name="back" size={22} />
        </Pressable>
        <Dots step={1} />
        <View style={styles.spacer} />
      </View>
      <Text style={styles.title}>What should we{'\n'}call you?</Text>
      <Text style={styles.sub}>Just a first name. It stays on this phone.</Text>
      {error || nameError ? <Banner tone="crimson">{error ?? nameError}</Banner> : null}
      <TextInput
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoCorrect={false}
        placeholder="Meena"
        placeholderTextColor={palette.tertiary}
        style={styles.input}
      />
      <Button
        label="Next"
        disabled={busy || validateName(name) !== null}
        onPress={() => {
          setBusy(true);
          void game.saveName(name).then((saveError) => {
            setBusy(false);
            if (saveError) setError(saveError);
            else router.push('/onboarding/avatar');
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
  input: {
    backgroundColor: palette.raised,
    color: palette.ink,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: palette.crimson,
    paddingHorizontal: 18,
    height: 60,
    fontSize: 18,
    fontFamily: font.semibold,
  },
});
