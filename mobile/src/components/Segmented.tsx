import { Pressable, Text, StyleSheet, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

type Option<T> = { label: string; value: T };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Full-width segmented toggle; active segment is a coffee pill with cream text. */
export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.track}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, active && styles.active]}
          >
            <Text style={[styles.label, { color: active ? colors.cream : colors.muted }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.track,
    borderRadius: radius.pill,
    padding: 4,
  },
  segment: { flex: 1, height: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: colors.coffee },
  label: { fontFamily: fonts.semibold, fontSize: 14 },
});
