import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Icon } from '@/components/icons';
import { NoticeCard } from '@/components/notice';
import { REMINDERS, reminderById } from '@/domain/copy';
import { clockLabel, reminderCopy, slotFoods, type ReminderTime } from '@/domain/reminder-plan';
import { useGame } from '@/state/game';
import { useReminders } from '@/state/reminders';
import { font } from '@/theme';

function fromParams(hour: unknown, minute: unknown): ReminderTime | null {
  if (typeof hour !== 'string' || typeof minute !== 'string') return null;
  const h = Number.parseInt(hour, 10);
  const m = Number.parseInt(minute, 10);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { hour: h, minute: m };
}

export default function ReminderScreen() {
  const router = useRouter();
  const game = useGame();
  const reminders = useReminders();
  const params = useLocalSearchParams<{ id?: string; h?: string; m?: string }>();
  const reminder = reminderById(typeof params.id === 'string' ? params.id : undefined);
  const slot = REMINDERS.findIndex((item) => item.id === reminder.id);
  const time = fromParams(params.h, params.m) ?? reminders.times[slot];
  const copy = reminderCopy(slot, slotFoods(game.order)[slot], game.foods);
  const day = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');
  const also = reminders.times
    .filter((_, index) => index !== slot)
    .map((item) => clockLabel(item))
    .join(' and ');
  const clock = `${time.hour % 12 || 12}:${String(time.minute).padStart(2, '0')}`;

  return (
    <View style={styles.page}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
        <Icon name="back" size={22} />
      </Pressable>
      <Text style={styles.day}>{day}</Text>
      <Text style={styles.clock}>{clock}</Text>
      <Text style={styles.suffix}>{time.hour < 12 ? 'AM' : 'PM'}</Text>
      <NoticeCard title={copy.title} body={copy.body} onPress={() => router.push('/forge')} />
      <Text style={styles.also}>Also at {also}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F3E6DC', paddingHorizontal: 12, paddingTop: 64, gap: 16 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  day: { color: '#6E5D55', fontFamily: font.text, fontSize: 16, lineHeight: 22, textAlign: 'center' },
  clock: { color: '#2A1A17', fontFamily: font.display, fontSize: 92, lineHeight: 110, textAlign: 'center' },
  suffix: { color: '#6E5D55', fontFamily: font.bold, fontSize: 18, textAlign: 'center', marginTop: -28 },
  also: { color: '#6E5D55', fontFamily: font.text, fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
