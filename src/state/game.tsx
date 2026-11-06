import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import * as SplashScreen from 'expo-splash-screen';

import { emptyStreak, emptyTree, type AvatarId, type FoodKey, type QuestKey, type VitaminFood } from '@/domain/engine';
import {
  cancelReminders,
  ensureReminderPermission,
  rescheduleIfAllowed,
  scheduleReminders,
} from '@/lib/notifications';
import { isSupabaseConfigured } from '@/lib/supabase';
import { boot, signIn as signInAccount, signOut as signOutAccount, signUp as signUpAccount, startPractice } from '@/lib/session';
import {
  drinkTea,
  logQuest,
  readSnap,
  saveAvatar,
  saveName,
  saveReminders,
  settleTea,
  startDigest,
  type ActionResult,
  type Snap,
} from '@/lib/store';
import { syncAccount } from '@/lib/sync';

export type Destination = '/forge' | '/onboarding/name';

type GameValue = {
  ready: boolean;
  snap: Snap;
  online: boolean;
  configured: boolean;
  notice: string | null;
  syncing: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; destination: Destination | null }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; confirmEmail: boolean; destination: Destination | null }>;
  practice: () => Promise<Destination>;
  signOut: () => Promise<void>;
  saveName: (name: string) => Promise<string | null>;
  saveAvatar: (avatarId: AvatarId) => Promise<string | null>;
  setReminders: (enabled: boolean) => Promise<string | null>;
  logQuest: (input: {
    questKey: QuestKey;
    foodKey?: FoodKey | null;
    vitaminCFood?: VitaminFood | null;
  }) => Promise<string | null>;
  startDigest: () => Promise<string | null>;
  drinkTea: () => Promise<string | null>;
  syncNow: () => Promise<void>;
};

const signedOut: Snap = {
  mode: 'signed_out',
  userId: null,
  profile: null,
  logs: [],
  teas: [],
  streak: emptyStreak(),
  badges: [],
  tree: emptyTree(),
  wallet: { ironShards: 0, flowPoints: 0 },
  lastSyncAt: null,
  lastSyncError: null,
};

const GameContext = createContext<GameValue | null>(null);

function destinationFor(snap: Snap): Destination {
  return snap.profile?.onboardedAt ? '/forge' : '/onboarding/name';
}

export function GameProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [snap, setSnap] = useState<Snap>(signedOut);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const snapRef = useRef(snap);
  const syncingRef = useRef(false);
  snapRef.current = snap;

  const refresh = useCallback(async () => {
    const next = await readSnap(db);
    setSnap(next);
    return next;
  }, [db]);

  const runSync = useCallback(async () => {
    if (syncingRef.current || snapRef.current.mode !== 'cloud') return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      await syncAccount(db);
      await refresh();
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [db, refresh]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const next = await boot(db);
      if (!alive) return;
      setSnap(next);
      setReady(true);
      await SplashScreen.hideAsync().catch(() => undefined);
      if (next.profile?.remindersEnabled) await rescheduleIfAllowed();
      if (next.mode === 'cloud') void runSync();
    })();
    return () => {
      alive = false;
    };
  }, [db, runSync]);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 4600);
    return () => clearTimeout(id);
  }, [notice]);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const Network = await import('expo-network');
        const state = await Network.getNetworkStateAsync();
        if (alive) setOnline(state.isConnected !== false && state.isInternetReachable !== false);
      } catch {
        if (alive) setOnline(true);
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 8000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!ready || snap.mode === 'signed_out') return;
    if (!snap.teas.some((tea) => tea.status === 'active')) return;
    const id = setInterval(() => {
      void (async () => {
        const message = await settleTea(db);
        if (!message) return;
        setNotice(message);
        const next = await refresh();
        if (next.mode === 'cloud') void runSync();
      })();
    }, 1000);
    return () => clearInterval(id);
  }, [db, ready, refresh, runSync, snap.mode, snap.teas]);

  const apply = useCallback(
    async (result: ActionResult) => {
      const next = await refresh();
      if (result.message) setNotice(result.message);
      if (result.error) setNotice(result.error);
      if (!result.error && next.mode === 'cloud') void runSync();
      return result.error;
    },
    [refresh, runSync],
  );

  const value = useMemo<GameValue>(
    () => ({
      ready,
      snap,
      online,
      configured: isSupabaseConfigured(),
      notice,
      syncing,
      signIn: async (email, password) => {
        const error = await signInAccount(db, email, password);
        const next = await refresh();
        if (error) return { error, destination: null };
        return { error: null, destination: destinationFor(next) };
      },
      signUp: async (email, password) => {
        const result = await signUpAccount(db, email, password);
        const next = await refresh();
        if (result.confirmEmail) return { error: null, confirmEmail: true, destination: null };
        if (result.error) return { error: result.error, confirmEmail: false, destination: null };
        return { error: null, confirmEmail: false, destination: destinationFor(next) };
      },
      practice: async () => {
        await startPractice(db);
        const next = await refresh();
        return destinationFor(next);
      },
      signOut: async () => {
        await signOutAccount(db);
        setNotice(null);
        await refresh();
      },
      saveName: async (name) => apply(await saveName(db, name)),
      saveAvatar: async (avatarId) => apply(await saveAvatar(db, avatarId)),
      setReminders: async (enabled) => {
        if (Platform.OS === 'web') {
          if (enabled) return 'Reminders work on the phone app, not in this browser.';
          return apply(await saveReminders(db, false));
        }
        if (enabled) {
          const allowed = await ensureReminderPermission();
          if (!allowed) return 'Notification permission was denied.';
          await scheduleReminders();
        } else {
          await cancelReminders();
        }
        return apply(await saveReminders(db, enabled));
      },
      logQuest: async (input) => apply(await logQuest(db, input)),
      startDigest: async () => apply(await startDigest(db)),
      drinkTea: async () => apply(await drinkTea(db)),
      syncNow: async () => {
        if (!online) {
          setNotice('No network. Today is saved on this phone.');
          return;
        }
        await runSync();
      },
    }),
    [apply, db, notice, online, ready, refresh, runSync, snap, syncing],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameValue {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGame must be used inside GameProvider');
  return value;
}
