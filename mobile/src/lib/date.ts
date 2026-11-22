import AscendNative from '../../modules/ascend-native';

/** Local-calendar-day helpers used for the friction ladder's midnight reset. */

/** A date's local "YYYY-MM-DD" key. */
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Today as a stable "YYYY-MM-DD" key. Asks the native tamper-proof clock, so
 * changing the date in Settings doesn't trigger the midnight reset; falls back
 * to the phone's clock if the native module is unavailable.
 */
export function todayKey(): string {
  try {
    return AscendNative.getTrustedDay();
  } catch {
    return dateKey(new Date());
  }
}

/** True if `storedKey` is not today (i.e. the calendar day has rolled over). */
export function isNewDay(storedKey: string | null | undefined): boolean {
  return storedKey !== todayKey();
}
