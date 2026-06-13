import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppChip } from './AppChip';
import { colors, fonts, radius } from '../theme';
import { LIMIT_MIN, LIMIT_MAX } from '../data/apps';
import { formatDuration } from '../data/mock';
import type { AppCatalogItem } from '../data/apps';

type Props = {
  app: AppCatalogItem;
  minutes: number;
  onBump: (delta: number) => void;
};

function StepBtn({ icon, disabled, onPress }: { icon: 'minus' | 'plus'; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.stepBtn,
        { opacity: disabled ? 0.35 : 1, transform: [{ scale: pressed && !disabled ? 0.92 : 1 }] },
      ]}
    >
      <Feather name={icon} size={18} color={colors.ink} />
    </Pressable>
  );
}

/** Per-app time-limit stepper. 15 min–4 h, 15-min steps. Used in onboarding & Edit Limits. */
export function LimitStepperRow({ app, minutes, onBump }: Props) {
  return (
    <View style={styles.row}>
      <AppChip hue={app.hue} glyph={app.glyph} size={38} />
      <Text style={styles.name}>{app.name}</Text>
      <View style={styles.stepper}>
        <StepBtn icon="minus" disabled={minutes <= LIMIT_MIN} onPress={() => onBump(-1)} />
        <Text style={styles.value}>{formatDuration(minutes)}</Text>
        <StepBtn icon="plus" disabled={minutes >= LIMIT_MAX} onPress={() => onBump(1)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.cardSm,
    padding: 14,
    marginBottom: 10,
  },
  name: { flex: 1, marginLeft: 12, fontFamily: fonts.medium, fontSize: 15.5, color: colors.ink },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    minWidth: 64,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.ink,
  },
});
