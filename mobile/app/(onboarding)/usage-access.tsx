import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, OnboardingShell } from '../../src/components';
import { colors, fonts } from '../../src/theme';

const BULLETS = [
  'Ascend needs usage access to measure time in each app.',
  'This powers your stats and the friction interventions.',
  'Your data stays on this device unless you explicitly share it.',
];

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bullet}>
      <View style={styles.dot} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

export default function UsageAccess() {
  const router = useRouter();
  return (
    <OnboardingShell
      step={1}
      footer={
        <>
          {/* Real app opens Usage Access settings + re-checks on return. Stubbed → proceed. */}
          <Button label="Grant Access" onPress={() => router.push('/(onboarding)/overlay-permission')} />
          <Button label="I'll do this later" variant="text" onPress={() => router.push('/(onboarding)/overlay-permission')} />
        </>
      }
    >
      <Card style={styles.illus}>
        <View style={styles.bars}>
          {[0.5, 0.8, 0.4, 1, 0.65, 0.3, 0.55].map((h, i) => (
            <View key={i} style={[styles.bar, { height: 60 * h }]} />
          ))}
        </View>
      </Card>
      <Text style={styles.headline}>See where your time goes</Text>
      <View style={{ marginTop: 16 }}>
        {BULLETS.map((b) => (
          <Bullet key={b} text={b} />
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  illus: { alignItems: 'center', paddingVertical: 24 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 60 },
  bar: { width: 16, borderRadius: 6, backgroundColor: colors.coral },
  headline: { marginTop: 22, fontFamily: fonts.displayXBold, fontSize: 24, color: colors.ink },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.coral, marginTop: 7, marginRight: 12 },
  bulletText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted },
});
