import { Pressable, Text, StyleSheet, ViewStyle, View } from 'react-native';
import { ReactNode } from 'react';
import { colors, fonts, radius, sizes } from '../theme';

export type ButtonVariant = 'primary' | 'coffee' | 'outline' | 'google' | 'text';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  left?: ReactNode;
  style?: ViewStyle;
};

const bg: Record<ButtonVariant, string> = {
  primary: colors.coral,
  coffee: colors.coffee,
  outline: 'transparent',
  google: colors.white,
  text: 'transparent',
};

const fg: Record<ButtonVariant, string> = {
  primary: colors.cream,
  coffee: colors.cream,
  outline: colors.coffee,
  google: colors.ink,
  text: colors.coralText,
};

export function Button({ label, onPress, variant = 'primary', disabled, left, style }: Props) {
  const isText = variant === 'text';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: isText ? sizes.buttonHeightSecondary : sizes.buttonHeight,
          backgroundColor: bg[variant],
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
        },
        variant === 'outline' && styles.outline,
        variant === 'google' && styles.googleBorder,
        style,
      ]}
    >
      {left ? <View style={styles.left}>{left}</View> : null}
      <Text style={[styles.label, { color: fg[variant] }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.coffee,
  },
  googleBorder: {
    borderWidth: 1,
    borderColor: '#e5dac9',
  },
  left: { marginRight: 10 },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
});
