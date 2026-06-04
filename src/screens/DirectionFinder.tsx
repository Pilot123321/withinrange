import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';
import { Photo } from '../components/Photo';
import { PrimaryButton } from '../components/PrimaryButton';
import { SafetyMenu } from '../components/SafetyMenu';
import { RangingTech } from '../ranging';
import { colors, font, radius, space } from '../theme';
import { NearbyPeer } from '../types';
import { useHeading } from '../useHeading';

// Short human label for each ranging radio, shown as "via UWB · WiFi · BLE".
const techLabel = (t: RangingTech) =>
  ({ uwb: 'UWB', ble_cs: 'BLE CS', wifi_rtt: 'WiFi', ble_rssi: 'BLE' }[t]);

// AirTag-style finder: a big arrow points toward the person. The arrow combines
// where they are (peer.bearing, absolute) with which way the phone is facing
// (compass heading), so as you turn, it keeps pointing at them.
export function DirectionFinder({
  peer,
  sent,
  onSayHi,
  onReport,
  onBlock,
  onClose,
  connected,
}: {
  peer: NearbyPeer | null;
  sent: boolean;
  onSayHi: () => void;
  onReport: (reason: string) => void;
  onBlock: () => void;
  onClose: () => void;
  // True when you've already connected — show a "connected" note instead of the
  // "say hi" affordance (their socials live in the Connections tab).
  connected?: boolean;
}) {
  const heading = useHeading(!!peer);
  const [safety, setSafety] = useState(false);

  // Relative direction to draw the arrow. Without a compass we fall back to the
  // absolute bearing (arrow won't react to turning, but still points sensibly).
  const rotation = peer ? (peer.bearing - (heading ?? 0) + 360) % 360 : 0;

  const close = peer ? peer.distanceM <= 1.3 : false;
  const status = !peer
    ? ''
    : close
    ? "You're basically there 🎯"
    : peer.distanceM <= 3
    ? 'Very close — look around'
    : peer.distanceM <= 6
    ? 'Getting closer'
    : 'Head this way';

  return (
    <Modal visible={!!peer} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.screen}>
        {peer && (
          <>
            <View style={styles.who}>
              <Photo photoUri={peer.photoUri} avatar={peer.avatar} size={56} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{peer.displayName}</Text>
                <Text style={styles.distance}>
                  {close ? 'right next to you' : `about ${peer.distanceM.toFixed(1)} m`}
                  {peer.accuracyM != null && !close ? ` · ±${peer.accuracyM.toFixed(1)} m` : ''}
                </Text>
                {!!peer.via?.length && <Text style={styles.via}>via {peer.via.map(techLabel).join(' · ')}</Text>}
              </View>
            </View>

            <View style={styles.dialWrap}>
              <View style={[styles.arrow, { transform: [{ rotate: `${rotation}deg` }] }]}>
                <Svg width={200} height={200}>
                  <Circle cx={100} cy={100} r={96} stroke={colors.border} strokeWidth={2} fill={colors.surface} />
                  <Polygon
                    points="100,28 138,150 100,124 62,150"
                    fill={close ? colors.success : colors.primary}
                  />
                </Svg>
              </View>
            </View>

            <Text style={styles.status}>{status}</Text>
            {heading == null && (
              <Text style={styles.note}>Compass unavailable here — arrow shows their direction, not relative to you.</Text>
            )}

            <View style={styles.actions}>
              {connected ? (
                <View style={styles.handlePill}>
                  <Text style={styles.handleText}>✅ Connected</Text>
                  <Text style={styles.demoNote}>their socials are in your Connections tab</Text>
                </View>
              ) : sent ? (
                <View style={styles.sentPill}>
                  <Text style={styles.sentText}>👋 hi sent — you'll connect if they're open too</Text>
                </View>
              ) : (
                <PrimaryButton label="Say hi 👋" onPress={onSayHi} style={styles.btn} />
              )}
              <PrimaryButton label="Done" variant="subtle" onPress={onClose} style={styles.btn} />
              <Pressable onPress={() => setSafety(true)} accessibilityRole="button" style={styles.report}>
                <Text style={styles.reportText}>Report or block</Text>
              </Pressable>
            </View>

            <SafetyMenu
              visible={safety}
              name={peer.displayName}
              onBlock={() => {
                setSafety(false);
                onBlock();
              }}
              onReport={(reason) => {
                setSafety(false);
                onReport(reason);
              }}
              onClose={() => setSafety(false)}
            />
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', padding: space.lg, gap: space.lg },
  who: { flexDirection: 'row', alignItems: 'center', gap: space.md, alignSelf: 'stretch', marginTop: space.md },
  name: { fontSize: font.title, fontWeight: '700', color: colors.text },
  distance: { fontSize: font.body, color: colors.textSoft },
  via: { fontSize: font.small, color: colors.textSoft, marginTop: 1 },
  dialWrap: { flex: 1, justifyContent: 'center' },
  arrow: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  status: { fontSize: font.title, fontWeight: '800', color: colors.text, textAlign: 'center' },
  note: { fontSize: font.small, color: colors.textSoft, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: space.sm },
  btn: { alignSelf: 'stretch' },
  report: { alignItems: 'center', paddingVertical: space.sm },
  reportText: { fontSize: font.small, fontWeight: '700', color: colors.textSoft, textDecorationLine: 'underline' },
  sentPill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  sentText: { fontSize: font.small, color: colors.textSoft, textAlign: 'center', fontWeight: '600' },
  handlePill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  handleText: { fontSize: font.body, fontWeight: '700', color: colors.success },
  demoNote: { fontSize: 11, color: colors.textSoft, marginTop: 2 },
});
