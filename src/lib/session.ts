import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { SQLiteDatabase } from 'expo-sqlite';

import { newId } from '@/lib/id';
import { cancelReminders } from '@/lib/notifications';
import { getSupabase } from '@/lib/supabase';
import {
  clearAll,
  readSnap,
  reconcile,
  replaceFromServer,
  seedAccount,
  setSyncMeta,
  type ServerSnapshot,
  type Snap,
} from '@/lib/store';
import { fetchAccount } from '@/lib/sync';

export const SIGN_IN_AGAIN_NOTE = 'Sign in again to back up your progress. It is saved on this phone.';
export const NOT_BACKED_UP_NOTE = 'Backup is not set up in this app. Your progress is saved on this phone.';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function within<T>(task: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('Took too long.')), ms);
    task.then(
      (value) => {
        clearTimeout(id);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(id);
        reject(error instanceof Error ? error : new Error('Could not reach Uyvo.'));
      },
    );
  });
}

async function sessionUser(supabase: SupabaseClient): Promise<User | null> {
  try {
    const { data } = await within(supabase.auth.getSession(), 5000);
    return data.session?.user ?? null;
  } catch {
    return null;
  }
}

// Takes the account's copy from the server. Nothing on the phone is removed until
// that copy has really arrived. If it cannot be reached the phone keeps what it has.
export async function adoptCloudUser(db: SQLiteDatabase, userId: string, email: string): Promise<string | null> {
  let remote: ServerSnapshot | null = null;
  let syncError: string | null = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      remote = await within(fetchAccount(userId, email), 12000);
      syncError = null;
      if (remote) break;
    } catch (error) {
      syncError = error instanceof Error ? error.message : 'Could not reach Uyvo.';
    }
    if (attempt < 3) await wait(350);
  }
  const local = await readSnap(db);
  const sameAccount = local.mode === 'cloud' && local.userId === userId;
  if (syncError && !remote) {
    if (!sameAccount) return syncError;
    await setSyncMeta(db, syncError);
    await reconcile(db);
    return null;
  }
  if (sameAccount) {
    if (remote) await replaceFromServer(db, remote);
    await reconcile(db);
    return null;
  }
  await clearAll(db);
  if (remote) await replaceFromServer(db, remote);
  else await seedAccount(db, { id: userId, email, mode: 'cloud', displayName: 'Hero' });
  await reconcile(db);
  return null;
}

// Starting the app never removes saved progress. Only Sign out and Start over do.
export async function boot(db: SQLiteDatabase): Promise<Snap> {
  const supabase = getSupabase();
  const snap = await readSnap(db);
  if (snap.mode === 'device') {
    await reconcile(db);
    return readSnap(db);
  }
  if (snap.mode === 'cloud') {
    await reconcile(db);
    if (!supabase) {
      await setSyncMeta(db, NOT_BACKED_UP_NOTE);
      return readSnap(db);
    }
    const user = await sessionUser(supabase);
    if (!user) await setSyncMeta(db, SIGN_IN_AGAIN_NOTE);
    else if (user.id !== snap.userId) await adoptCloudUser(db, user.id, user.email ?? '');
    return readSnap(db);
  }
  if (supabase) {
    const user = await sessionUser(supabase);
    if (user) await adoptCloudUser(db, user.id, user.email ?? '');
  }
  return readSnap(db);
}

export async function signIn(db: SQLiteDatabase, email: string, password: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return 'Sign-in is not set up yet.';
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user) return error?.message ?? 'Could not sign in.';
  const problem = await adoptCloudUser(db, data.user.id, data.user.email ?? email.trim());
  if (problem) {
    await supabase.auth.signOut();
    return 'Could not load your days. Check the internet and try again.';
  }
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
  const problem = await adoptCloudUser(db, data.user.id, data.user.email ?? email.trim());
  if (problem) {
    await supabase.auth.signOut();
    return { error: 'Could not set up your days. Check the internet and try again.' };
  }
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
