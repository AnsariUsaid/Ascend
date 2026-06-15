import { Pressable, Text, StyleSheet, View } from 'react-native';
import { AppChip } from './AppChip';
import { Checkbox } from './Checkbox';
import { colors, fonts, radius } from '../theme';

type AppLike = { name: string; glyph: string; hue: number };

type Props = {
  app: AppLike;
  selected: boolean;
  onToggle: () => void;
  /** Caption under the name (e.g. "Currently monitored"). */
  caption?: string;
};

/** Multi-select row: chip + name (+caption) + checkbox. Used in onboarding & Edit Apps. */
export function AppSelectRow({ app, selected, onToggle, caption }: Props) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && { backgroundColor: '#fdf9f1' },
      ]}
    >
      <AppChip hue={app.hue} glyph={app.glyph} size={38} />
      <View style={styles.text}>
        <Text style={styles.name}>{app.name}</Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
      <Checkbox checked={selected} />
    </Pressable>
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
  rowSelected: { borderColor: 'rgba(210,96,63,0.55)' },
  text: { flex: 1, marginLeft: 12 },
  name: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.ink },
  caption: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.muted3, marginTop: 2 },
});
