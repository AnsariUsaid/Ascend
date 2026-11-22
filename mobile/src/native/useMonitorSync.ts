import { useEffect } from 'react';
import { AppState } from 'react-native';
import AscendNative from '../../modules/ascend-native';
import { useAppStore } from '../store/useAppStore';
import { useFocusStore } from '../store/useFocusStore';
import { DEFAULT_LIMIT } from '../data/apps';
import { useStoresHydrated } from '../hooks/useStoresHydrated';

/**
 * Keeps the native background watcher (Phase D foreground service) in sync with
 * the user's config. The service can only do its job when BOTH special
 * permissions are granted AND there's at least one monitored app (or a Focus
 * session is running) — so we arm it exactly then, and disarm otherwise.
 *
 * We re-sync whenever the selection/limits change and every time the app returns
 * to the foreground (the user may have just toggled a permission in Settings, or
 * edited limits). All calls are wrapped — on a stock device without the native
 * module (shouldn't happen on the dev build) we simply do nothing.
 */
export function useMonitorSync() {
  const selected = useAppStore((s) => s.selected);
  const limits = useAppStore((s) => s.limits);
  // Until saved settings load, `selected` is the empty default — syncing then
  // would switch the watcher off on every launch. If loading failed, leave the
  // watcher as it is rather than act on defaults.
  const { status } = useStoresHydrated();
  // A running Focus session needs the watcher even with no daily limits set.
  const focusRunning = useFocusStore((s) => s.session?.runningSince != null);

  useEffect(() => {
    if (status !== 'ready') return;
    const sync = () => {
      try {
        const hasPerms = AscendNative.hasUsageAccess() && AscendNative.hasOverlayPermission();
        const keys = Object.keys(selected).filter((k) => selected[k]);
        if (hasPerms && (keys.length > 0 || focusRunning)) {
          AscendNative.startWatching(
            keys.map((packageName) => ({
              packageName,
              limitMinutes: limits[packageName] ?? DEFAULT_LIMIT,
            })),
          );
        } else {
          AscendNative.stopWatching();
        }
      } catch {
        // native module unavailable — no-op
      }
    };

    sync();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => sub.remove();
  }, [selected, limits, status, focusRunning]);
}
