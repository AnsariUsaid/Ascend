import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius } from '../theme';
import { useProtectionStatus } from '../hooks/useProtectionStatus';
import AscendNative from '../../modules/ascend-native';

/**
 * The Settings "Protection" hub: live status of the four things Ascend needs,
 * each tappable to jump to the right system screen to fix it. Required items
 * (usage / overlay) read red when off; reliability items (battery / notifications)
 * read amber — useful but not fatal. Status re-checks when you return to the app.
 */
type Row = {
  key: string;
  label: string;
  desc: string;
  ok: boolean;
  required: boolean;
  fix: () => void;
};

export function ProtectionCard() {
  const { usageAccess, overlay, batteryExempt, notifications } = useProtectionStatus();

  const rows: Row[] = [
    {
      key: 'usage',
      label: 'Usage Access',
      desc: 'Read your screen time',
      ok: usageAccess,
      required: true,
      fix: () => AscendNative.openUsageAccessSettings(),
    },
    {
      key: 'overlay',
      label: 'Display Over Apps',
      desc: 'Show friction over other apps',
      ok: overlay,
      required: true,
      fix: () => AscendNative.openOverlaySettings(),
    },
    {
      key: 'battery',
      label: 'Unrestricted Battery',
      desc: 'Stops the OS killing the watcher',
      ok: batteryExempt,
      required: false,
      fix: () => AscendNative.openBatteryOptimizationSettings(),
    },
    {
      key: 'notif',
      label: 'Notifications',
      desc: 'Shows the guard is running',
      ok: notifications,
      required: false,
      fix: () => AscendNative.openNotificationSettings(),
    },
  ];

  return (
    <View style={{ marginTop: 24 }}>
      <Text style={styles.sectionLabel}>PROTECTION</Text>
      <View style={styles.group}>
        {rows.map((r, i) => (
          <Pressable
            key={r.key}
            onPress={r.fix}
            style={({ pressed }) => [
              styles.row,
              i < rows.length - 1 && styles.divider,
              pressed && { backgroundColor: '#fdf9f1' },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{r.label}</Text>
              <Text style={styles.desc}>{r.desc}</Text>
            </View>
            <StatusPill ok={r.ok} required={r.required} />
            <Feather name="chevron-right" size={20} color={colors.faint} style={{ marginLeft: 4 }} />
          </Pressable>
        ))}
      </View>
      <Text style={styles.note}>
        On Samsung, also add Ascend to “Never sleeping apps” (Settings → Battery → Background
        usage limits) so it keeps watching.
      </Text>
    </View>
  );
}

function StatusPill({ ok, required }: { ok: boolean; required: boolean }) {
  if (ok) {
    return (
      <View style={[styles.pill, { backgroundColor: colors.successBg }]}>
        <Feather name="check" size={12} color={colors.successText} />
        <Text style={[styles.pillText, { color: colors.successText }]}>On</Text>
      </View>
    );
  }
  // Off: red if it's a hard requirement, amber if it's a reliability nudge.
  const bg = required ? colors.dangerBg : '#f7ecd6';
  const fg = required ? colors.dangerText : '#9a6a1f';
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Feather name="alert-triangle" size={11} color={fg} />
      <Text style={[styles.pillText, { color: fg }]}>{required ? 'Required' : 'Off'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    letterSpacing: 0.14 * 12.5,
    color: colors.muted2,
    marginBottom: 10,
  },
  group: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  label: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.ink },
  desc: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.muted3, marginTop: 2 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: { fontFamily: fonts.semibold, fontSize: 12 },
  note: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted3,
    marginTop: 8,
    paddingHorizontal: 4,
  },
});
