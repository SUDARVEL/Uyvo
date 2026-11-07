import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { DEFAULT_TIMES, type ReminderTime } from '@/domain/reminder-plan';
import { syncNotifications } from '@/lib/notifications';
import { readReminderTimes, writeReminderTimes } from '@/lib/reminder-times';
import { useGame } from '@/state/game';

type RemindersValue = {
  times: ReminderTime[];
  saveTime: (slot: number, time: ReminderTime | null) => Promise<ReminderTime[]>;
};

const RemindersContext = createContext<RemindersValue | null>(null);

const freshTimes = () => DEFAULT_TIMES.map((time) => ({ ...time }));

// Keeps the phone's alarms the same as the plan. It lives next to the game so the
// reminder times, the saved steps and the 60 minute wait are always planned together.
export function RemindersProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const game = useGame();
  const [times, setTimes] = useState<ReminderTime[]>(freshTimes);
  const [loaded, setLoaded] = useState(false);
  const timesRef = useRef(times);
  const gameRef = useRef(game);
  const liveRef = useRef(false);
  gameRef.current = game;
  liveRef.current = game.ready && loaded;
  const { ready, snap, order, foods, dayOffset } = game;
  const enabled = snap.mode !== 'signed_out' && Boolean(snap.profile?.remindersEnabled);

  const push = useCallback(() => {
    if (Platform.OS === 'web') return;
    const current = gameRef.current;
    const profile = current.snap.profile;
    void syncNotifications({
      enabled: current.snap.mode !== 'signed_out' && Boolean(profile?.remindersEnabled),
      times: timesRef.current,
      order: current.order,
      foods: current.foods,
      logs: current.snap.logs,
      teas: current.snap.teas,
      now: new Date(),
      dayOffset: current.dayOffset,
    });
  }, []);

  useEffect(() => {
    let alive = true;
    void readReminderTimes(db).then((saved) => {
      if (!alive) return;
      timesRef.current = saved;
      setTimes(saved);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [db, snap.userId]);

  useEffect(() => {
    if (!ready || !loaded) return;
    const id = setTimeout(push, 400);
    return () => clearTimeout(id);
  }, [dayOffset, enabled, foods, loaded, order, push, ready, snap.logs, snap.teas, snap.userId, times]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && liveRef.current) push();
    });
    return () => subscription.remove();
  }, [push]);

  const saveTime = useCallback(
    async (slot: number, time: ReminderTime | null) => {
      const next = timesRef.current.map((item) => ({ ...item }));
      next[slot] = time ? { ...time } : { ...DEFAULT_TIMES[slot] };
      const saved = await writeReminderTimes(db, next);
      timesRef.current = saved;
      setTimes(saved);
      push();
      return saved;
    },
    [db, push],
  );

  const value = useMemo(() => ({ times, saveTime }), [saveTime, times]);
  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}

export function useReminders(): RemindersValue {
  const value = useContext(RemindersContext);
  if (!value) throw new Error('useReminders must be used inside RemindersProvider');
  return value;
}
