import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ChevronMark, Wordmark } from '../src/components';
import { colors, fonts, radius, spacing } from '../src/theme';
import { useStatusBarStyle } from '../src/hooks/useStatusBarStyle';

export default function SignIn() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useStatusBarStyle('light'); // coral hero → white icons

  // v1 is fully local — no accounts. "Get Started" goes straight to onboarding.
  const enter = () => router.replace('/(onboarding)/usage-access');

  return (
    <View style={styles.root}>
      {/* Coral hero */}
      <View style={[styles.hero, { paddingTop: insets.top + 40 }]}>
        <View style={styles.heroContent}>
          <ChevronMark size={52} />
          <Wordmark size={20} style={{ marginTop: 12 }} />
          <Text style={styles.headline}>Take back{'\n'}your time.</Text>
          <Text style={styles.sub}>Let's start your journey.</Text>
        </View>
      </View>

      {/* Cream sheet */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <Button label="Get Started" variant="primary" onPress={enter} />
        <Text style={styles.legal}>
          No account needed. Everything stays private on your device.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.coral },
  hero: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  heroContent: {},
  headline: {
    marginTop: 24,
    fontFamily: fonts.displayXBold,
    fontSize: 44,
    lineHeight: 48,
    color: colors.cream,
  },
  sub: {
    marginTop: 12,
    fontFamily: fonts.regular,
    fontSize: 17,
    color: 'rgba(251,244,234,0.78)',
  },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 28,
    paddingTop: 28,
    gap: 12,
  },
  legal: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted2,
  },
});
