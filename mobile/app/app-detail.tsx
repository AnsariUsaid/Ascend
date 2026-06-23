import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, ProgressBar, ScreenHeader, UsageBars } from '../src/components';
import { colors, fonts, radius, spacing } from '../src/theme';
import { formatDuration } from '../src/data/mock';
import { useUsage } from '../src/usage/useUsage';
import { useFrictionStore } from '../src/store/useFrictionStore';
import { getApp } from '../src/data/installedApps';

export default function AppDetail() {
  const insets = useSafeAreaInsets();
  const { app: pkg } = useLocalSearchParams<{ app?: string }>();

  const usage = useUsage();
  const data = usage.apps.find((a) => a.key === pkg);
  const meta = getApp(pkg ?? '');
  const fr = useFrictionStore((s) => s.byApp[pkg ?? '']);
  const friction = fr ?? { answered: 0, skipped: 0, stopped: 0, maxLevel: 0 };

  const name = data?.name ?? meta.name;

  // App not currently monitored (or no data yet).
  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream }}>
        <ScrollView contentContainerStyle={pad(insets.top)}>
          <ScreenHeader title={name} />
          <Card>
            <Text style={styles.empty}>No usage data for this app yet.</Text>
          </Card>
        </ScrollView>
      </View>
    );
  }

  const over = data.today > data.limit;
  const days = usage.weekLabels.map((label, i) => {
    const mins = data.daily[i] ?? 0;
    return {
      label,
      segments: [
        {
          key: `d${i}`,
          hue: data.hue,
          minutes: mins,
          color: mins > data.limit ? colors.dangerText : colors.coral,
        },
      ],
    };
  });
  const todayIdx = days.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={pad(insets.top)}>
        <ScreenHeader title={name} />

        {/* Today vs limit */}
        <Card>
          <View style={styles.todayRow}>
            <Text style={styles.todayNum}>{formatDuration(data.today)}</Text>
            <Text style={[styles.todayStatus, { color: over ? colors.dangerText : colors.successText }]}>
              {over ? `over by ${formatDuration(data.today - data.limit)}` : `${formatDuration(data.limit - data.today)} left`}
            </Text>
          </View>
          <ProgressBar progress={data.limit ? data.today / data.limit : 0} over={over} />
          <Text style={styles.caption}>
            {formatDuration(data.today)} of your {formatDuration(data.limit)} daily limit
          </Text>
        </Card>

        {/* Last 7 days */}
        <Card style={{ marginTop: 12 }}>
          <Text style={styles.cardLabel}>LAST 7 DAYS</Text>
          <UsageBars days={days} selectedIndex={todayIdx} />
          <Text style={styles.caption}>{formatDuration(data.weekTotal)} this week · red = over limit</Text>
        </Card>

        {/* Friction for this app */}
        <Text style={styles.sectionLabel}>FRICTION ON {name.toUpperCase()}</Text>
        <View style={styles.grid}>
          <Stat value={friction.answered} label="answered" highlight />
          <Stat value={friction.maxLevel} label="highest level" />
          <Stat value={friction.skipped} label="skipped" />
          <Stat value={friction.stopped} label="times stopped" />
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  return (
    <View style={[styles.statCard, highlight ? { backgroundColor: colors.coral } : styles.statWhite]}>
      <Text style={[styles.statNum, highlight && { color: colors.cream }]}>{value}</Text>
      <Text style={[styles.statLabel, highlight && { color: 'rgba(251,244,234,0.8)' }]}>{label}</Text>
    </View>
  );
}

const pad = (top: number) => ({
  paddingTop: top + 12,
  paddingHorizontal: spacing.screenH,
  paddingBottom: 32,
});

const styles = StyleSheet.create({
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted2, textAlign: 'center', paddingVertical: 12 },

  todayRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  todayNum: { fontFamily: fonts.displayXBold, fontSize: 30, color: colors.ink },
  todayStatus: { fontFamily: fonts.semibold, fontSize: 14 },
  caption: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.muted2, marginTop: 12 },

  cardLabel: { fontFamily: fonts.semibold, fontSize: 12.5, letterSpacing: 0.14 * 12.5, color: colors.muted2, marginBottom: 16 },
  sectionLabel: { fontFamily: fonts.semibold, fontSize: 12.5, letterSpacing: 0.14 * 12.5, color: colors.muted2, marginTop: 24, marginBottom: 10 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flexBasis: '47%', flexGrow: 1, borderRadius: radius.cardSm, padding: 14, minHeight: 88, justifyContent: 'space-between' },
  statWhite: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder },
  statNum: { fontFamily: fonts.displayXBold, fontSize: 26, color: colors.ink },
  statLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted2, marginTop: 8 },
});
