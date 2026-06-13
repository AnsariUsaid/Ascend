import { Pressable, Text, StyleSheet, View } from 'react-native';
import { ReactNode } from 'react';
import { Feather } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

type Props = {
  label: string;
  value?: string;
  onPress?: () => void;
  /** Right-side control (e.g. a Toggle) instead of value + chevron. */
  right?: ReactNode;
  danger?: boolean;
  /** Hide the bottom hairline (last row in a group). */
  last?: boolean;
};

export function SettingsRow({ label, value, onPress, right, danger, last }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        !last && styles.divider,
        pressed && onPress && { backgroundColor: '#fdf9f1' },
      ]}
    >
      <Text style={[styles.label, danger && { color: colors.dangerText }]}>{label}</Text>
      <View style={styles.right}>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        {right}
        {onPress && !right ? (
          <Feather name="chevron-right" size={20} color={colors.faint} style={{ marginLeft: 6 }} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  label: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.ink },
  right: { flexDirection: 'row', alignItems: 'center' },
  value: { fontFamily: fonts.regular, fontSize: 14.5, color: colors.muted2 },
});
