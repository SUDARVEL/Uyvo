import type { FoodStepKey } from './plan';

export type ReminderTime = { hour: number; minute: number };

export type PlannedNotification = {
  id: string;
  channel: 'reminders' | 'wait';
  fireAt: number;
  title: string;
  body: string;
};

export type PlanInput = {
  enabled: boolean;
  times: ReadonlyArray<ReminderTime>;
  order: ReadonlyArray<FoodStepKey>;
  foods: Readonly<Record<string, string>>;
  logs: ReadonlyArray<{ localDate: string; questKey: string }>;
  teas: ReadonlyArray<{ status: string; endsAt: string }>;
  now: Date;
  dayOffset?: number;
  days?: number;
};

export const REMINDER_SLOTS = 3;
export const PLAN_DAYS = 14;
export const REMINDER_PREFIX = 'uyvo-r-';
export const WAIT_ID = 'uyvo-wait';
export const TEST_ID = 'uyvo-test';
export const LEGACY_IDS: readonly string[] = ['uyvo-0730', 'uyvo-1100', 'uyvo-1330'];

export const WAIT_TITLE = 'Your 60 minutes are over';
export const WAIT_BODY = 'You can have tea now. Open Uyvo to collect +5 iron.';

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_LEAD_MS = 2000;

export const DEFAULT_TIMES: ReadonlyArray<ReminderTime> = [
  { hour: 7, minute: 30 },
  { hour: 11, minute: 0 },
  { hour: 13, minute: 30 },
];

const FOOD_ORDER: ReadonlyArray<FoodStepKey> = ['morning_shot', 'midmorning_juice', 'lunch_greens'];

const SHORT_NAME: Record<FoodStepKey, string> = {
  morning_shot: 'Soaked dry fruit',
  midmorning_juice: 'Red juice',
  lunch_greens: 'Green lunch',
};

const SLOT_BODY: ReadonlyArray<string> = [
  'Drink it first. Lemon or guava doubles the iron.',
  'Drink it before lunch. Lemon or guava doubles the iron.',
  'Eat them now. Then wait 60 minutes with no tea.',
];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Calendar math in UTC, so a daylight saving change can never skip or repeat a day.
export function shiftDay(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number);
  const moved = new Date(Date.UTC(year, month - 1, day + days));
  return `${moved.getUTCFullYear()}-${pad(moved.getUTCMonth() + 1)}-${pad(moved.getUTCDate())}`;
}

function atClock(key: string, time: ReminderTime): number {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, time.hour, time.minute, 0, 0).getTime();
}

function validTime(value: unknown): value is ReminderTime {
  if (!value || typeof value !== 'object') return false;
  const { hour, minute } = value as Record<string, unknown>;
  return (
    typeof hour === 'number' &&
    typeof minute === 'number' &&
    Number.isInteger(hour) &&
    Number.isInteger(minute) &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  );
}

export function normalizeTimes(value: unknown): ReminderTime[] {
  const incoming = Array.isArray(value) ? value : [];
  return DEFAULT_TIMES.map((fallback, slot) => {
    const found = incoming[slot];
    return validTime(found) ? { hour: found.hour, minute: found.minute } : { ...fallback };
  });
}

export function sameTime(a: ReminderTime, b: ReminderTime): boolean {
  return a.hour === b.hour && a.minute === b.minute;
}

export function clockLabel(time: ReminderTime): string {
  return `${time.hour % 12 || 12}:${pad(time.minute)} ${time.hour < 12 ? 'AM' : 'PM'}`;
}

export function toTime(hour12: number, minute: number, pm: boolean): ReminderTime {
  return { hour: (hour12 % 12) + (pm ? 12 : 0), minute };
}

export function minuteChoices(current: number): number[] {
  const choices = Array.from({ length: 12 }, (_, index) => index * 5);
  if (!choices.includes(current)) choices.push(current);
  return choices.sort((a, b) => a - b);
}

export function slotFoods(order: ReadonlyArray<FoodStepKey>): FoodStepKey[] {
  const seen = new Set<FoodStepKey>();
  const picked: FoodStepKey[] = [];
  for (const key of order) {
    if (FOOD_ORDER.includes(key) && !seen.has(key)) {
      seen.add(key);
      picked.push(key);
    }
  }
  for (const key of FOOD_ORDER) if (!seen.has(key)) picked.push(key);
  return picked;
}

export function foodNameFor(key: FoodStepKey, foods: Readonly<Record<string, string>>): string {
  const mine = foods[key]?.trim();
  return mine ? mine : SHORT_NAME[key];
}

export function reminderCopy(
  slot: number,
  key: FoodStepKey,
  foods: Readonly<Record<string, string>>,
): { title: string; body: string } {
  return {
    title: `${foodNameFor(key, foods)} is ready`,
    body: SLOT_BODY[Math.min(Math.max(slot, 0), SLOT_BODY.length - 1)],
  };
}

function waitNotification(input: PlanInput): PlannedNotification | null {
  const nowMs = input.now.getTime();
  const offset = (input.dayOffset ?? 0) * DAY_MS;
  const ends = input.teas
    .filter((tea) => tea.status === 'active')
    .map((tea) => new Date(tea.endsAt).getTime() - offset)
    .filter((ms) => Number.isFinite(ms) && ms - nowMs >= MIN_LEAD_MS)
    .sort((a, b) => a - b);
  if (ends.length === 0) return null;
  return { id: WAIT_ID, channel: 'wait', fireAt: ends[0], title: WAIT_TITLE, body: WAIT_BODY };
}

// Plans real phone alarms, so it uses the real clock. The admin test day only
// moves the app's own days: it never moves an alarm.
export function planNotifications(input: PlanInput): PlannedNotification[] {
  if (!input.enabled) return [];
  const nowMs = input.now.getTime();
  const times = normalizeTimes(input.times);
  const foods = slotFoods(input.order);
  const today = dayKey(input.now);
  const done = new Set<string>();
  if ((input.dayOffset ?? 0) === 0) {
    for (const log of input.logs) if (log.localDate === today) done.add(log.questKey);
  }
  const planned: PlannedNotification[] = [];
  for (let day = 0; day < (input.days ?? PLAN_DAYS); day += 1) {
    const key = shiftDay(today, day);
    const stamp = key.replace(/-/g, '');
    for (let slot = 0; slot < REMINDER_SLOTS; slot += 1) {
      const food = foods[slot];
      if (day === 0 && done.has(food)) continue;
      const fireAt = atClock(key, times[slot]);
      if (fireAt - nowMs < MIN_LEAD_MS) continue;
      planned.push({
        id: `${REMINDER_PREFIX}${slot}-${stamp}`,
        channel: 'reminders',
        fireAt,
        ...reminderCopy(slot, food, input.foods),
      });
    }
  }
  const wait = waitNotification(input);
  if (wait) planned.push(wait);
  return planned.sort((a, b) => a.fireAt - b.fireAt);
}

export function isManagedId(id: string): boolean {
  return id.startsWith(REMINDER_PREFIX) || id === WAIT_ID || LEGACY_IDS.includes(id);
}

export function plannedKey(item: PlannedNotification): string {
  return `${item.channel}|${item.fireAt}|${item.title}|${item.body}`;
}
