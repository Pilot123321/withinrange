import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { TabBar, TabKey } from './src/components/TabBar';
import { ProximityProvider } from './src/proximity/ProximityProvider';
import { SimulatedProximity } from './src/proximity/SimulatedProximity';
import { IncomingHello } from './src/screens/IncomingHello';
import { MatchesScreen } from './src/screens/MatchesScreen';
import { MatchOverlay } from './src/screens/MatchOverlay';
import { NearbyScreen } from './src/screens/NearbyScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { initialState, reducer, StoreContext } from './src/store';
import { colors } from './src/theme';
import { publishWidgetState } from './src/widget';

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [tab, setTab] = useState<TabKey>('nearby');
  const store = useMemo(() => ({ state, dispatch }), [state]);

  // The proximity engine. Swap `SimulatedProximity` for a Bluetooth-backed
  // provider later and nothing below has to change.
  const provider = useRef<ProximityProvider>(new SimulatedProximity());

  // Start advertising/scanning only while I'm in the app AND open to connect.
  useEffect(() => {
    if (state.phase !== 'main' || !state.profile) return;
    if (!state.isOpen) {
      provider.current.stop();
      return;
    }
    provider.current.start(state.profile, {
      onPeersChanged: (peers) => dispatch({ type: 'PEERS_CHANGED', peers }),
      onIncomingHello: (peer) => dispatch({ type: 'INCOMING_HELLO', peer }),
      onMatch: (reveal) => dispatch({ type: 'MATCH', reveal }),
    });
    return () => provider.current.stop();
  }, [state.phase, state.isOpen, state.profile]);

  // Keep the iOS home-screen widget in sync (no-op everywhere but a native build).
  useEffect(() => {
    publishWidgetState({ open: state.isOpen, nearbyCount: state.peers.length });
  }, [state.isOpen, state.peers.length]);

  return (
    <SafeAreaProvider>
      <StoreContext.Provider value={store}>
        <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
          <StatusBar style="dark" />
        {state.phase === 'onboarding' ? (
          <OnboardingScreen />
        ) : (
          <View style={styles.flex}>
            <View style={styles.flex}>
              {tab === 'nearby' ? (
                <NearbyScreen
                  onSayHi={(peerId) => {
                    dispatch({ type: 'SAY_HI', peerId });
                    provider.current.sayHi(peerId);
                  }}
                />
              ) : (
                <MatchesScreen />
              )}
            </View>
            <TabBar active={tab} onChange={setTab} matchCount={state.matches.length} />
          </View>
        )}

        <IncomingHello
          peer={state.incoming}
          onOpen={() => state.incoming && provider.current.respondToHello(state.incoming.id, true)}
          onDismiss={() => {
            if (state.incoming) provider.current.respondToHello(state.incoming.id, false);
            dispatch({ type: 'DISMISS_INCOMING' });
          }}
        />

        <MatchOverlay
          match={state.match}
          onDone={() => dispatch({ type: 'CLEAR_MATCH' })}
          onReport={(peerId, reason) => dispatch({ type: 'REPORT', peerId, reason })}
          onBlock={(peerId) => dispatch({ type: 'BLOCK', peerId })}
        />
        </SafeAreaView>
      </StoreContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
});
