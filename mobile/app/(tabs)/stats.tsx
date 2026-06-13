import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppChip, Card, Segmented } from '../../src/components';
import { appChipColors, appHues, colors, fonts, radius, spacing } from '../../src/theme';
import { statsByRange, formatDuration, PerApp } from '../../src/data/mock';
import { useFrictionStore } from '../../src/store/useFrictionStore';

const SEG_COLORS = {
  instagram: appChipColors(appHues.instagram).glyph,
  youtube: colors.coral,
  tiktok: appChipColors(appHues.tiktok).glyph,
};
const LEGEND = [
  { label: 'IG', color: SEG_COLORS.instagram },
  { label: 'YT', color: SEG_COLORS.youtube },
  { label: 'TT', color: SEG_COLORS.tiktok },
];

function DeltaPill({ pct }: { pct: number }) {
  const down = pct < 0;
  return (
    <View style={[styles.delta, { backgroundColor: down ? colors.successBg : colors.dangerBg }]}>
      <Text style={[styles.deltaText, { color: down ? colors.successText : colors.dangerText }]}>
        {down ? '↓' : '↑'} {Math.abs(pct)}%
      </Text>
    </View>
  );
}

function PerAppRow({ app }: { app: PerApp }) {
  return (
    <View style={styles.perAppRow}>
      <AppChip hue={app.hue} glyph={app.glyph} size={36} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.perAppName}>{app.name}</Text>
        <Text style={styles.perAppTotal}>{formatDuration(app.totalMinutes)} total</Text>
      </View>
      <DeltaPill pct={app.deltaPct} />
    </View>
  );
}

