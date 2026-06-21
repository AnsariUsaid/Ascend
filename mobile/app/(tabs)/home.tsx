import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AppChip, Card, ChevronMark, ProgressBar } from '../../src/components';
import { colors, fonts, radius, spacing } from '../../src/theme';
import { formatDuration } from '../../src/data/mock';
import { useFrictionStore } from '../../src/store/useFrictionStore';
import { useAppStore } from '../../src/store/useAppStore';
import { useUsage, AppUsage } from '../../src/usage/useUsage';
import { usePermissionStatus } from '../../src/hooks/usePermissionStatus';
import AscendNative from '../../modules/ascend-native';

/** Live friction status for an app: grace countdown or blocked-for-today. */
function FrictionStatus({ appKey }: { appKey: string }) {
  const fr = useFrictionStore((s) => s.byApp[appKey]);
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!fr) return null;
  if (fr.blockedForToday) {
    return (
      <View style={[styles.frPill, { backgroundColor: colors.dangerBg }]}>
        <Feather name="moon" size={12} color={colors.dangerText} />
        <Text style={[styles.frPillText, { color: colors.dangerText }]}>Blocked today</Text>
      </View>
    );
  }
  if (fr.graceExpiresAt && fr.graceExpiresAt > Date.now()) {
    const secs = Math.floor((fr.graceExpiresAt - Date.now()) / 1000);
    const mm = Math.floor(secs / 60);
    const ss = (secs % 60).toString().padStart(2, '0');
    return (
      <View style={[styles.frPill, { backgroundColor: colors.successBg }]}>
        <Feather name="clock" size={12} color={colors.successText} />
        <Text style={[styles.frPillText, { color: colors.successText }]}>
          Grace {mm}:{ss}
        </Text>
      </View>
    );
  }
  return null;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 18) return 'Good afternoon,';
  return 'Good evening,';
}

