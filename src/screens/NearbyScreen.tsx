import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { NetworkGraph } from '../components/NetworkGraph';
import { Photo } from '../components/Photo';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { useStore } from '../store';
import { colors, font, radius, space } from '../theme';
import { NearbyPeer } from '../types';
import { DirectionFinder } from './DirectionFinder';
import { PeerDetailSheet } from './PeerDetailSheet';
import { ProfileEditor } from './ProfileEditor';

export function NearbyScreen({ onSayHi }: { onSayHi: (peerId: string) => void }) {
  const { state, dispatch } = useStore();
  const { profile, isOpen, peers, sentHellos, matches } = state;
  const [selected, setSelected] = useState<NearbyPeer | null>(null);
  const [finding, setFinding] = useState<NearbyPeer | null>(null);
  const [editing, setEditing] = useState(false);

  if (!profile) return null;
  // Keep the open sheets in sync with live peer data (distance/bearing/sent).
  const selectedLive = selected ? peers.find((p) => p.id === selected.id) ?? null : null;
  const findingLive = finding ? peers.find((p) => p.id === finding.id) ?? null : null;
  const matchedFor = (id: string) => matches.find((m) => m.peerId === id) ?? null;

  const blockPeer = (id: string) => {
    dispatch({ type: 'BLOCK', peerId: id });
    setSelected(null);
    setFinding(null);
  };
  const reportPeer = (id: string, reason: string) => {
    dispatch({ type: 'REPORT', peerId: id, reason });
    setSelected(null);
    setFinding(null);
  };

  return (
    <View style={styles.flex}>
      <View style={styles.nav}>
        <Text style={styles.largeTitle}>Nearby</Text>
        <View style={styles.toggle} accessibilityRole="switch" accessibilityState={{ checked: isOpen }}>
          <Text style={styles.toggleLabel}>{isOpen ? 'Open' : 'Hidden'}</Text>
          <Switch
            value={isOpen}
            onValueChange={(v) => dispatch({ type: 'SET_OPEN', value: v })}
            trackColor={{ true: colors.success, false: colors.border }}
            ios_backgroundColor={colors.border}
            accessibilityLabel="Open to connect"
          />
        </View>
      </View>

      <Pressable
        style={styles.profileRow}
        onPress={() => setEditing(true)}
        accessibilityRole="button"
        accessibilityLabel="Edit your profile"
      >
        <Photo photoUri={profile.photoUri} avatar={profile.avatar} size={40} />
        <View style={styles.profileText}>
          <View style={styles.meNameRow}>
            <Text style={styles.meName}>{profile.displayName || 'You'}</Text>
            <VerifiedBadge verified={profile.verified} size={15} />
          </View>
          <Text style={styles.meEdit}>Edit profile</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSoft} />
      </Pressable>

      {!isOpen ? (
        <EmptyState title="You're hidden right now" body="No one nearby can see you. Flip “Open” on when you're ready." />
      ) : peers.length === 0 ? (
        <EmptyState
          title="Looking around…"
          body="When people who also use withinrange are near you, they'll appear on your map."
        />
      ) : (
        <NetworkGraph me={profile} peers={peers} sentHellos={sentHellos} onSelect={setSelected} />
      )}

      {isOpen && peers.length > 0 && (
        <Text style={styles.footer}>Tap anyone to see their vibe. No one is ever told if you pass.</Text>
      )}

      <PeerDetailSheet
        peer={selectedLive}
        sent={!!selectedLive && sentHellos.includes(selectedLive.id)}
        matched={selectedLive ? matchedFor(selectedLive.id) : null}
        onSayHi={() => selectedLive && onSayHi(selectedLive.id)}
        onFind={() => {
          setFinding(selected);
          setSelected(null);
        }}
        onReport={(reason) => selectedLive && reportPeer(selectedLive.id, reason)}
        onBlock={() => selectedLive && blockPeer(selectedLive.id)}
        onClose={() => setSelected(null)}
      />
      <DirectionFinder
        peer={findingLive}
        sent={!!findingLive && sentHellos.includes(findingLive.id)}
        matchedHandle={findingLive ? matchedFor(findingLive.id)?.instagram : undefined}
        demo={findingLive ? matchedFor(findingLive.id)?.demo : undefined}
        onSayHi={() => findingLive && onSayHi(findingLive.id)}
        onReport={(reason) => findingLive && reportPeer(findingLive.id, reason)}
        onBlock={() => findingLive && blockPeer(findingLive.id)}
        onClose={() => setFinding(null)}
      />
      <ProfileEditor visible={editing} onClose={() => setEditing(false)} />
    </View>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.sm,
  },
  largeTitle: { fontSize: font.display, fontWeight: '700', color: colors.text, letterSpacing: 0.37 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    marginHorizontal: space.md,
    marginBottom: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
  },
  profileText: { flex: 1 },
  meNameRow: { flexDirection: 'row', alignItems: 'center' },
  meName: { fontSize: font.body, fontWeight: '600', color: colors.text },
  meEdit: { fontSize: font.small, color: colors.textSoft },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  toggleLabel: { fontSize: font.small, color: colors.textSoft, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.sm },
  emptyTitle: { fontSize: font.title, fontWeight: '800', color: colors.text, textAlign: 'center' },
  emptyBody: { fontSize: font.body, color: colors.textSoft, textAlign: 'center', lineHeight: 24 },
  footer: { fontSize: font.small, color: colors.textSoft, textAlign: 'center', padding: space.md },
});
