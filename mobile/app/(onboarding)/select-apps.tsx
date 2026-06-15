import { useMemo, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AppSelectRow, Button, OnboardingShell } from '../../src/components';
import { colors, fonts } from '../../src/theme';
import { getInstalledApps } from '../../src/data/installedApps';
import { SUGGESTED_PACKAGES } from '../../src/data/appMeta';
import { useAppStore } from '../../src/store/useAppStore';

export default function SelectApps() {
  const router = useRouter();
  const selected = useAppStore((s) => s.selected);
  const toggleApp = useAppStore((s) => s.toggleApp);
  const [error, setError] = useState(false);

  // Real installed apps, with common social apps surfaced first.
  const apps = useMemo(() => {
    const all = getInstalledApps();
    const suggested = all.filter((a) => SUGGESTED_PACKAGES.includes(a.packageName));
    const rest = all.filter((a) => !SUGGESTED_PACKAGES.includes(a.packageName));
    return [...suggested, ...rest];
  }, []);
  const anySelected = apps.some((a) => selected[a.packageName]);

  const onContinue = () => {
    if (!anySelected) {
      setError(true);
      return;
    }
    router.push('/(onboarding)/time-limits');
  };

  return (
    <OnboardingShell step={3} footer={<Button label="Continue" onPress={onContinue} />}>
      <Text style={styles.headline}>Which apps do you want to control?</Text>
      <Text style={styles.sub}>You can change this anytime.</Text>
      {error && !anySelected ? <Text style={styles.error}>Select at least one app.</Text> : null}
      {apps.map((app) => (
        <AppSelectRow
          key={app.packageName}
          app={app}
          selected={!!selected[app.packageName]}
          onToggle={() => {
            setError(false);
            toggleApp(app.packageName);
          }}
        />
      ))}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  headline: { fontFamily: fonts.displayXBold, fontSize: 24, color: colors.ink },
  sub: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted2, marginTop: 6, marginBottom: 18 },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.dangerText, marginBottom: 12 },
});
