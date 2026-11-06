import type { SQLiteDatabase } from 'expo-sqlite';

import {
  AVATARS,
  buildQuestLog,
  canLog,
  canStartDigest,
  celebration,
  digestEnd,
  emptyStreak,
  emptyTree,
  evaluateProgress,
  isQuestKey,
  localDate,
  validateName,
  type AvatarId,
  type Badge,
  type BadgeKey,
  type FoodKey,
  type QuestKey,
  type QuestLog,
  type Streak,
  type TeaStatus,
  type TeaWindow,
  type TreeState,
  type VitaminFood,
} from '@/domain/engine';
import { exclusive } from '@/lib/lock';
import { newId } from '@/lib/id';

export type AccountMode = 'cloud' | 'device';

export type Profile = {
  id: string;
  email: string;
  displayName: string;
  avatarId: AvatarId;
  onboardedAt: string | null;
  remindersEnabled: boolean;
};

export type Snap = {
  mode: 'signed_out' | AccountMode;
  userId: string | null;
  profile: Profile | null;
  logs: QuestLog[];
  teas: TeaWindow[];
  streak: Streak;
  badges: Badge[];
  tree: TreeState;
  wallet: { ironShards: number; flowPoints: number };
  lastSyncAt: string | null;
  lastSyncError: string | null;
  coachSeen: boolean;
};

export type ActionResult = { error: string | null; message: string | null };

export type OutboxItem = {
  id: number;
  userId: string;
  entity: string;
  clientId: string;
  op: 'insert' | 'update';
  payload: string;
};

export type ServerSnapshot = {
  profile: Profile;
  wallet: { ironShards: number; flowPoints: number };
  logs: QuestLog[];
  teas: TeaWindow[];
  streak: Streak;
  badges: Badge[];
  tree: TreeState;
};

const SCHEMA = `
create table if not exists profiles (
  id text primary key not null,
  email text not null default '',
  display_name text not null,
  avatar_id text not null,
  onboarded_at text,
  reminders_enabled integer not null default 0
);
create table if not exists wallets (
  user_id text primary key not null,
  iron_shards integer not null default 0,
  flow_points integer not null default 0
);
create table if not exists quest_logs (
  id text primary key not null,
  user_id text not null,
  client_id text not null unique,
  local_date text not null,
  quest_key text not null,
  food_key text,
  vitamin_c_food text,
  vitamin_c integer not null,
  base_iron integer not null,
  base_flow integer not null,
  iron_shards_awarded integer not null,
  flow_points_awarded integer not null,
  logged_at text not null
);
create table if not exists tea_windows (
  id text primary key not null,
  user_id text not null,
  client_id text not null unique,
  local_date text not null,
  started_at text not null,
  ends_at text not null,
  status text not null,
  drank_at text
);
create table if not exists streaks (
  user_id text primary key not null,
  current_streak integer not null,
  longest_streak integer not null,
  last_success_date text
);
create table if not exists badges (
  user_id text not null,
  badge_key text not null,
  earned_on text not null,
  primary key (user_id, badge_key)
);
create table if not exists tree_state (
  user_id text not null primary key,
  weeks_completed integer not null,
  fruit_count integer not null
);
create table if not exists outbox (
  id integer primary key autoincrement,
  user_id text not null,
  entity text not null,
  client_id text not null,
  op text not null,
  payload text not null,
  created_at text not null,
  attempts integer not null default 0,
  last_error text
);
create table if not exists meta (
  key text primary key not null,
  value text not null
);
`;

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(SCHEMA);
}

async function transaction<T>(db: SQLiteDatabase, task: () => Promise<T>): Promise<T> {
  return exclusive(async () => {
    let value: T | undefined;
    await db.withTransactionAsync(async () => {
      value = await task();
    });
    return value as T;
  });
}

async function meta(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('select value from meta where key = ?', key);
  return row?.value ?? null;
}

async function setMeta(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    'insert into meta (key, value) values (?, ?) on conflict(key) do update set value = excluded.value',
    key,
    value,
  );
}

function asAvatar(value: string): AvatarId {
  if ((AVATARS as readonly string[]).includes(value)) return value as AvatarId;
  return value === 'vein' ? 'man' : 'woman';
}

