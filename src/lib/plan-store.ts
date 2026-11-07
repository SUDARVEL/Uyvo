import type { SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_PLAN, PLAN_KEYS, type PlanKey, type PlanStep } from '@/domain/plan';

const PLAN_KEY = 'plan_steps';
const FOOD_KEY = 'my_foods';
const ADMIN_KEY = 'admin_open';

function isPlanKey(value: string): value is PlanKey {
  return (PLAN_KEYS as readonly string[]).includes(value);
}

export function normalizePlan(value: unknown): PlanStep[] {
  const incoming = Array.isArray(value) ? value : [];
  return DEFAULT_PLAN.map((fallback) => {
    const found = incoming.find((step) => step && typeof step === 'object' && (step as PlanStep).key === fallback.key) as
      | Partial<PlanStep>
      | undefined;
    return {
      key: fallback.key,
      title: text(found?.title, fallback.title),
      detail: text(found?.detail, fallback.detail),
      body: text(found?.body, fallback.body),
      action: text(found?.action, fallback.action),
    };
  });
}

function text(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 120) : fallback;
}

export async function readPlan(db: SQLiteDatabase): Promise<PlanStep[]> {
  const raw = await readMeta(db, PLAN_KEY);
  if (!raw) return DEFAULT_PLAN;
  try {
    return normalizePlan(JSON.parse(raw));
  } catch {
    return DEFAULT_PLAN;
  }
}

export async function writePlan(db: SQLiteDatabase, plan: PlanStep[]): Promise<void> {
  await writeMeta(db, PLAN_KEY, JSON.stringify(normalizePlan(plan)));
}

export async function readFoods(db: SQLiteDatabase): Promise<Record<string, string>> {
  const raw = await readMeta(db, FOOD_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const foods: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!isPlanKey(key) || typeof value !== 'string') continue;
      const name = value.trim().slice(0, 40);
      if (name) foods[key] = name;
    }
    return foods;
  } catch {
    return {};
  }
}

export async function writeFood(db: SQLiteDatabase, key: PlanKey, name: string): Promise<Record<string, string>> {
  const foods = await readFoods(db);
  const trimmed = name.trim().slice(0, 40);
  if (trimmed) foods[key] = trimmed;
  else delete foods[key];
  await writeMeta(db, FOOD_KEY, JSON.stringify(foods));
  return foods;
}

export async function readAdminOpen(db: SQLiteDatabase): Promise<boolean> {
  return (await readMeta(db, ADMIN_KEY)) === '1';
}

export async function writeAdminOpen(db: SQLiteDatabase, open: boolean): Promise<void> {
  await writeMeta(db, ADMIN_KEY, open ? '1' : '0');
}

async function readMeta(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('select value from meta where key = ?', key);
  return row?.value ?? null;
}

async function writeMeta(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    'insert into meta (key, value) values (?, ?) on conflict(key) do update set value = excluded.value',
    key,
    value,
  );
}
