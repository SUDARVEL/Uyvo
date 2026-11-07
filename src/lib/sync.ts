import type { SupabaseClient } from '@supabase/supabase-js';
import type { SQLiteDatabase } from 'expo-sqlite';

import { addDays, isQuestKey, localDate, type BadgeKey, type QuestLog, type TeaStatus } from '@/domain/engine';
import { appNow } from '@/lib/clock';
import { getSupabase } from '@/lib/supabase';
import {
  deleteOutbox,
  markOutboxError,
  readOutbox,
  replaceFromServer,
  setSyncMeta,
  type OutboxItem,
  type Profile,
  type ServerSnapshot,
} from '@/lib/store';

type Row = Record<string, unknown>;

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function integer(value: unknown): number {
  return typeof value === 'number' ? value : 0;
}

function flag(value: unknown): boolean {
  return value === true;
}

function mapLog(row: Row): QuestLog {
  const questKey = text(row.quest_key);
  if (!isQuestKey(questKey)) throw new Error(`Unknown quest ${questKey}`);
  const food = text(row.food_key);
  const vitamin = text(row.vitamin_c_food);
  return {
    id: text(row.id),
    userId: text(row.user_id),
    clientId: text(row.client_id),
    localDate: text(row.local_date),
    questKey,
    foodKey: food === 'keerai' || food === 'spinach' || food === 'beetroot' ? food : null,
    vitaminCFood: vitamin === 'lemon' || vitamin === 'guava' ? vitamin : null,
    vitaminC: flag(row.vitamin_c),
    baseIron: integer(row.base_iron),
    baseFlow: integer(row.base_flow),
    ironShardsAwarded: integer(row.iron_shards_awarded),
    flowPointsAwarded: integer(row.flow_points_awarded),
    loggedAt: text(row.logged_at),
  };
}

function mapStatus(value: unknown): TeaStatus {
  return value === 'survived' || value === 'drank' ? value : 'active';
}

export async function fetchAccount(userId: string, email: string): Promise<ServerSnapshot | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const profileResult = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (profileResult.error) throw new Error(profileResult.error.message);
  if (!profileResult.data) return null;

  const since = addDays(localDate(appNow()), -30);
  const [wallet, logs, teas, streak, badges, tree] = await Promise.all([
    supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('quest_logs').select('*').eq('user_id', userId).gte('local_date', since),
    supabase.from('tea_windows').select('*').eq('user_id', userId).gte('local_date', since),
    supabase.from('streaks').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('badges').select('*').eq('user_id', userId),
    supabase.from('tree_state').select('*').eq('user_id', userId).maybeSingle(),
  ]);
  for (const result of [wallet, logs, teas, streak, badges, tree]) {
    if (result.error) throw new Error(result.error.message);
  }

  const profileRow = profileResult.data as Row;
  const avatar = text(profileRow.avatar_id, 'woman');
  const profile: Profile = {
    id: userId,
    email,
    displayName: text(profileRow.display_name, 'Hero'),
    avatarId: avatar === 'man' || avatar === 'woman' ? avatar : avatar === 'vein' ? 'man' : 'woman',
    onboardedAt: profileRow.onboarded_at == null ? null : text(profileRow.onboarded_at),
    remindersEnabled: flag(profileRow.reminders_enabled),
  };
  const walletRow = (wallet.data ?? {}) as Row;
  const streakRow = (streak.data ?? {}) as Row;
  const treeRow = (tree.data ?? {}) as Row;
  const badgeRows = (badges.data ?? []) as Row[];

  return {
    since,
    profile,
    wallet: {
      ironShards: integer(walletRow.iron_shards),
      flowPoints: integer(walletRow.flow_points),
    },
    logs: ((logs.data ?? []) as Row[]).map(mapLog),
    teas: ((teas.data ?? []) as Row[]).map((row) => ({
      id: text(row.id),
      userId: text(row.user_id),
      clientId: text(row.client_id),
      localDate: text(row.local_date),
      startedAt: text(row.started_at),
      endsAt: text(row.ends_at),
      status: mapStatus(row.status),
      drankAt: row.drank_at == null ? null : text(row.drank_at),
    })),
    streak: {
      currentStreak: integer(streakRow.current_streak),
      longestStreak: integer(streakRow.longest_streak),
      lastSuccessDate: streakRow.last_success_date == null ? null : text(streakRow.last_success_date),
    },
    badges: badgeRows
      .filter(
        (row): row is Row & { badge_key: BadgeKey } =>
          row.badge_key === 'capillary_creator' ||
          row.badge_key === 'oxygen_optimizer' ||
          row.badge_key === 'hemoglobin_master',
      )
      .map((row) => ({ badgeKey: row.badge_key, earnedOn: text(row.earned_on) })),
    tree: {
      weeksCompleted: integer(treeRow.weeks_completed),
      fruitCount: integer(treeRow.fruit_count),
    },
  };
}

async function pushRow(supabase: SupabaseClient, row: OutboxItem): Promise<void> {
  const payload = JSON.parse(row.payload) as Record<string, unknown>;
  if (row.entity === 'quest_log') {
    const { error } = await supabase.from('quest_logs').upsert(payload, {
      onConflict: 'client_id',
      ignoreDuplicates: true,
    });
    if (error) throw new Error(error.message);
    return;
  }
  if (row.entity === 'tea_window' && row.op === 'insert') {
    const { error } = await supabase.from('tea_windows').upsert(payload, {
      onConflict: 'client_id',
      ignoreDuplicates: true,
    });
    if (error) throw new Error(error.message);
    return;
  }
  if (row.entity === 'tea_window') {
    const { error } = await supabase
      .from('tea_windows')
      .update(payload)
      .eq('client_id', row.clientId)
      .eq('user_id', row.userId);
    if (error) throw new Error(error.message);
    return;
  }
  if (row.entity === 'profile') {
    const { error } = await supabase.from('profiles').update(payload).eq('id', row.userId);
    if (error) throw new Error(error.message);
    return;
  }
  if (row.entity === 'streak') {
    const { error } = await supabase.from('streaks').update(payload).eq('user_id', row.userId);
    if (error) throw new Error(error.message);
    return;
  }
  if (row.entity === 'tree') {
    const { error } = await supabase.from('tree_state').update(payload).eq('user_id', row.userId);
    if (error) throw new Error(error.message);
    return;
  }
  if (row.entity === 'badge') {
    const { error } = await supabase.from('badges').upsert(payload, {
      onConflict: 'user_id,badge_key',
      ignoreDuplicates: true,
    });
    if (error) throw new Error(error.message);
    return;
  }
  throw new Error(`Unknown outbox entity ${row.entity}`);
}

export async function syncAccount(db: SQLiteDatabase): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  let user: { id: string; email?: string } | undefined;
  try {
    const { data } = await supabase.auth.getSession();
    user = data.session?.user;
  } catch {
    return 'Could not reach Uyvo.';
  }
  if (!user) return 'Sign in before syncing.';

  while (true) {
    const rows = await readOutbox(db);
    const row = rows[0];
    if (!row) break;
    try {
      await pushRow(supabase, row);
      await deleteOutbox(db, row.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed.';
      await markOutboxError(db, row.id, message);
      await setSyncMeta(db, message);
      return message;
    }
  }

  try {
    const remote = await fetchAccount(user.id, user.email ?? '');
    if (remote) await replaceFromServer(db, remote);
    await setSyncMeta(db, null);
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not refresh from the server.';
    await setSyncMeta(db, message);
    return message;
  }
}
