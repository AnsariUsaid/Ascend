import { appHues } from '../theme';

/** Known brand chip metadata, keyed by package name. */
const KNOWN: Record<string, { glyph: string; hue: number }> = {
  'com.instagram.android': { glyph: 'I', hue: appHues.instagram },
  'com.google.android.youtube': { glyph: 'Y', hue: appHues.youtube },
  'com.zhiliaoapp.musically': { glyph: 'T', hue: appHues.tiktok },
  'com.facebook.katana': { glyph: 'F', hue: appHues.facebook },
  'com.twitter.android': { glyph: 'X', hue: appHues.x },
  'com.x.android': { glyph: 'X', hue: appHues.x },
  'com.whatsapp': { glyph: 'W', hue: appHues.whatsapp },
  'com.snapchat.android': { glyph: 'S', hue: appHues.snapchat },
  'com.reddit.frontpage': { glyph: 'R', hue: appHues.reddit },
};

/** Stable hue (0–360) derived from a package name, for apps we don't know. */
function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

/** Chip glyph + hue for any app: brand colors when known, else derived. */
export function appMeta(packageName: string, name: string): { glyph: string; hue: number } {
  return KNOWN[packageName] ?? { glyph: (name.trim()[0] ?? '?').toUpperCase(), hue: hashHue(packageName) };
}

/** Package names we pre-suggest in the picker when they're installed. */
export const SUGGESTED_PACKAGES = Object.keys(KNOWN);