function asMode(value: string | null): AccountMode | null {
  return value === 'cloud' || value === 'device' ? value : null;
}

type LogRow = {
  id: string;
  user_id: string;
  client_id: string;
  local_date: string;
  quest_key: string;
  food_key: string | null;
  vitamin_c_food: string | null;
  vitamin_c: number;
  base_iron: number;
  base_flow: number;
  iron_shards_awarded: number;
  flow_points_awarded: number;
  logged_at: string;
};

function mapLog(row: LogRow): QuestLog {
  if (!isQuestKey(row.quest_key)) throw new Error(`Unknown quest ${row.quest_key}`);
  const food = row.food_key === 'keerai' || row.food_key === 'spinach' || row.food_key === 'beetroot' ? row.food_key : null;
  const vitamin = row.vitamin_c_food === 'lemon' || row.vitamin_c_food === 'guava' ? row.vitamin_c_food : null;
  return {
    id: row.id,
    userId: row.user_id,
    clientId: row.client_id,
    localDate: row.local_date,
    questKey: row.quest_key,
    foodKey: food,
    vitaminCFood: vitamin,
    vitaminC: row.vitamin_c === 1,
    baseIron: row.base_iron,
    baseFlow: row.base_flow,
    ironShardsAwarded: row.iron_shards_awarded,
    flowPointsAwarded: row.flow_points_awarded,
    loggedAt: row.logged_at,
  };
}

type TeaRow = {
  id: string;
  user_id: string;
  client_id: string;
  local_date: string;
  started_at: string;
  ends_at: string;
  status: string;
  drank_at: string | null;
};

function mapTea(row: TeaRow): TeaWindow {
  const status: TeaStatus = row.status === 'survived' || row.status === 'drank' ? row.status : 'active';
  return {
    id: row.id,
    userId: row.user_id,
    clientId: row.client_id,
    localDate: row.local_date,
    startedAt: row.started_at,
    endsAt: row.ends_at,
    status,
    drankAt: row.drank_at,
  };
}

async function readLogs(db: SQLiteDatabase, userId: string): Promise<QuestLog[]> {
  const rows = await db.getAllAsync<LogRow>('select * from quest_logs where user_id = ? order by logged_at', userId);
  return rows.map(mapLog);
}

async function readTeas(db: SQLiteDatabase, userId: string): Promise<TeaWindow[]> {
  const rows = await db.getAllAsync<TeaRow>('select * from tea_windows where user_id = ? order by started_at', userId);
  return rows.map(mapTea);
}

async function readProfile(db: SQLiteDatabase, userId: string): Promise<Profile | null> {
  const row = await db.getFirstAsync<{
    id: string;
    email: string;
    display_name: string;
    avatar_id: string;
    onboarded_at: string | null;
    reminders_enabled: number;
  }>('select * from profiles where id = ?', userId);
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarId: asAvatar(row.avatar_id),
    onboardedAt: row.onboarded_at,
    remindersEnabled: row.reminders_enabled === 1,
  };
}

async function readStreak(db: SQLiteDatabase, userId: string): Promise<Streak> {
  const row = await db.getFirstAsync<{
    current_streak: number;
    longest_streak: number;
    last_success_date: string | null;
  }>('select * from streaks where user_id = ?', userId);
  if (!row) return emptyStreak();
  return {
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastSuccessDate: row.last_success_date,
  };
}

async function readBadges(db: SQLiteDatabase, userId: string): Promise<Badge[]> {
  const rows = await db.getAllAsync<{ badge_key: string; earned_on: string }>(
    'select badge_key, earned_on from badges where user_id = ?',
    userId,
  );
  return rows
    .filter((row): row is { badge_key: BadgeKey; earned_on: string } =>
      row.badge_key === 'capillary_creator' ||
      row.badge_key === 'oxygen_optimizer' ||
      row.badge_key === 'hemoglobin_master',
    )
    .map((row) => ({ badgeKey: row.badge_key, earnedOn: row.earned_on }));
}

