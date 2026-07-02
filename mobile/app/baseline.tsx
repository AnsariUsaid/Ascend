import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, ScreenHeader, StatusBarCap, UsageBars } from '../src/components';
import { colors, fonts, spacing } from '../src/theme';
import { formatDuration } from '../src/data/mock';
import { useUsage, USAGE_DAYS } from '../src/usage/useUsage';

export default function BaselineDetail() {
  const insets = useSafeAreaInsets();
  const usage = useUsage();

  const { typicalDay, todayMinutes, improvement } = usage;
  const diff = typicalDay - todayMinutes; // positive = below your typical day (good)
  const hasData = typicalDay > 0;

  // Headline adapts to direction — and stays gentle when you're over (the day isn't done).
  const headline = !hasData
    ? 'Building your baseline'
    : improvement > 0
    ? `↓ ${improvement}%`
    : improvement < 0
    ? `↑ ${Math.abs(improvement)}%`
    : 'On pace';
  const headlineSub = !hasData
    ? 'A few days of history are needed before we can compare.'
    : improvement > 0
    ? 'less than your typical day, so far today'
    : improvement < 0
    ? 'a bit more than your typical day — the day isn’t over yet'
    : 'right around your typical day so far';
  const headlineColor = improvement > 0 ? colors.successBg : colors.cream;

  // 7-day chart: the 6 days that average into your baseline (muted) + today (coral).
  const todayIdx = USAGE_DAYS - 1;
  const days = usage.weekLabels.map((label, i) => ({
    label,
    segments: [
      {
        key: `d${i}`,
        hue: 0,
        minutes: usage.weekDailyTotals[i] ?? 0,
        color: i === todayIdx ? colors.coral : 'rgba(210,96,63,0.28)',
      },
    ],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={pad(insets.top)}>
        <ScreenHeader title="Your baseline" />

        {/* Headline readout */}
        <Card dark style={styles.hero}>
          <Text style={[styles.heroNum, { color: headlineColor }]}>{headline}</Text>
          <Text style={styles.heroSub}>{headlineSub}</Text>
        </Card>

        {/* The live numbers behind it */}
        <Card style={{ marginTop: 12 }}>
          <Text style={styles.cardLabel}>THE NUMBERS</Text>
          <Row
            label="Your typical day"
            sub="average of the last 6 days"
            value={hasData ? formatDuration(typicalDay) : '—'}
          />
          <View style={styles.hair} />
          <Row label="Today so far" value={formatDuration(todayMinutes)} />
          {hasData ? (
            <>
              <View style={styles.hair} />
              <Row
                label={diff >= 0 ? 'Below typical by' : 'Above typical by'}
                value={formatDuration(Math.abs(diff))}
                accent={diff >= 0 ? colors.successText : colors.coral}
              />
            </>
          ) : null}
        </Card>

        {/* Visual: what makes the average vs. what we compare */}
        <Card style={{ marginTop: 12 }}>
          <Text style={styles.cardLabel}>LAST 7 DAYS</Text>
          <UsageBars days={days} selectedIndex={todayIdx} showScale />
          <Text style={styles.caption}>
            The six faded bars average into your baseline. Today (coral) is what we measure against it.
          </Text>
        </Card>

        {/* Plain-language explainer */}
        <Card style={{ marginTop: 12 }}>
          <Text style={styles.cardLabel}>HOW IT WORKS</Text>
          <Text style={styles.body}>
            Your <Text style={styles.bold}>baseline</Text> is the average daily screen time across the
            previous six days on your monitored apps. Each day that window slides forward, so it always
            reflects your recent habits — there’s nothing to reset.
          </Text>
          <Text style={[styles.body, { marginTop: 12 }]}>
            We compare <Text style={styles.bold}>today</Text> against that baseline to show how you’re
            trending. Because today is still in progress, the number naturally starts high in the morning
            and settles as the day fills in.
          </Text>
          <Text style={styles.formula}>
            ({formatDuration(typicalDay)} typical − {formatDuration(todayMinutes)} today) ÷{' '}
            {formatDuration(typicalDay)} = {improvement > 0 ? `${improvement}% less` : hasData ? 'on pace' : '—'}
          </Text>
        </Card>
      </ScrollView>
      <StatusBarCap />
    </View>
  );
}

function Row({
  label,
  sub,
  value,
  accent,
}: {
  label: string;
  sub?: string;
  value: string;
  accent?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <Text style={[styles.rowValue, accent ? { color: accent } : null]}>{value}</Text>
    </View>
  );
}

const pad = (top: number) => ({
  paddingTop: top + 12,
  paddingHorizontal: spacing.screenH,
  paddingBottom: 32,
});

const styles = StyleSheet.create({
  hero: { alignItems: 'flex-start' },
  heroNum: { fontFamily: fonts.displayXBold, fontSize: 36 },
  heroSub: { fontFamily: fonts.regular, fontSize: 14, color: 'rgba(251,244,234,0.7)', marginTop: 6 },

  cardLabel: { fontFamily: fonts.semibold, fontSize: 12.5, letterSpacing: 0.14 * 12.5, color: colors.muted2, marginBottom: 16 },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  rowSub: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.muted2, marginTop: 2 },
  rowValue: { fontFamily: fonts.displayXBold, fontSize: 19, color: colors.ink, marginLeft: 12 },
  hair: { height: 1, backgroundColor: colors.divider, marginVertical: 4 },

  caption: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: colors.muted2, marginTop: 14 },
  body: { fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 22, color: colors.muted },
  bold: { fontFamily: fonts.semibold, color: colors.ink },
  formula: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.muted2,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});
