import { colors } from '../../theme';

/** Focus has two moods: the warm day palette while planning, a calm night while climbing. */
export const night = {
  bg: '#1E1A24',
  restBg: '#26212B',
  text: '#F6EDE3',
  sub: '#A99CB0',
  dim: '#8E8296',
  line: '#4A4054',
  peakBack: '#26212E',
  peakFront: '#2E2836',
  snow: '#3A3344',
  lit: '#E98A6A',
  litRest: '#8E6E66',
  dot: '#F2A285',
  tabBorder: '#2C2634',
  tabInactive: '#7C7088',
} as const;

export const day = {
  bg: colors.cream,
  peakBack: '#F3E7D8',
  peakFront: '#EBD9C6',
  snow: '#FBF4EA',
  trail: '#D9B9A2',
  week: '#E7C2B2',
} as const;
