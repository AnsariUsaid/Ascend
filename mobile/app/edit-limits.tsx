import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, LimitStepperRow, ScreenHeader } from '../src/components';
import { colors, fonts, spacing } from '../src/theme';
import { getInstalledApps } from '../src/data/installedApps';
import { DEFAULT_LIMIT } from '../src/data/apps';
import { useAppStore } from '../src/store/useAppStore';

export default function EditLimits() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selected = useAppStore((s) => s.selected);
  const limits = useAppStore((s) => s.limits);
  const bumpLimit = useAppStore((s) => s.bumpLimit);

  const apps = getInstalledApps().filter((a) => selected[a.packageName]);

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
        <Text style={styles.note}>Changes take effect immediately.</Text>
        {apps.map((app) => (
          <LimitStepperRow
            key={app.packageName}
            app={app}
            minutes={limits[app.packageName] ?? DEFAULT_LIMIT}
            onBump={(delta) => bumpLimit(app.packageName, delta)}
          />
        ))}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button label="Save" onPress={() => router.back()} />
      </View>
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