async function readTree(db: SQLiteDatabase, userId: string): Promise<TreeState> {
  const row = await db.getFirstAsync<{ weeks_completed: number; fruit_count: number }>(
    'select * from tree_state where user_id = ?',
    userId,
  );
  if (!row) return emptyTree();
  return { weeksCompleted: row.weeks_completed, fruitCount: row.fruit_count };
}

async function readWallet(db: SQLiteDatabase, userId: string): Promise<{ ironShards: number; flowPoints: number }> {
  const row = await db.getFirstAsync<{ iron_shards: number; flow_points: number }>(
    'select * from wallets where user_id = ?',
    userId,
  );
  return { ironShards: row?.iron_shards ?? 0, flowPoints: row?.flow_points ?? 0 };
}

function blankSnap(lastSyncAt: string | null, lastSyncError: string | null): Snap {
  return {
    mode: 'signed_out',
    userId: null,
    profile: null,
    logs: [],
    teas: [],
    streak: emptyStreak(),
    badges: [],
    tree: emptyTree(),
    wallet: { ironShards: 0, flowPoints: 0 },
    lastSyncAt,
    lastSyncError,
    coachSeen: true,
  };
}

async function readSnapUnlocked(db: SQLiteDatabase): Promise<Snap> {
  const lastSyncAt = await meta(db, 'last_sync_at');
  const lastSyncError = await meta(db, 'last_sync_error');
  const coachSeen = (await meta(db, 'coach_seen')) === '1';
  const userId = await meta(db, 'active_user_id');
  const mode = asMode(await meta(db, 'account_mode'));
  if (!userId || !mode) return blankSnap(lastSyncAt, lastSyncError);
  const profile = await readProfile(db, userId);
  if (!profile) return blankSnap(lastSyncAt, lastSyncError);
  return {
    mode,
    userId,
    profile,
    logs: await readLogs(db, userId),
    teas: await readTeas(db, userId),
    streak: await readStreak(db, userId),
    badges: await readBadges(db, userId),
    tree: await readTree(db, userId),
    wallet: await readWallet(db, userId),
    lastSyncAt,
    lastSyncError,
    coachSeen,
  };
}

export function dismissCoach(db: SQLiteDatabase): Promise<void> {
  return exclusive(() => setMeta(db, 'coach_seen', '1'));
}

export function readSnap(db: SQLiteDatabase): Promise<Snap> {
  return exclusive(() => readSnapUnlocked(db));
}

async function enqueue(
  db: SQLiteDatabase,
  mode: string | null,
  userId: string,
  entity: string,
  clientId: string,
  op: 'insert' | 'update',
  payload: object,
): Promise<void> {
  if (mode !== 'cloud') return;
  await db.runAsync(
    'insert into outbox (user_id, entity, client_id, op, payload, created_at) values (?, ?, ?, ?, ?, ?)',
    userId,
    entity,
    clientId,
    op,
    JSON.stringify(payload),
    new Date().toISOString(),
  );
}

function logPayload(entry: QuestLog) {
  return {
    id: entry.id,
    user_id: entry.userId,
    client_id: entry.clientId,
    local_date: entry.localDate,
    quest_key: entry.questKey,
    food_key: entry.foodKey,
    vitamin_c_food: entry.vitaminCFood,
    vitamin_c: entry.vitaminC,
    base_iron: entry.baseIron,
    base_flow: entry.baseFlow,
    iron_shards_awarded: entry.ironShardsAwarded,
    flow_points_awarded: entry.flowPointsAwarded,
    logged_at: entry.loggedAt,
  };
}

