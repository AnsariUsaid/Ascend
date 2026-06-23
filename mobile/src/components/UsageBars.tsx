import { View, Text, Pressable, StyleSheet } from 'react-native';
import { appChipColors, colors, fonts } from '../theme';

export type BarSegment = {
  key: string;
  hue: number;
  minutes: number;
  /** Optional explicit color; falls back to the app-hue color. */
  color?: string;
};
export type BarDay = { label: string; segments: BarSegment[] };

type Props = {
  days: BarDay[];
  /** Highlight one day (e.g. the selected day or today). */
  selectedIndex?: number | null;
  /** Make days tappable. Omit for a display-only chart. */
  onSelectDay?: (i: number) => void;
  height?: number;
  barWidth?: number;
};

const GRID_LINES = 4;
const segColor = (seg: BarSegment) => seg.color ?? appChipColors(seg.hue).glyph;

/** Reusable 7-day stacked bar chart: rounded-top bars on faint gridlines. */
export function UsageBars({
  days,
  selectedIndex = null,
  onSelectDay,
  height = 150,
  barWidth = 22,
}: Props) {
  const totals = days.map((d) => d.segments.reduce((s, x) => s + x.minutes, 0));
  const max = Math.max(1, ...totals);

  return (
    <View style={styles.wrap}>
      {/* Faint gridlines behind the bars */}
      {Array.from({ length: GRID_LINES + 1 }).map((_, g) => (
        <View key={g} style={[styles.grid, { top: (g / GRID_LINES) * height }]} />
      ))}

      {/* Bars + labels, one tappable column each */}
      <View style={styles.row}>
        {days.map((d, i) => {
          const total = totals[i];
          const selected = selectedIndex === i;
          const inner = (
            <>
              <View style={[styles.barArea, { height }]}>
                <View
                  style={{
                    width: barWidth,
                    height: `${(total / max) * 100}%`,
                    borderTopLeftRadius: 6,
                    borderTopRightRadius: 6,
                    overflow: 'hidden',
                    justifyContent: 'flex-end',
                  }}
                >
                  {d.segments.map((s) => (
                    <View
                      key={s.key}
                      style={{
                        width: '100%',
                        height: total ? `${(s.minutes / total) * 100}%` : '0%',
                        backgroundColor: segColor(s),
                      }}
                    />
                  ))}
                </View>
              </View>
              <Text style={[styles.label, selected && styles.labelSel]}>{d.label}</Text>
            </>
          );
          return onSelectDay ? (
            <Pressable
              key={i}
              style={[styles.col, selected && styles.colSel]}
              onPress={() => onSelectDay(i)}
            >
              {inner}
            </Pressable>
          ) : (
            <View key={i} style={[styles.col, selected && styles.colSel]}>
              {inner}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  grid: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.divider },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  col: { flex: 1, alignItems: 'center', borderRadius: 12 },
  colSel: { backgroundColor: 'rgba(210,96,63,0.07)' },
  barArea: { justifyContent: 'flex-end' },
  label: { marginTop: 8, marginBottom: 2, fontFamily: fonts.medium, fontSize: 12, color: colors.muted3 },
  labelSel: { color: colors.coral, fontFamily: fonts.semibold },
});
