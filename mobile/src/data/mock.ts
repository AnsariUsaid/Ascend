/**
 * Mock data for the frontend-first phase. Replaced by real tracking + API later.
 * Times are in minutes.
 */
import { appHues } from '../theme';

export type MonitoredApp = {
  key: string;
  name: string;
  glyph: string;
  hue: number;
  usedMinutes: number;
  limitMinutes: number;
};

export const user = {
  displayName: 'EarlyBird',
  initials: 'EB',
  streakDays: 7,
};

export const todayApps: MonitoredApp[] = [
  { key: 'instagram', name: 'Instagram', glyph: 'I', hue: appHues.instagram, usedMinutes: 48, limitMinutes: 60 },
  { key: 'youtube', name: 'YouTube', glyph: 'Y', hue: appHues.youtube, usedMinutes: 72, limitMinutes: 60 },
  { key: 'tiktok', name: 'TikTok', glyph: 'T', hue: appHues.tiktok, usedMinutes: 25, limitMinutes: 45 },
];

/** Total daily usage (minutes) for the current week, Monday–Sunday. Last = today. */
export const weekUsage = [186, 142, 205, 168, 133, 90, 145];
export const weekLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const timeSavedThisWeekMinutes = 220; // "3h 40m"

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
