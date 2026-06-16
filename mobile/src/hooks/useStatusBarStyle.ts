import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle, StatusBarStyle } from 'expo-status-bar';

/**
 * Set the system status-bar icon style (light icons for dark backgrounds, dark
 * icons for light backgrounds) **every time this screen gains focus**.
 *
 * Why on focus and not just on mount: expo-status-bar doesn't reset when a screen
 * unmounts, so a `light` screen would "leak" its style onto the next screen.
 * Re-asserting on focus guarantees each screen owns its own status-bar style —
 * correct through navigation, tab switches, and modals opening/closing.
 */
export function useStatusBarStyle(style: StatusBarStyle) {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(style);
    }, [style]),
  );
}
