/**
 * Ascend "Summit" palette — from the design handoff (README "Design Tokens").
 * Hex values are taken verbatim where the handoff gave them; oklch-specified
 * tokens are converted with `oklchToHex` so they match the spec exactly.
 */

/** Convert an OKLCH color to a #rrggbb sRGB hex string. */
export function oklchToHex(L: number, C: number, hDeg: number): string {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  // OKLab -> linear sRGB
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const toGamma = (c: number) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, v)) * 255);
  };
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(toGamma(lr))}${hex(toGamma(lg))}${hex(toGamma(lb))}`;
}

export const colors = {
  // Brand
  coral: '#D2603F', // oklch(0.62 0.15 38) — primary
  coralText: oklchToHex(0.55, 0.12, 40), // coral-tinted text on light bg

  // Surfaces / text
  cream: '#fbf4ea', // app background, text on dark/coral
  coffee: '#221a13', // dark cards, secondary buttons, dialog scrim base
  ink: '#2b211a', // primary text on light

  // Muted text ramp
  muted: '#5c5045', // body
  muted2: '#8a7a69', // captions
  muted3: '#9a8a78', // captions
  faint: '#b9a98f', // faint

  // Borders / dividers
  cardBorder: '#eee2d0',
  divider: '#f6ecdd',

  // Tracks / fills
  track: '#f0e3cf', // progress track / inactive fill
  disabled: '#ddd0bb',

  // Semantic
  successText: oklchToHex(0.45, 0.1, 150),
  successBg: oklchToHex(0.94, 0.05, 150),
  dangerText: oklchToHex(0.53, 0.165, 30),
  dangerBg: oklchToHex(0.95, 0.035, 30),
  amber: oklchToHex(0.78, 0.13, 70), // time-saved number, rank highlight on dark

  white: '#ffffff',
} as const;

/** App-identity hues (degrees) from the handoff. */
export const appHues = {
  instagram: 340,
  youtube: 25,
  tiktok: 200,
  facebook: 260,
  x: 290,
  whatsapp: 150,
  snapchat: 95,
  reddit: 45,
} as const;

export type AppKey = keyof typeof appHues;

/** chip bg oklch(0.87 0.06 H) + glyph oklch(0.42 0.1 H) for an app hue. */
export function appChipColors(hue: number) {
  return {
    bg: oklchToHex(0.87, 0.06, hue),
    glyph: oklchToHex(0.42, 0.1, hue),
  };
}