async function insertLog(db: SQLiteDatabase, entry: QuestLog): Promise<void> {
  await db.runAsync(
    `insert into quest_logs (
      id, user_id, client_id, local_date, quest_key, food_key, vitamin_c_food, vitamin_c,
      base_iron, base_flow, iron_shards_awarded, flow_points_awarded, logged_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    entry.id,
    entry.userId,
    entry.clientId,
    entry.localDate,
    entry.questKey,
    entry.foodKey,
    entry.vitaminCFood,
    entry.vitaminC ? 1 : 0,
    entry.baseIron,
    entry.baseFlow,
    entry.ironShardsAwarded,
    entry.flowPointsAwarded,
    entry.loggedAt,
  );
}

async function bumpWallet(db: SQLiteDatabase, userId: string, iron: number, flow: number): Promise<void> {
  await db.runAsync(
    'update wallets set iron_shards = iron_shards + ?, flow_points = flow_points + ? where user_id = ?',
    iron,
    flow,
    userId,
  );
}

async function applyProgress(db: SQLiteDatabase, userId: string, mode: string | null, today: string): Promise<string | null> {
  const logs = await readLogs(db, userId);
  const streak = await readStreak(db, userId);
  const badges = await readBadges(db, userId);
  const tree = await readTree(db, userId);
  const next = evaluateProgress({
    logs,
    streak,
    badges: badges.map((badge) => badge.badgeKey),
    tree,
    today,
  });
  const streakChanged =
    next.streak.currentStreak !== streak.currentStreak ||
    next.streak.longestStreak !== streak.longestStreak ||
    next.streak.lastSuccessDate !== streak.lastSuccessDate;
  if (streakChanged) {
    await db.runAsync(
      `insert into streaks (user_id, current_streak, longest_streak, last_success_date)
       values (?, ?, ?, ?)
       on conflict(user_id) do update set
         current_streak = excluded.current_streak,
         longest_streak = excluded.longest_streak,
         last_success_date = excluded.last_success_date`,
      userId,
      next.streak.currentStreak,
      next.streak.longestStreak,
      next.streak.lastSuccessDate,
    );
    await enqueue(db, mode, userId, 'streak', userId, 'update', {
      current_streak: next.streak.currentStreak,
      longest_streak: next.streak.longestStreak,
      last_success_date: next.streak.lastSuccessDate,
    });
  }
  for (const badge of next.newBadges) {
    await db.runAsync(
      'insert into badges (user_id, badge_key, earned_on) values (?, ?, ?) on conflict(user_id, badge_key) do nothing',
      userId,
      badge.badgeKey,
      badge.earnedOn,
    );
    await enqueue(db, mode, userId, 'badge', `${userId}:${badge.badgeKey}`, 'insert', {
      user_id: userId,
      badge_key: badge.badgeKey,
      earned_on: badge.earnedOn,
    });
  }
  if (next.tree.weeksCompleted !== tree.weeksCompleted || next.tree.fruitCount !== tree.fruitCount) {
    await db.runAsync(
      `insert into tree_state (user_id, weeks_completed, fruit_count) values (?, ?, ?)
       on conflict(user_id) do update set weeks_completed = excluded.weeks_completed, fruit_count = excluded.fruit_count`,
      userId,
      next.tree.weeksCompleted,
      next.tree.fruitCount,
    );
    await enqueue(db, mode, userId, 'tree', userId, 'update', {
      weeks_completed: next.tree.weeksCompleted,
      fruit_count: next.tree.fruitCount,
    });
  }
  return celebration(next.newBadges, next.fruitGrew);
}

async function writeProfile(db: SQLiteDatabase, profile: Profile, mode: string | null): Promise<void> {
  await db.runAsync(
    `insert into profiles (id, email, display_name, avatar_id, onboarded_at, reminders_enabled)
     values (?, ?, ?, ?, ?, ?)
     on conflict(id) do update set
       email = excluded.email,
       display_name = excluded.display_name,
       avatar_id = excluded.avatar_id,
       onboarded_at = excluded.onboarded_at,
       reminders_enabled = excluded.reminders_enabled`,
    profile.id,
    profile.email,
    profile.displayName,
    profile.avatarId,
    profile.onboardedAt,
    profile.remindersEnabled ? 1 : 0,
  );
  await enqueue(db, mode, profile.id, 'profile', profile.id, 'update', {
    display_name: profile.displayName,
    avatar_id: profile.avatarId,
    onboarded_at: profile.onboardedAt,
    reminders_enabled: profile.remindersEnabled,
  });
}

export async function clearAll(db: SQLiteDatabase): Promise<void> {
  await transaction(db, async () => {
    await db.execAsync(
      `delete from outbox; delete from badges; delete from quest_logs; delete from tea_windows;
       delete from streaks; delete from tree_state; delete from wallets; delete from profiles; delete from meta;`,
    );
  });
}

export async function seedAccount(
  db: SQLiteDatabase,
  input: { id: string; email: string; mode: AccountMode; displayName: string },
): Promise<void> {
  await transaction(db, async () => {
    await db.runAsync(
      'insert into profiles (id, email, display_name, avatar_id, onboarded_at, reminders_enabled) values (?, ?, ?, ?, null, 0)',
      input.id,
      input.email,
      input.displayName,
      'woman',
    );
    await db.runAsync('insert into wallets (user_id, iron_shards, flow_points) values (?, 0, 0)', input.id);
    await db.runAsync(
      'insert into streaks (user_id, current_streak, longest_streak, last_success_date) values (?, 0, 0, null)',
      input.id,
    );
    await db.runAsync('insert into tree_state (user_id, weeks_completed, fruit_count) values (?, 0, 0)', input.id);
    await setMeta(db, 'active_user_id', input.id);
    await setMeta(db, 'account_mode', input.mode);
  });
}

export async function replaceFromServer(db: SQLiteDatabase, snapshot: ServerSnapshot): Promise<boolean> {
  return transaction(db, async () => {
    const pending = await db.getFirstAsync<{ n: number }>('select count(*) as n from outbox');
    if ((pending?.n ?? 0) > 0) return false;
    const userId = snapshot.profile.id;
    await db.runAsync('delete from quest_logs where user_id = ?', userId);
    await db.runAsync('delete from tea_windows where user_id = ?', userId);
    await db.runAsync('delete from badges where user_id = ?', userId);
    await writeProfile(db, snapshot.profile, null);
    await db.runAsync(
      `insert into wallets (user_id, iron_shards, flow_points) values (?, ?, ?)
       on conflict(user_id) do update set iron_shards = excluded.iron_shards, flow_points = excluded.flow_points`,
      userId,
      snapshot.wallet.ironShards,
      snapshot.wallet.flowPoints,
    );
    for (const entry of snapshot.logs) await insertLog(db, entry);
    for (const tea of snapshot.teas) {
      await db.runAsync(
        `insert into tea_windows (id, user_id, client_id, local_date, started_at, ends_at, status, drank_at)
         values (?, ?, ?, ?, ?, ?, ?, ?)`,
        tea.id,
        tea.userId,
        tea.clientId,
        tea.localDate,
        tea.startedAt,
        tea.endsAt,
        tea.status,
        tea.drankAt,
      );
    }
    await db.runAsync(
      `insert into streaks (user_id, current_streak, longest_streak, last_success_date) values (?, ?, ?, ?)
       on conflict(user_id) do update set
         current_streak = excluded.current_streak,
         longest_streak = excluded.longest_streak,
         last_success_date = excluded.last_success_date`,
      userId,
      snapshot.streak.currentStreak,
      snapshot.streak.longestStreak,
      snapshot.streak.lastSuccessDate,
    );
    for (const badge of snapshot.badges) {
      await db.runAsync(
        'insert into badges (user_id, badge_key, earned_on) values (?, ?, ?) on conflict(user_id, badge_key) do nothing',
        userId,
        badge.badgeKey,
        badge.earnedOn,
      );
    }
    await db.runAsync(
      `insert into tree_state (user_id, weeks_completed, fruit_count) values (?, ?, ?)
       on conflict(user_id) do update set weeks_completed = excluded.weeks_completed, fruit_count = excluded.fruit_count`,
      userId,
      snapshot.tree.weeksCompleted,
      snapshot.tree.fruitCount,
    );
    await setMeta(db, 'active_user_id', userId);
    await setMeta(db, 'account_mode', 'cloud');
    return true;
  });
}

export async function reconcile(db: SQLiteDatabase): Promise<void> {
  await transaction(db, async () => {
    const userId = await meta(db, 'active_user_id');
    const mode = await meta(db, 'account_mode');
    if (!userId) return;
    await applyProgress(db, userId, mode, localDate());
  });
}

export async function setSyncMeta(db: SQLiteDatabase, error: string | null): Promise<void> {
  await transaction(db, async () => {
    if (error) {
      await setMeta(db, 'last_sync_error', error);
    } else {
      await db.runAsync('delete from meta where key = ?', 'last_sync_error');
      await setMeta(db, 'last_sync_at', new Date().toISOString());
    }
  });
}

export function readOutbox(db: SQLiteDatabase): Promise<OutboxItem[]> {
  return exclusive(async () => {
    const rows = await db.getAllAsync<{
      id: number;
      user_id: string;
      entity: string;
      client_id: string;
      op: string;
      payload: string;
    }>('select * from outbox order by id');
    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      entity: row.entity,
      clientId: row.client_id,
      op: row.op === 'update' ? 'update' : 'insert',
      payload: row.payload,
    }));
  });
}

export function deleteOutbox(db: SQLiteDatabase, id: number): Promise<void> {
  return transaction(db, async () => {
    await db.runAsync('delete from outbox where id = ?', id);
  });
}

export function markOutboxError(db: SQLiteDatabase, id: number, error: string): Promise<void> {
  return transaction(db, async () => {
    await db.runAsync('update outbox set attempts = attempts + 1, last_error = ? where id = ?', error, id);
  });
}

async function mutateProfile(
  db: SQLiteDatabase,
  change: (profile: Profile) => Profile | string,
): Promise<ActionResult> {
  return transaction(db, async () => {
    const userId = await meta(db, 'active_user_id');
    const mode = await meta(db, 'account_mode');
    if (!userId) return { error: 'Sign in first.', message: null };
    const current = await readProfile(db, userId);
    if (!current) return { error: 'The hero profile is missing.', message: null };
    const next = change(current);
    if (typeof next === 'string') return { error: next, message: null };
    await writeProfile(db, next, mode);
    return { error: null, message: null };
  });
}

export function saveName(db: SQLiteDatabase, raw: string): Promise<ActionResult> {
  const nameError = validateName(raw);
  if (nameError) return Promise.resolve({ error: nameError, message: null });
  const displayName = raw.trim();
  return mutateProfile(db, (profile) => ({ ...profile, displayName }));
}

export function saveAvatar(db: SQLiteDatabase, avatarId: AvatarId): Promise<ActionResult> {
  return mutateProfile(db, (profile) => ({
    ...profile,
    avatarId,
    onboardedAt: profile.onboardedAt ?? new Date().toISOString(),
  }));
}

export function saveReminders(db: SQLiteDatabase, enabled: boolean): Promise<ActionResult> {
  return mutateProfile(db, (profile) => ({ ...profile, remindersEnabled: enabled }));
}

export function logQuest(
  db: SQLiteDatabase,
  input: { questKey: QuestKey; foodKey?: FoodKey | null; vitaminCFood?: VitaminFood | null },
): Promise<ActionResult> {
  return transaction(db, async () => {
    const userId = await meta(db, 'active_user_id');
    const mode = await meta(db, 'account_mode');
    if (!userId) return { error: 'Sign in first.', message: null };
    const now = new Date();
    const today = localDate(now);
    const logs = await readLogs(db, userId);
    const teas = await readTeas(db, userId);
    const refusal = canLog({ questKey: input.questKey, logs, teas, now, today });
    if (refusal) return { error: refusal, message: null };
    let entry: QuestLog;
    try {
      entry = buildQuestLog({
        id: newId(),
        userId,
        questKey: input.questKey,
        today,
        loggedAt: now.toISOString(),
        foodKey: input.foodKey ?? null,
        vitaminCFood: input.vitaminCFood ?? null,
      });
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Could not log that meal.', message: null };
    }
    await insertLog(db, entry);
    await bumpWallet(db, userId, entry.ironShardsAwarded, entry.flowPointsAwarded);
    await enqueue(db, mode, userId, 'quest_log', entry.clientId, 'insert', logPayload(entry));
    const message = await applyProgress(db, userId, mode, entry.localDate);
    return { error: null, message };
  });
}

async function survive(db: SQLiteDatabase, tea: TeaWindow, mode: string | null): Promise<string | null> {
  const updated = await db.runAsync(
    `update tea_windows set status = 'survived', drank_at = null where id = ? and status = 'active'`,
    tea.id,
  );
  if (updated.changes !== 1) return null;
  await enqueue(db, mode, tea.userId, 'tea_window', tea.clientId, 'update', {
    status: 'survived',
    drank_at: null,
  });
  const logs = await readLogs(db, tea.userId);
  const already = logs.some((entry) => entry.localDate === tea.localDate && entry.questKey === 'digest_survive');
  if (!already) {
    const entry = buildQuestLog({
      id: newId(),
      userId: tea.userId,
      questKey: 'digest_survive',
      today: tea.localDate,
      loggedAt: new Date().toISOString(),
    });
    await insertLog(db, entry);
    await bumpWallet(db, tea.userId, entry.ironShardsAwarded, entry.flowPointsAwarded);
    await enqueue(db, mode, tea.userId, 'quest_log', entry.clientId, 'insert', logPayload(entry));
  }
  return (await applyProgress(db, tea.userId, mode, tea.localDate)) ?? 'You waited. +5 iron.';
}

export function startDigest(db: SQLiteDatabase): Promise<ActionResult> {
  return transaction(db, async () => {
    const userId = await meta(db, 'active_user_id');
    const mode = await meta(db, 'account_mode');
    if (!userId) return { error: 'Sign in first.', message: null };
    const now = new Date();
    const today = localDate(now);
    const logs = await readLogs(db, userId);
    const teas = await readTeas(db, userId);
    const refusal = canStartDigest(logs, teas, today);
    if (refusal) return { error: refusal, message: null };
    const id = newId();
    const ends = digestEnd(now);
    const tea: TeaWindow = {
      id,
      userId,
      clientId: id,
      localDate: today,
      startedAt: now.toISOString(),
      endsAt: ends.toISOString(),
      status: 'active',
      drankAt: null,
    };
    await db.runAsync(
      `insert into tea_windows (id, user_id, client_id, local_date, started_at, ends_at, status, drank_at)
       values (?, ?, ?, ?, ?, ?, 'active', null)`,
      tea.id,
      tea.userId,
      tea.clientId,
      tea.localDate,
      tea.startedAt,
      tea.endsAt,
    );
    await enqueue(db, mode, userId, 'tea_window', tea.clientId, 'insert', {
      id: tea.id,
      user_id: userId,
      client_id: tea.clientId,
      local_date: tea.localDate,
      started_at: tea.startedAt,
      ends_at: tea.endsAt,
      status: 'active',
      drank_at: null,
    });
    return { error: null, message: 'Wait 60 minutes. No blood food. Water is still ok.' };
  });
}

export function drinkTea(db: SQLiteDatabase): Promise<ActionResult> {
  return transaction(db, async () => {
    const userId = await meta(db, 'active_user_id');
    const mode = await meta(db, 'account_mode');
    if (!userId) return { error: 'Sign in first.', message: null };
    const teas = await readTeas(db, userId);
    const active = teas.find((tea) => tea.status === 'active');
    if (!active) return { error: 'There is no digest to spoil.', message: null };
    const now = new Date();
    if (now.getTime() >= new Date(active.endsAt).getTime()) {
      const message = await survive(db, active, mode);
      return { error: null, message };
    }
    const drankAt = now.toISOString();
    const updated = await db.runAsync(
      `update tea_windows set status = 'drank', drank_at = ? where id = ? and status = 'active'`,
      drankAt,
      active.id,
    );
    if (updated.changes !== 1) return { error: 'The window already closed.', message: null };
    await enqueue(db, mode, userId, 'tea_window', active.clientId, 'update', {
      status: 'drank',
      drank_at: drankAt,
    });
    return { error: null, message: 'You drank tea. No blood food until the clock ends.' };
  });
}

export function settleTea(db: SQLiteDatabase): Promise<string | null> {
  return transaction(db, async () => {
    const userId = await meta(db, 'active_user_id');
    const mode = await meta(db, 'account_mode');
    if (!userId) return null;
    const teas = await readTeas(db, userId);
    const now = Date.now();
    const due = teas.find((tea) => tea.status === 'active' && new Date(tea.endsAt).getTime() <= now);
    if (!due) return null;
    return survive(db, due, mode);
  });
}
