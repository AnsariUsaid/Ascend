import { useEffect } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackHydration } from '../store/hydration';
import { todayKey } from '../lib/date';
import builtIn from './questions/batch-0.json';

/**
 * Question packs (see docs/QUESTION_SPEC.md). Batch 0 ships inside the app;
 * batches 1..N live on the website and rotate weekly:
 *
 *   week  = whole weeks since EPOCH (a Monday, by Ascend's trusted date)
 *   batch = (week % N) + 1          → 1, 2, … N, then back to 1
 *
 * When a new week starts, the app downloads that week's batch once and keeps it.
 * Offline, a failed download or a bad file just keeps the last pack (or batch 0).
 * Nothing about the user is sent — these are plain public files.
 */
const BASE_URL = 'https://ascend.ansariusaid.me/questions';
const EPOCH_UTC = Date.UTC(2026, 0, 5); // Monday 5 January 2026
const RETRY_MS = 60 * 60 * 1000; // after a failed attempt, wait an hour before trying again
const TIMEOUT_MS = 10000;

export type PackQuestion = {
  id: string;
  prompt: string;
  answer: string;
  options?: string[];
  accept?: string[];
  reject?: string[];
  reference?: string;
};
type Levels = Record<string, PackQuestion[]>;
export type Pack = { batch: number; version: number; trivia: Levels; logic: Levels; typing: Levels; math: Levels };
export type PackType = 'trivia' | 'logic' | 'typing' | 'math';

export const BUILT_IN = builtIn as Pack;

/** Whole weeks since the epoch Monday, using Ascend's tamper-proof date. */
export function currentWeek(): number {
  const [y, m, d] = todayKey().split('-').map(Number);
  return Math.floor((Date.UTC(y, m - 1, d) - EPOCH_UTC) / (7 * 86400000));
}

type PackState = {
  pack: Pack | null; // this or a previous week's downloaded batch
  week: number | null; // the week `pack` was downloaded for
  lastAttempt: number; // epoch ms of the last download attempt
  setPack: (pack: Pack, week: number) => void;
  reset: () => void;
};

export const useQuestionPackStore = create<PackState>()(
  persist(
    (set) => ({
      pack: null,
      week: null,
      lastAttempt: 0,
      setPack: (pack, week) => set({ pack, week }),
      reset: () => set({ pack: null, week: null, lastAttempt: 0 }),
    }),
    {
      name: 'ascend-questions',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: (_state: PackState) => trackHydration('ascend-questions'),
      partialize: (s) => ({ pack: s.pack, week: s.week, lastAttempt: s.lastAttempt }),
    },
  ),
);

/** The pack questions are served from right now: the downloaded one, else batch 0. */
export function activePack(): Pack {
  return useQuestionPackStore.getState().pack ?? BUILT_IN;
}

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

/** Accept a downloaded pack only if every type has usable questions at every level. */
function isValidPack(p: unknown): p is Pack {
  const pack = p as Pack;
  if (!pack || typeof pack !== 'object') return false;
  for (const type of ['trivia', 'logic', 'typing', 'math'] as const) {
    for (const lvl of ['1', '2', '3', '4', '5']) {
      const items = pack[type]?.[lvl];
      if (!Array.isArray(items) || items.length < 5) return false;
      for (const q of items) {
        if (!isStr(q?.id) || !isStr(q?.prompt) || !isStr(q?.answer)) return false;
        if (q.options && !q.options.includes(q.answer)) return false;
        if (type === 'typing' && !isStr(q.reference)) return false;
      }
    }
  }
  return true;
}

async function getJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

let inFlight = false;

/** Download this week's batch if we don't have it yet. Silent on failure. */
export async function syncQuestionPack() {
  const { week, pack, lastAttempt, setPack } = useQuestionPackStore.getState();
  const now = currentWeek();
  if ((pack && week === now) || inFlight || Date.now() - lastAttempt < RETRY_MS) return;
  inFlight = true;
  useQuestionPackStore.setState({ lastAttempt: Date.now() });
  try {
    const index = (await getJson(`${BASE_URL}/index.json`)) as { batches?: unknown };
    const count = typeof index?.batches === 'number' && index.batches > 0 ? Math.floor(index.batches) : 0;
    if (!count) return;
    const batch = (((now % count) + count) % count) + 1;
    const data = await getJson(`${BASE_URL}/batch-${batch}.json`);
    if (isValidPack(data)) setPack(data, now);
  } catch {
    // offline / timeout / bad file — keep the pack we have
  } finally {
    inFlight = false;
  }
}

/** Check for a new week's pack when the app starts and whenever it comes back to the front. */
export function useQuestionPackSync() {
  useEffect(() => {
    // Only after the saved pack has loaded — otherwise a fresh download could be
    // overwritten by the older saved copy finishing its load a moment later.
    const run = () => {
      if (useQuestionPackStore.persist.hasHydrated()) syncQuestionPack();
    };
    run();
    const unsubHydrate = useQuestionPackStore.persist.onFinishHydration(run);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => {
      unsubHydrate();
      sub.remove();
    };
  }, []);
}
