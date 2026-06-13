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

// ---- Stats ----

export type StackDay = { label: string; instagram: number; youtube: number; tiktok: number };
export type PerApp = { key: string; name: string; glyph: string; hue: number; totalMinutes: number; deltaPct: number };
export type FrictionStats = { answered: number; highestLevel: number; stopped: number };

export type StatsRange = {
  improvementPct: number; // negative = reduction
  breakdown: StackDay[];
  perApp: PerApp[];
  friction: FrictionStats;
};

export const STACK_LEGEND = [
  { key: 'instagram', name: 'IG', hue: appHues.instagram },
  { key: 'youtube', name: 'YT', hue: appHues.youtube },
  { key: 'tiktok', name: 'TT', hue: appHues.tiktok },
];

export const statsByRange: Record<'week' | 'month', StatsRange> = {
  week: {
    improvementPct: -14,
    breakdown: [
      { label: 'M', instagram: 60, youtube: 80, tiktok: 46 },
      { label: 'T', instagram: 50, youtube: 60, tiktok: 32 },
      { label: 'W', instagram: 72, youtube: 90, tiktok: 43 },
      { label: 'T', instagram: 64, youtube: 70, tiktok: 34 },
      { label: 'F', instagram: 60, youtube: 110, tiktok: 45 },
      { label: 'S', instagram: 30, youtube: 40, tiktok: 20 },
      { label: 'S', instagram: 48, youtube: 72, tiktok: 25 },
    ],
    perApp: [
      { key: 'instagram', name: 'Instagram', glyph: 'I', hue: appHues.instagram, totalMinutes: 384, deltaPct: -18 },
      { key: 'youtube', name: 'YouTube', glyph: 'Y', hue: appHues.youtube, totalMinutes: 522, deltaPct: 5 },
      { key: 'tiktok', name: 'TikTok', glyph: 'T', hue: appHues.tiktok, totalMinutes: 245, deltaPct: -22 },
    ],
    friction: { answered: 37, highestLevel: 4, stopped: 9 },
  },
  month: {
    improvementPct: -23,
    breakdown: [
      { label: 'W1', instagram: 420, youtube: 560, tiktok: 300 },
      { label: 'W2', instagram: 380, youtube: 500, tiktok: 260 },
      { label: 'W3', instagram: 350, youtube: 470, tiktok: 240 },
      { label: 'W4', instagram: 300, youtube: 430, tiktok: 210 },
    ],
    perApp: [
      { key: 'instagram', name: 'Instagram', glyph: 'I', hue: appHues.instagram, totalMinutes: 1450, deltaPct: -25 },
      { key: 'youtube', name: 'YouTube', glyph: 'Y', hue: appHues.youtube, totalMinutes: 1960, deltaPct: -12 },
      { key: 'tiktok', name: 'TikTok', glyph: 'T', hue: appHues.tiktok, totalMinutes: 1010, deltaPct: -30 },
    ],
    friction: { answered: 148, highestLevel: 6, stopped: 41 },
  },
};

// ---- Leaderboard ----

export type LeaderRow = { rank: number; name: string; savedMinutes: number; reductionPct: number; isYou?: boolean };

export const leaderboardResetIn = '2d 14h';

export const leaderboard: LeaderRow[] = [
  { rank: 1, name: 'Nova', savedMinutes: 540, reductionPct: -31 },
  { rank: 2, name: 'Kestrel', savedMinutes: 470, reductionPct: -27 },
  { rank: 3, name: 'Pinecone', savedMinutes: 430, reductionPct: -24 },
  { rank: 4, name: 'RiverFox', savedMinutes: 360, reductionPct: -19 },
  { rank: 4, name: 'Summit22', savedMinutes: 340, reductionPct: -19 },
  { rank: 6, name: 'Wander', savedMinutes: 300, reductionPct: -16 },
  { rank: 7, name: 'EarlyBird', savedMinutes: 220, reductionPct: -14, isYou: true },
  { rank: 8, name: 'Dawnlight', savedMinutes: 180, reductionPct: -11 },
];
