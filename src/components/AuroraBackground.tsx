import { Accelerometer } from 'expo-sensors';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

// A living, "Stitch"-style backdrop: soft blue→violet gradient glows that
// slowly drift on their own AND parallax with the phone's tilt (accelerometer),
// each blob at a different depth so the layer feels 3D. On web/desktop, where
// there's no motion sensor, the blobs just keep drifting — still alive.

type Blob = {
  color: string;
  size: number; // diameter in px
  x: number; // resting center, fraction of screen width
  y: number; // resting center, fraction of screen height
  depth: number; // parallax strength: bigger = moves more with tilt
  drift: number; // auto-drift amplitude in px
  period: number; // auto-drift loop duration (ms)
};

const BLOBS: Blob[] = [
  { color: '#1A73E8', size: 1.5, x: 0.18, y: 0.12, depth: 26, drift: 16, period: 9000 },
  { color: '#7C5CFF', size: 1.7, x: 0.85, y: 0.32, depth: 46, drift: 22, period: 12000 },
  { color: '#C7A6FF', size: 1.2, x: 0.5, y: 0.78, depth: 64, drift: 18, period: 10500 },
  { color: '#24D9EC', size: 1.0, x: 0.92, y: 0.92, depth: 36, drift: 14, period: 14000 },
];

export function AuroraBackground() {
  const { width, height } = Dimensions.get('window');
  // One auto-drift driver, reused (phase-shifted) across blobs.
  const drift = useRef(new Animated.Value(0)).current;
  // Smoothed tilt, -1..1 on each axis, from the accelerometer.
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: 16000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    let alive = true;
    Accelerometer.isAvailableAsync().then((ok) => {
      if (!ok || !alive) return; // web/desktop: drift-only, no tilt
      Accelerometer.setUpdateInterval(60);
      sub = Accelerometer.addListener(({ x, y }) => {
        // Ease toward the new reading so motion is buttery, not jittery.
        Animated.timing(tiltX, { toValue: x, duration: 120, useNativeDriver: false }).start();
        Animated.timing(tiltY, { toValue: y, duration: 120, useNativeDriver: false }).start();
      });
    });
    return () => {
      alive = false;
      sub?.remove();
    };
  }, [tiltX, tiltY]);

  const layers = useMemo(
    () =>
      BLOBS.map((b, i) => {
        const d = b.size * width;
        const cx = b.x * width - d / 2;
        const cy = b.y * height - d / 2;
        // Auto-drift: a gentle circular wander, phase-shifted per blob.
        const phase = i / BLOBS.length;
        const dx = drift.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [0, b.drift, 0, -b.drift, 0].map((v) => v * Math.cos(phase * Math.PI * 2)),
        });
        const dy = drift.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [b.drift, 0, -b.drift, 0, b.drift].map((v) => v * Math.sin(phase * Math.PI * 2 + 1)),
        });
        // Tilt parallax: deeper blobs move more, so the stack reads as 3D.
        const px = tiltX.interpolate({ inputRange: [-1, 1], outputRange: [b.depth, -b.depth] });
        const py = tiltY.interpolate({ inputRange: [-1, 1], outputRange: [-b.depth, b.depth] });
        // Fluid "breathing": each blob slowly swells and shrinks, lava-lamp style,
        // phase-shifted so the whole field churns instead of pulsing in unison.
        const scale = drift.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: i % 2 === 0 ? [0.82, 1.18, 0.82] : [1.16, 0.84, 1.16],
        });
        return { b, d, cx, cy, tx: Animated.add(dx, px), ty: Animated.add(dy, py), scale };
      }),
    [width, height, drift, tiltX, tiltY]
  );

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]} pointerEvents="none">
      {layers.map(({ b, d, cx, cy, tx, ty, scale }, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            transform: [{ translateX: tx }, { translateY: ty }, { scale }],
          }}
        >
          <Svg width={d} height={d}>
            <Defs>
              <RadialGradient id={`g${i}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={b.color} stopOpacity={0.95} />
                <Stop offset="35%" stopColor={b.color} stopOpacity={0.55} />
                <Stop offset="70%" stopColor={b.color} stopOpacity={0.22} />
                <Stop offset="100%" stopColor={b.color} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={d / 2} cy={d / 2} r={d / 2} fill={`url(#g${i})`} />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Sits on the darkest surface tone; glows bloom on top of it.
  root: { backgroundColor: colors.bg, overflow: 'hidden' },
});
