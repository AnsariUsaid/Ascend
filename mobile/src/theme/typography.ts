/**
 * Typography — from the handoff.
 * Bricolage Grotesque (700/800): wordmark, headlines, numbers, screen titles.
 * Outfit (300–600): all UI text.
 * Font family keys match the @expo-google-fonts export names loaded in app/_layout.tsx.
 */

export const fonts = {
  // Bricolage Grotesque
  display: 'BricolageGrotesque_700Bold',
  displayXBold: 'BricolageGrotesque_800ExtraBold',
  // Outfit
  light: 'Outfit_300Light',
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
} as const;

/** Reusable text presets (fontSize / lineHeight / letterSpacing) from the spec scale. */
export const text = {
  screenTitle: { fontFamily: fonts.displayXBold, fontSize: 27 },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    letterSpacing: 0.14 * 12.5,
    textTransform: 'uppercase' as const,
  },
  row: { fontFamily: fonts.medium, fontSize: 15 },
  caption: { fontFamily: fonts.regular, fontSize: 12.5 },
  heroNumber: { fontFamily: fonts.displayXBold, fontSize: 30 },
  wordmark: { fontFamily: fonts.displayXBold, letterSpacing: 0.16 * 42, fontSize: 42 },
} as const;
