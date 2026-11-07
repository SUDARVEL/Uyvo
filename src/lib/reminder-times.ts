import type { SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_TIMES, normalizeTimes, type ReminderTime } from '@/domain/reminder-plan';

const TIMES_KEY = 'reminder_times';

export async function readReminderTimes(db: SQLiteDatabase): Promise<ReminderTime[]> {
  const row = await db.getFirstAsync<{ value: string }>('select value from meta where key = ?', TIMES_KEY);
  if (!row) return DEFAULT_TIMES.map((time) => ({ ...time }));
  try {
    return normalizeTimes(JSON.parse(row.value));
  } catch {
    return DEFAULT_TIMES.map((time) => ({ ...time }));
  }
}

export async function writeReminderTimes(db: SQLiteDatabase, times: ReadonlyArray<ReminderTime>): Promise<ReminderTime[]> {
  const next = normalizeTimes(times);
  await db.runAsync(
    'insert into meta (key, value) values (?, ?) on conflict(key) do update set value = excluded.value',
    TIMES_KEY,
    JSON.stringify(next),
  );
  return next;
}
