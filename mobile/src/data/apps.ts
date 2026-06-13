import { appHues } from '../theme';

export type AppCatalogItem = {
  key: string;
  name: string;
  glyph: string;
  hue: number;
  packageName: string;
  /** Pre-detected as installed (shown in onboarding step 3). */
  detected: boolean;
};

/** The 8 apps Ascend can monitor. Six are "pre-detected"; Edit Apps shows all 8. */
export const APP_CATALOG: AppCatalogItem[] = [
  { key: 'instagram', name: 'Instagram', glyph: 'I', hue: appHues.instagram, packageName: 'com.instagram.android', detected: true },
  { key: 'youtube', name: 'YouTube', glyph: 'Y', hue: appHues.youtube, packageName: 'com.google.android.youtube', detected: true },
  { key: 'tiktok', name: 'TikTok', glyph: 'T', hue: appHues.tiktok, packageName: 'com.zhiliaoapp.musically', detected: true },
  { key: 'facebook', name: 'Facebook', glyph: 'F', hue: appHues.facebook, packageName: 'com.facebook.katana', detected: true },
  { key: 'x', name: 'X', glyph: 'X', hue: appHues.x, packageName: 'com.twitter.android', detected: true },
  { key: 'whatsapp', name: 'WhatsApp', glyph: 'W', hue: appHues.whatsapp, packageName: 'com.whatsapp', detected: true },
  { key: 'snapchat', name: 'Snapchat', glyph: 'S', hue: appHues.snapchat, packageName: 'com.snapchat.android', detected: false },
  { key: 'reddit', name: 'Reddit', glyph: 'R', hue: appHues.reddit, packageName: 'com.reddit.frontpage', detected: false },
];

/** Preselected during onboarding. */
export const DEFAULT_SELECTED = ['instagram', 'youtube', 'tiktok'];

/** Time-limit bounds (minutes) — 15 min to 4 h, 15-min steps. */
export const LIMIT_MIN = 15;
export const LIMIT_MAX = 240;
export const LIMIT_STEP = 15;
export const DEFAULT_LIMIT = 60;
