import { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AppChip, Button } from '../src/components';
import { night } from '../src/components/focus/palette';
import { Mountain } from '../src/components/focus/Mountain';
import { fonts } from '../src/theme';
import { useFocusStore, elapsedMs, remainingMs } from '../src/store/useFocusStore';
import { useStoresHydrated } from '../src/hooks/useStoresHydrated';
import { getApp } from '../src/data/installedApps';
import { formatDuration } from '../src/data/mock';
import { useStatusBarStyle } from '../src/hooks/useStatusBarStyle';
import AscendNative from '../modules/ascend-native';

/** "27:14", or "1:05:09" for an hour or more. */
function clock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h > 0 ? `${h}:${String(m).padStart(2, '0')}` : m}:${String(s).padStart(2, '0')}`;
}

/**
 * Shown over an app the user left behind for a Focus session. Calm, no questions:
 * the app simply stays closed until the climb is over. Stopping is always possible
 * from the Focus tab, so this never traps anyone.
 */
export default function FocusBlock() {
  useStatusBarStyle('light');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ app?: string }>();
  const { status } = useStoresHydrated();
  const session = useFocusStore((s) => s.session);
  const [, setTick] = useState(0);

  const app = getApp(params.app ?? '');
  const blocking =
    !!session && session.runningSince != null && session.apps.includes(app.packageName) && remainingMs(session) > 0;

  // Leave exactly once — several paths can fire together.
  const closed = useRef(false);
  const close = (backToApp: boolean) => {
    if (closed.current) return;
    closed.current = true;
    if (backToApp) {
      try {
        AscendNative.returnToPreviousApp();
      } catch {}
    }
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };
  const backToFocus = () => {
    if (closed.current) return;
    closed.current = true;
    router.dismissTo('/(tabs)/focus');
  };

  // Hardware Back does nothing here; the way out is "Back to focus".
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Walking away (Home / Recents / screen off) closes this. Not a way around it:
  // the watcher shows it again within ~2s if the app is opened.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') close(true);
    });
    return () => sub.remove();
  }, []);

  // Count down; when the climb ends (or it was paused/stopped), hand the app back.
  useEffect(() => {
    if (status === 'loading') return;
    if (!blocking) {
      useFocusStore.getState().finishIfDone();
      close(true);
      return;
    }
    const id = setInterval(() => {
      setTick((n) => n + 1);
      const s = useFocusStore.getState().session;
      if (!s || remainingMs(s) <= 0) {
        useFocusStore.getState().finishIfDone();
        close(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [status, blocking]);

  if (status === 'loading' || !session) return <View style={styles.fill} />;

  const climbed = Math.max(1, Math.round(elapsedMs(session) / 60000));

  return (
    <View style={[styles.fill, { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 28 }]}>
      <View style={styles.center}>
        <View>
          <AppChip hue={app.hue} glyph={app.glyph} size={60} />
          <View style={styles.lock}>
            <Feather name="lock" size={14} color={night.dot} />
          </View>
        </View>
        <Text style={styles.title}>{app.name} can wait</Text>
        <Text style={styles.sub}>
          You're {formatDuration(climbed)} up the mountain.{'\n'}
          {clock(remainingMs(session))} to the summit.
        </Text>
        <View style={{ alignSelf: 'stretch', marginTop: 28 }}>
          <Mountain mode="climb" progress={elapsedMs(session) / session.durationMs} />
        </View>
      </View>
      <Button label="Back to focus" onPress={backToFocus} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: night.bg, paddingHorizontal: 24 },
  center: { flex: 1, alignItems: 'center' },
  lock: {
    position: 'absolute',
    right: -9,
    bottom: -9,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: night.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.displayXBold, fontSize: 28, color: night.text, marginTop: 26, textAlign: 'center' },
  sub: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: night.sub, textAlign: 'center', marginTop: 8 },
});
