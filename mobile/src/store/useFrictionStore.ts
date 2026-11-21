import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayKey } from '../lib/date';
import { MAX_LEVEL } from '../data/questionBank';
import AscendNative from '../../modules/ascend-native';
import type { QuestionType } from './useAppStore';

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
  wrongStreak: number; // wrong answers in a row (drives the answer lockout)
  lockedUntil: number | null; // epoch ms; can't answer again until then
  /** Question on screen right now, so reopening friction shows the same one (no free re-roll). */
  currentQ: { type: QuestionType; level: number; id: string } | null;
};

const freshApp = (): AppFriction => ({
  level: 1,
  graceExpiresAt: null,
  blockedForToday: false,
  answered: 0,
  skipped: 0,
  stopped: 0,
  maxLevel: 1,
  wrongStreak: 0,
  lockedUntil: null,
  currentQ: null,
});

// Older persisted entries predate some fields — fill them from the defaults.
const withDefaults = (a?: Partial<AppFriction>): AppFriction => ({ ...freshApp(), ...a });

/**
 * Lockout after a wrong answer, doubling with each miss in a row: 3s, 6s, 12s,
 * 24s, then 30s. A fresh question alone isn't enough — blind-guessing a 4-option
 * question still wins 25% of the time — so guessing has to cost more than thinking.
 */
export const lockMsFor = (streak: number) =>
  Math.min(30, 3 * 2 ** Math.max(0, streak - 1)) * 1000;

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
  /** Wrong answer → bump the miss streak and start a lockout (no grace, no level change). */
  answerWrong: (key: string) => void;
  /** Remember the question currently shown for this app. */
  setCurrentQ: (key: string, q: AppFriction['currentQ']) => void;
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
        set((s) => ({ byApp: { ...s.byApp, [key]: fn(withDefaults(s.byApp[key])) } }));

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

        getApp: (key) => withDefaults(get().byApp[key]),

        isInGrace: (key) => {
          const a = get().byApp[key];
          return !!a?.graceExpiresAt && a.graceExpiresAt > Date.now();
        },

        answerCorrect: (key, graceMinutes) => {
          const graceExpiresAt = Date.now() + graceMinutes * 60_000;
          update(key, (a) => {
            // Climb a level. We allow ONE step past the top (MAX_LEVEL + 1) as a
            // sentinel meaning "ladder finished for today" — the overlay reads it and
            // shows the terminal "done for today" screen instead of another question.
            // So clearing level 5 is the final earn round; the next trigger ends the day.
            const nextLevel = Math.min(MAX_LEVEL + 1, a.level + 1);
            return {
              ...a,
              level: nextLevel,
              graceExpiresAt,
              answered: a.answered + 1,
              wrongStreak: 0,
              lockedUntil: null,
              currentQ: null,
              // Stats never show the sentinel — cap the displayed max at MAX_LEVEL.
              maxLevel: Math.min(MAX_LEVEL, Math.max(a.maxLevel, nextLevel)),
            };
          });
          // Native watcher backs off until grace expires.
          pushNative(() => AscendNative.setGrace(key, graceExpiresAt));
        },

        answerWrong: (key) =>
          update(key, (a) => {
            const wrongStreak = a.wrongStreak + 1;
            return { ...a, wrongStreak, lockedUntil: Date.now() + lockMsFor(wrongStreak) };
          }),

        setCurrentQ: (key, q) => update(key, (a) => ({ ...a, currentQ: q })),

        skip: (key) =>
          update(key, (a) => {
            // Skip penalty climbs a level, capped — at the top it re-serves level MAX_LEVEL.
            const nextLevel = Math.min(MAX_LEVEL, a.level + 1);
            // At the cap the level can't climb, so a skip would be a free re-roll.
            // Charge it like a wrong answer instead.
            const atCap = a.level >= MAX_LEVEL;
            const wrongStreak = atCap ? a.wrongStreak + 1 : a.wrongStreak;
            return {
              ...a,
              level: nextLevel,
              graceExpiresAt: null,
              skipped: a.skipped + 1,
              maxLevel: Math.max(a.maxLevel, nextLevel),
              wrongStreak,
              lockedUntil: atCap ? Date.now() + lockMsFor(wrongStreak) : a.lockedUntil,
              currentQ: null,
            };
          }),

        doneForToday: (key) => {
          update(key, (a) => ({
            ...a,
            blockedForToday: true,
            graceExpiresAt: null,
            currentQ: null,
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
