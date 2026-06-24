import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, LimitStepperRow, MotivationDialog, ScreenHeader } from '../src/components';
import { colors, fonts, spacing } from '../src/theme';
import { getInstalledApps } from '../src/data/installedApps';
import { DEFAULT_LIMIT, LIMIT_MIN, LIMIT_MAX, LIMIT_STEP } from '../src/data/apps';
import { useAppStore } from '../src/store/useAppStore';
import { useUsage } from '../src/usage/useUsage';

const clamp = (m: number) => Math.max(LIMIT_MIN, Math.min(LIMIT_MAX, m));

export default function EditLimits() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selected = useAppStore((s) => s.selected);
  const limits = useAppStore((s) => s.limits);
  const setLimit = useAppStore((s) => s.setLimit);
  const usage = useUsage();

  const apps = useMemo(
    () => getInstalledApps().filter((a) => selected[a.packageName]),
    [selected],
  );

  // Draft limits; applied only on Save so we can gate a loosening.
  const [draft, setDraft] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const a of apps) init[a.packageName] = limits[a.packageName] ?? DEFAULT_LIMIT;
    return init;
  });
  const [gate, setGate] = useState(false);

  const bump = (pkg: string, delta: number) =>
    setDraft((d) => ({ ...d, [pkg]: clamp((d[pkg] ?? DEFAULT_LIMIT) + delta * LIMIT_STEP) }));

  // Apps currently over their (committed) limit today — the "escape" moment.
  const overLimit = useMemo(
    () => new Set(usage.apps.filter((a) => a.today >= a.limit).map((a) => a.key)),
    [usage.apps],
  );
  // Over-limit apps whose limit the user is raising right now.
  const escaping = apps.filter((a) => {
    const orig = limits[a.packageName] ?? DEFAULT_LIMIT;
    return (draft[a.packageName] ?? orig) > orig && overLimit.has(a.packageName);
  });

  const commit = () => {
    for (const a of apps) setLimit(a.packageName, draft[a.packageName] ?? DEFAULT_LIMIT);
    router.back();
  };

  const save = () => {
    if (escaping.length > 0) {
      setGate(true);
      return;
    }
    commit();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: spacing.screenH,
          paddingBottom: 24,
        }}
      >
        <ScreenHeader title="Time Limits" />
        <Text style={styles.note}>Changes apply when you tap Save.</Text>
        {apps.map((app) => (
          <LimitStepperRow
            key={app.packageName}
            app={app}
            minutes={draft[app.packageName] ?? DEFAULT_LIMIT}
            onBump={(delta) => bump(app.packageName, delta)}
          />
        ))}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button label="Save" onPress={save} />
      </View>

      <MotivationDialog
        visible={gate}
        title="Give yourself more time?"
        message="You've hit the limit and the urge to raise it is the pull, not a verdict on you. The you who set this knew today would feel like this. Stick with it?"
        stayLabel="Keep my limit"
        continueLabel="Raise it anyway"
        onStay={() => {
          // Keep the limit: snap the raised values back to their originals.
          setDraft((d) => {
            const next = { ...d };
            for (const a of escaping) next[a.packageName] = limits[a.packageName] ?? DEFAULT_LIMIT;
            return next;
          });
          setGate(false);
        }}
        onContinue={() => {
          setGate(false);
          commit();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  note: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted3, marginBottom: 16 },
  footer: {
    paddingHorizontal: spacing.screenH,
    paddingTop: 12,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});
