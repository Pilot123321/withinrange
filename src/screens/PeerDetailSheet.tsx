import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Photo } from '../components/Photo';
import { PrimaryButton } from '../components/PrimaryButton';
import { SafetyMenu } from '../components/SafetyMenu';
import { Sheet } from '../components/Sheet';
import { colors, font, radius, space } from '../theme';
import { closenessLabel, MatchReveal, NearbyPeer } from '../types';

// Tapping a node opens this. You see who they are + their vibe, and can send a
// private hi. Direction-finding is only offered AFTER a mutual match — pointing
// an arrow at someone who hasn't consented would be a stalking tool.
export function PeerDetailSheet({
  peer,
  sent,
  matched,
  onSayHi,
  onFind,
  onReport,
  onBlock,
  onClose,
}: {
  peer: NearbyPeer | null;
  sent: boolean;
  matched: MatchReveal | null;
  onSayHi: () => void;
  onFind: () => void;
  onReport: (reason: string) => void;
  onBlock: () => void;
  onClose: () => void;
}) {
  const [safety, setSafety] = useState(false);

  return (
    <Sheet visible={!!peer} onClose={onClose}>
      {peer && (
        <View style={styles.body}>
          <Photo photoUri={peer.photoUri} avatar={peer.avatar} size={88} />
          <Text style={styles.name}>{peer.displayName}</Text>
          <View style={styles.closenessRow}>
            <Ionicons name="location" size={14} color={colors.textSoft} />
            <Text style={styles.closeness}>{closenessLabel[peer.closeness]}</Text>
          </View>
          {!!peer.bio && <Text style={styles.bio}>{peer.bio}</Text>}

          {matched ? (
            <>
              <Text style={styles.matched}>✅ You matched · @{matched.instagram}</Text>
              <PrimaryButton label="Find them 🧭" onPress={onFind} style={styles.btn} />
            </>
          ) : sent ? (
            <View style={styles.sentPill}>
              <Text style={styles.sentText}>👋 hi sent — you'll only connect if they're open too</Text>
            </View>
          ) : (
            <PrimaryButton label="Say hi 👋" onPress={onSayHi} style={styles.btn} />
          )}

          {!matched && (
            <Text style={styles.gateNote}>🧭 You can find each other once you both say hi.</Text>
          )}

          <PrimaryButton label="Close" variant="subtle" onPress={onClose} style={styles.btn} />
          <Pressable onPress={() => setSafety(true)} accessibilityRole="button" style={styles.report}>
            <Ionicons name="flag-outline" size={15} color={colors.textSoft} />
            <Text style={styles.reportText}>Report or block</Text>
          </Pressable>
          <Text style={styles.note}>If you pass, they're never told. No pressure either way.</Text>

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
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', gap: space.sm, alignSelf: 'stretch' },
  name: { fontSize: font.title, fontWeight: '700', color: colors.text, marginTop: space.sm },
  closenessRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  closeness: { fontSize: font.small, color: colors.textSoft },
  bio: { fontSize: font.body, color: colors.text, textAlign: 'center', lineHeight: 24, marginVertical: space.sm },
  matched: { fontSize: font.body, fontWeight: '600', color: colors.success, textAlign: 'center' },
  btn: { alignSelf: 'stretch' },
  sentPill: {
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: space.md,
  },
  sentText: { fontSize: font.small, color: colors.textSoft, textAlign: 'center', fontWeight: '500' },
  gateNote: { fontSize: font.small, color: colors.textSoft, textAlign: 'center' },
  report: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: space.sm },
  reportText: { fontSize: font.small, fontWeight: '600', color: colors.textSoft },
  note: { fontSize: font.small, color: colors.textSoft, textAlign: 'center' },
});
