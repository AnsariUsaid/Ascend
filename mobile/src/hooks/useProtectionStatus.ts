import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import AscendNative from '../../modules/ascend-native';

/**
 * Live status of everything Ascend needs to actually protect you. The two
 * `*Required` flags are hard requirements (no usage read / no friction without
 * them); the other two are reliability boosts (the watcher can be killed without
 * the battery exemption; its notification is hidden without the notif permission).
 *
 * Like usePermissionStatus, this RE-CHECKS every time the app returns to the
 * foreground — the user grants these in system Settings (another app) and comes
 * back, so we must reflect the real current state, never assume.
 *
 * Every native call is wrapped: the battery/notification getters were added in
 * Phase E, so on an older installed build they simply read as `false` until the
 * next native rebuild — the UI degrades gracefully instead of crashing.
 */
export type ProtectionStatus = {
  usageAccess: boolean;
  overlay: boolean;
  batteryExempt: boolean;
  notifications: boolean;
};

const safe = (fn: () => boolean): boolean => {
  try {
    return fn();
  } catch {
    return false;
  }
};

const read = (): ProtectionStatus => ({
  usageAccess: safe(AscendNative.hasUsageAccess),
  overlay: safe(AscendNative.hasOverlayPermission),
  batteryExempt: safe(AscendNative.isIgnoringBatteryOptimizations),
  notifications: safe(AscendNative.hasNotificationPermission),
});

export function useProtectionStatus() {
  const [status, setStatus] = useState<ProtectionStatus>(read);

  const recheck = useCallback(() => setStatus(read()), []);

  useEffect(() => {
    recheck();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') recheck();
    });
    return () => sub.remove();
  }, [recheck]);

  return { ...status, recheck };
}
