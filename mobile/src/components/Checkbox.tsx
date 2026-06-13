import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme';

/** 26px rounded-square checkbox; coral fill + cream check when on. */
export function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.box, checked ? styles.on : styles.off]}>
      {checked ? <Feather name="check" size={16} color={colors.cream} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  on: { backgroundColor: colors.coral },
  off: { borderWidth: 2, borderColor: colors.disabled, backgroundColor: 'transparent' },
});