export default function Stats() {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<'week' | 'month'>('week');
  const [selDay, setSelDay] = useState<number | null>(null);
  const data = statsByRange[range];

  const totals = data.breakdown.map((d) => d.instagram + d.youtube + d.tiktok);
  const max = Math.max(...totals);
  const sel = selDay != null ? data.breakdown[selDay] : null;

  // Live friction counters from today's ladder, layered on the mock history.
  const frByApp = useFrictionStore((s) => s.byApp);
  const live = Object.values(frByApp).reduce(
    (acc, a) => ({
      answered: acc.answered + a.answered,
      maxLevel: Math.max(acc.maxLevel, a.maxLevel),
      stopped: acc.stopped + a.stopped,
    }),
    { answered: 0, maxLevel: 0, stopped: 0 },
  );
  const fAnswered = data.friction.answered + live.answered;
  const fHighest = Math.max(data.friction.highestLevel, live.maxLevel);
  const fStopped = data.friction.stopped + live.stopped;

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: spacing.screenH, paddingBottom: 32 }}
    >
      <Text style={styles.title}>Stats</Text>
      <Segmented
        options={[
          { label: 'Week', value: 'week' as const },
          { label: 'Month', value: 'month' as const },
        ]}
        value={range}
        onChange={(v) => {
          setRange(v);
          setSelDay(null);
        }}
      />

      {/* Improvement summary */}
      <Card dark style={styles.improve}>
        <Text style={styles.improveNum}>↓ {Math.abs(data.improvementPct)}%</Text>
        <Text style={styles.improveLabel}>less screen time</Text>
        <Text style={styles.improveSub}>vs. last {range}</Text>
      </Card>

      {/* Daily breakdown */}
      <Card style={{ marginTop: 12 }}>
        <View style={styles.breakdownHeader}>
          <Text style={styles.cardLabel}>DAILY BREAKDOWN</Text>
          <View style={styles.legend}>
            {LEGEND.map((l) => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendText}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.chartRow}>
          {data.breakdown.map((d, i) => {
            const total = totals[i];
            const dim = selDay != null && selDay !== i;
            return (
              <Pressable
                key={i}
                style={styles.chartCol}
                onPress={() => setSelDay(selDay === i ? null : i)}
              >
                <View style={styles.barArea}>
                  <View style={{ width: 18, opacity: dim ? 0.35 : 1, height: `${(total / max) * 100}%`, justifyContent: 'flex-end' }}>
                    <View style={{ height: `${(d.tiktok / total) * 100}%`, backgroundColor: SEG_COLORS.tiktok }} />
                    <View style={{ height: `${(d.youtube / total) * 100}%`, backgroundColor: SEG_COLORS.youtube }} />
                    <View
                      style={{
                        height: `${(d.instagram / total) * 100}%`,
                        backgroundColor: SEG_COLORS.instagram,
                        borderTopLeftRadius: 5,
                        borderTopRightRadius: 5,
                      }}
                    />
                  </View>
                </View>
                <Text style={[styles.chartLabel, selDay === i && { color: colors.coral }]}>{d.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {sel ? (
          <Text style={styles.dayFooter}>
            Day {sel.label} · {formatDuration(sel.instagram + sel.youtube + sel.tiktok)} · IG{' '}
            {formatDuration(sel.instagram)} · YT {formatDuration(sel.youtube)} · TT{' '}
            {formatDuration(sel.tiktok)}
          </Text>
        ) : null}
      </Card>

      {/* Per-app performance */}
      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>PER-APP PERFORMANCE</Text>
      <Card>
        {data.perApp.map((app, i) => (
          <View key={app.key}>
            <PerAppRow app={app} />
            {i < data.perApp.length - 1 ? <View style={styles.hair} /> : null}
          </View>
        ))}
      </Card>

      {/* Friction stats */}
      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>FRICTION STATS</Text>
      <View style={styles.frictionGrid}>
        <View style={[styles.frictionCard, { backgroundColor: colors.coral }]}>
          <Text style={[styles.frictionNum, { color: colors.cream }]}>{fAnswered}</Text>
          <Text style={[styles.frictionLabel, { color: 'rgba(251,244,234,0.8)' }]}>questions answered</Text>
        </View>
        <View style={[styles.frictionCard, styles.frictionWhite]}>
          <Text style={styles.frictionNum}>{fHighest}</Text>
          <Text style={styles.frictionLabel}>highest level</Text>
        </View>
        <View style={[styles.frictionCard, styles.frictionWhite]}>
          <Text style={styles.frictionNum}>{fStopped}</Text>
          <Text style={styles.frictionLabel}>times stopped</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.displayXBold, fontSize: 27, color: colors.ink, marginBottom: 16 },

  improve: { marginTop: 16, alignItems: 'flex-start' },
  improveNum: { fontFamily: fonts.displayXBold, fontSize: 34, color: colors.successBg },
  improveLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.cream, marginTop: 4 },
  improveSub: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(251,244,234,0.55)', marginTop: 2 },

  cardLabel: { fontFamily: fonts.semibold, fontSize: 12.5, letterSpacing: 0.14 * 12.5, color: colors.muted2 },
  breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  legend: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 9, height: 9, borderRadius: 3, marginRight: 5 },
  legendText: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted2 },

  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  chartCol: { flex: 1, alignItems: 'center' },
  barArea: { height: 110, justifyContent: 'flex-end' },
  chartLabel: { marginTop: 8, fontFamily: fonts.medium, fontSize: 12, color: colors.muted3 },
  dayFooter: {
    marginTop: 16,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.muted,
    backgroundColor: colors.cream,
    borderRadius: 10,
    padding: 10,
  },

  sectionLabel: { fontFamily: fonts.semibold, fontSize: 12.5, letterSpacing: 0.14 * 12.5, color: colors.muted2, marginBottom: 10 },
  perAppRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  perAppName: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.ink },
  perAppTotal: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted2, marginTop: 2 },
  hair: { height: 1, backgroundColor: colors.divider, marginVertical: 6 },
  delta: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  deltaText: { fontFamily: fonts.semibold, fontSize: 13 },

  frictionGrid: { flexDirection: 'row', gap: 10 },
  frictionCard: { flex: 1, borderRadius: radius.cardSm, padding: 14, minHeight: 96, justifyContent: 'space-between' },
  frictionWhite: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder },
  frictionNum: { fontFamily: fonts.displayXBold, fontSize: 28, color: colors.ink },
  frictionLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted2, marginTop: 8 },
});
