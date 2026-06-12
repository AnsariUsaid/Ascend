import { View, StyleSheet } from 'react-native';
import { colors, radius, sizes } from '../theme';

type Props = {
  /** 0..1 fill fraction (clamped). */
  progress: number;
  /** Render the fill in the danger color (over-limit). */
  over?: boolean;
  height?: number;
};

export function ProgressBar({ progress, over, height = sizes.progressBarHeight }: Props) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <View style={[styles.track, { height, borderRadius: radius.pill }]}>
      <View
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: radius.pill,
          backgroundColor: over ? colors.dangerText : colors.coral,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', backgroundColor: colors.track, overflow: 'hidden' },
});
