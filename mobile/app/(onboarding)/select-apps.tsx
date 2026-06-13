import { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AppSelectRow, Button, OnboardingShell } from '../../src/components';
import { colors, fonts } from '../../src/theme';
import { APP_CATALOG } from '../../src/data/apps';
import { useAppStore } from '../../src/store/useAppStore';

export default function SelectApps() {
  const router = useRouter();
  const selected = useAppStore((s) => s.selected);
  const toggleApp = useAppStore((s) => s.toggleApp);
  const [error, setError] = useState(false);

  const detected = APP_CATALOG.filter((a) => a.detected);
  const anySelected = detected.some((a) => selected[a.key]);

  const onContinue = () => {
    if (!anySelected) {
      setError(true);
      return;
    }
    router.push('/(onboarding)/time-limits');
  };

  return (
    <OnboardingShell
      step={3}
      footer={<Button label="Continue" onPress={onContinue} />}
    >
      <Text style={styles.headline}>Which apps do you want to control?</Text>
      <Text style={styles.sub}>You can change this anytime.</Text>
      {error && !anySelected ? <Text style={styles.error}>Select at least one app.</Text> : null}
      {detected.map((app) => (
        <AppSelectRow
          key={app.key}
          app={app}
          selected={!!selected[app.key]}
          onToggle={() => {
            setError(false);
            toggleApp(app.key);
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