function Avatar({ initials, size = 46 }: { initials: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

function UsageRow({ app }: { app: AppUsage }) {
  const over = app.today > app.limit;
  const diff = Math.abs(app.today - app.limit);
  return (
    <Card style={styles.usageCard} borderColor={over ? 'rgba(190,64,44,0.45)' : undefined}>
      <View style={styles.usageHeader}>
        <AppChip hue={app.hue} glyph={app.glyph} size={36} />
        <Text style={styles.appName}>{app.name}</Text>
        <Text style={[styles.status, { color: over ? colors.dangerText : colors.successText }]}>
          {over ? `Over by ${formatDuration(diff)}` : `${formatDuration(diff)} left`}
        </Text>
      </View>
      <View style={{ marginTop: 12 }}>
        <ProgressBar progress={app.limit ? app.today / app.limit : 0} over={over} />
        <View style={styles.captionRow}>
          <Text style={styles.usageCaption}>
            {formatDuration(app.today)} / {formatDuration(app.limit)}
          </Text>
          <FrictionStatus appKey={app.key} />
        </View>
      </View>
    </Card>
  );
}

function WeekChart({ totals, labels }: { totals: number[]; labels: string[] }) {
  const max = Math.max(1, ...totals);
  const todayIdx = totals.length - 1;
  return (
    <Card style={{ marginTop: 12 }}>
      <Text style={styles.cardLabel}>THIS WEEK</Text>
      <View style={styles.chartRow}>
        {totals.map((v, i) => {
          const isToday = i === todayIdx;
          return (
            <View key={i} style={styles.chartCol}>
              <View style={styles.chartBarTrack}>
                <View
                  style={{
                    width: 14,
                    height: `${(v / max) * 100}%`,
                    borderRadius: 7,
                    backgroundColor: isToday ? colors.coral : colors.track,
                  }}
                />
              </View>
              <Text style={[styles.chartLabel, isToday && { color: colors.coral }]}>{labels[i]}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const ensureToday = useFrictionStore((s) => s.ensureToday);
  const displayName = useAppStore((s) => s.displayName);

  const usage = useUsage();
  const { granted: batteryExempt } = usePermissionStatus(AscendNative.isIgnoringBatteryOptimizations);

  // Apply the midnight reset + refresh usage whenever the dashboard opens.
  useEffect(() => {
    ensureToday();
    usage.refresh();
  }, []);

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingHorizontal: spacing.screenH,
        paddingBottom: 32,
      }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.refresh}>Updated just now</Text>
        </View>
        <Avatar initials={displayName.slice(0, 2).toUpperCase()} />
      </View>

      {/* Usage-access prompt when the permission isn't granted */}
      {!usage.hasAccess && (
        <Pressable style={styles.accessBanner} onPress={() => AscendNative.openUsageAccessSettings()}>
          <Feather name="alert-triangle" size={16} color="#9a6a1f" />
          <Text style={styles.accessText}>
            Grant Usage Access to see your real screen time. Tap to open Settings.
          </Text>
        </Pressable>
      )}

      {/* Battery nudge: the watcher can be killed unless Ascend is set "Unrestricted". */}
      {usage.hasAccess && usage.apps.length > 0 && !batteryExempt && (
        <Pressable style={styles.accessBanner} onPress={() => AscendNative.openBatteryOptimizationSettings()}>
          <Feather name="battery-charging" size={16} color="#9a6a1f" />
          <Text style={styles.accessText}>
            Let Ascend run in the background so it reliably catches your limits — set its
            battery to “Unrestricted”. Tap to enable.
          </Text>
        </Pressable>
      )}

      {/* Streak banner */}
      <View style={styles.streak}>
        <ChevronMark size={30} strokeWidth={9} />
        <View style={{ marginLeft: 14 }}>
          <Text style={styles.streakTitle}>{usage.streak}-day streak</Text>
          <Text style={styles.streakCaption}>Days this week under all your limits</Text>
        </View>
      </View>

      {/* Today's usage */}
      <Text style={[styles.sectionLabel, { marginTop: 22 }]}>TODAY'S USAGE</Text>
      {usage.apps.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No monitored apps yet. Add some in Settings.</Text>
        </Card>
      ) : (
        usage.apps.map((app) => <UsageRow key={app.key} app={app} />)
      )}

      {/* This week */}
      <WeekChart totals={usage.weekDailyTotals} labels={usage.weekLabels} />

      {/* Time saved */}
      <Card dark style={styles.timeSaved}>
        <View style={{ flex: 1 }}>
          <Text style={styles.timeSavedLabel}>TIME SAVED</Text>
          <Text style={styles.timeSavedSub}>vs. your limits, this week</Text>
        </View>
        <Text style={styles.timeSavedNum}>{formatDuration(usage.timeSavedWeek)}</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  greeting: { fontFamily: fonts.regular, fontSize: 14.5, color: colors.muted },
  name: { fontFamily: fonts.displayXBold, fontSize: 27, color: colors.ink, marginTop: 2 },
  refresh: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.muted3, marginTop: 4 },
  avatar: { backgroundColor: colors.coffee, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.cream },

  accessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f7ecd6',
    borderRadius: radius.cardSm,
    padding: 14,
    marginBottom: 16,
  },
  accessText: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: '#7a5417', lineHeight: 18 },

  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.coral,
    borderRadius: radius.card,
    padding: 18,
  },
  streakTitle: { fontFamily: fonts.displayXBold, fontSize: 18, color: colors.cream },
  streakCaption: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(251,244,234,0.85)', marginTop: 2 },

  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    letterSpacing: 0.14 * 12.5,
    color: colors.muted2,
    marginBottom: 10,
  },
  emptyText: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted2, textAlign: 'center', paddingVertical: 8 },

  usageCard: { marginBottom: 12 },
  usageHeader: { flexDirection: 'row', alignItems: 'center' },
  appName: { flex: 1, marginLeft: 12, fontFamily: fonts.medium, fontSize: 15.5, color: colors.ink },
  status: { fontFamily: fonts.semibold, fontSize: 13 },
  captionRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  usageCaption: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.muted2 },
  frPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  frPillText: { fontFamily: fonts.semibold, fontSize: 11.5 },

  cardLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    letterSpacing: 0.14 * 12.5,
    color: colors.muted2,
    marginBottom: 14,
  },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  chartCol: { alignItems: 'center', flex: 1 },
  chartBarTrack: { height: 90, justifyContent: 'flex-end' },
  chartLabel: { marginTop: 8, fontFamily: fonts.medium, fontSize: 12, color: colors.muted3 },

  timeSaved: { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  timeSavedLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    letterSpacing: 0.14 * 12.5,
    color: 'rgba(251,244,234,0.7)',
  },
  timeSavedSub: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(251,244,234,0.55)', marginTop: 4 },
  timeSavedNum: { fontFamily: fonts.displayXBold, fontSize: 30, color: colors.amber },
});
