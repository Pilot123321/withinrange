import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { HandleList } from '../components/HandleList';
import { Photo } from '../components/Photo';
import { PrimaryButton } from '../components/PrimaryButton';
import { SafetyMenu } from '../components/SafetyMenu';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { useStore } from '../store';
import { colors, font, radius, space } from '../theme';
import { MatchReveal } from '../types';

// The payoff: both said hi, so now their socials are shared between the two of
// you. Celebratory and mutual — never one-sided.
export function MatchOverlay({
  match,
  onDone,
  onReport,
  onBlock,
}: {
  match: MatchReveal | null;
  onDone: () => void;
  onReport: (peerId: string, reason: string) => void;
  onBlock: (peerId: string) => void;
}) {
  const { state } = useStore();
  const me = state.profile;
  const [safety, setSafety] = useState(false);

  return (
    <Modal visible={!!match} transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.kicker}>You connected 🎉</Text>

          <View style={styles.avatars}>
            {me && <Photo photoUri={me.photoUri} avatar={me.avatar} size={64} />}
            <Text style={styles.plus}>+</Text>
            {match && <Photo photoUri={match.photoUri} avatar={match.avatar} size={64} />}
          </View>

          {match && (
            <>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{match.displayName}</Text>
                <VerifiedBadge verified={match.verified} size={20} />
              </View>
              {!!match.bio && <Text style={styles.bio}>{match.bio}</Text>}
              <HandleList handles={match.handles} demo={match.demo} />
              {match.demo && <Text style={styles.demoNote}>simulated — not real accounts</Text>}
            </>
          )}

          <Text style={styles.note}>Shared just between the two of you. Go say hi 👋</Text>
          <PrimaryButton label="Done" onPress={onDone} style={styles.btn} />
          <Pressable onPress={() => setSafety(true)} accessibilityRole="button" style={styles.report}>
            <Text style={styles.reportText}>Report or block</Text>
          </Pressable>

          {match && (
            <SafetyMenu
              visible={safety}
              name={match.displayName}
              onBlock={() => {
                setSafety(false);
                onBlock(match.peerId);
                onDone();
              }}
              onReport={(reason) => {
                setSafety(false);
                onReport(match.peerId, reason);
                onDone();
              }}
              onClose={() => setSafety(false)}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31,27,24,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.xl,
    alignItems: 'center',
    gap: space.sm,
    alignSelf: 'stretch',
  },
  kicker: { fontSize: font.title, fontWeight: '800', color: colors.accent },
  avatars: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginVertical: space.sm },
  plus: { fontSize: font.title, color: colors.textSoft, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: font.display, fontWeight: '800', color: colors.text },
  bio: { fontSize: font.body, color: colors.textSoft, textAlign: 'center', lineHeight: 24, marginBottom: space.xs },
  handlePill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  handle: { fontSize: font.body, fontWeight: '700', color: colors.accent },
  demoNote: { fontSize: 11, color: colors.textSoft, marginTop: 2 },
  note: { fontSize: font.small, color: colors.textSoft, textAlign: 'center', lineHeight: 22, marginTop: space.xs },
  btn: { alignSelf: 'stretch', marginTop: space.sm },
  report: { paddingVertical: space.sm },
  reportText: { fontSize: font.small, fontWeight: '700', color: colors.textSoft, textDecorationLine: 'underline' },
});
