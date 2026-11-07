import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { markArt } from '@/art';
import { Icon } from '@/components/icons';
import { font, palette } from '@/theme';

export default function ReminderScreen() {
  const router = useRouter();
  return (
    <View style={styles.page}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
        <Icon name="back" size={22} />
      </Pressable>
      <Text style={styles.clock}>7:30</Text>
      <Text style={styles.day}>Saturday, 7 November</Text>
      <View style={styles.note}>
        <Image source={markArt} style={styles.mark} />
        <View style={styles.copy}>
          <Text style={styles.app}>UYVO</Text>
          <Text style={styles.title}>Your soaked dry fruit is ready</Text>
          <Text style={styles.body}>Drink it first. Lemon or guava doubles the iron.</Text>
        </View>
      </View>
      <Text style={styles.also}>Also at 11:00 AM and 1:30 PM.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#1C1412', padding: 24, paddingTop: 64, gap: 16 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clock: { color: '#FFFFFF', fontFamily: font.display, fontSize: 72, lineHeight: 78, textAlign: 'center', marginTop: 24 },
  day: { color: 'rgba(255,255,255,0.72)', fontFamily: font.text, fontSize: 16, textAlign: 'center' },
  note: {
    marginTop: 28,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  mark: { width: 52, height: 52, borderRadius: 12 },
  copy: { flex: 1, gap: 2 },
  app: { color: palette.tertiary, fontFamily: font.bold, fontSize: 11, letterSpacing: 1.2 },
  title: { color: palette.ink, fontFamily: font.semibold, fontSize: 16 },
  body: { color: palette.muted, fontFamily: font.text, fontSize: 14, lineHeight: 19 },
  also: { color: 'rgba(255,255,255,0.72)', fontFamily: font.text, fontSize: 14, textAlign: 'center' },
});
