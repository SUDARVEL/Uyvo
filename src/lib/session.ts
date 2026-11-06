import type { SQLiteDatabase } from 'expo-sqlite';

import { newId } from '@/lib/id';
import { cancelReminders } from '@/lib/notifications';
import { getSupabase } from '@/lib/supabase';
import { clearAll, readSnap, reconcile, replaceFromServer, seedAccount, setSyncMeta, type Snap } from '@/lib/store';
import { fetchAccount } from '@/lib/sync';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function adoptCloudUser(db: SQLiteDatabase, userId: string, email: string): Promise<void> {
  let remote = null;
  let syncError: string | null = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      remote = await fetchAccount(userId, email);
      syncError = null;
      if (remote) break;
    } catch (error) {
      syncError = error instanceof Error ? error.message : 'Could not reach Uyvo.';
    }
    if (attempt < 3) await wait(350);
  }
  await clearAll(db);
  if (remote) await replaceFromServer(db, remote);
  else await seedAccount(db, { id: userId, email, mode: 'cloud', displayName: 'Hero' });
  if (syncError) await setSyncMeta(db, syncError);
  await reconcile(db);
}

export async function boot(db: SQLiteDatabase): Promise<Snap> {
  const supabase = getSupabase();
  const snap = await readSnap(db);
  if (snap.mode === 'device') {
    await reconcile(db);
    return readSnap(db);
  }
  if (!supabase) {
    if (snap.mode === 'cloud') await clearAll(db);
    return readSnap(db);
  }
  const { data } = await supabase.auth.getSession();
  const sessionUser = data.session?.user;
  if (snap.mode === 'cloud') {
    if (!sessionUser || sessionUser.id !== snap.userId) {
      if (sessionUser) await adoptCloudUser(db, sessionUser.id, sessionUser.email ?? '');
      else await clearAll(db);
    } else {
      await reconcile(db);
    }
    return readSnap(db);
  }
  if (sessionUser) await adoptCloudUser(db, sessionUser.id, sessionUser.email ?? '');
  return readSnap(db);
}

export async function signIn(db: SQLiteDatabase, email: string, password: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return 'Sign-in is not set up yet.';
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user) return error?.message ?? 'Could not sign in.';
  await adoptCloudUser(db, data.user.id, data.user.email ?? email.trim());
  return null;
}

export async function signUp(
  db: SQLiteDatabase,
  email: string,
  password: string,
): Promise<{ error?: string; confirmEmail?: boolean }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Sign-in is not set up yet.' };
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) return { error: error.message };
  if (!data.session || !data.user) return { confirmEmail: true };
  await adoptCloudUser(db, data.user.id, data.user.email ?? email.trim());
  return {};
}

export async function startPractice(db: SQLiteDatabase): Promise<void> {
  const supabase = getSupabase();
  if (supabase) await supabase.auth.signOut();
  await clearAll(db);
  await seedAccount(db, { id: newId(), email: '', mode: 'device', displayName: 'Hero' });
}

export async function signOut(db: SQLiteDatabase): Promise<void> {
  await cancelReminders();
  await clearAll(db);
  const supabase = getSupabase();
  if (supabase) await supabase.auth.signOut();
}
