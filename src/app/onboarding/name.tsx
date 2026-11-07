import { useState } from 'react';
import { Image } from 'expo-image';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { openingArt } from '@/art';
import { Button } from '@/components/ui';
import { validateName } from '@/domain/engine';
import { useGame } from '@/state/game';
import { PullRefresh } from '@/state/refresh';
import { font, palette } from '@/theme';

export function OnboardingBar({ step, onBack }: { step: 1 | 2; onBack: () => void }) {
  return (
    <View style={styles.bar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.back}>
        <Image source={openingArt.back} style={{ width: 20, height: 20 }} contentFit="contain" />
      </Pressable>
      <View style={styles.track}>
        <View style={[styles.segment, step >= 1 ? styles.segmentOn : null]} />
        <View style={[styles.segment, step >= 2 ? styles.segmentOn : null]} />
      </View>
      <Text style={styles.count}>{step} of 2</Text>
    </View>
  );
}

export default function NameScreen() {
  const game = useGame();
  const router = useRouter();
  const [name, setName] = useState(game.snap.profile?.displayName === 'Hero' ? '' : (game.snap.profile?.displayName ?? ''));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ready = validateName(name) === null;
  const insets = useSafeAreaInsets();

  if (!game.ready) return null;
  if (game.snap.mode === 'signed_out') return <Redirect href="/sign-in" />;
  if (game.snap.profile?.onboardedAt) return <Redirect href="/forge" />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        alwaysBounceVertical
        refreshControl={<PullRefresh />}>
      <View style={styles.grow}>
      <View style={styles.pad}>
        <OnboardingBar
          step={1}
          onBack={() => {
            void game.signOut().then(() => router.replace('/sign-in'));
          }}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.icon}>
          <Image source={openingArt.icon} style={styles.iconArt} contentFit="contain" />
        </View>
        <Text style={styles.title}>First, what should{'\n'}we call you?</Text>
        <Text style={styles.sub}>Just your first name. It stays on this phone.</Text>
        <Text style={styles.label}>First name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus
          placeholder="Meena"
          placeholderTextColor={palette.tertiary}
          style={styles.input}
        />
        {ready ? (
          <View style={styles.meet}>
            <Image source={openingArt.check} style={{ width: 14, height: 14 }} contentFit="contain" />
            <Text style={styles.meetText}>Nice to meet you, {name.trim()}</Text>
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      </View>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Button
          label="Next"
          disabled={busy || !ready}
          onPress={() => {
            setBusy(true);
            void game.saveName(name).then((saveError) => {
              setBusy(false);
              if (saveError) setError(saveError);
              else router.push('/onboarding/avatar');
            });
          }}
        />
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  grow: { flexGrow: 1 },
  pad: { paddingHorizontal: 24, paddingTop: 4 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 44 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.raised,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: { flex: 1, flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: palette.line },
  segmentOn: { backgroundColor: palette.crimson },
  count: { color: palette.tertiary, fontFamily: font.semibold, fontSize: 12 },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 28, gap: 10 },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FCF5EB',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconArt: { width: 48, height: 50 },
  title: { color: palette.ink, fontFamily: font.display, fontSize: 30, lineHeight: 36, letterSpacing: -0.6, marginTop: 6 },
  sub: { color: palette.muted, fontFamily: font.text, fontSize: 15, lineHeight: 22 },
  label: { color: palette.muted, fontFamily: font.semibold, fontSize: 12, marginTop: 10 },
  input: {
    height: 60,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: palette.crimson,
    backgroundColor: palette.raised,
    paddingHorizontal: 20,
    color: palette.ink,
    fontFamily: font.bold,
    fontSize: 18,
  },
  meet: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meetText: { color: palette.leaf, fontFamily: font.semibold, fontSize: 12 },
  error: { color: palette.crimson, fontFamily: font.semibold, fontSize: 13 },
  footer: { paddingHorizontal: 24, paddingBottom: 12 },
});
