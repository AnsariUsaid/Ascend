import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LIMIT, LIMIT_MIN, LIMIT_MAX, LIMIT_STEP } from '../data/apps';

export type QuestionType = 'math' | 'trivia' | 'logic' | 'typing';
export type GracePeriod = 5 | 10 | 15;

type AppState = {
  // Onboarding + Settings shared config (single source of truth).
  // Keyed by Android package name (e.g. "com.instagram.android").
  selected: Record<string, boolean>;
  limits: Record<string, number>; // minutes, per package
  questionType: QuestionType;
  gracePeriod: GracePeriod;
  displayName: string;
  leaderboardOptIn: boolean;
  notifications: boolean;

  /**
   * Average daily screen-time (minutes) of monitored apps before Ascend — the
   * denominator for the leaderboard's % reduction. Set ONCE on first launch,
   * computed from the past-7-day UsageStatsManager query (see useUsage).
   */
  baselineMinutes: number;
  /** True once the real baseline has been captured (so we don't overwrite it). */
  baselineComputed: boolean;

  // Actions
  toggleApp: (key: string) => void;
  setSelected: (next: Record<string, boolean>) => void;
  setLimit: (key: string, minutes: number) => void;
  bumpLimit: (key: string, delta: number) => void;
  setQuestionType: (t: QuestionType) => void;
  setGracePeriod: (g: GracePeriod) => void;
  setDisplayName: (name: string) => void;
  setLeaderboardOptIn: (v: boolean) => void;
  setNotifications: (v: boolean) => void;
  setBaseline: (minutes: number) => void;

  // Derived helpers
  selectedKeys: () => string[];
};

const clampLimit = (m: number) => Math.max(LIMIT_MIN, Math.min(LIMIT_MAX, m));

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selected: {},
      limits: {},
      questionType: 'math',
      gracePeriod: 10,
      displayName: 'EarlyBird',
      leaderboardOptIn: true,
      notifications: true,
      baselineMinutes: 320, // fallback until the real past-7-day baseline is computed
      baselineComputed: false,

      toggleApp: (key) =>
        set((s) => ({
          selected: { ...s.selected, [key]: !s.selected[key] },
          // Give a newly-enabled app a default limit if it doesn't have one.
          limits: s.limits[key] != null ? s.limits : { ...s.limits, [key]: DEFAULT_LIMIT },
        })),
      setSelected: (next) => set({ selected: next }),
      setLimit: (key, minutes) =>
        set((s) => ({ limits: { ...s.limits, [key]: clampLimit(minutes) } })),
      bumpLimit: (key, delta) =>
        set((s) => ({
          limits: { ...s.limits, [key]: clampLimit((s.limits[key] ?? DEFAULT_LIMIT) + delta * LIMIT_STEP) },
        })),
      setQuestionType: (t) => set({ questionType: t }),
      setGracePeriod: (g) => set({ gracePeriod: g }),
      setDisplayName: (name) => set({ displayName: name }),
      setLeaderboardOptIn: (v) => set({ leaderboardOptIn: v }),
      setNotifications: (v) => set({ notifications: v }),
      setBaseline: (minutes) => set({ baselineMinutes: minutes, baselineComputed: true }),

      selectedKeys: () => {
        const { selected } = get();
        return Object.keys(selected).filter((k) => selected[k]);
      },
    }),
    {
      name: 'ascend-config',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        selected: s.selected,
        limits: s.limits,
        questionType: s.questionType,
        gracePeriod: s.gracePeriod,
        displayName: s.displayName,
        leaderboardOptIn: s.leaderboardOptIn,
        notifications: s.notifications,
        baselineMinutes: s.baselineMinutes,
        baselineComputed: s.baselineComputed,
      }),
    },
  ),
);
