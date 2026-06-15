import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius } from '../theme';

type Props = {
  granted: boolean;
  grantedText: string;
  reminderText: string;
};

/** Green success when granted, amber reminder when not. */
export function PermissionBanner({ granted, grantedText, reminderText }: Props) {
  return (
    <View style={[styles.banner, granted ? styles.green : styles.amber]}>
      <Feather
        name={granted ? 'check-circle' : 'alert-triangle'}
        size={16}
        color={granted ? colors.successText : '#9a6a1f'}
      />
      <Text style={[styles.text, { color: granted ? colors.successText : '#7a5417' }]}>
        {granted ? grantedText : reminderText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: radius.cardSm,
    padding: 14,
    marginTop: 16,
  },
  green: { backgroundColor: colors.successBg },
  amber: { backgroundColor: '#f7ecd6' },
  text: { flex: 1, fontFamily: fonts.medium, fontSize: 13.5, lineHeight: 19 },
});
