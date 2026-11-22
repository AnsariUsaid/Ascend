import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fonts, radius } from '../theme';
import { Announcement, openAnnouncementLink } from '../data/announcements';

// Announcements get their own calm teal so they don't read as a warning (amber)
// or as the streak (coral).
const TEAL = '#2f7a6d';
const TEAL_BG = '#e4f1ee';
const TEAL_BORDER = '#cde4de';

/**
 * A full-width, collapsible note from the Ascend team. Collapsed it's one quiet
 * line (title · action · chevron); the chevron expands the full message. It
 * isn't dismissible — it stays while the announcement is live in
 * web/public/announcements.json, and being collapsed keeps it out of the way.
 */
export function AnnouncementPill({ item }: { item: Announcement }) {
  const [open, setOpen] = useState(false);
  const hasLink = !!(item.url && item.button);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => !o);
  };

  return (
    <View style={styles.pill}>
      <Pressable
        onPress={toggle}
        style={styles.row}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${item.title}. ${open ? 'Hide' : 'Show'} message`}
      >
        <Feather name="bell" size={15} color={TEAL} />
        <Text style={styles.title} numberOfLines={open ? undefined : 1}>
          {item.title}
        </Text>
        {hasLink ? (
          <Pressable onPress={() => openAnnouncementLink(item.url!)} style={styles.action} hitSlop={6}>
            <Text style={styles.actionText} numberOfLines={1}>
              {item.button}
            </Text>
          </Pressable>
        ) : null}
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={TEAL} />
      </Pressable>
      {open ? <Text style={styles.body}>{item.body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: TEAL_BG,
    borderWidth: 1,
    borderColor: TEAL_BORDER,
    borderRadius: radius.cardSm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 32 },
  title: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: '#1f4d45' },
  action: {
    backgroundColor: TEAL,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: 150,
  },
  actionText: { fontFamily: fonts.semibold, fontSize: 12.5, color: '#ffffff' },
  body: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#35574f',
    marginTop: 8,
    marginBottom: 4,
  },
});
