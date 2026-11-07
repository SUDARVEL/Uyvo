import { Platform } from 'react-native';

import {
  LEGACY_IDS,
  TEST_ID,
  isManagedId,
  planNotifications,
  plannedKey,
  type PlanInput,
} from '@/domain/reminder-plan';

export const NOTIFICATIONS_OFF = 'Notifications are off for Uyvo on this phone.';
export const NOT_IN_BROWSER = 'Reminders work in the app, not in this browser.';

type Notifications = typeof import('expo-notifications');

async function notifications() {
  return import('expo-notifications');
}

// Android 13 and newer only show the permission question after a channel exists,
// so channels are always created before anything asks.
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
      name: 'Food reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200],
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('wait', {
      name: 'The 60 minute wait',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
      sound: 'default',
    });
  }
  return Notifications;
}

function allows(Notifications: Notifications, status: { granted: boolean; ios?: { status: number } }): boolean {
  return status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

async function cancelOne(Notifications: Notifications, id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // The id is not scheduled.
  }
}

async function applyPlan(input: PlanInput): Promise<void> {
  const Notifications = await prepare();
  const planned = planNotifications(input);
  const wanted = new Map(planned.map((item) => [item.id, item]));
  let existing: Awaited<ReturnType<Notifications['getAllScheduledNotificationsAsync']>> = [];
  let listed = true;
  try {
    existing = await Notifications.getAllScheduledNotificationsAsync();
  } catch {
    listed = false;
  }
  // Only Uyvo's own reminder and wait ids are touched. 'uyvo-update' and anything else stay.
  // The three old repeating ids (uyvo-0730, uyvo-1100, uyvo-1330) are never wanted, so they are removed here.
  const kept = new Set<string>();
  for (const request of existing) {
    const id = request.identifier;
    if (!isManagedId(id)) continue;
    const item = wanted.get(id);
    if (item && request.content.data?.key === plannedKey(item)) {
      kept.add(id);
      continue;
    }
    await cancelOne(Notifications, id);
  }
  if (!listed) for (const id of LEGACY_IDS) await cancelOne(Notifications, id);
  if (planned.length === 0) return;
  const access = await Notifications.getPermissionsAsync();
  if (!allows(Notifications, access)) return;
  for (const item of planned) {
    if (kept.has(item.id)) continue;
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: item.id,
        content: {
          title: item.title,
          body: item.body,
          data: { route: 'forge', key: plannedKey(item) },
          priority: Notifications.AndroidNotificationPriority.HIGH,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(item.fireAt),
          channelId: item.channel,
        },
      });
    } catch {
      // One bad alarm must not stop the rest. The next change tries again.
    }
  }
}

let queue: Promise<void> = Promise.resolve();
let latest: PlanInput | null = null;

async function runLatest(): Promise<void> {
  const input = latest;
  latest = null;
  if (!input) return;
  try {
    await applyPlan(input);
  } catch {
    // The next change plans again.
  }
}

// Makes the phone match the plan. Calls queue up and only the newest one is applied.
export function syncNotifications(input: PlanInput): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve();
  latest = input;
  queue = queue.then(runLatest);
  return queue;
}

export function cancelReminders(): Promise<void> {
  return syncNotifications({
    enabled: false,
    times: [],
    order: [],
    foods: {},
    logs: [],
    teas: [],
    now: new Date(),
  });
}

export async function ensureReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const Notifications = await prepare();
  const current = await Notifications.getPermissionsAsync();
  if (allows(Notifications, current)) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return allows(Notifications, asked);
}

export async function readNotificationAccess(): Promise<'on' | 'off' | 'unknown'> {
  if (Platform.OS === 'web') return 'unknown';
  try {
    const Notifications = await notifications();
    return allows(Notifications, await Notifications.getPermissionsAsync()) ? 'on' : 'off';
  } catch {
    return 'unknown';
  }
}

export async function sendTestReminder(): Promise<string | null> {
  if (Platform.OS === 'web') return NOT_IN_BROWSER;
  if (!(await ensureReminderPermission())) return NOTIFICATIONS_OFF;
  const Notifications = await prepare();
  await cancelOne(Notifications, TEST_ID);
  await Notifications.scheduleNotificationAsync({
    identifier: TEST_ID,
    content: {
      title: 'This is a test reminder',
      body: 'Your reminders will look like this. Tap to open Today.',
      data: { route: 'forge' },
      priority: Notifications.AndroidNotificationPriority.HIGH,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: 'reminders',
    },
  });
  return null;
}

export async function notifyUpdateReady(title = 'Uyvo has something new', body = 'Tap to see it.'): Promise<void> {
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
      title,
      body,
      data: { kind: 'update' },
      priority: Notifications.AndroidNotificationPriority.HIGH,
      sound: true,
    },
    // A null trigger is immediate, but on Android it ignores the channel.
    // `{ channelId }` is the immediate trigger that uses updates-high.
    trigger: Platform.OS === 'android' ? { channelId: 'updates-high' } : null,
  });
}

export async function listenForNotices(onNotice: (title: string, body: string) => void): Promise<() => void> {
  if (Platform.OS === 'web') return () => undefined;
  const Notifications = await notifications();
  const subscription = Notifications.addNotificationReceivedListener((event) => {
    if (event.request.content.data?.kind === 'update') return;
    onNotice(event.request.content.title ?? 'Uyvo', event.request.content.body ?? '');
  });
  return () => subscription.remove();
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
