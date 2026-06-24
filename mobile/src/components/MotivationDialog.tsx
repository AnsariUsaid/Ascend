import { Modal, View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { colors, fonts, radius, spacing } from '../theme';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  /** The encouraging "don't do it" choice — primary, leads. */
  stayLabel: string;
  /** The loosening action — quiet secondary. */
  continueLabel: string;
  onStay: () => void;
  onContinue: () => void;
};

/**
 * A warm "are you sure?" gate shown when the user tries to loosen their setup
 * (remove a monitored app / raise a limit) while over a limit. Unlike
 * ConfirmDialog, the encouraging choice leads as the primary button.
 */
export function MotivationDialog({
  visible,
  title,
  message,
  stayLabel,
  continueLabel,
  onStay,
  onContinue,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onStay}>
      <View style={styles.scrim}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button label={stayLabel} onPress={onStay} />
            <Button label={continueLabel} variant="text" onPress={onContinue} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(24,15,9,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.cream,
    borderRadius: radius.dialog,
    padding: 24,
  },
  title: { fontFamily: fonts.displayXBold, fontSize: 20, color: colors.ink },
  message: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted, marginTop: 12 },
  actions: { marginTop: 22, gap: 10 },
});
