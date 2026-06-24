import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppSelectRow, Button, MotivationDialog, ScreenHeader } from '../src/components';
import { colors, fonts, spacing } from '../src/theme';
import { getInstalledApps, getApp } from '../src/data/installedApps';
import { SUGGESTED_PACKAGES } from '../src/data/appMeta';
import { useAppStore } from '../src/store/useAppStore';
import { useUsage } from '../src/usage/useUsage';

export default function EditApps() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const committed = useAppStore((s) => s.selected);
  const setSelected = useAppStore((s) => s.setSelected);
  const usage = useUsage();

  const apps = useMemo(() => {
    const all = getInstalledApps();
    const suggested = all.filter((a) => SUGGESTED_PACKAGES.includes(a.packageName));
    const rest = all.filter((a) => !SUGGESTED_PACKAGES.includes(a.packageName));
    return [...suggested, ...rest];
  }, []);

  // Local draft; back discards it.
  const [draft, setDraft] = useState<Record<string, boolean>>({ ...committed });
  const [gate, setGate] = useState(false);
  const count = apps.filter((a) => draft[a.packageName]).length;

  // Packages currently over their limit today (the real "escape" moment).
  const overLimit = useMemo(
    () => new Set(usage.apps.filter((a) => a.today >= a.limit).map((a) => a.key)),
    [usage.apps],
  );
  // Monitored, over-limit apps the user is trying to drop right now.
  const escaping = apps.filter(
    (a) => committed[a.packageName] && !draft[a.packageName] && overLimit.has(a.packageName),
  );

  const commit = () => {
    setSelected(draft);
    router.back();
  };

  const save = () => {
    if (count === 0) return;
    if (escaping.length > 0) {
      setGate(true);
      return;
    }
    commit();
  };

  const gateName =
    escaping.length === 1 ? getApp(escaping[0].packageName).name : `${escaping.length} apps`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: spacing.screenH,
          paddingBottom: 24,
        }}
      >
        <ScreenHeader title="Monitored Apps" rightText={`${count} selected`} />
        {count === 0 ? <Text style={styles.error}>Select at least one app.</Text> : null}
        {apps.map((app) => (
          <AppSelectRow
            key={app.packageName}
            app={app}
            selected={!!draft[app.packageName]}
            caption={committed[app.packageName] ? 'Currently monitored' : 'Not monitored'}
            onToggle={() => setDraft((d) => ({ ...d, [app.packageName]: !d[app.packageName] }))}
          />
        ))}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button label="Save Changes" onPress={save} disabled={count === 0} />
      </View>

      <MotivationDialog
        visible={gate}
        title={escaping.length === 1 ? `Stop watching ${gateName}?` : 'Stop watching these apps?'}
        message="You're over the limit right now — and wanting to drop it from Ascend this second is exactly that pull talking. The hard part is almost over. Want to stick with it?"
        stayLabel="Keep it on track"
        continueLabel="Remove anyway"
        onStay={() => {
          // Keep them on track: restore the apps they tried to drop.
          setDraft((d) => {
            const next = { ...d };
            for (const a of escaping) next[a.packageName] = true;
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
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.dangerText, marginBottom: 12 },
  footer: {
    paddingHorizontal: spacing.screenH,
    paddingTop: 12,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});
