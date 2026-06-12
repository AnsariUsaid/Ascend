import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

type Props = {
  size?: number;
  color?: string;
  /** Opacity of the lower (second) chevron. */
  secondaryOpacity?: number;
  strokeWidth?: number;
};

/** Ascend mark: two stacked up-chevrons, the lower one faded. */
export function ChevronMark({
  size = 72,
  color = colors.cream,
  secondaryOpacity = 0.38,
  strokeWidth = 8,
}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Path
        d="M15 70 L50 45 L85 70"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={secondaryOpacity}
      />
      <Path
        d="M15 48 L50 23 L85 48"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
