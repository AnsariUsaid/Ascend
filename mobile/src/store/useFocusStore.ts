import { useEffect } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayKey } from '../lib/date';
import { trackHydration } from './hydration';
import AscendNative from '../../modules/ascend-native';

/**
 * Focus ("the climb"): a timer during which chosen apps stay closed.
 *
 * Time is kept as timestamps, not a ticking counter, so it stays right even if
 * Android kills Ascend mid-session: elapsed = `doneMs` (time before the current
 * stretch) + (now − `runningSince`). Paused → `runningSince` is null and the
 * clock stops; paused time never counts.
 *
 * Focus minutes are saved per day for the last 7 days (`history`). Stopping
 * early saves what was climbed; reaching the end saves the full length.
 */
export type FocusSession = {
  apps: string[]; // package names kept closed while running
  durationMs: number; // the length the user picked
  doneMs: number; // focus time before the current running stretch
  runningSince: number | null; // epoch ms; null while paused
};

/** What just happened, so the Focus tab can show the summit or a "saved" note. */
export type FocusResult = { kind: 'summit' | 'stopped'; ms: number };

const DAY_MS = 86400000;
const KEEP_DAYS = 7;

/** Focus time so far in a session. */
export const elapsedMs = (s: FocusSession, now = Date.now()) =>
  Math.min(s.durationMs, s.doneMs + (s.runningSince != null ? Math.max(0, now - s.runningSince) : 0));

export const remainingMs = (s: FocusSession, now = Date.now()) => Math.max(0, s.durationMs - elapsedMs(s, now));

/** "YYYY-MM-DD" for `daysAgo` days before `today` (a "YYYY-MM-DD" key). */
export function dayKeyBefore(today: string, daysAgo: number): string {
  const [y, m, d] = today.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) - daysAgo * DAY_MS);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

/** Drop days older than the last week. */
function pruned(history: Record<string, number>, today: string): Record<string, number> {
  const keep = new Set(Array.from({ length: KEEP_DAYS }, (_, i) => dayKeyBefore(today, i)));
  return Object.fromEntries(Object.entries(history).filter(([k]) => keep.has(k)));
}

// Mirror the session to the native watcher. Wrapped so a missing module never breaks JS.
function pushNative(session: FocusSession | null) {
  try {
    if (session && session.runningSince != null) {
      AscendNative.setFocus(
        session.apps,
        Date.now() + remainingMs(session),
        Math.round(session.durationMs / 60000),
      );
    } else {
      AscendNative.clearFocus();
    }
  } catch {
    /* native module unavailable — no-op */
  }
}

type FocusState = {
  session: FocusSession | null;
  history: Record<string, number>; // day → focus ms
  lastDurationMs: number; // remembered for next time
  lastApps: string[] | null; // remembered for next time (null = use monitored apps)
  result: FocusResult | null;
  start: (apps: string[], durationMs: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  /** End the session if its time is up (called by the ticking UI and on app open). */
  finishIfDone: () => void;
  clearResult: () => void;
  reset: () => void;
};

const initial = {
  session: null,
  history: {},
  lastDurationMs: 25 * 60000,
  lastApps: null,
  result: null,
};

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => {
      // Credit focus time to today and close the session.
      const end = (kind: FocusResult['kind']) => {
        const s = get().session;
        if (!s) return;
        const ms = elapsedMs(s);
        const today = todayKey();
        const history = pruned(get().history, today);
        if (ms > 0) history[today] = (history[today] ?? 0) + ms;
        set({ session: null, history, result: { kind, ms } });
        pushNative(null);
      };

      return {
        ...initial,
        start: (apps, durationMs) => {
          const session: FocusSession = { apps, durationMs, doneMs: 0, runningSince: Date.now() };
          set({ session, lastDurationMs: durationMs, lastApps: apps, result: null });
          pushNative(session);
        },
        pause: () => {
          const s = get().session;
          if (!s || s.runningSince == null) return;
          const session = { ...s, doneMs: elapsedMs(s), runningSince: null };
          set({ session });
          pushNative(session);
        },
        resume: () => {
          const s = get().session;
          if (!s || s.runningSince != null) return;
          const session = { ...s, runningSince: Date.now() };
          set({ session });
          pushNative(session);
        },
        stop: () => end('stopped'),
        finishIfDone: () => {
          const s = get().session;
          if (s && remainingMs(s) <= 0) end('summit');
        },
        clearResult: () => set({ result: null }),
        reset: () => {
          set({ ...initial });
          pushNative(null);
        },
      };
    },
    {
      name: 'ascend-focus',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: (_state: FocusState) => trackHydration('ascend-focus'),
      partialize: (s) => ({
        session: s.session,
        history: s.history,
        lastDurationMs: s.lastDurationMs,
        lastApps: s.lastApps,
        result: s.result,
      }),
    },
  ),
);

/** Focus ms per day for the last 7 days, oldest first (index 6 = today). */
export function weekHistory(history: Record<string, number>): { day: string; ms: number }[] {
  const today = todayKey();
  return Array.from({ length: KEEP_DAYS }, (_, i) => {
    const day = dayKeyBefore(today, KEEP_DAYS - 1 - i);
    return { day, ms: history[day] ?? 0 };
  });
}

/**
 * On launch and whenever Ascend comes back to the front: end a session whose time
 * ran out while Ascend was closed, and re-send a running one to the watcher (a
 * reboot clears the watcher's copy).
 */
export function useFocusSync() {
  useEffect(() => {
    const run = () => {
      if (!useFocusStore.persist.hasHydrated()) return;
      const store = useFocusStore.getState();
      store.finishIfDone();
      pushNative(useFocusStore.getState().session);
    };
    run();
    const unsub = useFocusStore.persist.onFinishHydration(run);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => {
      unsub();
      sub.remove();
    };
  }, []);
}
