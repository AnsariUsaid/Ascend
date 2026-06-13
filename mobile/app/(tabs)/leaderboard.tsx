import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../src/theme';
import { leaderboard, leaderboardResetIn, formatDuration, LeaderRow } from '../../src/data/mock';
import { useAppStore } from '../../src/store/useAppStore';

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function Avatar({ name, size, ring }: { name: string; size: number; ring?: boolean }) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ring ? 3 : 0,
          borderColor: colors.coral,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.34 }]}>{initials(name)}</Text>
    </View>
  );
}

function PodiumSpot({ row, place }: { row: LeaderRow; place: 1 | 2 | 3 }) {
  const first = place === 1;
  const blockColor = first ? colors.coral : colors.track;
  const blockH = first ? 84 : place === 2 ? 64 : 52;
  return (
    <View style={[styles.podiumSpot, first && { marginBottom: 0 }]}>
      <Avatar name={row.name} size={first ? 68 : 56} ring={first} />
      <Text style={styles.podiumName} numberOfLines={1}>
        {row.name}
      </Text>
      <View style={[styles.podiumBlock, { backgroundColor: blockColor, height: blockH }]}>
        <Text style={[styles.podiumRank, { color: first ? colors.cream : colors.muted }]}>#{place}</Text>
        <Text style={[styles.podiumPct, { color: first ? colors.cream : colors.successText }]}>
          ↓{Math.abs(row.reductionPct)}%
        </Text>
      </View>
    </View>
  );
}

export default function Leaderboard() {
  const insets = useSafeAreaInsets();
  const optIn = useAppStore((s) => s.leaderboardOptIn);

  const top3 = leaderboard.filter((r) => r.rank <= 3).sort((a, b) => a.rank - b.rank);
  const rest = leaderboard.filter((r) => r.rank >= 4 && !r.isYou);
  const you = leaderboard.find((r) => r.isYou);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: spacing.screenH, paddingBottom: 24 }}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Leaderboard</Text>
          <View style={styles.resetPill}>
            <View style={styles.resetDot} />
            <Text style={styles.resetText}>Resets in {leaderboardResetIn}</Text>
          </View>
        </View>
        <Text style={styles.caption}>This week · ranked by % screen-time reduction</Text>

        {/* Podium */}
        <View style={styles.podium}>
          {top3[1] ? <PodiumSpot row={top3[1]} place={2} /> : null}
          {top3[0] ? <PodiumSpot row={top3[0]} place={1} /> : null}
          {top3[2] ? <PodiumSpot row={top3[2]} place={3} /> : null}
        </View>

        {/* List #4+ */}
        <View style={{ marginTop: 8 }}>
          {rest.map((r) => (
            <View key={`${r.rank}-${r.name}`} style={styles.listRow}>
              <Text style={styles.listRank}>{r.rank}</Text>
              <Avatar name={r.name} size={36} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.listName}>{r.name}</Text>
                <Text style={styles.listSaved}>{formatDuration(r.savedMinutes)} saved</Text>
              </View>
              <Text style={styles.listPct}>↓{Math.abs(r.reductionPct)}%</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Pinned current-user row */}
      {you ? (
        <View style={[styles.pinned, { paddingBottom: insets.bottom + 14 }]}>
          {optIn ? (
            <View style={styles.pinnedInner}>
              <Text style={styles.pinnedRank}>#{you.rank}</Text>
              <Avatar name={you.name} size={38} ring />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.pinnedName}>{you.name} (you)</Text>
                <Text style={styles.pinnedMeta}>
                  {formatDuration(you.savedMinutes)} saved · 2 spots to top 5
                </Text>
              </View>
              <Text style={styles.pinnedPct}>↓{Math.abs(you.reductionPct)}%</Text>
            </View>
          ) : (
            <Text style={styles.hidden}>
              You're hidden from rankings. Turn on “Show me on Leaderboard” in Settings to compete.
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.displayXBold, fontSize: 27, color: colors.ink },
  resetPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(210,96,63,0.12)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  resetDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.coral, marginRight: 6 },
  resetText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.coralText },
  caption: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted2, marginTop: 6 },

  avatar: { backgroundColor: colors.coffee, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.semibold, color: colors.cream },

  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginTop: 28 },
  podiumSpot: { flex: 1, alignItems: 'center' },
  podiumName: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink, marginTop: 8, marginBottom: 8 },
  podiumBlock: { width: '100%', borderTopLeftRadius: 12, borderTopRightRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 2 },
  podiumRank: { fontFamily: fonts.displayXBold, fontSize: 18 },
  podiumPct: { fontFamily: fonts.semibold, fontSize: 13 },

  listRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.cardSm, padding: 12, marginBottom: 10 },
  listRank: { width: 24, fontFamily: fonts.display, fontSize: 15, color: colors.faint, textAlign: 'center', marginRight: 8 },
  listName: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  listSaved: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.muted2, marginTop: 2 },
  listPct: { fontFamily: fonts.semibold, fontSize: 14, color: colors.successText },

  pinned: { backgroundColor: colors.coffee, paddingHorizontal: spacing.screenH, paddingTop: 14 },
  pinnedInner: { flexDirection: 'row', alignItems: 'center' },
  pinnedRank: { width: 30, fontFamily: fonts.displayXBold, fontSize: 16, color: colors.amber, textAlign: 'center', marginRight: 6 },
  pinnedName: { fontFamily: fonts.semibold, fontSize: 15, color: colors.cream },
  pinnedMeta: { fontFamily: fonts.regular, fontSize: 12.5, color: 'rgba(251,244,234,0.6)', marginTop: 2 },
  pinnedPct: { fontFamily: fonts.semibold, fontSize: 14, color: colors.successBg },
  hidden: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: 'rgba(251,244,234,0.75)', textAlign: 'center' },
});
