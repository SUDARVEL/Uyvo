import { Platform } from 'react-native';

import { REMINDERS } from '@/domain/copy';

async function notifications() {
  return import('expo-notifications');
}

async function prepare() {
  const Notifications = await notifications();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('forge', {
      name: 'Daily reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return Notifications;
}

export async function scheduleReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  const Notifications = await prepare();
  for (const reminder of REMINDERS) {
    try {
      await Notifications.cancelScheduledNotificationAsync(reminder.id);
    } catch {
      // The id is not scheduled yet.
    }
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { route: 'forge' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminder.hour,
        minute: reminder.minute,
        channelId: 'forge',
      },
    });
  }
}

export async function cancelReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  const Notifications = await notifications();
  for (const reminder of REMINDERS) {
    try {
      await Notifications.cancelScheduledNotificationAsync(reminder.id);
    } catch {
      // Already gone.
    }
  }
}

export async function ensureReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const Notifications = await notifications();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function rescheduleIfAllowed(): Promise<void> {
  if (Platform.OS === 'web') return;
  const Notifications = await notifications();
  const current = await Notifications.getPermissionsAsync();
  if (!current.granted) return;
  await scheduleReminders();
}

export async function listenForForgeOpens(onOpen: () => void): Promise<() => void> {
  if (Platform.OS === 'web') return () => undefined;
  const Notifications = await notifications();
  const subscription = Notifications.addNotificationResponseReceivedListener(() => {
    onOpen();
  });
  return () => subscription.remove();
}
