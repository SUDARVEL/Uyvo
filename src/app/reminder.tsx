import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Icon } from '@/components/icons';
import { NoticeCard } from '@/components/notice';
import { REMINDERS, reminderById } from '@/domain/copy';
import { font } from '@/theme';

function clockLabel(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const suffix = hour < 12 ? 'AM' : 'PM';
  return `${h}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export default function ReminderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const reminder = reminderById(typeof params.id === 'string' ? params.id : undefined);
  const day = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');
  const also = REMINDERS.filter((item) => item.id !== reminder.id)
    .map((item) => clockLabel(item.hour, item.minute))
    .join(' and ');

  return (
    <View style={styles.page}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
        <Icon name="back" size={22} />
      </Pressable>
      <Text style={styles.day}>{day}</Text>
      <Text style={styles.clock}>{`${reminder.hour % 12 || 12}:${String(reminder.minute).padStart(2, '0')}`}</Text>
      <NoticeCard title={reminder.title} body={reminder.body} onPress={() => router.push('/forge')} />
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
  also: { color: '#6E5D55', fontFamily: font.text, fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
