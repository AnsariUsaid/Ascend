import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayKey } from '../lib/date';
import AscendNative from '../../modules/ascend-native';

// Mirror friction outcomes into the native watcher (Phase D). Wrapped so a
// missing native module never breaks the JS engine.
const pushNative = (fn: () => void) => {
  try {
    fn();
  } catch {
    /* native module unavailable — no-op */
  }
};

/** Per-app friction state for the current calendar day. Resets at midnight. */
export type AppFriction = {
  level: number; // current ladder level (next question difficulty)
  graceExpiresAt: number | null; // epoch ms; in grace while in the future
  blockedForToday: boolean; // user tapped "I'm done for today"
  answered: number;
  skipped: number;
  stopped: number;
  maxLevel: number; // highest level reached today
};

const freshApp = (): AppFriction => ({
  level: 1,
  graceExpiresAt: null,
  blockedForToday: false,
  answered: 0,
  skipped: 0,
  stopped: 0,
  maxLevel: 1,
});

type FrictionStore = {
  today: string;
  byApp: Record<string, AppFriction>;

  /** Reset all per-app state if the calendar day has rolled over. Call on app open / overlay open. */
  ensureToday: () => void;
  /** Read a snapshot (never mutates); returns a fresh default if unseen. */
  getApp: (key: string) => AppFriction;
  isInGrace: (key: string) => boolean;

  /** Correct answer → grant grace + climb one level. */
  answerCorrect: (key: string, graceMinutes: number) => void;
  /** Skip → +1 level penalty, no grace. */
  skip: (key: string) => void;
  /** "I'm done for today" → block this app for the rest of the day. */
  doneForToday: (key: string) => void;

  /** Dev-only: clear today's state immediately. */
  resetDay: () => void;
};

export const useFrictionStore = create<FrictionStore>()(
  persist(
    (set, get) => {
      // Apply an update to one app's state, creating it if needed.
      const update = (key: string, fn: (a: AppFriction) => AppFriction) =>
        set((s) => ({ byApp: { ...s.byApp, [key]: fn(s.byApp[key] ?? freshApp()) } }));

      return {
        today: todayKey(),
        byApp: {},

        ensureToday: () => {
          if (get().today !== todayKey()) {
            set({ today: todayKey(), byApp: {} });
            // New day: clear native grace/blocked so the watcher re-enforces.
            pushNative(() => AscendNative.clearAllFriction());
          }
        },

        getApp: (key) => get().byApp[key] ?? freshApp(),

        isInGrace: (key) => {
          const a = get().byApp[key];
          return !!a?.graceExpiresAt && a.graceExpiresAt > Date.now();
        },

        answerCorrect: (key, graceMinutes) => {
          const graceExpiresAt = Date.now() + graceMinutes * 60_000;
          update(key, (a) => {
            const nextLevel = a.level + 1;
            return {
              ...a,
              level: nextLevel,
              graceExpiresAt,
              answered: a.answered + 1,
              maxLevel: Math.max(a.maxLevel, nextLevel),
            };
          });
          // Native watcher backs off until grace expires.
          pushNative(() => AscendNative.setGrace(key, graceExpiresAt));
        },

        skip: (key) =>
          update(key, (a) => {
            const nextLevel = a.level + 1;
            return {
              ...a,
              level: nextLevel,
              graceExpiresAt: null,
              skipped: a.skipped + 1,
              maxLevel: Math.max(a.maxLevel, nextLevel),
            };
          }),

        doneForToday: (key) => {
          update(key, (a) => ({
            ...a,
            blockedForToday: true,
            graceExpiresAt: null,
            stopped: a.stopped + 1,
          }));
          // Native watcher stops re-triggering until midnight.
          pushNative(() => AscendNative.setBlockedToday(key));
        },

        resetDay: () => {
          set({ today: todayKey(), byApp: {} });
          pushNative(() => AscendNative.clearAllFriction());
        },
      };
    },
    {
      name: 'ascend-friction',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist data, not the action functions.
      partialize: (s) => ({ today: s.today, byApp: s.byApp }),
    },
  ),
);
