import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { noticeMark } from '@/art';
import { font, palette } from '@/theme';

export function NoticeCard({ title, body, onPress }: { title: string; body: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.icon}>
        <Image source={noticeMark} style={styles.mark} contentFit="contain" />
      </View>
      <View style={styles.copy}>
        <View style={styles.top}>
          <Text style={styles.app}>Uyvo</Text>
          <Text style={styles.now}>now</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,247,242,0.9)',
    borderRadius: 24,
    padding: 14,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    overflow: 'hidden',
    shadowColor: '#5C331F',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  icon: { width: 40, height: 40, borderRadius: 10, overflow: 'hidden' },
  mark: { width: 40, height: 40 },
  copy: { flex: 1, gap: 2 },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  app: { color: palette.muted, fontFamily: font.semibold, fontSize: 12, lineHeight: 16 },
  now: { color: palette.tertiary, fontFamily: font.semibold, fontSize: 12, lineHeight: 16 },
  title: { color: palette.ink, fontFamily: font.bold, fontSize: 16, lineHeight: 22, letterSpacing: -0.1 },
  body: { color: palette.muted, fontFamily: font.text, fontSize: 13, lineHeight: 18 },
});
