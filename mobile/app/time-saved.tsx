import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppStatRow, Card, ScreenHeader, UsageBars } from '../src/components';
import { colors, fonts, spacing } from '../src/theme';
import { formatDuration } from '../src/data/mock';
import { useUsage } from '../src/usage/useUsage';

/** Minutes you stayed under one app's limit on a single day (never negative). */
const savedOn = (limit: number, used: number) => Math.max(0, limit - used);

export default function TimeSavedDetail() {
  const insets = useSafeAreaInsets();
  const usage = useUsage();

  const hasData = usage.apps.length > 0;
  const todayIdx = usage.weekLabels.length - 1;

  // Time saved per day = how far under their limits you stayed across all apps.
  const days = usage.weekLabels.map((label, i) => ({
    label,
    segments: [
      {
        key: `d${i}`,
        hue: 0,
        minutes: usage.apps.reduce((s, a) => s + savedOn(a.limit, a.daily[i] ?? 0), 0),
        color: i === todayIdx ? colors.amber : 'rgba(230,161,92,0.45)',
      },
    ],
  }));

  // Per-app contribution to the weekly total, biggest saver first.
  const perApp = usage.apps
    .map((a) => ({
      ...a,
      saved: a.daily.reduce((s, d) => s + savedOn(a.limit, d), 0),
    }))
    .sort((x, y) => y.saved - x.saved);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={pad(insets.top)}>
        <ScreenHeader title="Time saved" />

        {/* Headline readout */}
        <Card dark style={styles.hero}>
          <Text style={styles.heroNum}>{formatDuration(usage.timeSavedWeek)}</Text>
          <Text style={styles.heroSub}>under your daily limits, across the last 7 days</Text>
        </Card>

        {/* Per-day chart */}
        <Card style={{ marginTop: 12 }}>
          <Text style={styles.cardLabel}>SAVED EACH DAY</Text>
          {hasData ? (
            <>
              <UsageBars days={days} selectedIndex={todayIdx} />
              <Text style={styles.caption}>
                Each bar is how far under your limits you stayed that day. Today is in full colour;
                it’s still filling in, so its number settles as the day goes on.
              </Text>
            </>
          ) : (
            <Text style={styles.empty}>No monitored apps yet.</Text>
          )}
        </Card>

        {/* Per-app breakdown */}
        {hasData ? (
          <Card style={{ marginTop: 12 }}>
            <Text style={styles.cardLabel}>BY APP</Text>
            {perApp.map((a, i) => (
              <View key={a.key}>
                <AppStatRow
                  hue={a.hue}
                  glyph={a.glyph}
                  name={a.name}
                  sub={`${formatDuration(a.weekTotal)} used · ${formatDuration(a.limit)}/day limit`}
                  right={<Text style={styles.savedVal}>{formatDuration(a.saved)}</Text>}
                />
                {i < perApp.length - 1 ? <View style={styles.hair} /> : null}
              </View>
            ))}
          </Card>
        ) : null}

        {/* Plain-language explainer */}
        <Card style={{ marginTop: 12 }}>
          <Text style={styles.cardLabel}>HOW IT WORKS</Text>
          <Text style={styles.body}>
            For each monitored app, on each of the last seven days, we take how far you stayed{' '}
            <Text style={styles.bold}>under</Text> that app’s daily limit —{' '}
            <Text style={styles.bold}>limit − time used</Text> — and never count below zero. Adding
            that up across every app and day gives your weekly total.
          </Text>
          <Text style={[styles.body, { marginTop: 12 }]}>
            A day you don’t open an app at all counts its whole limit as saved, and going over a
            limit simply adds nothing for that day (never a negative). So this measures headroom
            under your limits — not time compared to how much you used to scroll.
          </Text>
          <Text style={styles.formula}>
            Σ apps · Σ 7 days  max(0, limit − used) = {formatDuration(usage.timeSavedWeek)} saved
          </Text>
        </Card>
      </ScrollView>
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
  heroNum: { fontFamily: fonts.displayXBold, fontSize: 36, color: colors.amber },
  heroSub: { fontFamily: fonts.regular, fontSize: 14, color: 'rgba(251,244,234,0.7)', marginTop: 6 },

  cardLabel: { fontFamily: fonts.semibold, fontSize: 12.5, letterSpacing: 0.14 * 12.5, color: colors.muted2, marginBottom: 16 },

  savedVal: { fontFamily: fonts.displayXBold, fontSize: 16, color: colors.coralText, marginLeft: 12 },
  hair: { height: 1, backgroundColor: colors.divider, marginVertical: 4 },

  caption: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: colors.muted2, marginTop: 14 },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted2, textAlign: 'center', paddingVertical: 18 },
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
