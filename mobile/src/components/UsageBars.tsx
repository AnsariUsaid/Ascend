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
  /** Show a left-side value scale aligned to the gridlines. */
  showScale?: boolean;
  /** Format a y-axis scale value (in minutes). Defaults to a compact h/m. */
  formatValue?: (minutes: number) => string;
};

const GRID_LINES = 4;
const SCALE_W = 42;
const segColor = (seg: BarSegment) => seg.color ?? appChipColors(seg.hue).glyph;
const defaultFmt = (m: number) => (m >= 60 ? `${+(m / 60).toFixed(1)}h` : `${Math.round(m)}m`);

/** Round a max value up to a tidy step so the y-axis ticks land on round numbers. */
function niceMax(v: number): number {
  if (v <= 60) return Math.ceil(v / 15) * 15; // 15-min steps under an hour
  if (v <= 240) return Math.ceil(v / 60) * 60; // whole hours up to 4h
  return Math.ceil(v / 120) * 120; // 2-hour steps beyond
}

/** Reusable 7-day stacked bar chart: rounded-top bars on faint gridlines. */
export function UsageBars({
  days,
  selectedIndex = null,
  onSelectDay,
  height = 150,
  barWidth = 22,
  showScale = false,
  formatValue,
}: Props) {
  const totals = days.map((d) => d.segments.reduce((s, x) => s + x.minutes, 0));
  // Round the top of the scale up to a "nice" value so the axis reads cleanly.
  const max = niceMax(Math.max(1, ...totals));
  const fmt = formatValue ?? defaultFmt;
  const gutter = showScale ? SCALE_W : 0;

  return (
    <View style={styles.wrap}>
      {/* Faint gridlines behind the bars */}
      {Array.from({ length: GRID_LINES + 1 }).map((_, g) => (
        <View key={g} style={[styles.grid, { top: (g / GRID_LINES) * height, left: gutter }]} />
      ))}

      {/* Left value scale, aligned to each gridline */}
      {showScale &&
        Array.from({ length: GRID_LINES + 1 }).map((_, g) => (
          <Text
            key={`s${g}`}
            style={[styles.scale, { top: (g / GRID_LINES) * height - 7, width: SCALE_W - 8 }]}
          >
            {fmt(max * (1 - g / GRID_LINES))}
          </Text>
        ))}

      {/* Bars + labels, one tappable column each */}
      <View style={[styles.row, { marginLeft: gutter }]}>
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
  grid: { position: 'absolute', right: 0, height: 1, backgroundColor: colors.divider },
  scale: {
    position: 'absolute',
    left: 0,
    textAlign: 'right',
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.muted3,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  col: { flex: 1, alignItems: 'center', borderRadius: 12 },
  colSel: { backgroundColor: 'rgba(210,96,63,0.07)' },
  barArea: { justifyContent: 'flex-end' },
  label: { marginTop: 8, marginBottom: 2, fontFamily: fonts.medium, fontSize: 12, color: colors.muted3 },
  labelSel: { color: colors.coral, fontFamily: fonts.semibold },
});
