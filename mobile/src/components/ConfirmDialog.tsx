import { Modal, View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { colors, fonts, radius, spacing } from '../theme';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Centered confirmation dialog over a dim scrim; danger-red confirm. */
export function ConfirmDialog({ visible, title, message, confirmLabel, onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.scrim}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button label="Cancel" variant="outline" onPress={onCancel} style={{ flex: 1 }} />
            <Button
              label={confirmLabel}
              onPress={onConfirm}
              style={{ flex: 1, backgroundColor: colors.dangerText }}
            />
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
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
});
