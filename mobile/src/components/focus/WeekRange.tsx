import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../../theme';
import { formatDuration } from '../../data/mock';
import { day as dayPalette } from './palette';

const W = 280;
const H = 72;
const STEP = W / 7;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const weekdayOf = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};
const minutes = (ms: number) => Math.round(ms / 60000);

type Props = { days: { day: string; ms: number }[] };

/** The week as a mountain range: each day's peak is as tall as that day's focus time. */
export function WeekRange({ days }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const max = Math.max(...days.map((d) => d.ms), 1);
  const total = days.reduce((a, d) => a + d.ms, 0);
  const sel = picked != null ? days[picked] : null;

  return (
    <View>
      <View style={styles.head}>
        <View>
          <Text style={styles.label}>{sel ? DAY_NAMES[weekdayOf(sel.day)].toUpperCase() : 'THIS WEEK'}</Text>
          <Text style={styles.total}>{formatDuration(minutes(sel ? sel.ms : total))}</Text>
        </View>
        <Text style={styles.hint}>{sel ? 'Tap again to see the week' : 'Tap a peak for that day'}</Text>
      </View>

      <View style={{ aspectRatio: W / H, marginTop: 10 }}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
          {days.map((d, i) => {
            const cx = STEP * i + STEP / 2;
            const h = d.ms > 0 ? 10 + (d.ms / max) * (H - 14) : 5;
            const isToday = i === days.length - 1;
            const fill = picked === i ? colors.coralText : isToday ? colors.coral : dayPalette.week;
            return <Path key={d.day} d={`M${cx - STEP * 0.75} ${H} L${cx} ${H - h} L${cx + STEP * 0.75} ${H} Z`} fill={fill} opacity={picked != null && picked !== i ? 0.55 : 1} />;
          })}
        </Svg>
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            {days.map((d, i) => (
              <Pressable
                key={d.day}
                style={{ flex: 1 }}
                accessibilityLabel={`${DAY_NAMES[weekdayOf(d.day)]}: ${formatDuration(minutes(d.ms))} focused`}
                onPress={() => setPicked((p) => (p === i ? null : i))}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.days}>
        {days.map((d, i) => (
          <Text key={d.day} style={[styles.dayText, i === days.length - 1 && styles.today]}>
            {i === days.length - 1 ? 'Today' : DAY_NAMES[weekdayOf(d.day)][0]}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  label: { fontFamily: fonts.semibold, fontSize: 11.5, letterSpacing: 1.4, color: colors.muted3 },
  total: { fontFamily: fonts.displayXBold, fontSize: 24, color: colors.ink, marginTop: 2 },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted3, marginBottom: 4 },
  days: { flexDirection: 'row', marginTop: 6 },
  dayText: { flex: 1, textAlign: 'center', fontFamily: fonts.medium, fontSize: 11.5, color: colors.muted3 },
  today: { color: colors.coralText, fontFamily: fonts.semibold },
});
