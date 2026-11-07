import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodArt, heroArt, treeArt } from '@/art';
import { font, palette } from '@/theme';

const pages = [
  {
    title: 'Your picture,\nyour food',
    skip: true,
    steps: [
      { art: heroArt.woman.pale, title: 'The picture changes with food', body: 'Eat the iron foods and watch it get stronger.' },
      { art: foodArt.morning_shot, title: 'Tap the big Next card', body: 'It always shows the one thing to do now.' },
    ],
  },
  {
    title: 'Two small\nrules',
    skip: false,
    steps: [
      { art: foodArt.tea, title: 'After green lunch, wait 60 min', body: 'No tea. Water, a banana and a walk are fine.' },
      { art: treeArt.sapling, title: 'Days counts your days in a row', body: 'Seven full days grows a red fruit.' },
    ],
  },
] as const;

export function Coach({ step, onNext, onSkip }: { step: number; onNext: () => void; onSkip: () => void }) {
  const insets = useSafeAreaInsets();
  const page = pages[Math.min(step, pages.length - 1)] ?? pages[0];
  const last = step >= pages.length - 1;
  return (
    <View style={styles.scrim}>
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.handle} />
        <View style={styles.head}>
          <View style={styles.headCopy}>
            <Text style={styles.kicker}>HOW UYVO WORKS · {step + 1} OF 2</Text>
            <Text style={styles.title}>{page.title}</Text>
          </View>
          {page.skip ? (
            <Pressable accessibilityRole="button" onPress={onSkip}>
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
          ) : null}
        </View>
        {page.steps.map((item) => (
          <View key={item.title} style={styles.row}>
            <View style={styles.thumb}>
              <Image source={item.art} style={styles.thumbArt} contentFit="contain" />
            </View>
            <View style={styles.copy}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowBody}>{item.body}</Text>
            </View>
          </View>
        ))}
        <View style={styles.footer}>
          <View style={styles.dots}>
            {pages.map((_, index) => (
              <View key={index} style={[styles.dot, index === step ? styles.dotOn : null]} />
            ))}
          </View>
          <Pressable accessibilityRole="button" onPress={onNext} style={styles.button}>
            <Text style={styles.buttonText}>{last ? 'Start' : 'Next'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(43,13,18,0.62)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: palette.raised,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 16,
  },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: palette.line, alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  headCopy: { gap: 6, flexShrink: 1 },
  kicker: { color: palette.crimson, fontFamily: font.extra, fontSize: 11, letterSpacing: 1.2 },
  title: { color: palette.ink, fontFamily: font.display, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  skip: { color: palette.tertiary, fontFamily: font.semibold, fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: palette.bg, borderRadius: 20, padding: 12 },
  thumb: { width: 56, height: 56, borderRadius: 16, backgroundColor: palette.raised, alignItems: 'center', justifyContent: 'center' },
  thumbArt: { width: 50, height: 50 },
  copy: { flex: 1, gap: 2 },
  rowTitle: { color: palette.ink, fontFamily: font.bold, fontSize: 16, lineHeight: 22 },
  rowBody: { color: palette.muted, fontFamily: font.text, fontSize: 13, lineHeight: 18 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.line },
  dotOn: { width: 18, backgroundColor: palette.crimson },
  button: {
    width: 170,
    height: 56,
    borderRadius: 999,
    backgroundColor: palette.crimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontFamily: font.bold, fontSize: 16 },
});
