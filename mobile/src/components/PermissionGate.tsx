import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Button } from './Button';
import { Wordmark } from './Wordmark';
import { colors, fonts } from '../theme';
import { useProtectionStatus } from '../hooks/useProtectionStatus';
import { useAppStore } from '../store/useAppStore';
import AscendNative from '../../modules/ascend-native';

/**
 * Full-screen hard block shown when a REQUIRED permission (Usage Access or
 * Overlay) has been revoked while the user is actively set up. Without these the
 * app is silently useless — it can't read usage or show friction — so instead of
 * pretending all is well, we cover the app until the user re-grants. The status
 * hook re-checks on foreground, so returning from Settings auto-dismisses this.
 *
 * Battery exemption + notifications are NOT gated here — they're reliability
 * nudges (surfaced in Settings → Protection), not hard requirements.
 */
export function PermissionGate() {
  const insets = useSafeAreaInsets();
  const { usageAccess, overlay } = useProtectionStatus();
  // Only block someone who has actually finished setup (has monitored apps);
  // a fresh/empty install is handled by onboarding, not this gate.
  const isSetUp = useAppStore((s) => s.selectedKeys().length > 0);

  const blocked = isSetUp && (!usageAccess || !overlay);
  if (!blocked) return null;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <Feather name="shield-off" size={34} color={colors.coral} />
        </View>
        <Wordmark size={22} style={{ marginTop: 22 }} />
        <Text style={styles.title}>Ascend can't protect you</Text>
        <Text style={styles.sub}>
          A permission Ascend needs was turned off. Until you turn it back on, your limits
          aren't being enforced.
        </Text>
      </View>

      <View style={styles.actions}>
        {!usageAccess && (
          <Button
            label="Re-grant Usage Access"
            variant="google"
            onPress={() => AscendNative.openUsageAccessSettings()}
          />
        )}
        {!overlay && (
          <Button
            label="Re-grant Display Over Apps"
            variant="google"
            onPress={() => AscendNative.openOverlaySettings()}
          />
        )}
        <Text style={styles.hint}>This screen closes automatically once it's restored.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: colors.coral,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.displayXBold,
    fontSize: 27,
    color: colors.cream,
    marginTop: 26,
    textAlign: 'center',
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 15.5,
    lineHeight: 23,
    color: 'rgba(251,244,234,0.85)',
    textAlign: 'center',
    marginTop: 14,
  },
  actions: { gap: 10 },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: 'rgba(251,244,234,0.7)',
    textAlign: 'center',
    marginTop: 4,
  },
});
