import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../theme';

/** Temporary tab screen until the real one is built (Milestone 2). */
export function Placeholder({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.center}>
        <Text style={styles.soon}>Coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: spacing.screenH },
  title: { fontFamily: fonts.displayXBold, fontSize: 27, color: colors.ink },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  soon: { fontFamily: fonts.medium, fontSize: 15, color: colors.muted3 },
});
