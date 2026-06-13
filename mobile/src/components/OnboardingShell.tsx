import { ReactNode } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingHeader } from './OnboardingHeader';
import { colors, spacing } from '../theme';

type Props = {
  step: number;
  children: ReactNode;
  /** Pinned footer (buttons). */
  footer: ReactNode;
};

export function OnboardingShell({ step, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: spacing.screenH,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingHeader step={step} />
        {children}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>{footer}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  footer: {
    paddingHorizontal: spacing.screenH,
    paddingTop: 12,
    gap: 10,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});
