import { View, Text, StyleSheet } from 'react-native';
import { appChipColors, fonts } from '../theme';

type Props = {
  /** App hue in degrees (see theme `appHues`). */
  hue: number;
  /** Letter/glyph to show — placeholder until real app icons are wired in. */
  glyph: string;
  size?: number;
};

/** Rounded-square app-identity chip. Placeholder glyph stands in for the real icon. */
export function AppChip({ hue, glyph, size = 38 }: Props) {
  const { bg, glyph: glyphColor } = appChipColors(hue);
  return (
    <View
      style={[
        styles.chip,
        { width: size, height: size, borderRadius: size * 0.3, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.glyph, { color: glyphColor, fontSize: size * 0.45 }]}>{glyph}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { alignItems: 'center', justifyContent: 'center' },
  glyph: { fontFamily: fonts.displayXBold },
});
