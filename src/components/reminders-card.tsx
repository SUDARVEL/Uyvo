import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { Icon, Toggle } from '@/components/icons';
import { TimeSheet } from '@/components/time-sheet';
import { REMINDERS } from '@/domain/copy';
import { DEFAULT_TIMES, clockLabel, foodNameFor, slotFoods } from '@/domain/reminder-plan';
import { NOTIFICATIONS_OFF, readNotificationAccess, sendTestReminder } from '@/lib/notifications';
import { useGame } from '@/state/game';
import { useReminders } from '@/state/reminders';
import { font, palette } from '@/theme';

type Message = { text: string; tone: 'good' | 'bad' };

export function RemindersCard() {
  const game = useGame();
  const reminders = useReminders();
  const router = useRouter();
  const web = Platform.OS === 'web';
  const enabled = Boolean(game.snap.profile?.remindersEnabled) && !web;
  const [slot, setSlot] = useState<number | null>(null);
  const [access, setAccess] = useState<'on' | 'off' | 'unknown'>('unknown');
  const [tried, setTried] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const foods = slotFoods(game.order);

  const check = useCallback(() => {
    void readNotificationAccess().then(setAccess);
  }, []);

  useFocusEffect(check);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, [check]);

  const blocked = access === 'off' && (enabled || tried);
  const nameOf = (index: number) => foodNameFor(foods[index], game.foods);

  const finish = (text: string) => setMessage({ text, tone: 'good' });

  return (
    <>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Reminders</Text>
          <Toggle
            value={enabled}
            disabled={web}
            onValueChange={(next) => {
              setMessage(null);
              void game.setReminders(next).then((error) => {
                if (error === NOTIFICATIONS_OFF) setTried(true);
                else if (error) setMessage({ text: error, tone: 'bad' });
                else setTried(false);
                check();
              });
            }}
          />
        </View>

        {blocked ? (
          <View style={styles.alert}>
            <Text style={styles.alertTitle}>{NOTIFICATIONS_OFF}</Text>
            <Text style={styles.alertBody}>Turn them on in your phone settings. Then come back here.</Text>
            <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()} style={styles.alertButton}>
              <Text style={styles.alertButtonText}>Open phone settings</Text>
            </Pressable>
          </View>
        ) : null}

        {[0, 1, 2].map((index) => (
          <Pressable
            key={index}
            accessibilityRole="button"
            accessibilityLabel={`Change the time for ${nameOf(index)}`}
            onPress={() => setSlot(index)}
            style={[styles.row, styles.divided, !enabled ? styles.off : null]}>
            <Text style={styles.rowLabel}>{nameOf(index)}</Text>
            <Text style={styles.rowValue}>{clockLabel(reminders.times[index])}</Text>
            <Icon name="chevron" size={18} />
          </Pressable>
        ))}

        <Text style={styles.hint}>
          {enabled
            ? 'Tap a time to change it. Each reminder opens Today. Includes the end of the 60 minute wait.'
            : web
              ? 'Reminders work in the app, not in this browser. You can still set the times.'
              : 'Reminders are off. You can still change the times. When they are on, they include the end of the 60 minute wait.'}
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setMessage(null);
            void sendTestReminder().then((error) => {
              if (error === NOTIFICATIONS_OFF) setTried(true);
              setMessage(error ? { text: error, tone: 'bad' } : { text: 'A test reminder will come in about 5 seconds.', tone: 'good' });
              check();
            });
          }}
          style={[styles.row, styles.divided]}>
          <Text style={styles.rowLabel}>Send a test reminder</Text>
          <Icon name="chevron" size={18} />
        </Pressable>

        {Platform.OS !== 'ios' ? (
          <Text style={styles.hint}>
            If reminders are late on your phone, set Uyvo battery to No restrictions and allow auto start.
          </Text>
        ) : null}
      </View>

      {message ? (
        <Text accessibilityLiveRegion="polite" style={message.tone === 'good' ? styles.good : styles.bad}>
          {message.text}
        </Text>
      ) : null}

      {slot !== null ? (
        <TimeSheet
          title={nameOf(slot)}
          time={reminders.times[slot]}
          normal={DEFAULT_TIMES[slot]}
          onCancel={() => setSlot(null)}
          onSave={(time) => {
            const index = slot;
            setSlot(null);
            void reminders.saveTime(index, time).then(() => finish(`Saved. Reminder at ${clockLabel(time)}.`));
          }}
          onNormal={() => {
            const index = slot;
            setSlot(null);
            void reminders.saveTime(index, null).then(() => finish(`Saved. Reminder at ${clockLabel(DEFAULT_TIMES[index])}.`));
          }}
          onPreview={(time) => {
            const index = slot;
            setSlot(null);
            router.push(`/reminder?id=${REMINDERS[index].id}&h=${time.hour}&m=${time.minute}`);
          }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.raised, borderRadius: 24, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 56 },
  divided: { borderTopWidth: 1, borderTopColor: palette.line },
  off: { opacity: 0.55 },
  rowLabel: { flex: 1, color: palette.ink, fontFamily: font.semibold, fontSize: 16 },
  rowValue: { color: palette.muted, fontFamily: font.text, fontSize: 15 },
  hint: { color: palette.tertiary, fontFamily: font.text, fontSize: 13, lineHeight: 18, paddingVertical: 10 },
  alert: { backgroundColor: '#F8E6E8', borderRadius: 16, padding: 14, gap: 6, marginBottom: 10 },
  alertTitle: { color: palette.crimson, fontFamily: font.bold, fontSize: 15, lineHeight: 20 },
  alertBody: { color: palette.ink, fontFamily: font.text, fontSize: 14, lineHeight: 20 },
  alertButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 18,
    backgroundColor: palette.crimson,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  alertButtonText: { color: '#FFFFFF', fontFamily: font.bold, fontSize: 15 },
  good: { color: palette.leaf, fontFamily: font.semibold, fontSize: 14 },
  bad: { color: palette.crimson, fontFamily: font.semibold, fontSize: 14 },
});
