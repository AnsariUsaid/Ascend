import { useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronMark, Wordmark } from '../src/components';
import { colors, fonts } from '../src/theme';
import { useAppStore } from '../src/store/useAppStore';
import { useStatusBarStyle } from '../src/hooks/useStatusBarStyle';

export default function Splash() {
  const router = useRouter();
  const rise = useRef(new Animated.Value(0)).current;
  useStatusBarStyle('light'); // coral background → white icons

  // Rising-sun loader loop (visual only — safe to run on mount).
  useEffect(() => {
    Animated.loop(
      Animated.timing(rise, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  // Auto-advance — but ONLY while the splash is the focused screen. A returning,
  // set-up user skips sign-in + onboarding and lands on the dashboard; a fresh user
  // starts at sign-in. (Auth is stubbed, so the persisted `onboarded` flag is our
  // "returning user" signal for now; read via getState() at fire time so we see the
  // rehydrated value.)
  //
  // Why useFocusEffect, not useEffect: when the app cold-starts straight into the
  // friction overlay (the native watcher's ascend://friction deep link), the splash
  // still mounts underneath the modal but isn't focused. A plain timer would fire
  // anyway and yank the user off friction to the dashboard (issue #4). Tying it to
  // focus means it stays quiet under friction, and only advances once friction is
  // dismissed and the splash actually regains focus.
  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => {
        const onboarded = useAppStore.getState().onboarded;
        router.replace(onboarded ? '/(tabs)/home' : '/sign-in');
      }, 2600);
      return () => clearTimeout(t);
    }, []),
  );

  const translateY = rise.interpolate({ inputRange: [0, 1], outputRange: [18, -2] });
  const opacity = rise.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 1, 0.2] });

  return (
    <View style={styles.root}>
      <ChevronMark size={72} />
      <Wordmark size={42} style={{ marginTop: 18 }} />
      <Text style={styles.tagline}>Break the Scroll. Earn Your Feed.</Text>

      <View style={styles.loaderBox}>
        <Animated.View
          style={[styles.sun, { opacity, transform: [{ translateY }] }]}
        />
        <View style={styles.horizon} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: 'rgba(251,244,234,0.75)',
  },
  loaderBox: {
    position: 'absolute',
    bottom: 90,
    width: 64,
    height: 44,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  sun: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.cream,
    marginBottom: 6,
  },
  horizon: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(251,244,234,0.45)',
  },
});
