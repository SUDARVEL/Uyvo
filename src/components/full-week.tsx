import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { treeArt } from '@/art';
import { font, palette } from '@/theme';

export function FullWeek({ fruitCount, onClose }: { fruitCount: number; onClose: () => void }) {
  return (
    <View style={styles.page}>
      <Image source={treeArt.fruit} style={styles.fruit} />
      <Text style={styles.kicker}>FULL WEEK</Text>
      <Text style={styles.title}>A pomegranate grew.</Text>
      <Text style={styles.body}>Seven full days. The count starts again at zero.</Text>
      <Text style={styles.count}>{fruitCount} red {fruitCount === 1 ? 'fruit' : 'fruits'}</Text>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.button}>
        <Text style={styles.buttonText}>Start a new week</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 12,
    zIndex: 20,
  },
  fruit: { width: 180, height: 180, borderRadius: 28 },
  kicker: { color: palette.crimson, fontFamily: font.bold, fontSize: 12, letterSpacing: 1.4 },
  title: { color: palette.ink, fontFamily: font.display, fontSize: 36, textAlign: 'center' },
  body: { color: palette.muted, fontFamily: font.text, fontSize: 16, textAlign: 'center', lineHeight: 22 },
  count: { color: palette.crimson, fontFamily: font.displayItalic, fontSize: 22 },
  button: {
    marginTop: 12,
    height: 56,
    borderRadius: 999,
    backgroundColor: palette.crimson,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  buttonText: { color: '#FFFFFF', fontFamily: font.bold, fontSize: 16 },
});
