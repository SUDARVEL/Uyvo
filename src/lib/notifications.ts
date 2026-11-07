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
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Daily reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200],
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
        channelId: 'reminders',
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

export async function notifyUpdateReady(): Promise<void> {
  if (Platform.OS === 'web') return;
  const Notifications = await prepare();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('updates-high', {
      name: 'App updates',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
  const current = await Notifications.getPermissionsAsync();
  const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return;
  try {
    await Notifications.dismissNotificationAsync('uyvo-update');
  } catch {
    // Nothing is showing yet.
  }
  try {
    await Notifications.cancelScheduledNotificationAsync('uyvo-update');
  } catch {
    // Nothing is waiting.
  }
  await Notifications.scheduleNotificationAsync({
    identifier: 'uyvo-update',
    content: {
      title: 'Uyvo has something new',
      body: 'Tap to see it.',
      data: { kind: 'update' },
      priority: Notifications.AndroidNotificationPriority.HIGH,
      sound: true,
    },
    // A null trigger is immediate, but on Android it ignores the channel.
    // `{ channelId }` is the immediate trigger that uses updates-high.
    trigger: Platform.OS === 'android' ? { channelId: 'updates-high' } : null,
  });
}

export async function listenForForgeOpens(onOpen: () => void): Promise<() => void> {
  if (Platform.OS === 'web') return () => undefined;
  const Notifications = await notifications();
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    if (response.notification.request.content.data?.kind === 'update') return;
    onOpen();
  });
  return () => subscription.remove();
}
