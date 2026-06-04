import { createContext, useContext } from 'react';
import type { PersistedState } from './persistence';
import { MatchReveal, MyProfile, NearbyPeer } from './types';

export type Report = { peerId: string; reason: string; at: number };

// Anti-spam: at most this many hellos within the rolling window.
export const HELLO_LIMIT = 8;
export const HELLO_WINDOW_MS = 5 * 60 * 1000;

export type AppState = {
  phase: 'loading' | 'agegate' | 'onboarding' | 'main';
  profile: MyProfile | null;
  isOpen: boolean; // am I discoverable right now?
  verifiedOnly: boolean; // only let verified people say hi to me
  peers: NearbyPeer[];
  sentHellos: string[]; // peerIds I've said hi to (waiting, never "rejected")
  helloTimes: number[]; // timestamps of recent hellos (rate limiting)
  incoming: NearbyPeer | null; // an incoming hello awaiting my response
  match: MatchReveal | null; // a fresh mutual match to celebrate
  matches: MatchReveal[]; // everyone I've mutually matched — gates the finder
  blocked: string[]; // peerIds I've blocked → mutually invisible
  reports: Report[]; // reports I've filed (synced to safety backend later)
};

export const initialState: AppState = {
  phase: 'loading', // wait for persisted state to hydrate before routing
  profile: null,
  isOpen: true,
  verifiedOnly: false,
  peers: [],
  sentHellos: [],
  helloTimes: [],
  incoming: null,
  match: null,
  matches: [],
  blocked: [],
  reports: [],
};

// Hellos sent within the rolling window — used to enforce HELLO_LIMIT.
export function recentHelloCount(times: number[], now = Date.now()): number {
  return times.filter((t) => now - t < HELLO_WINDOW_MS).length;
}

export type Action =
  | { type: 'HYDRATE'; data: PersistedState | null }
  | { type: 'COMPLETE_AGEGATE' }
  | { type: 'COMPLETE_ONBOARDING'; profile: MyProfile }
  | { type: 'UPDATE_PROFILE'; profile: MyProfile }
  | { type: 'VERIFY_ME' }
  | { type: 'SET_VERIFIED_ONLY'; value: boolean }
  | { type: 'SET_OPEN'; value: boolean }
  | { type: 'PEERS_CHANGED'; peers: NearbyPeer[] }
  | { type: 'SAY_HI'; peerId: string }
  | { type: 'INCOMING_HELLO'; peer: NearbyPeer }
  | { type: 'DISMISS_INCOMING' }
  | { type: 'MATCH'; reveal: MatchReveal }
  | { type: 'CLEAR_MATCH' }
  | { type: 'BLOCK'; peerId: string }
  | { type: 'REPORT'; peerId: string; reason: string };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE': {
      // Restore saved data on launch. If we already have a profile, skip the
      // age gate + onboarding straight to the main app.
      const d = action.data;
      if (d?.profile) {
        return {
          ...state,
          profile: d.profile,
          matches: d.matches ?? [],
          blocked: d.blocked ?? [],
          reports: d.reports ?? [],
          verifiedOnly: d.verifiedOnly ?? false,
          phase: 'main',
        };
      }
      return { ...state, phase: 'agegate' };
    }

    case 'COMPLETE_AGEGATE':
      return { ...state, phase: 'onboarding' };

    case 'COMPLETE_ONBOARDING':
      return { ...state, phase: 'main', profile: action.profile, isOpen: true };

    case 'UPDATE_PROFILE':
      return { ...state, profile: action.profile };

    case 'VERIFY_ME':
      return state.profile ? { ...state, profile: { ...state.profile, verified: true } } : state;

    case 'SET_VERIFIED_ONLY':
      return { ...state, verifiedOnly: action.value };

    case 'SET_OPEN':
      // Turning off makes me invisible and clears the room I was seeing.
      return action.value
        ? { ...state, isOpen: true }
        : { ...state, isOpen: false, peers: [], incoming: null };

    case 'PEERS_CHANGED': {
      // Blocked people are invisible to me (and I to them, server-side).
      const visible = action.peers.filter((p) => !state.blocked.includes(p.id));
      const ids = new Set(visible.map((p) => p.id));
      return {
        ...state,
        peers: visible,
        sentHellos: state.sentHellos.filter((id) => ids.has(id)),
      };
    }

    case 'SAY_HI':
      if (state.sentHellos.includes(action.peerId)) return state;
      return {
        ...state,
        sentHellos: [...state.sentHellos, action.peerId],
        helloTimes: [...state.helloTimes, Date.now()],
      };

    case 'INCOMING_HELLO':
      // Only surface one at a time; ignore if I'm already looking at one.
      if (state.incoming) return state;
      // If I've chosen verified-only, silently drop hellos from unverified people.
      if (state.verifiedOnly && !action.peer.verified) return state;
      return { ...state, incoming: action.peer };

    case 'DISMISS_INCOMING':
      return { ...state, incoming: null };

    case 'MATCH': {
      // Record the match (dedupe) — being matched is what unlocks the finder.
      const matches = state.matches.some((m) => m.peerId === action.reveal.peerId)
        ? state.matches
        : [...state.matches, action.reveal];
      return { ...state, match: action.reveal, matches, incoming: null };
    }

    case 'CLEAR_MATCH':
      return { ...state, match: null };

    case 'BLOCK':
    case 'REPORT': {
      // Both remove the person from everywhere and make us mutually invisible.
      // REPORT additionally files a report for the safety backend.
      const peerId = action.peerId;
      return {
        ...state,
        blocked: state.blocked.includes(peerId) ? state.blocked : [...state.blocked, peerId],
        peers: state.peers.filter((p) => p.id !== peerId),
        sentHellos: state.sentHellos.filter((id) => id !== peerId),
        matches: state.matches.filter((m) => m.peerId !== peerId),
        incoming: state.incoming?.id === peerId ? null : state.incoming,
        match: state.match?.peerId === peerId ? null : state.match,
        reports:
          action.type === 'REPORT'
            ? [...state.reports, { peerId, reason: action.reason, at: Date.now() }]
            : state.reports,
      };
    }

    default:
      return state;
  }
}

export const StoreContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreContext.Provider');
  return ctx;
}
