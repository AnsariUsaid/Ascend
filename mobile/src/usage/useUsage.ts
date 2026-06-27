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

  // Rolling baseline: today vs. the average of the 6 days before it. The window
  // slides forward with the dates (getUsage always returns the trailing 7 days),
  // so there's nothing to freeze or reset — it's all derived live.
  //   typicalDay  = avg daily minutes over the previous 6 days (full days)
  //   todayMinutes = today so far
  //   improvement = how much below your typical day you are today (signed %)
  const todayMinutes = weekDailyTotals[USAGE_DAYS - 1] ?? 0;
  const prevDays = weekDailyTotals.slice(0, USAGE_DAYS - 1); // the 6 days before today
  const typicalDay = prevDays.length
    ? Math.round(prevDays.reduce((s, n) => s + n, 0) / prevDays.length)
    : 0;
  // Signed: positive = used less than usual today, negative = used more.
  // Consumers clamp/format (the headline shows reductions only).
  const improvement = typicalDay > 0
    ? Math.round(((typicalDay - todayMinutes) / typicalDay) * 100)
    : 0;

  return {
    apps,
    weekLabels: useMemo(() => dayLabels(USAGE_DAYS), []),
    weekDailyTotals,
    timeSavedWeek,
    streak,
    hasAccess,
    refresh,
    // Rolling-baseline pieces (also feed the baseline detail page).
    todayMinutes,
    typicalDay,
    improvement,
  };
}
