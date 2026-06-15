import { Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, LimitStepperRow, OnboardingShell } from '../../src/components';
import { colors, fonts } from '../../src/theme';
import { getInstalledApps } from '../../src/data/installedApps';
import { DEFAULT_LIMIT } from '../../src/data/apps';
import { useAppStore } from '../../src/store/useAppStore';

export default function TimeLimits() {
  const router = useRouter();
  const selected = useAppStore((s) => s.selected);
  const limits = useAppStore((s) => s.limits);
  const bumpLimit = useAppStore((s) => s.bumpLimit);

  const apps = getInstalledApps().filter((a) => selected[a.packageName]);

  return (
    <OnboardingShell
      step={4}
      footer={<Button label="Continue" onPress={() => router.push('/(onboarding)/preferences')} />}
    >
      <Text style={styles.headline}>Set your daily limits</Text>
      <Text style={styles.sub}>
        Interventions start when a limit is exceeded. You can fine-tune these later.
      </Text>
      {apps.map((app) => (
        <LimitStepperRow
          key={app.packageName}
          app={app}
          minutes={limits[app.packageName] ?? DEFAULT_LIMIT}
          onBump={(delta) => bumpLimit(app.packageName, delta)}
        />
      ))}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  headline: { fontFamily: fonts.displayXBold, fontSize: 24, color: colors.ink },
  sub: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted2, marginTop: 6, marginBottom: 18, lineHeight: 21 },
});
