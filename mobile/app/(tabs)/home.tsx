import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AppChip, Card, ChevronMark, ProgressBar } from '../../src/components';
import { colors, fonts, radius, spacing } from '../../src/theme';
import {
  user,
  todayApps,
  weekUsage,
  weekLabels,
  timeSavedThisWeekMinutes,
  formatDuration,
  MonitoredApp,
} from '../../src/data/mock';
import { useFrictionStore } from '../../src/store/useFrictionStore';

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
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

function UsageRow({ app }: { app: MonitoredApp }) {
  const over = app.usedMinutes > app.limitMinutes;
  const diff = Math.abs(app.usedMinutes - app.limitMinutes);
  return (
    <Card
      style={styles.usageCard}
      borderColor={over ? 'rgba(190,64,44,0.45)' : undefined}
    >
      <View style={styles.usageHeader}>
        <AppChip hue={app.hue} glyph={app.glyph} size={36} />
        <Text style={styles.appName}>{app.name}</Text>
        <Text style={[styles.status, { color: over ? colors.dangerText : colors.successText }]}>
          {over ? `Over by ${formatDuration(diff)}` : `${formatDuration(diff)} left`}
        </Text>
      </View>
      <View style={{ marginTop: 12 }}>
        <ProgressBar progress={app.usedMinutes / app.limitMinutes} over={over} />
        <View style={styles.captionRow}>
          <Text style={styles.usageCaption}>
            {formatDuration(app.usedMinutes)} / {formatDuration(app.limitMinutes)}
          </Text>
          <FrictionStatus appKey={app.key} />
        </View>
      </View>
    </Card>
  );
}

function WeekChart() {
  const max = Math.max(...weekUsage);
  const todayIdx = weekUsage.length - 1;
  return (
    <Card style={{ marginTop: 12 }}>
      <Text style={styles.cardLabel}>THIS WEEK</Text>
      <View style={styles.chartRow}>
        {weekUsage.map((v, i) => {
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
              <Text style={[styles.chartLabel, isToday && { color: colors.coral }]}>
                {weekLabels[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const ensureToday = useFrictionStore((s) => s.ensureToday);
  const resetDay = useFrictionStore((s) => s.resetDay);

  // Apply the midnight reset whenever the dashboard opens.
  useEffect(() => {
    ensureToday();
  }, []);

  // Trigger the overlay for the first over-limit app (mock data), else the first app.
  const triggerApp = todayApps.find((a) => a.usedMinutes > a.limitMinutes) ?? todayApps[0];

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
          <Text style={styles.name}>{user.displayName}</Text>
          <Text style={styles.refresh}>Updated just now</Text>
        </View>
        <Avatar initials={user.initials} />
      </View>

      {/* Streak banner */}
      <View style={styles.streak}>
        <ChevronMark size={30} strokeWidth={9} />
        <View style={{ marginLeft: 14 }}>
          <Text style={styles.streakTitle}>{user.streakDays}-day streak</Text>
          <Text style={styles.streakCaption}>Every day this week under your limits</Text>
        </View>
      </View>

      {/* Today's usage */}
      <Text style={[styles.sectionLabel, { marginTop: 22 }]}>TODAY'S USAGE</Text>
      {todayApps.map((app) => (
        <UsageRow key={app.key} app={app} />
      ))}

      {/* This week */}
      <WeekChart />

      {/* Time saved */}
      <Card dark style={styles.timeSaved}>
        <View style={{ flex: 1 }}>
          <Text style={styles.timeSavedLabel}>TIME SAVED</Text>
          <Text style={styles.timeSavedSub}>vs. your limits, this week</Text>
        </View>
        <Text style={styles.timeSavedNum}>{formatDuration(timeSavedThisWeekMinutes)}</Text>
      </Card>

      {/* Dev tools — replaced by the native usage-limit watcher in Milestone 4. */}
      <View style={styles.devRow}>
        <Pressable
          style={styles.devTrigger}
          onPress={() => router.push(`/friction?app=${triggerApp.key}`)}
        >
          <Feather name="zap" size={15} color={colors.muted3} />
          <Text style={styles.devTriggerText}>Simulate limit reached</Text>
        </Pressable>
        <Pressable style={styles.devTrigger} onPress={resetDay}>
          <Feather name="rotate-ccw" size={15} color={colors.muted3} />
          <Text style={styles.devTriggerText}>Reset day</Text>
        </Pressable>
      </View>
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

  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.coral,
    borderRadius: radius.card,
    padding: 18,
  },
  streakTitle: { fontFamily: fonts.displayXBold, fontSize: 18, color: colors.cream },
  streakCaption: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(251,244,234,0.85)',
    marginTop: 2,
  },

  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    letterSpacing: 0.14 * 12.5,
    color: colors.muted2,
    marginBottom: 10,
  },

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

  devRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 22 },
  devTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  devTriggerText: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted3 },
});
