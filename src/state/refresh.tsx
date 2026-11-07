import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, RefreshControl, View, type StyleProp, type ViewStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NoticeCard } from '@/components/notice';
import { UPDATE_NOTICE, noticeForNow } from '@/domain/copy';
import { listenForNotices, notifyUpdateReady } from '@/lib/notifications';
import { palette } from '@/theme';

const SEEN_UPDATE = 'uyvo-seen-update';

type Notice = { title: string; body: string; onPress?: () => void };

type RefreshValue = {
  refreshing: boolean;
  refresh: () => Promise<void>;
};

const RefreshContext = createContext<RefreshValue | null>(null);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notice, setNotice] = useState<Notice | null>(null);
  const updates = Updates.useUpdates();
  const updatesRef = useRef(updates);
  updatesRef.current = updates;
  const gate = useRef<string | null>(null);
  const wantsNotice = useRef(false);
  const flight = useRef<Promise<void> | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const showMeal = useCallback(() => {
    const reminder = noticeForNow(new Date());
    setNotice({
      title: reminder.title,
      body: reminder.body,
      onPress: () => router.push('/forge'),
    });
  }, [router]);

  const announce = useCallback(async (id: string) => {
    gate.current = id;
    const note = { title: 'Something new is ready', body: 'Tap to open it.' };
    try {
      await notifyUpdateReady(note.title, note.body);
    } catch {
      // The card still tells them an update is ready.
    }
    setNotice({
      ...note,
      onPress: () => {
        void Updates.reloadAsync();
      },
    });
  }, []);

  const runCheck = useCallback(
    (explicit: boolean) => {
      if (explicit) wantsNotice.current = true;
      if (flight.current) return flight.current;
      const job = (async () => {
        if (Platform.OS === 'web' || !Updates.isEnabled) {
          const pulled = wantsNotice.current;
          wantsNotice.current = false;
          if (pulled && Platform.OS !== 'web') showMeal();
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
          if (pulled) showMeal();
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
          if (pulled) setNotice({ title: 'Could not refresh', body: 'Check the internet and pull down again.' });
        }
      })();
      flight.current = job.finally(() => {
        flight.current = null;
      });
      return flight.current;
    },
    [announce, showMeal],
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

  useEffect(() => {
    if (Platform.OS === 'web' || !Updates.isEnabled || Updates.isEmbeddedLaunch || !Updates.updateId) return;
    const id = Updates.updateId;
    let alive = true;
    void AsyncStorage.getItem(SEEN_UPDATE).then((seen) => {
      if (!alive || seen === id) return;
      setNotice(UPDATE_NOTICE);
      void AsyncStorage.setItem(SEEN_UPDATE, id);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let remove: () => void = () => undefined;
    let alive = true;
    void listenForNotices((title, body) => {
      setNotice({ title, body, onPress: () => router.push('/forge') });
    }).then((unsubscribe) => {
      if (!alive) unsubscribe();
      else remove = unsubscribe;
    });
    return () => {
      alive = false;
      remove();
    };
  }, [router]);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') {
      setRefreshing(true);
      showMeal();
      setRefreshing(false);
      return;
    }
    setRefreshing(true);
    try {
      await runCheck(true);
    } finally {
      setRefreshing(false);
    }
  }, [runCheck, showMeal]);

  const value = useMemo(() => ({ refreshing, refresh }), [refresh, refreshing]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let startY: number | null = null;
    let lastY: number | null = null;
    let atTop = false;
    let pulled = false;
    const scrollTop = (target: EventTarget | null) => {
      let node = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
      while (node) {
        if (node.scrollHeight > node.clientHeight + 4 && node.scrollTop > 2) return false;
        node = node.parentElement;
      }
      return true;
    };
    const down = (event: PointerEvent) => {
      startY = event.clientY;
      lastY = event.clientY;
      pulled = false;
      atTop = scrollTop(event.target);
    };
    const fire = (y: number, limit: number) => {
      if (pulled || startY == null || !atTop) return;
      if (y - startY < limit) return;
      pulled = true;
      void refresh();
    };
    const move = (event: PointerEvent) => {
      lastY = event.clientY;
      fire(event.clientY, 64);
    };
    const up = (event: PointerEvent) => {
      fire(event.clientY, 64);
      startY = null;
    };
    // The web scroll view cancels the pointer once a drag starts, and that event's clientY is 0.
    const cancel = () => {
      if (lastY != null) fire(lastY, 8);
      startY = null;
    };
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('pointermove', move, true);
    window.addEventListener('pointerup', up, true);
    window.addEventListener('pointercancel', cancel, true);
    return () => {
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerup', up, true);
      window.removeEventListener('pointercancel', cancel, true);
    };
  }, [refresh]);

  return (
    <RefreshContext.Provider value={value}>
      {children}
      {notice ? (
        <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12, zIndex: 40 }}>
          <NoticeCard
            title={notice.title}
            body={notice.body}
            onPress={() => {
              const action = notice.onPress;
              setNotice(null);
              action?.();
            }}
          />
        </View>
      ) : null}
    </RefreshContext.Provider>
  );
}

// Android and web pass the scroll view in as children. It has to be rendered or the page is blank.
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
