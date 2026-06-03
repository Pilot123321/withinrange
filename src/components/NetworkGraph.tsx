import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Line } from 'react-native-svg';
import { Photo } from './Photo';
import { MyProfile, NearbyPeer } from '../types';
import { colors, font, space } from '../theme';

const AnimatedLine = Animated.createAnimatedComponent(Line);

// Distance bucket → which ring (0 = innermost = closest).
const RING: Record<NearbyPeer['closeness'], number> = {
  'right-here': 0,
  'a-few-steps': 1,
  nearby: 2,
};

const NODE = 56; // node photo diameter

// Renders the room as a living network: "you" at the center, each nearby person
// a node on a distance ring, joined by dashed edges whose dashes flow inward —
// a gentle sense of connection pulling toward you.
export function NetworkGraph({
  me,
  peers,
  sentHellos,
  onSelect,
}: {
  me: MyProfile;
  peers: NearbyPeer[];
  sentHellos: string[];
  onSelect: (peer: NearbyPeer) => void;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const flow = useRef(new Animated.Value(0)).current;

  // One continuous loop drives the "flow" along every edge.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(flow, { toValue: 1, duration: 1600, easing: Easing.linear, useNativeDriver: false })
    );
    loop.start();
    return () => loop.stop();
  }, [flow]);

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  }

  const cx = size.w / 2;
  const cy = size.h / 2;
  // Leave room for each node AND the name label beneath it.
  const pad = NODE / 2 + 26;
  // Phone width limits a circle, but there's lots of vertical room — so lay the
  // rings out as an ELLIPSE that fills the height. Bigger rings + the taller
  // axis keep nodes (and their labels) from overlapping each other or "You".
  const rxMax = Math.max(40, cx - pad);
  const ryMax = Math.max(40, cy - pad);
  const RING_FRACTION = [0.45, 0.72, 1]; // inner → outer ring sizes

  // Even angular spread; offset by ring so rings don't line up into spokes.
  const placed = peers.map((peer, i) => {
    const ring = RING[peer.closeness];
    const f = RING_FRACTION[ring];
    const angle = (i / Math.max(peers.length, 1)) * Math.PI * 2 - Math.PI / 2 + ring * 0.7;
    const x = cx + Math.cos(angle) * rxMax * f;
    const y = cy + Math.sin(angle) * ryMax * f;
    return { peer, x, y, sent: sentHellos.includes(peer.id) };
  });

  // dashoffset animates 0 → -16 so dashes appear to travel toward the center.
  const dashOffset = flow.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });

  return (
    <View style={styles.canvas} onLayout={onLayout}>
      {size.w > 0 && (
        <>
          <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
            {/* faint elliptical guide rings — the "radar" feel */}
            {RING_FRACTION.map((f, ring) => (
              <Ellipse
                key={ring}
                cx={cx}
                cy={cy}
                rx={rxMax * f}
                ry={ryMax * f}
                stroke={colors.border}
                strokeWidth={1}
                fill="none"
              />
            ))}
            {/* Confidence "cloud": a soft halo whose radius is the ranging
                uncertainty (±metres). We show honest position confidence rather
                than a fake-precise dot — an idea borrowed from the confidence
                heatmaps in multi-sensor fusion work (e.g. the "wallhacks" radar
                project, itself inspired by MIT CSAIL RF-Pose). We sense only
                consenting app users via their own phones — never through walls. */}
            {placed.map(({ peer, x, y }) =>
              peer.accuracyM != null ? (
                <Circle
                  key={`halo-${peer.id}`}
                  cx={x}
                  cy={y}
                  r={NODE / 2 + Math.min(40, peer.accuracyM * 9)}
                  fill={peer.avatar.color}
                  opacity={0.12}
                />
              ) : null
            )}

            {/* edges from you to each person */}
            {placed.map(({ peer, x, y, sent }) => (
              <AnimatedLine
                key={peer.id}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke={sent ? colors.primary : colors.textSoft}
                strokeWidth={sent ? 2.5 : 1.5}
                strokeDasharray={[2, 6]}
                strokeDashoffset={dashOffset}
                opacity={sent ? 0.9 : 0.5}
              />
            ))}
          </Svg>

          {/* center: you */}
          <View style={[styles.node, { left: cx - NODE / 2, top: cy - NODE / 2 }]} pointerEvents="none">
            <View style={styles.meHalo}>
              <Photo photoUri={me.photoUri} avatar={me.avatar} size={NODE} />
            </View>
            <Text style={styles.meLabel}>You</Text>
          </View>

          {/* people around you */}
          {placed.map(({ peer, x, y, sent }) => (
            <Pressable
              key={peer.id}
              onPress={() => onSelect(peer)}
              accessibilityRole="button"
              accessibilityLabel={`${peer.displayName}, ${peer.closeness.replace(/-/g, ' ')}${sent ? ', hi sent' : ''}`}
              style={[styles.node, { left: x - NODE / 2, top: y - NODE / 2 }]}
            >
              <View>
                <Photo photoUri={peer.photoUri} avatar={peer.avatar} size={NODE} />
                {peer.verified && (
                  <View style={styles.nodeBadge}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                  </View>
                )}
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {peer.displayName}
              </Text>
              {sent && <Text style={styles.sent}>👋 sent</Text>}
            </Pressable>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { flex: 1, overflow: 'hidden' },
  node: { position: 'absolute', width: NODE, alignItems: 'center' },
  nodeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.bg,
    borderRadius: 10,
  },
  meHalo: {
    borderRadius: NODE,
    borderWidth: 3,
    borderColor: colors.primary,
    padding: 2,
  },
  meLabel: { fontSize: font.small, fontWeight: '800', color: colors.primary, marginTop: 2 },
  name: {
    fontSize: font.small,
    fontWeight: '700',
    color: colors.text,
    marginTop: 5,
    maxWidth: NODE + 20,
    textAlign: 'center',
    backgroundColor: colors.bg,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  sent: { fontSize: 11, color: colors.primary, fontWeight: '700' },
});
