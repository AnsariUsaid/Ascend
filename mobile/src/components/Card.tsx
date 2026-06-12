import { View, ViewStyle, StyleSheet } from 'react-native';
import { ReactNode } from 'react';
import { colors, radius, spacing } from '../theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  /** Use the dark coffee surface instead of white. */
  dark?: boolean;
  borderColor?: string;
};

export function Card({ children, style, dark, borderColor }: Props) {
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: dark ? colors.coffee : colors.white,
          borderColor: borderColor ?? (dark ? 'transparent' : colors.cardBorder),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.lg,
  },
});
