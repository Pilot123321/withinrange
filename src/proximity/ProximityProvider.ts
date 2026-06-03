import { MatchReveal, MyProfile, NearbyPeer } from '../types';

// The seam between the app and *how* we detect/connect to nearby people.
//
// Today: SimulatedProximity (fake peers, runs on one device — proves the flow).
// Next:  BleProximity — phones advertise a rotating anonymous id over
//        Bluetooth LE and scan for others; "hi"/match signaling rides a small
//        backend. The UI never changes because it only talks to this interface.
//
// Privacy is structural: a NearbyPeer carries NO real identity. Real name +
// instagram cross the wire only inside onMatch, and only after BOTH sides opt in.
export type ProximityHandlers = {
  // The current set of people in range (replace-in-full on each change).
  onPeersChanged: (peers: NearbyPeer[]) => void;
  // Someone nearby said hi to *me*. I was never told who passed on me, and
  // they aren't told if I ignore this — silence is a soft, painless "no".
  onIncomingHello: (peer: NearbyPeer) => void;
  // Both sides said hi → reveal contact info to each other. The happy path.
  onMatch: (match: MatchReveal) => void;
};

export interface ProximityProvider {
  // Begin advertising myself + scanning. I'm only discoverable while started.
  start(profile: MyProfile, handlers: ProximityHandlers): void;
  // Stop advertising + scanning. I become invisible immediately.
  stop(): void;
  // Send a low-pressure "hi" to a nearby person. They only learn it's me if
  // they're also open to me — otherwise it quietly evaporates.
  sayHi(peerId: string): void;
  // Respond to an incoming hello. `open: false` dismisses silently.
  respondToHello(peerId: string, open: boolean): void;
}
