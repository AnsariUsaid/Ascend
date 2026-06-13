import { Pressable, Text, StyleSheet, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

type Option<T> = { label: string; value: T };

type Props<T extends string | number> = {
  options: Option<T>[];
  value: T;
  onSelect: (value: T) => void;
};

/** Row of pill choices; selected pill is coral. Wraps to multiple lines. */
export function ChoiceChips<T extends string | number>({ options, value, onSelect }: Props<T>) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onSelect(opt.value)}
            style={({ pressed }) => [
              styles.chip,
              active ? styles.chipActive : styles.chipIdle,
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={[styles.label, { color: active ? colors.cream : colors.ink }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 18,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.coral },
  chipIdle: { backgroundColor: colors.track },
  label: { fontFamily: fonts.semibold, fontSize: 15 },
});
