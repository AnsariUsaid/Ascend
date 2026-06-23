import { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppChip } from './AppChip';
import { colors, fonts } from '../theme';

type Props = {
  hue: number;
  glyph: string;
  name: string;
  /** Secondary line under the name (e.g. "2h 5m total"). */
  sub?: string;
  /** Right-aligned content (e.g. a minutes value). */
  right?: ReactNode;
  /** When set, the row is tappable and shows a chevron. */
  onPress?: () => void;
};

/** A monitored-app row: chip + name (+ optional sub / right value). */
export function AppStatRow({ hue, glyph, name, sub, right, onPress }: Props) {
  const body = (
    <View style={styles.row}>
      <AppChip hue={hue} glyph={glyph} size={36} />
      <View style={styles.middle}>
        <Text style={styles.name}>{name}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
      {right}
      {onPress ? (
        <Feather name="chevron-right" size={18} color={colors.faint} style={{ marginLeft: 8 }} />
      ) : null}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  middle: { flex: 1, marginLeft: 12 },
  name: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.ink },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted2, marginTop: 2 },
});
