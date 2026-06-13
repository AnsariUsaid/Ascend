import { useEffect, useRef } from 'react';
import { Pressable, Animated } from 'react-native';
import { colors } from '../theme';

type Props = {
  value: boolean;
  onChange: (v: boolean) => void;
};

/** 48×29 track, thumb 19px on / 13px off, 0.2s animation (per handoff). */
export function Toggle({ value, onChange }: Props) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.disabled, colors.coral],
  });
  const thumbSize = anim.interpolate({ inputRange: [0, 1], outputRange: [13, 19] });
  const thumbLeft = anim.interpolate({ inputRange: [0, 1], outputRange: [4, 25] });
  const thumbTop = anim.interpolate({ inputRange: [0, 1], outputRange: [8, 5] });

  return (
    <Pressable onPress={() => onChange(!value)} hitSlop={8}>
      <Animated.View
        style={{ width: 48, height: 29, borderRadius: 99, backgroundColor: trackColor }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            width: thumbSize,
            height: thumbSize,
            borderRadius: 99,
            left: thumbLeft,
            top: thumbTop,
            backgroundColor: colors.white,
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
