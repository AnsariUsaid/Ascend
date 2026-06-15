import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Tracks a native permission boolean and RE-CHECKS it every time the app comes
 * back to the foreground. That's the key behavior for "special" permissions:
 * the user leaves to a system Settings screen (another app) and returns, and we
 * must reflect the real, current state — never assume it was granted.
 *
 * @param check a synchronous native getter, e.g. AscendNative.hasUsageAccess
 */
export function usePermissionStatus(check: () => boolean) {
  const [granted, setGranted] = useState(false);

  const recheck = useCallback(() => {
    try {
      setGranted(check());
    } catch {
      setGranted(false);
    }
  }, [check]);

  useEffect(() => {
    recheck(); // initial check on mount
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') recheck(); // returned from Settings → re-verify
    });
    return () => sub.remove();
  }, [recheck]);

  return { granted, recheck };
}
