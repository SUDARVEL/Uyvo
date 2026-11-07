import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, AppState, Platform, RefreshControl, type StyleProp, type ViewStyle } from 'react-native';
import * as Updates from 'expo-updates';

import { notifyUpdateReady } from '@/lib/notifications';
import { palette } from '@/theme';

type RefreshValue = {
  refreshing: boolean;
  refresh: () => Promise<void>;
};

const RefreshContext = createContext<RefreshValue | null>(null);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const updates = Updates.useUpdates();
  const updatesRef = useRef(updates);
  updatesRef.current = updates;
  const gate = useRef<string | null>(null);
  const wantsNotice = useRef(false);
  const flight = useRef<Promise<void> | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const announce = useCallback(async (id: string) => {
    gate.current = id;
    try {
      await notifyUpdateReady();
    } catch {
      // The on-screen alert still tells them an update is ready.
    }
    Alert.alert('Uyvo has something new', 'Tap to see it.', [
      { text: 'Later', style: 'cancel' },
      { text: 'See it', onPress: () => void Updates.reloadAsync() },
    ]);
  }, []);

  const runCheck = useCallback(
    (explicit: boolean) => {
      if (explicit) wantsNotice.current = true;
      if (flight.current) return flight.current;
      const job = (async () => {
        if (Platform.OS === 'web' || !Updates.isEnabled) {
          const pulled = wantsNotice.current;
          wantsNotice.current = false;
          if (pulled && Platform.OS !== 'web') {
            Alert.alert('Uyvo is up to date', 'Pull down any time to check again.');
          }
          return;
        }
        const seen = gate.current;
        gate.current = 'busy';
        try {
          const result = await Updates.checkForUpdateAsync();
          let isNew = false;
          if (result.isAvailable) {
            const fetched = await Updates.fetchUpdateAsync();
            isNew = fetched.isNew;
          }
          const live = updatesRef.current;
          const id = live.downloadedUpdate?.updateId ?? 'pending';
          const pending = isNew || live.isUpdatePending;
          const pulled = wantsNotice.current;
          wantsNotice.current = false;
          if (pending) {
            if (!pulled && (seen === id || seen === 'pending')) {
              gate.current = id;
              return;
            }
            await announce(id);
            return;
          }
          gate.current = seen === 'busy' ? null : seen;
          if (pulled) Alert.alert('Uyvo is up to date', 'Pull down any time to check again.');
        } catch {
          const pulled = wantsNotice.current;
          wantsNotice.current = false;
          const live = updatesRef.current;
          if (live.isUpdatePending) {
            const id = live.downloadedUpdate?.updateId ?? 'pending';
            if (pulled || (seen !== id && seen !== 'pending')) {
              await announce(id);
              return;
            }
            gate.current = id;
            return;
          }
          gate.current = seen === 'busy' ? null : seen;
          if (pulled) Alert.alert('Could not refresh', 'Check the internet and pull down again.');
        }
      })();
      flight.current = job.finally(() => {
        flight.current = null;
      });
      return flight.current;
    },
    [announce],
  );

  useEffect(() => {
    if (Platform.OS === 'web' || !Updates.isEnabled) return;
    void runCheck(false);
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') void runCheck(false);
    });
    return () => app.remove();
  }, [runCheck]);

  useEffect(() => {
    if (Platform.OS === 'web' || !Updates.isEnabled || !updates.isUpdatePending) return;
    const id = updates.downloadedUpdate?.updateId ?? 'pending';
    if (gate.current === 'busy' || gate.current === id || gate.current === 'pending') {
      if (gate.current === 'pending') gate.current = id;
      return;
    }
    void announce(id);
  }, [announce, updates.downloadedUpdate?.updateId, updates.isUpdatePending]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let remove: () => void = () => undefined;
    void import('expo-notifications').then((Notifications) => {
      const sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.kind === 'update') void Updates.reloadAsync();
      });
      remove = () => sub.remove();
    });
    return () => remove();
  }, []);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') {
      window.location.reload();
      return;
    }
    setRefreshing(true);
    try {
      await runCheck(true);
    } finally {
      setRefreshing(false);
    }
  }, [runCheck]);

  const value = useMemo(() => ({ refreshing, refresh }), [refresh, refreshing]);
  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>;
}

export function PullRefresh({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const value = useContext(RefreshContext);
  return (
    <RefreshControl
      refreshing={value?.refreshing ?? false}
      onRefresh={() => void value?.refresh()}
      tintColor={palette.crimson}
      colors={[palette.crimson]}
      style={style}>
      {children}
    </RefreshControl>
  );
}
