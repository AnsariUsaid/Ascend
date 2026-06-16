import { ReactNode, useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../theme';

type Props = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Bottom sheet over a dimmed scrim.
 *
 * We drive the transition ourselves (`animationType="none"`) instead of using
 * the Modal's built-in `slide`: the canned slide is linear and the scrim pops in
 * instantly, which feels cheap. Here the sheet eases up (fast → gentle settle)
 * while the scrim fades in, and the exit animates too (then we unmount).
 */
export function Sheet({ visible, title, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  // Keep the Modal mounted through the exit animation, then drop it.
  const [mounted, setMounted] = useState(visible);
  // 0 = fully closed (offscreen), 1 = fully open.
  const anim = useRef(new Animated.Value(0)).current;
  // Measured sheet height so it slides exactly its own height, no guesswork.
  const [sheetH, setSheetH] = useState(420);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, anim]);

  if (!mounted) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [sheetH, 0] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.fill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: anim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}
          style={[styles.sheet, { paddingBottom: insets.bottom + 20, transform: [{ translateY }] }]}
        >
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  scrim: { backgroundColor: 'rgba(24,15,9,0.55)' },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.xxl,
    paddingTop: 24,
  },
  title: { fontFamily: fonts.displayXBold, fontSize: 20, color: colors.ink, marginBottom: 18 },
});
