// Core domain types, shared across the app and the proximity layer.

import { RangingTech } from './ranging';

export type AvatarSpec = {
  emoji: string;
  color: string;
};

// How I describe myself. Real identity (name + instagram) is private and is
// ONLY ever shared with someone after a mutual "hi". Until then, others see
// just my anonymous alias + avatar.
export type MyProfile = {
  displayName: string;
  instagram: string; // handle without the leading "@"
  alias: string; // friendly two-word alias others see, e.g. "Sky Otter"
  avatar: AvatarSpec;
  bio: string; // 2–3 lines, anonymous "vibe" shown before any match
  // Real identity — revealed ONLY after a mutual match, never while browsing.
  photoUri?: string; // customizable profile photo (local image uri)
  verified: boolean; // passed selfie verification (a trust signal, anti-catfish)
};

// A person detected nearby — intentionally anonymous. No name, no photo,
// no exact distance. Their real identity is NOT included here.
export type NearbyPeer = {
  id: string; // ephemeral/rotating id
  displayName: string; // real first name, shown up front to build trust
  photoUri?: string; // real photo if set; otherwise the emoji avatar shows
  verified: boolean; // shows a verified badge; a trust/anti-catfish signal
  alias: string;
  avatar: AvatarSpec; // emoji avatar — the photo fallback
  bio: string; // short vibe — a signal to help you decide to say hi
  // Soft proximity bucket only — never raw meters (feels like surveillance).
  closeness: 'right-here' | 'a-few-steps' | 'nearby';
  // For the AirTag-style finder: where they are relative to North (degrees,
  // 0 = North, 90 = East) and a fused distance estimate in metres. Distance is
  // produced by the ranging engine (fusing BLE/UWB/WiFi); `accuracyM` is the
  // 1-σ uncertainty and `via` lists which radios contributed.
  bearing: number;
  distanceM: number;
  accuracyM?: number;
  via?: RangingTech[];
};

// Revealed to BOTH people only after a mutual hi. This is the payoff.
export type MatchReveal = {
  peerId: string;
  alias: string;
  avatar: AvatarSpec;
  displayName: string;
  instagram: string;
  bio: string;
  verified: boolean;
  photoUri?: string; // real profile photo, revealed with the rest on a match
  // True for simulated peers: handle is fake, so we MUST NOT deep-link to a
  // real instagram.com profile (it could belong to an uninvolved stranger).
  demo?: boolean;
};

export const closenessLabel: Record<NearbyPeer['closeness'], string> = {
  'right-here': 'right here',
  'a-few-steps': 'a few steps away',
  nearby: 'nearby',
};
