import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius } from '../theme';
import {
  Announcement,
  openAnnouncementLink,
  useAnnouncementStore,
} from '../data/announcements';

/** A small dismissible note from the Ascend team (see src/data/announcements.ts). */
export function AnnouncementCard({ item }: { item: Announcement }) {
  const dismiss = useAnnouncementStore((s) => s.dismiss);
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Feather name="message-circle" size={16} color={colors.coral} />
        <Text style={styles.title}>{item.title}</Text>
        <Pressable onPress={() => dismiss(item.id)} hitSlop={10} accessibilityLabel="Dismiss">
          <Feather name="x" size={18} color={colors.muted2} />
        </Pressable>
      </View>
      <Text style={styles.body}>{item.body}</Text>
      {item.url && item.button ? (
        <Pressable onPress={() => openAnnouncementLink(item.url!)} style={styles.button}>
          <Text style={styles.buttonText}>{item.button}</Text>
          <Feather name="arrow-up-right" size={15} color={colors.coral} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.cardSm,
    padding: 14,
    marginBottom: 16,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: fonts.semibold, fontSize: 14.5, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: 6 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 10 },
  buttonText: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.coral },
});
