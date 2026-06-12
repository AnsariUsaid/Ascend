/** Spacing & shape tokens — from the handoff. */

export const spacing = {
  screenH: 24, // screen horizontal padding
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  card: 18, // hero cards 18; standard 16–18
  cardSm: 16,
  button: 18,
  sheet: 32, // dialogs/sheets 24–32
  dialog: 24,
  pill: 99, // pills/chips/progress
} as const;

export const sizes = {
  buttonHeight: 56,
  buttonHeightSecondary: 48,
  progressBarHeight: 7,
  navIcon: 22,
} as const;
