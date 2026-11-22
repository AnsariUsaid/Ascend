import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AppChip, AppSelectRow, Button, Card, Sheet } from '../../src/components';
import { Mountain, MountainMode } from '../../src/components/focus/Mountain';
import { WeekRange } from '../../src/components/focus/WeekRange';
import { night } from '../../src/components/focus/palette';
import { colors, fonts, radius, spacing, text } from '../../src/theme';
import { useFocusStore, elapsedMs, remainingMs, weekHistory } from '../../src/store/useFocusStore';
import { useAppStore } from '../../src/store/useAppStore';
import { getApp, getInstalledApps } from '../../src/data/installedApps';
import { SUGGESTED_PACKAGES } from '../../src/data/appMeta';
import { formatDuration } from '../../src/data/mock';
import { todayKey } from '../../src/lib/date';

const PRESETS = [15, 25, 45, 60, 90];
const MIN_CUSTOM = 5;
const MAX_CUSTOM = 240;

/** "27:14", or "1:05:09" for an hour or more. */
function clock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

/** "Instagram", "Instagram and X", "Instagram, YouTube and X", "Instagram, YouTube and 2 more". */
function joinNames(pkgs: string[]): string {
  const names = pkgs.map((p) => getApp(p).name);
  if (names.length <= 1) return names[0] ?? 'Your apps';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  if (names.length === 3) return `${names[0]}, ${names[1]} and ${names[2]}`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} more`;
}

const mins = (ms: number) => Math.round(ms / 60000);

export default function Focus() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const session = useFocusStore((s) => s.session);
  const history = useFocusStore((s) => s.history);
  const result = useFocusStore((s) => s.result);
  const introSeen = useFocusStore((s) => s.introSeen);
  const { start, pause, resume, stop, finishIfDone, clearResult, markIntroSeen } = useFocusStore.getState();
  const monitored = useAppStore((s) => s.selected);

  // The plan: last time's length and apps, else 25 min and your monitored apps.
  const defaultApps = () => {
    const last = useFocusStore.getState().lastApps;
    return last ?? Object.keys(monitored).filter((k) => monitored[k]);
  };
  const [durationMin, setDurationMin] = useState(() => mins(useFocusStore.getState().lastDurationMs));
  const [apps, setApps] = useState<string[]>(defaultApps);
  const [hydrated, setHydrated] = useState(() => useFocusStore.persist.hasHydrated());
  useEffect(
    () =>
      useFocusStore.persist.onFinishHydration((s) => {
        setHydrated(true);
        setDurationMin(mins(s.lastDurationMs));
        setApps(s.lastApps ?? Object.keys(useAppStore.getState().selected).filter((k) => useAppStore.getState().selected[k]));
      }),
    [],
  );

  const mode: MountainMode = session
    ? session.runningSince != null
      ? 'climb'
      : 'rest'
    : result?.kind === 'summit'
      ? 'summit'
      : 'plan';
  const isNight = mode !== 'plan';

  // Tick once a second while climbing (time is computed from timestamps; this just redraws).
  const [, setTick] = useState(0);
  useEffect(() => {
    if (mode !== 'climb') return;
    const id = setInterval(() => {
      setTick((n) => n + 1);
      finishIfDone();
    }, 1000);
    return () => clearInterval(id);
  }, [mode, finishIfDone]);

  // Day fades into night when the climb starts, and back when it's over.
  const nightAnim = useRef(new Animated.Value(isNight ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(nightAnim, { toValue: isNight ? 1 : 0, duration: 700, useNativeDriver: false }).start();
  }, [isNight, nightAnim]);
  const bg = nightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.cream, mode === 'rest' ? night.restBg : night.bg],
  });

  // Light status-bar icons and a dark tab bar at night.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(isNight ? 'light' : 'dark');
    }, [isNight]),
  );
  useEffect(() => {
    navigation.setOptions({
      tabBarInactiveTintColor: isNight ? night.tabInactive : colors.muted3,
      tabBarStyle: {
        backgroundColor: isNight ? night.bg : colors.white,
        borderTopColor: isNight ? night.tabBorder : colors.cardBorder,
        borderTopWidth: 1,
        height: 64,
        paddingTop: 6,
      },
    });
  }, [isNight, navigation]);

  // "Saved to today" note after stopping early fades away by itself.
  useEffect(() => {
    if (result?.kind !== 'stopped') return;
    const id = setTimeout(clearResult, 6000);
    return () => clearTimeout(id);
  }, [result, clearResult]);

  const [confirmStop, setConfirmStop] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState(durationMin);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDraft, setPickerDraft] = useState<string[]>([]);
  const [noApps, setNoApps] = useState(false);

  // "How the climb works": opens by itself the first time, then only from the ⓘ.
  const [intro, setIntro] = useState<'first' | 'again' | null>(null);
  useEffect(() => {
    if (hydrated && !introSeen && mode === 'plan') setIntro('first');
  }, [hydrated, introSeen, mode]);
  const closeIntro = () => {
    setIntro(null);
    markIntroSeen();
  };

  const allApps = useMemo(() => {
    const all = getInstalledApps();
    return [
      ...all.filter((a) => SUGGESTED_PACKAGES.includes(a.packageName)),
      ...all.filter((a) => !SUGGESTED_PACKAGES.includes(a.packageName)),
    ];
  }, []);

  const now = Date.now();
  const progress = session ? elapsedMs(session, now) / session.durationMs : 0;
  const left = session ? remainingMs(session, now) : 0;
  const climbedMin = session ? mins(elapsedMs(session, now)) : 0;
  const todayMs = history[todayKey()] ?? 0;
  const week = weekHistory(history);
  const waiting = (pkgs: string[]) => `${joinNames(pkgs)} ${pkgs.length === 1 ? 'is' : 'are'} waiting at base camp`;

  const begin = () => {
    if (apps.length === 0) {
      setNoApps(true);
      return;
    }
    start(apps, durationMin * 60000);
  };

  return (
    <Animated.View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: spacing.screenH, paddingBottom: 32, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {mode === 'plan' && (
          <>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Focus</Text>
              <Pressable onPress={() => setIntro('again')} hitSlop={12} accessibilityLabel="How Focus works">
                <Feather name="info" size={20} color={colors.muted3} />
              </Pressable>
            </View>
            <Text style={styles.sub}>Set a timer. The apps you pick stay closed until it's done.</Text>

            {result?.kind === 'stopped' && (
              <Pressable onPress={clearResult} style={styles.note}>
                <Feather name="check-circle" size={16} color={colors.successText} />
                <Text style={styles.noteText}>
                  Nice climb. {formatDuration(Math.max(1, mins(result.ms)))} saved to today.
                </Text>
              </Pressable>
            )}

            <View style={{ marginTop: 14 }}>
              <Mountain mode="plan" progress={0} />
            </View>

            <Text style={styles.section}>How long</Text>
            <View style={styles.pills}>
              {PRESETS.map((m) => {
                const on = durationMin === m;
                return (
                  <Pressable key={m} onPress={() => setDurationMin(m)} style={[styles.pill, on && styles.pillOn]}>
                    <Text style={[styles.pillText, on && styles.pillTextOn]}>{on ? `${m} min` : m}</Text>
                  </Pressable>
                );
              })}
              {(() => {
                const custom = !PRESETS.includes(durationMin);
                return (
                  <Pressable
                    onPress={() => {
                      setCustomDraft(durationMin);
                      setCustomOpen(true);
                    }}
                    style={[styles.pill, custom && styles.pillOn]}
                  >
                    <Text style={[styles.pillText, custom && styles.pillTextOn]}>
                      {custom ? formatDuration(durationMin) : 'Custom'}
                    </Text>
                  </Pressable>
                );
              })()}
            </View>

            <Text style={styles.section}>Leave behind</Text>
            <Pressable
              onPress={() => {
                setPickerDraft(apps);
                setPickerOpen(true);
              }}
              style={styles.chips}
              accessibilityLabel="Choose apps to leave behind"
            >
              {apps.slice(0, 6).map((p) => {
                const a = getApp(p);
                return <AppChip key={p} hue={a.hue} glyph={a.glyph} size={40} />;
              })}
              {apps.length > 6 && <Text style={styles.more}>+{apps.length - 6}</Text>}
              <View style={styles.addChip}>
                <Feather name={apps.length ? 'edit-2' : 'plus'} size={16} color={colors.muted2} />
              </View>
            </Pressable>
            <Text style={[styles.caption, noApps && apps.length === 0 && { color: colors.dangerText }]}>
              {apps.length === 0
                ? 'Pick at least one app to leave behind.'
                : `${joinNames(apps)} stay${apps.length === 1 ? 's' : ''} closed until you're done.`}
            </Text>

            <Button label="Start climbing" onPress={begin} style={{ marginTop: 20 }} />

            <Card style={{ marginTop: 22 }}>
              <WeekRange days={week} />
            </Card>
          </>
        )}

        {mode === 'climb' && session && (
          <View style={styles.nightWrap}>
            <Text style={styles.nightLabel}>THE CLIMB</Text>
            <Text style={styles.timer} accessibilityRole="timer">{clock(left)}</Text>
            <Text style={styles.nightSub}>left of your {formatDuration(mins(session.durationMs))} climb</Text>
            <View style={{ marginTop: 22, alignSelf: 'stretch' }}>
              <Mountain mode="climb" progress={progress} />
            </View>
            <View style={styles.waitRow}>
              <Feather name="lock" size={13} color={night.sub} />
              <Text style={styles.waitText}>{waiting(session.apps)}</Text>
            </View>
            <View style={styles.actions}>
              <Pressable onPress={pause} style={({ pressed }) => [styles.ghost, pressed && { opacity: 0.7 }]}>
                <Text style={styles.ghostText}>Pause</Text>
              </Pressable>
              <Pressable onPress={() => setConfirmStop(true)} style={({ pressed }) => [styles.quiet, pressed && { opacity: 0.7 }]}>
                <Text style={styles.quietText}>Stop</Text>
              </Pressable>
            </View>
          </View>
        )}

        {mode === 'rest' && session && (
          <View style={styles.nightWrap}>
            <Text style={styles.nightLabel}>RESTING</Text>
            <Text style={[styles.timer, { color: night.dim }]}>{clock(left)}</Text>
            <Text style={styles.nightSub}>
              Your apps are open while you rest.{'\n'}Paused time doesn't count.
            </Text>
            <View style={{ marginTop: 22, alignSelf: 'stretch' }}>
              <Mountain mode="rest" progress={progress} />
            </View>
            <View style={styles.actions}>
              <Button label="Keep climbing" onPress={resume} style={{ flex: 1 }} />
              <Pressable onPress={() => setConfirmStop(true)} style={({ pressed }) => [styles.quiet, pressed && { opacity: 0.7 }]}>
                <Text style={styles.quietText}>Stop</Text>
              </Pressable>
            </View>
          </View>
        )}

        {mode === 'summit' && result && (
          <View style={styles.nightWrap}>
            <Text style={styles.nightLabel}>YOU MADE IT</Text>
            <Text style={styles.summitTitle}>Summit reached</Text>
            <Text style={styles.nightSub}>
              {formatDuration(Math.max(1, mins(result.ms)))} climb · Today: {formatDuration(mins(todayMs))} focused
            </Text>
            <View style={{ marginTop: 22, alignSelf: 'stretch' }}>
              <Mountain mode="summit" progress={1} />
            </View>
            <Button label="Back to base camp" onPress={clearResult} style={{ marginTop: 28, alignSelf: 'stretch' }} />
          </View>
        )}
      </ScrollView>

      {/* Our own status-bar backing, fading with the sky (the tabs' cream cap is off here). */}
      <Animated.View pointerEvents="none" style={[styles.cap, { height: insets.top, backgroundColor: bg }]} />

      <Sheet visible={intro !== null} title="How the climb works" onClose={closeIntro}>
        {(
          [
            ['triangle', 'Pick how long you want to focus.'],
            ['lock', 'Choose apps to leave behind. They stay closed while you climb.'],
            ['pause', 'Pause for a break (your apps open again), or stop anytime. Your time is still saved.'],
          ] as const
        ).map(([icon, line]) => (
          <View key={icon} style={styles.introRow}>
            <View style={styles.introIcon}>
              <Feather name={icon} size={16} color={colors.coral} />
            </View>
            <Text style={styles.introText}>{line}</Text>
          </View>
        ))}
        <Button label={intro === 'first' ? 'Start exploring' : 'Got it'} onPress={closeIntro} style={{ marginTop: 22 }} />
      </Sheet>

      <Sheet visible={confirmStop} title="End this climb?" onClose={() => setConfirmStop(false)}>
        <Text style={styles.sheetText}>
          {climbedMin >= 1
            ? `You've climbed ${formatDuration(climbedMin)}. It'll be saved to today.`
            : "You've only just set off. Whatever you've climbed will be saved to today."}
        </Text>
        <Button label="Keep climbing" onPress={() => setConfirmStop(false)} style={{ marginTop: 20 }} />
        <Button
          label="End climb"
          variant="outline"
          onPress={() => {
            setConfirmStop(false);
            stop();
          }}
          style={{ marginTop: 12 }}
        />
      </Sheet>

      <Sheet visible={customOpen} title="How long?" onClose={() => setCustomOpen(false)}>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => setCustomDraft((m) => Math.max(MIN_CUSTOM, m - 5))}
            style={styles.stepBtn}
            accessibilityLabel="5 minutes less"
          >
            <Feather name="minus" size={22} color={colors.ink} />
          </Pressable>
          <Text style={styles.stepValue}>{formatDuration(customDraft)}</Text>
          <Pressable
            onPress={() => setCustomDraft((m) => Math.min(MAX_CUSTOM, m + 5))}
            style={styles.stepBtn}
            accessibilityLabel="5 minutes more"
          >
            <Feather name="plus" size={22} color={colors.ink} />
          </Pressable>
        </View>
        <Button
          label="Set"
          onPress={() => {
            setDurationMin(customDraft);
            setCustomOpen(false);
          }}
          style={{ marginTop: 22 }}
        />
      </Sheet>

      <Sheet visible={pickerOpen} title="Leave behind" onClose={() => setPickerOpen(false)}>
        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          {allApps.map((a) => {
            const on = pickerDraft.includes(a.packageName);
            return (
              <AppSelectRow
                key={a.packageName}
                app={a}
                selected={on}
                caption={monitored[a.packageName] ? 'Monitored' : undefined}
                onToggle={() =>
                  setPickerDraft((d) => (on ? d.filter((p) => p !== a.packageName) : [...d, a.packageName]))
                }
              />
            );
          })}
        </ScrollView>
        <Button
          label={pickerDraft.length ? `Leave ${pickerDraft.length} behind` : 'Done'}
          onPress={() => {
            setApps(pickerDraft);
            setPickerOpen(false);
          }}
          style={{ marginTop: 14 }}
        />
      </Sheet>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  title: { ...text.screenTitle, color: colors.ink },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  introRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  introIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.muted },
  sub: { fontFamily: fonts.regular, fontSize: 14.5, color: colors.muted2, marginTop: 4 },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: colors.successBg,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  noteText: { flex: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.successText },
  section: { ...text.sectionLabel, color: colors.muted3, marginTop: 18, marginBottom: 10 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: colors.track, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  pillOn: { backgroundColor: colors.coral },
  pillText: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  pillTextOn: { color: colors.cream, fontFamily: fonts.semibold },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  more: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted2 },
  addChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted2, marginTop: 10 },

  nightWrap: { flex: 1, alignItems: 'center', paddingTop: 28 },
  nightLabel: { fontFamily: fonts.semibold, fontSize: 11.5, letterSpacing: 1.8, color: night.sub },
  timer: { fontFamily: fonts.displayXBold, fontSize: 68, color: night.text, marginTop: 6, fontVariant: ['tabular-nums'] },
  nightSub: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: night.sub, textAlign: 'center', marginTop: 4 },
  summitTitle: { fontFamily: fonts.displayXBold, fontSize: 38, color: night.text, marginTop: 8 },
  waitRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 8 },
  waitText: { fontFamily: fonts.regular, fontSize: 13.5, color: night.sub, textAlign: 'center', flexShrink: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 'auto', paddingTop: 28, alignSelf: 'stretch' },
  ghost: {
    flex: 1,
    height: 56,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: night.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { fontFamily: fonts.semibold, fontSize: 16, color: night.text },
  quiet: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center' },
  quietText: { fontFamily: fonts.semibold, fontSize: 16, color: night.sub },

  cap: { position: 'absolute', top: 0, left: 0, right: 0 },
  sheetText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { fontFamily: fonts.displayXBold, fontSize: 34, color: colors.ink },
});
