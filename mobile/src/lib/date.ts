/** Local-calendar-day helpers used for the friction ladder's midnight reset. */

/** Today's local date as a stable "YYYY-MM-DD" key. */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** True if `storedKey` is not today (i.e. the calendar day has rolled over). */
export function isNewDay(storedKey: string | null | undefined): boolean {
  return storedKey !== todayKey();
}
