import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/theme';

const steps = [
  'This picture shows how you are today. Food makes it stronger.',
  'The big card is the next thing to do. Tap it.',
  'After green lunch, wait 60 minutes. Do not drink tea.',
  'The Days tab shows how many days in a row.',
];

export function Coach({ step, onNext }: { step: number; onNext: () => void }) {
  const last = step >= steps.length - 1;
  return (
    <View style={styles.scrim}>
      <View style={styles.card}>
        <Text style={styles.count}>{step + 1} of {steps.length}</Text>
        <Text style={styles.body}>{steps[step]}</Text>
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
    backgroundColor: 'rgba(28,28,30,0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  card: {
    backgroundColor: palette.raised,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  count: { color: palette.muted, fontSize: 13 },
  body: { color: palette.ink, fontSize: 22, fontWeight: '600', lineHeight: 28 },
  button: { backgroundColor: palette.ink, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
