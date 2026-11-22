import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius } from '../theme';
import {
  Announcement,
  openAnnouncementLink,
  useAnnouncementStore,
} from '../data/announcements';

/**
 * A small note from the Ascend team (see src/data/announcements.ts).
 * "Maybe later" / "Got it" dismisses it for good — we never re-show a card the
 * user has waved away, so it can't become nagging.
 */
export function AnnouncementCard({ item }: { item: Announcement }) {
  const dismiss = useAnnouncementStore((s) => s.dismiss);
  const hasLink = !!(item.url && item.button);
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Feather name="message-circle" size={16} color={colors.coral} />
        <Text style={styles.title}>{item.title}</Text>
      </View>
      <Text style={styles.body}>{item.body}</Text>
      <View style={styles.actions}>
        {hasLink ? (
          <Pressable
            onPress={() => openAnnouncementLink(item.url!)}
            style={[styles.btn, styles.primary]}
          >
            <Text style={styles.primaryText}>{item.button}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => dismiss(item.id)} style={[styles.btn, styles.secondary]}>
          <Text style={styles.secondaryText}>{hasLink ? 'Maybe later' : 'Got it'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.cardSm,
    padding: 16,
    marginBottom: 16,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.muted, lineHeight: 20, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.coral },
  primaryText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.cream },
  secondary: { backgroundColor: '#f3ece2' },
  secondaryText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
});
