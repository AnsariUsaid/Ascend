import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

const TOTAL = 5;

/** "Step N of 5" caption + 5-segment progress bar. */
export function OnboardingHeader({ step }: { step: number }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.caption}>
        Step {step} of {TOTAL}
      </Text>
      <View style={styles.bar}>
        {Array.from({ length: TOTAL }).map((_, i) => {
          const n = i + 1;
          const color =
            n < step ? colors.coral : n === step ? 'rgba(210,96,63,0.35)' : '#e5dac9';
          return <View key={i} style={[styles.seg, { backgroundColor: color }]} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 24 },
  caption: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted2, marginBottom: 10 },
  bar: { flexDirection: 'row', gap: 6 },
  seg: { flex: 1, height: 5, borderRadius: 99 },
});
