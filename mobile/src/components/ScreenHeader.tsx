import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fonts } from '../theme';

type Props = {
  title: string;
  /** Right-aligned caption (e.g. "3 selected"). */
  rightText?: string;
};

/** Back arrow + title row for pushed sub-screens (no bottom nav). */
export function ScreenHeader({ title, rightText }: Props) {
  const router = useRouter();
  return (
    <View style={styles.row}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
        <Feather name="arrow-left" size={24} color={colors.ink} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      {rightText ? <Text style={styles.right}>{rightText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  back: { marginRight: 14 },
  title: { flex: 1, fontFamily: fonts.displayXBold, fontSize: 22, color: colors.ink },
  right: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted2 },
});
