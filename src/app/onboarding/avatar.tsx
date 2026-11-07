import { useState } from 'react';
import { Image } from 'expo-image';
import { Redirect, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { heroArt, openingArt } from '@/art';
import { OnboardingBar } from '@/app/onboarding/name';
import { PictureCard } from '@/components/picture-card';
import { Button } from '@/components/ui';
import type { AvatarId } from '@/domain/engine';
import { useGame } from '@/state/game';
import { PullRefresh } from '@/state/refresh';
import { font, palette } from '@/theme';

const growth = [
  { label: 'Low', state: 'pale', bg: palette.sunken, on: true },
  { label: 'Tired', state: 'tired', bg: palette.sunken, on: false },
  { label: 'Strong', state: 'armored', bg: palette.blush, on: false },
  { label: 'Full', state: 'glowing', bg: palette.amberSoft, on: false },
] as const;

export default function AvatarScreen() {
  const game = useGame();
  const router = useRouter();
  const [avatar, setAvatar] = useState<AvatarId>(game.snap.profile?.avatarId ?? 'woman');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const name = game.snap.profile?.displayName ?? 'there';
  const insets = useSafeAreaInsets();

  if (!game.ready) return null;
  if (game.snap.mode === 'signed_out') return <Redirect href="/sign-in" />;
  if (game.snap.profile?.onboardedAt) return <Redirect href="/forge" />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        alwaysBounceVertical
        refreshControl={<PullRefresh />}>
        <OnboardingBar step={2} onBack={() => router.back()} />
        <Text style={styles.title}>
          Hi <Text style={styles.name}>{name}</Text>,{'\n'}pick your picture.
        </Text>
        <Text style={styles.sub}>Both start at Low. Food makes them stronger.</Text>
        <View style={styles.cards}>
          <PictureCard label="Woman" sub="Starts at Low" art={openingArt.womanLow} selected={avatar === 'woman'} onPress={() => setAvatar('woman')} />
          <PictureCard label="Man" sub="Starts at Low" art={openingArt.manLow} selected={avatar === 'man'} onPress={() => setAvatar('man')} />
        </View>
        <View style={styles.grows}>
          <View style={styles.growHead}>
            <Text style={styles.growKicker}>HOW YOUR PICTURE GROWS</Text>
            <Text style={styles.growMeta}>in one day</Text>
          </View>
          <View style={styles.growRow}>
            {growth.map((item, index) => (
              <View key={item.label} style={styles.growItem}>
                <View style={styles.step}>
                  <View style={[styles.bubble, { backgroundColor: item.bg }, item.on ? styles.bubbleOn : null]}>
                    <Image source={heroArt[avatar][item.state]} style={styles.bubbleArt} contentFit="contain" />
                  </View>
                  <Text style={[styles.bubbleLabel, item.on ? styles.bubbleLabelOn : null]}>{item.label}</Text>
                </View>
                {index < growth.length - 1 ? <Image source={openingArt.chevronGray} style={styles.chevron} contentFit="contain" /> : null}
              </View>
            ))}
          </View>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Button
          label="Start today"
          disabled={busy}
          onPress={() => {
            setBusy(true);
            void game.saveAvatar(avatar).then((saveError) => {
              setBusy(false);
              if (saveError) {
                setError(saveError);
                return;
              }
              router.replace('/forge');
              void game.setReminders(true).catch(() => undefined);
            });
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  list: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 4, gap: 10, paddingBottom: 12, flexGrow: 1 },
  title: { color: palette.ink, fontFamily: font.display, fontSize: 30, lineHeight: 36, letterSpacing: -0.6, marginTop: 24 },
  name: { fontFamily: font.displayItalic, color: palette.crimson },
  sub: { color: palette.muted, fontFamily: font.text, fontSize: 15, lineHeight: 22 },
  cards: { flexDirection: 'row', gap: 16, marginTop: 10 },
  grows: {
    marginTop: 6,
    backgroundColor: palette.raised,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    shadowColor: '#5C331F',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  growHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  growKicker: { color: palette.tertiary, fontFamily: font.extra, fontSize: 11, letterSpacing: 1.2 },
  growMeta: { color: palette.tertiary, fontFamily: font.semibold, fontSize: 12 },
  growRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  growItem: { flexDirection: 'row', alignItems: 'flex-start' },
  step: { alignItems: 'center', gap: 6 },
  chevron: { width: 14, height: 14, marginTop: 20, marginHorizontal: 2 },
  bubble: { width: 54, height: 54, borderRadius: 27, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
  bubbleOn: { borderWidth: 2.5, borderColor: palette.crimson },
  bubbleArt: { width: 58, height: 58 },
  bubbleLabel: { color: palette.muted, fontFamily: font.semibold, fontSize: 12 },
  bubbleLabelOn: { color: palette.crimson },
  error: { color: palette.crimson, fontFamily: font.semibold },
  footer: { paddingHorizontal: 24, paddingBottom: 8 },
});
