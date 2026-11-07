import type { SQLiteDatabase } from 'expo-sqlite';

import { localDate, logsOn } from '@/domain/engine';
import { FOOD_STEPS, type FoodStepKey } from '@/domain/plan';
import { appNow, getDayOffset, setDayOffset } from '@/lib/clock';
import {
  adminClearAll,
  adminClearDay,
  endWaitNow,
  logQuest,
  readSnap,
  startDigest,
  type ActionResult,
} from '@/lib/store';

export type AdminJump = 'start' | 'fruit' | 'juice' | 'wait' | 'done' | 'week';
export type AdminAction = 'skip' | 'finish' | AdminJump | 'reset';

const ok = (message: string | null = null): ActionResult => ({ error: null, message });

async function logFood(db: SQLiteDatabase, key: FoodStepKey): Promise<ActionResult> {
  return logQuest(db, { questKey: key, foodKey: key === 'lunch_greens' ? 'keerai' : null, vitaminCFood: null });
}

export async function skipStep(db: SQLiteDatabase, order: FoodStepKey[]): Promise<ActionResult> {
  const snap = await readSnap(db);
  const today = localDate(appNow());
  const done = new Set(logsOn(snap.logs, today).map((log) => log.questKey));
  if (snap.teas.some((tea) => tea.status === 'active')) return endWaitNow(db);
  const next = order.find((key) => !done.has(key));
  if (next) return logFood(db, next);
  const todayTea = snap.teas.find((tea) => tea.localDate === today);
  if (!todayTea) return startDigest(db);
  if (todayTea.status === 'drank') return { error: 'Tea was drunk today. Use Next day.', message: null };
  return { error: 'All 5 steps are done. Try Finish day and next.', message: null };
}

const isFullWeek = (message: string | null) => message?.includes('red fruit') ?? false;

export async function finishDay(db: SQLiteDatabase, order: FoodStepKey[]): Promise<string | null> {
  let celebration: string | null = null;
  for (let guard = 0; guard < 8; guard += 1) {
    const result = await skipStep(db, order);
    if (isFullWeek(result.message)) celebration = result.message;
    if (result.error) break;
  }
  const snap = await readSnap(db);
  const today = localDate(appNow());
  const todays = logsOn(snap.logs, today);
  const done = new Set(todays.map((log) => log.questKey));
  if (!done.has('banana')) await logQuest(db, { questKey: 'banana' });
  if (!done.has('walk')) await logQuest(db, { questKey: 'walk' });
  const glasses = todays.filter((log) => log.questKey === 'water').length;
  for (let glass = glasses; glass < 8; glass += 1) await logQuest(db, { questKey: 'water' });
  return celebration;
}

async function foodsUpTo(db: SQLiteDatabase, count: number): Promise<void> {
  for (const key of FOOD_STEPS.slice(0, count)) await logFood(db, key);
}

export async function jumpTo(db: SQLiteDatabase, target: AdminJump, order: FoodStepKey[]): Promise<ActionResult> {
  if (target === 'week') {
    const here = getDayOffset();
    const cleared = await adminClearAll(db);
    if (cleared.error) return cleared;
    try {
      for (let back = 6; back >= 0; back -= 1) {
        setDayOffset(here - back);
        await finishDay(db, order);
      }
    } finally {
      setDayOffset(here);
    }
    return ok('Seven full days are done. Open Today and Days.');
  }
  const cleared = await adminClearDay(db);
  if (cleared.error) return cleared;
  if (target === 'start') return ok('This test day is empty.');
  if (target === 'fruit') await logFood(db, 'morning_shot');
  else if (target === 'juice') {
    await logFood(db, 'morning_shot');
    await logFood(db, 'midmorning_juice');
  } else if (target === 'wait') {
    await foodsUpTo(db, 3);
    await startDigest(db);
  } else {
    await finishDay(db, order);
  }
  return ok('Ready. Open Today to see it.');
}
