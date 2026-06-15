import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import AscendNative from '../../modules/ascend-native';
import { getInstalledApps } from '../data/installedApps';
import { DEFAULT_LIMIT } from '../data/apps';
import { useAppStore } from '../store/useAppStore';

export const USAGE_DAYS = 7;

export type AppUsage = {
  key: string;
  name: string;
  glyph: string;
  hue: number;
  /** Foreground minutes per day, length USAGE_DAYS, last entry = today. */
  daily: number[];
  today: number;
  weekTotal: number;
  limit: number;
};

/** Weekday initials for the last `days` days, ending today. */
function dayLabels(days: number): string[] {
  const letters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const out: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(letters[d.getDay()]);
  }
  return out;
}

/**
 * Reads real per-app screen time from the native module for the user's
 * monitored apps, and re-reads whenever the app returns to the foreground.
 */
export function useUsage() {
  const selected = useAppStore((s) => s.selected);
  const limits = useAppStore((s) => s.limits);
  const baselineComputed = useAppStore((s) => s.baselineComputed);
  const setBaseline = useAppStore((s) => s.setBaseline);

  const [apps, setApps] = useState<AppUsage[]>([]);
  const [hasAccess, setHasAccess] = useState(false);

  const refresh = useCallback(() => {
    const monitored = getInstalledApps().filter((a) => selected[a.packageName]);

    let access = false;
    try {
      access = AscendNative.hasUsageAccess();
    } catch {
      access = false;
    }
    setHasAccess(access);

    let usage: Record<string, number[]> = {};
    try {
      usage = AscendNative.getUsage(monitored.map((a) => a.packageName), USAGE_DAYS);
    } catch {
      usage = {};
    }

    setApps(
      monitored.map((a) => {
        const daily = usage[a.packageName] ?? new Array(USAGE_DAYS).fill(0);
        const weekTotal = daily.reduce((s, n) => s + n, 0);
        return {
          key: a.packageName,
          name: a.name,
          glyph: a.glyph,
          hue: a.hue,
          daily,
          today: daily[daily.length - 1] ?? 0,
          weekTotal,
          limit: limits[a.packageName] ?? DEFAULT_LIMIT,
        };
      }),
    );
  }, [selected, limits]);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  // Total monitored usage per day, across all apps.
  const weekDailyTotals = useMemo(
    () => Array.from({ length: USAGE_DAYS }, (_, i) => apps.reduce((s, a) => s + (a.daily[i] ?? 0), 0)),
    [apps],
  );

  // "Time saved vs. your limits" this week: per app per day, minutes under the limit.
  const timeSavedWeek = useMemo(
    () =>
      apps.reduce(
        (sum, a) => sum + a.daily.reduce((s, d) => s + Math.max(0, a.limit - d), 0),
        0,
      ),
    [apps],
  );

  // Streak: consecutive days (ending today) where every app stayed under its limit.
  const streak = useMemo(() => {
    if (apps.length === 0) return 0;
    let n = 0;
    for (let i = USAGE_DAYS - 1; i >= 0; i--) {
      const allUnder = apps.every((a) => (a.daily[i] ?? 0) <= a.limit);
      if (allUnder) n++;
      else break;
    }
    return n;
  }, [apps]);

  // Baseline: compute once on the first launch that has usage access + data.
  useEffect(() => {
    if (hasAccess && !baselineComputed && apps.length > 0) {
      const avg = Math.round(weekDailyTotals.reduce((s, n) => s + n, 0) / USAGE_DAYS);
      if (avg > 0) setBaseline(avg);
    }
  }, [hasAccess, baselineComputed, apps.length, weekDailyTotals, setBaseline]);

  return {
    apps,
    weekLabels: useMemo(() => dayLabels(USAGE_DAYS), []),
    weekDailyTotals,
    timeSavedWeek,
    streak,
    hasAccess,
    refresh,
  };
}
