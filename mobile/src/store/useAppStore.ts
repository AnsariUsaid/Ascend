import { create } from 'zustand';
import {
  APP_CATALOG,
  DEFAULT_SELECTED,
  DEFAULT_LIMIT,
  LIMIT_MIN,
  LIMIT_MAX,
  LIMIT_STEP,
} from '../data/apps';

export type QuestionType = 'math' | 'trivia' | 'logic' | 'typing';
export type GracePeriod = 5 | 10 | 15;

type AppState = {
  // Onboarding + Settings shared config (single source of truth).
  selected: Record<string, boolean>;
  limits: Record<string, number>; // minutes, per app key
  questionType: QuestionType;
  gracePeriod: GracePeriod;
  displayName: string;
  leaderboardOptIn: boolean;
  notifications: boolean;

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

  // Derived helpers
  selectedKeys: () => string[];
};

const clampLimit = (m: number) => Math.max(LIMIT_MIN, Math.min(LIMIT_MAX, m));

const initialSelected: Record<string, boolean> = Object.fromEntries(
  APP_CATALOG.map((a) => [a.key, DEFAULT_SELECTED.includes(a.key)]),
);
const initialLimits: Record<string, number> = Object.fromEntries(
  APP_CATALOG.map((a) => [a.key, DEFAULT_LIMIT]),
);

export const useAppStore = create<AppState>((set, get) => ({
  selected: initialSelected,
  limits: initialLimits,
  questionType: 'math',
  gracePeriod: 10,
  displayName: 'EarlyBird',
  leaderboardOptIn: true,
  notifications: true,

  toggleApp: (key) =>
    set((s) => ({ selected: { ...s.selected, [key]: !s.selected[key] } })),
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

  selectedKeys: () => {
    const { selected } = get();
    return APP_CATALOG.filter((a) => selected[a.key]).map((a) => a.key);
  },
}));
