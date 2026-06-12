import { Text, StyleSheet, TextStyle } from 'react-native';
import { colors, fonts } from '../theme';

type Props = {
  size?: number;
  color?: string;
  style?: TextStyle;
};

/** "ASCEND" wordmark with the spec letter-spacing (0.16em). */
export function Wordmark({ size = 42, color = colors.cream, style }: Props) {
  return (
    <Text style={[styles.mark, { fontSize: size, color, letterSpacing: size * 0.16 }, style]}>
      ASCEND
    </Text>
  );
}

const styles = StyleSheet.create({
  mark: { fontFamily: fonts.displayXBold },
});
