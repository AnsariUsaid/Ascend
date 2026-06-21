import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppChip, Card } from '../../src/components';
import { appChipColors, colors, fonts, radius, spacing } from '../../src/theme';
import { formatDuration } from '../../src/data/mock';
import { useFrictionStore } from '../../src/store/useFrictionStore';
import { useAppStore } from '../../src/store/useAppStore';
import { useUsage } from '../../src/usage/useUsage';

type Segment = { key: string; hue: number; minutes: number };
type DayBar = { label: string; segments: Segment[] };
type PerApp = { key: string; name: string; glyph: string; hue: number; total: number };
type StatsView = {
  improvement: number; // % reduction (positive number)
  days: DayBar[];
  perApp: PerApp[];
  friction: { answered: number; highest: number; stopped: number };
};

const segColor = (hue: number) => appChipColors(hue).glyph;

export default function Stats() {
  const insets = useSafeAreaInsets();
  const [selDay, setSelDay] = useState<number | null>(null);

  const usage = useUsage();
  const baseline = useAppStore((s) => s.baselineMinutes);
  const frByApp = useFrictionStore((s) => s.byApp);
  const live = Object.values(frByApp).reduce(
    (a, x) => ({
      answered: a.answered + x.answered,
      highest: Math.max(a.highest, x.maxLevel),
      stopped: a.stopped + x.stopped,
    }),
    { answered: 0, highest: 0, stopped: 0 },
  );

  // This week, from real usage. (The Month view was removed — Android keeps only
  // ~7 days of per-app daily history, so a real month can't be built from it.)
  const avg = usage.weekDailyTotals.reduce((s, n) => s + n, 0) / Math.max(1, usage.weekDailyTotals.length);
  const view: StatsView = {
    improvement: baseline > 0 ? Math.max(0, Math.round(((baseline - avg) / baseline) * 100)) : 0,
    days: usage.weekLabels.map((label, i) => ({
      label,
      segments: usage.apps.map((a) => ({ key: a.key, hue: a.hue, minutes: a.daily[i] ?? 0 })),
    })),
    perApp: usage.apps.map((a) => ({ key: a.key, name: a.name, glyph: a.glyph, hue: a.hue, total: a.weekTotal })),
    friction: live,
  };

  const totals = view.days.map((d) => d.segments.reduce((s, x) => s + x.minutes, 0));
  const max = Math.max(1, ...totals);
  const sel = selDay != null ? view.days[selDay] : null;

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: spacing.screenH, paddingBottom: 32 }}
    >
      <Text style={styles.title}>Stats</Text>

      {/* Improvement summary */}
      <Card dark style={styles.improve}>
        <Text style={styles.improveNum}>↓ {view.improvement}%</Text>
        <Text style={styles.improveLabel}>less screen time</Text>
        <Text style={styles.improveSub}>vs. your baseline</Text>
      </Card>

      {/* Daily breakdown */}
      <Card style={{ marginTop: 12 }}>
        <View style={styles.breakdownHeader}>
          <Text style={styles.cardLabel}>DAILY BREAKDOWN</Text>
          <View style={styles.legend}>
            {view.perApp.map((a) => (
              <View key={a.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: segColor(a.hue) }]} />
                <Text style={styles.legendText}>{a.name.slice(0, 2)}</Text>
              </View>
            ))}
          </View>
        </View>

        {totals.every((t) => t === 0) ? (
          <Text style={styles.emptyText}>No usage data yet.</Text>
        ) : (
          <View style={styles.chartRow}>
            {view.days.map((d, i) => {
              const total = totals[i];
              const dim = selDay != null && selDay !== i;
              return (
                <Pressable key={i} style={styles.chartCol} onPress={() => setSelDay(selDay === i ? null : i)}>
                  <View style={styles.barArea}>
                    <View style={{ width: 18, opacity: dim ? 0.35 : 1, height: `${(total / max) * 100}%`, justifyContent: 'flex-end' }}>
                      {d.segments.map((s, si) => (
                        <View
                          key={s.key}
                          style={{
                            height: total ? `${(s.minutes / total) * 100}%` : '0%',
                            backgroundColor: segColor(s.hue),
                            borderTopLeftRadius: si === d.segments.length - 1 ? 5 : 0,
                            borderTopRightRadius: si === d.segments.length - 1 ? 5 : 0,
                          }}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.chartLabel, selDay === i && { color: colors.coral }]}>{d.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {sel ? (
          <Text style={styles.dayFooter}>
            {sel.label} · {formatDuration(sel.segments.reduce((s, x) => s + x.minutes, 0))}
            {sel.segments.map((s) => ` · ${s.key.slice(0, 2).toUpperCase()} ${formatDuration(s.minutes)}`).join('')}
          </Text>
        ) : null}
      </Card>

      {/* Per-app performance */}
      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>PER-APP PERFORMANCE</Text>
      <Card>
        {view.perApp.length === 0 ? (
          <Text style={styles.emptyText}>No monitored apps.</Text>
        ) : (
          view.perApp.map((app, i) => (
            <View key={app.key}>
              <View style={styles.perAppRow}>
                <AppChip hue={app.hue} glyph={app.glyph} size={36} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.perAppName}>{app.name}</Text>
                  <Text style={styles.perAppTotal}>{formatDuration(app.total)} total</Text>
                </View>
              </View>
              {i < view.perApp.length - 1 ? <View style={styles.hair} /> : null}
            </View>
          ))
        )}
      </Card>

      {/* Friction stats */}
      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>FRICTION STATS</Text>
      <View style={styles.frictionGrid}>
        <View style={[styles.frictionCard, { backgroundColor: colors.coral }]}>
          <Text style={[styles.frictionNum, { color: colors.cream }]}>{view.friction.answered}</Text>
          <Text style={[styles.frictionLabel, { color: 'rgba(251,244,234,0.8)' }]}>questions answered</Text>
        </View>
        <View style={[styles.frictionCard, styles.frictionWhite]}>
          <Text style={styles.frictionNum}>{view.friction.highest}</Text>
          <Text style={styles.frictionLabel}>highest level</Text>
        </View>
        <View style={[styles.frictionCard, styles.frictionWhite]}>
          <Text style={styles.frictionNum}>{view.friction.stopped}</Text>
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
  legend: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', flexShrink: 1, justifyContent: 'flex-end' },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 9, height: 9, borderRadius: 3, marginRight: 5 },
  legendText: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted2 },

  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  chartCol: { flex: 1, alignItems: 'center' },
  barArea: { height: 110, justifyContent: 'flex-end' },
  chartLabel: { marginTop: 8, fontFamily: fonts.medium, fontSize: 12, color: colors.muted3 },
  dayFooter: { marginTop: 16, fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted, backgroundColor: colors.cream, borderRadius: 10, padding: 10 },
  emptyText: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted2, textAlign: 'center', paddingVertical: 18 },

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
