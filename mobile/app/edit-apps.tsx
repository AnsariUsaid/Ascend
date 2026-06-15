import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppSelectRow, Button, ScreenHeader } from '../src/components';
import { colors, fonts, spacing } from '../src/theme';
import { getInstalledApps } from '../src/data/installedApps';
import { SUGGESTED_PACKAGES } from '../src/data/appMeta';
import { useAppStore } from '../src/store/useAppStore';

export default function EditApps() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const committed = useAppStore((s) => s.selected);
  const setSelected = useAppStore((s) => s.setSelected);

  const apps = useMemo(() => {
    const all = getInstalledApps();
    const suggested = all.filter((a) => SUGGESTED_PACKAGES.includes(a.packageName));
    const rest = all.filter((a) => !SUGGESTED_PACKAGES.includes(a.packageName));
    return [...suggested, ...rest];
  }, []);

  // Local draft; back discards it.
  const [draft, setDraft] = useState<Record<string, boolean>>({ ...committed });
  const count = apps.filter((a) => draft[a.packageName]).length;

  const save = () => {
    if (count === 0) return;
    setSelected(draft);
    router.back();
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
