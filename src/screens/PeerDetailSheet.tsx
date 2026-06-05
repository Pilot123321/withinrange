import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HandleList } from '../components/HandleList';
import { Photo } from '../components/Photo';
import { PrimaryButton } from '../components/PrimaryButton';
import { SafetyMenu } from '../components/SafetyMenu';
import { Sheet } from '../components/Sheet';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { INTENTS } from '../intents';
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
          <View style={styles.nameRow}>
            <Text style={styles.name}>{peer.displayName}</Text>
            <VerifiedBadge verified={peer.verified} size={18} />
          </View>
          <View style={styles.closenessRow}>
            <Ionicons name="location" size={14} color={colors.textSoft} />
            <Text style={styles.closeness}>{closenessLabel[peer.closeness]}</Text>
          </View>
          {!!peer.bio && <Text style={styles.bio}>{peer.bio}</Text>}

          {peer.intents.length > 0 && (
            <View style={styles.intentRow}>
              {peer.intents.map((tag) => (
                <View key={tag} style={styles.intentChip}>
                  <Text style={styles.intentText}>
                    {INTENTS[tag].emoji} {INTENTS[tag].label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {(peer.mbti || peer.hobbies.length > 0) && (
            <View style={styles.intentRow}>
              {!!peer.mbti && (
                <View style={[styles.intentChip, styles.mbtiChip]}>
                  <Text style={styles.mbtiText}>{peer.mbti}</Text>
                </View>
              )}
              {peer.hobbies.map((h) => (
                <View key={h} style={styles.intentChip}>
                  <Text style={styles.intentText}>{h}</Text>
                </View>
              ))}
            </View>
          )}

          {matched ? (
            <>
              <Text style={styles.matched}>✅ Connected</Text>
              <HandleList handles={matched.handles} demo={matched.demo} />
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
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.sm },
  name: { fontSize: font.title, fontWeight: '700', color: colors.text },
  closenessRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  closeness: { fontSize: font.small, color: colors.textSoft },
  bio: { fontSize: font.body, color: colors.text, textAlign: 'center', lineHeight: 24, marginVertical: space.sm },
  intentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
  intentChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
  },
  intentText: { fontSize: font.small, fontWeight: '600', color: colors.text },
  mbtiChip: { backgroundColor: colors.accent },
  mbtiText: { fontSize: font.small, fontWeight: '800', color: colors.primaryText, letterSpacing: 0.5 },
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
