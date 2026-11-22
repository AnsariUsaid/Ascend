import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { colors } from '../../theme';
import { day, night } from './palette';

export type MountainMode = 'plan' | 'climb' | 'rest' | 'summit';

const VB_W = 320;
const VB_H = 200;

// The switchback trail from base camp to the summit, in viewBox units.
const TRAIL: [number, number][] = [
  [34, 190], [96, 180], [70, 162], [128, 146], [114, 130], [152, 104], [144, 88], [170, 44],
];
const SUMMIT: [number, number] = [170, 40];
const STARS: [number, number, number][] = [
  [28, 30, 1.3], [62, 12, 1], [104, 26, 0.9], [222, 16, 1.4], [268, 42, 1], [300, 14, 1.1], [252, 74, 0.8], [18, 78, 0.8],
];

// Cumulative distance along the trail, so progress moves at an even pace.
const SEGMENTS = TRAIL.slice(1).map((p, i) => Math.hypot(p[0] - TRAIL[i][0], p[1] - TRAIL[i][1]));
const TOTAL = SEGMENTS.reduce((a, b) => a + b, 0);

/** The point `t` (0..1) of the way up the trail, plus the trail drawn so far. */
function along(t: number): { point: [number, number]; walked: [number, number][] } {
  let left = Math.max(0, Math.min(1, t)) * TOTAL;
  const walked: [number, number][] = [TRAIL[0]];
  for (let i = 0; i < SEGMENTS.length; i++) {
    const [ax, ay] = TRAIL[i];
    const [bx, by] = TRAIL[i + 1];
    if (left <= SEGMENTS[i]) {
      const f = SEGMENTS[i] ? left / SEGMENTS[i] : 0;
      const point: [number, number] = [ax + (bx - ax) * f, ay + (by - ay) * f];
      walked.push(point);
      return { point, walked };
    }
    left -= SEGMENTS[i];
    walked.push(TRAIL[i + 1]);
  }
  return { point: TRAIL[TRAIL.length - 1], walked };
}

const pts = (list: [number, number][]) => list.map((p) => p.join(',')).join(' ');

type Props = { mode: MountainMode; progress: number };

/** The climb: a mountain whose trail lights up as focus time passes. */
export function Mountain({ mode, progress }: Props) {
  const [width, setWidth] = useState(0);
  const scale = width / VB_W;
  const dark = mode !== 'plan';
  const t = mode === 'plan' ? 0 : mode === 'summit' ? 1 : progress;
  const { point, walked } = useMemo(() => along(t), [t]);

  // Slow "breathing" glow around the climber (~5s a breath) — barely there, but alive.
  const breath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (mode !== 'climb') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [mode, breath]);

  // A little burst of stars when the flag goes up.
  const burst = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (mode !== 'summit') return;
    burst.setValue(0);
    Animated.timing(burst, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [mode, burst]);

  const flagColor = mode === 'summit' || mode === 'plan' ? colors.coral : night.line;
  const litColor = mode === 'rest' ? night.litRest : night.lit;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ aspectRatio: VB_W / VB_H }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`}>
        {dark && STARS.map(([x, y, r], i) => <Circle key={i} cx={x} cy={y} r={r} fill={night.text} opacity={0.7} />)}
        <Path d="M110 200 L236 86 L320 168 L320 200 Z" fill={dark ? night.peakBack : day.peakBack} />
        <Path d="M0 200 L52 140 L88 162 L170 40 L236 128 L270 106 L320 200 Z" fill={dark ? night.peakFront : day.peakFront} />
        <Path d="M170 40 L158 58 L164 55 L170 60 L177 54 L183.5 58 Z" fill={dark ? night.snow : day.snow} />
        <Polyline
          points={pts(TRAIL)}
          fill="none"
          stroke={dark ? night.line : day.trail}
          strokeWidth={2}
          strokeDasharray="3 5"
          strokeLinecap="round"
        />
        {dark && walked.length > 1 && (
          <Polyline points={pts(walked)} fill="none" stroke={litColor} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
        )}
        <Path d={`M${SUMMIT[0]} ${SUMMIT[1]} L${SUMMIT[0]} ${SUMMIT[1] - 18} L${SUMMIT[0] + 13} ${SUMMIT[1] - 13} L${SUMMIT[0]} ${SUMMIT[1] - 8}`} fill={flagColor} stroke={flagColor} strokeWidth={1.4} />
        {mode === 'plan' && <Circle cx={TRAIL[0][0]} cy={TRAIL[0][1]} r={5} fill={colors.coral} />}
        {mode === 'rest' && (
          <Path d={`M${point[0] - 9} ${point[1] + 5} L${point[0]} ${point[1] - 8} L${point[0] + 9} ${point[1] + 5} Z`} fill={night.lit} />
        )}
      </Svg>

      {mode === 'climb' && width > 0 && (
        <View pointerEvents="none" style={[styles.dotWrap, { left: point[0] * scale - 14, top: point[1] * scale - 14 }]}>
          <Animated.View
            style={[
              styles.glow,
              {
                opacity: breath.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.4] }),
                transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.5] }) }],
              },
            ]}
          />
          <View style={styles.dot} />
        </View>
      )}

      {mode === 'summit' && width > 0 && (
        <View pointerEvents="none" style={{ position: 'absolute', left: SUMMIT[0] * scale, top: (SUMMIT[1] - 12) * scale }}>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            const r = 34 + (i % 2) * 12;
            return (
              <Animated.View
                key={i}
                style={[
                  styles.spark,
                  {
                    opacity: burst.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0.55] }),
                    transform: [
                      { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(a) * r] }) },
                      { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(a) * r] }) },
                    ],
                  },
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dotWrap: { position: 'absolute', width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: colors.coral },
  dot: { width: 11, height: 11, borderRadius: 6, backgroundColor: night.dot },
  spark: { position: 'absolute', width: 5, height: 5, borderRadius: 3, marginLeft: -2.5, marginTop: -2.5, backgroundColor: night.dot },
});
