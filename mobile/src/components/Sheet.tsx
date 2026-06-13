import { ReactNode } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../theme';

type Props = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
};

/** Bottom sheet over a dimmed scrim. */
export function Sheet({ visible, title, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(24,15,9,0.55)' },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.xxl,
    paddingTop: 24,
  },
  title: { fontFamily: fonts.displayXBold, fontSize: 20, color: colors.ink, marginBottom: 18 },
});
