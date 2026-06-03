import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Photo } from '../components/Photo';
import { SafetyMenu } from '../components/SafetyMenu';
import { useStore } from '../store';
import { colors, font, radius, space } from '../theme';
import { MatchReveal, NearbyPeer } from '../types';
import { DirectionFinder } from './DirectionFinder';

// The "Matches" tab: everyone you've mutually said hi to and swapped Instagram
// with. Tap a handle to open Instagram (never for simulated demo matches), and
// re-open the finder for anyone who's still in range.
export function MatchesScreen() {
  const { state, dispatch } = useStore();
  const { matches, peers } = state;
  const [finding, setFinding] = useState<NearbyPeer | null>(null);
  const [safetyFor, setSafetyFor] = useState<MatchReveal | null>(null);

  const nearbyById = new Map(peers.map((p) => [p.id, p]));
  const findingLive = finding ? peers.find((p) => p.id === finding.id) ?? null : null;
  const matchedHandleFor = (id: string) => matches.find((m) => m.peerId === id);

  function openInstagram(m: MatchReveal) {
    if (m.demo) return; // simulated handle — never open a real profile
    Linking.openURL(`https://instagram.com/${m.instagram}`);
  }

  function clearAfterSafety() {
    setSafetyFor(null);
    setFinding(null);
  }

  return (
    <View style={styles.flex}>
      <View style={styles.nav}>
        <Text style={styles.largeTitle}>Matches</Text>
      </View>

      {matches.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={44} color={colors.textSoft} />
          <Text style={styles.emptyTitle}>No connections yet</Text>
          <Text style={styles.emptyBody}>
            When you and someone nearby both say hi, you'll swap Instagram — and they'll show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(m) => m.peerId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const nearby = nearbyById.get(item.peerId);
            return (
              <View style={styles.row}>
                <Photo photoUri={item.photoUri} avatar={item.avatar} size={52} />
                <View style={styles.rowText}>
                  <Text style={styles.name}>{item.displayName}</Text>
                  <Pressable
                    onPress={() => openInstagram(item)}
                    disabled={item.demo}
                    accessibilityRole="link"
                    accessibilityLabel={`Open Instagram @${item.instagram}`}
                  >
                    <Text style={styles.handle}>
                      @{item.instagram}
                      {item.demo ? ' · simulated' : ''}
                    </Text>
                  </Pressable>
                  {nearby && <Text style={styles.nearbyNote}>● nearby now</Text>}
                </View>
                {nearby && (
                  <Pressable
                    style={styles.findBtn}
                    onPress={() => setFinding(nearby)}
                    accessibilityRole="button"
                    accessibilityLabel={`Find ${item.displayName}`}
                  >
                    <Ionicons name="navigate" size={18} color={colors.primary} />
                  </Pressable>
                )}
                <Pressable
                  style={styles.moreBtn}
                  onPress={() => setSafetyFor(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Report or block ${item.displayName}`}
                >
                  <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSoft} />
                </Pressable>
              </View>
            );
          }}
        />
      )}

      <DirectionFinder
        peer={findingLive}
        sent={false}
        matchedHandle={findingLive ? matchedHandleFor(findingLive.id)?.instagram : undefined}
        demo={findingLive ? matchedHandleFor(findingLive.id)?.demo : undefined}
        onSayHi={() => {}}
        onReport={(reason) => {
          if (findingLive) dispatch({ type: 'REPORT', peerId: findingLive.id, reason });
          setFinding(null);
        }}
        onBlock={() => {
          if (findingLive) dispatch({ type: 'BLOCK', peerId: findingLive.id });
          setFinding(null);
        }}
        onClose={() => setFinding(null)}
      />

      <SafetyMenu
        visible={!!safetyFor}
        name={safetyFor?.displayName ?? ''}
        onBlock={() => {
          if (safetyFor) dispatch({ type: 'BLOCK', peerId: safetyFor.peerId });
          clearAfterSafety();
        }}
        onReport={(reason) => {
          if (safetyFor) dispatch({ type: 'REPORT', peerId: safetyFor.peerId, reason });
          clearAfterSafety();
        }}
        onClose={() => setSafetyFor(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  nav: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.sm },
  largeTitle: { fontSize: font.display, fontWeight: '700', color: colors.text, letterSpacing: 0.37 },
  list: { paddingHorizontal: space.md, gap: space.sm, paddingBottom: space.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
  },
  rowText: { flex: 1 },
  name: { fontSize: font.body, fontWeight: '600', color: colors.text },
  handle: { fontSize: font.small, color: colors.accent, fontWeight: '600', marginTop: 1 },
  nearbyNote: { fontSize: font.small, color: colors.success, marginTop: 2, fontWeight: '600' },
  findBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBtn: { width: 32, height: 40, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.sm },
  emptyTitle: { fontSize: font.title, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: font.body, color: colors.textSoft, textAlign: 'center', lineHeight: 24 },
});
