import { useMemo, useState } from 'react';
import { Text, StyleSheet, TextInput, ToastAndroid } from 'react-native';
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
  const [query, setQuery] = useState('');

  // Real installed apps, with common social apps surfaced first.
  const apps = useMemo(() => {
    const all = getInstalledApps();
    const suggested = all.filter((a) => SUGGESTED_PACKAGES.includes(a.packageName));
    const rest = all.filter((a) => !SUGGESTED_PACKAGES.includes(a.packageName));
    return [...suggested, ...rest];
  }, []);

  // Filter by name as the user types.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter((a) => a.name.toLowerCase().includes(q));
  }, [apps, query]);

  const anySelected = apps.some((a) => selected[a.packageName]);

  const onContinue = () => {
    if (!anySelected) {
      ToastAndroid.show('Select at least one app to continue', ToastAndroid.SHORT);
      return;
    }
    router.push('/(onboarding)/time-limits');
  };

  return (
    <OnboardingShell step={3} footer={<Button label="Continue" onPress={onContinue} />}>
      <Text style={styles.headline}>Which apps do you want to control?</Text>
      <Text style={styles.sub}>You can change this anytime.</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search apps"
        placeholderTextColor={colors.faint}
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.search}
      />
      {visible.length === 0 ? (
        <Text style={styles.empty}>No apps match “{query.trim()}”.</Text>
      ) : (
        visible.map((app) => (
          <AppSelectRow
            key={app.packageName}
            app={app}
            selected={!!selected[app.packageName]}
            onToggle={() => toggleApp(app.packageName)}
          />
        ))
      )}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  headline: { fontFamily: fonts.displayXBold, fontSize: 24, color: colors.ink },
  sub: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted2, marginTop: 6, marginBottom: 16 },
  search: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 16,
  },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted2, paddingVertical: 16, textAlign: 'center' },
});
