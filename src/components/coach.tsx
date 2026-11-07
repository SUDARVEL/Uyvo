import { Pressable, StyleSheet, Text, View } from 'react-native';

import { font, palette } from '@/theme';

const pages = [
  {
    title: 'Your picture, your food',
    steps: [
      ['The picture changes with food.', 'Eat well, it gets stronger.'],
      ['Tap the big Next card.', 'It always shows what to do now.'],
    ],
  },
  {
    title: 'Two small rules',
    steps: [
      ['After green lunch, wait 60 minutes.', 'Don’t drink tea.'],
      ['The Days tab counts your days in a row.', 'Seven full days grow a pomegranate.'],
    ],
  },
] as const;

export function Coach({ step, onNext }: { step: number; onNext: () => void }) {
  const page = pages[Math.min(step, pages.length - 1)] ?? pages[0];
  const last = step >= pages.length - 1;
  return (
    <View style={styles.scrim}>
      <View style={styles.sheet}>
        <Text style={styles.kicker}>HOW UYVO WORKS</Text>
        <Text style={styles.title}>{page.title}</Text>
        {page.steps.map(([lead, rest], index) => (
          <View key={lead} style={styles.row}>
            <View style={styles.num}>
              <Text style={styles.numText}>{step * 2 + index + 1}</Text>
            </View>
            <Text style={styles.copy}>
              <Text style={styles.lead}>{lead} </Text>
              {rest}
            </Text>
          </View>
        ))}
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
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(42,26,23,0.28)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.raised,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 28,
    gap: 16,
  },
  kicker: { color: palette.tertiary, fontFamily: font.bold, fontSize: 12, letterSpacing: 1.4 },
  title: { color: palette.ink, fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  num: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.blush,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { color: palette.crimson, fontFamily: font.bold, fontSize: 14 },
  copy: { flex: 1, color: palette.muted, fontFamily: font.text, fontSize: 15, lineHeight: 21 },
  lead: { color: palette.ink, fontFamily: font.semibold },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.line },
  dotOn: { width: 18, backgroundColor: palette.crimson },
  button: {
    height: 56,
    borderRadius: 999,
    backgroundColor: palette.crimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontFamily: font.bold, fontSize: 16 },
});
