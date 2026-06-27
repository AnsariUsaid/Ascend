import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { useStatusBarStyle } from '../hooks/useStatusBarStyle';

/**
 * Opaque cream strip behind the translucent status bar, for pushed cream
 * sub-screens (baseline / time-saved / app-detail). Edge-to-edge means content
 * scrolls under the status bar; without this, a dark card sliding up collides
 * with the dark system icons. The strip keeps that area cream so the icons stay
 * legible — the same treatment the tab layout applies. Also re-asserts dark
 * icons on focus (e.g. when arriving from the light-icon friction screen).
 *
 * Render it as the LAST child of the screen's root view (a sibling after the
 * ScrollView) so it sits on top of the scrolling content.
 */
export function StatusBarCap() {
  const insets = useSafeAreaInsets();
  useStatusBarStyle('dark');
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: colors.cream,
      }}
    />
  );
}
