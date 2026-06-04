import { INTENT_ORDER, IntentTag } from '../intents';
import { RangingEngine, RangingSample, RangingTech } from '../ranging';
import { colors } from '../theme';
import { MatchReveal, MyProfile, NearbyPeer, SocialHandle, SocialPlatform } from '../types';
import { ProximityHandlers, ProximityProvider } from './ProximityProvider';

// A fake "room" of people so the whole social flow can be felt on ONE device,
// with no backend and no second phone. Swap this for BleProximity later — the
// app code that consumes it doesn't change.
//
// To make distance feel real, each peer has a hidden TRUE position that we only
// observe through noisy, simulated radio samples (BLE RSSI always; plus UWB /
// WiFi-RTT / BLE Channel-Sounding when the pretend device supports them). Those
// run through the same RangingEngine the real app will use, so the smoothing and
// fusion you see here is the production math, not a fake number.

type SimPeer = {
  peer: NearbyPeer;
  // Hidden real identity — revealed ONLY on a mutual connect, never before.
  realName: string;
  handles: SocialHandle[];
  likesMe: boolean;
  // Hidden ground-truth distance + which radios this pretend phone supports.
  trueDistanceM: number;
  caps: RangingTech[];
  engine: RangingEngine;
};

// Gaussian noise via Box–Muller — for believable per-radio measurement error.
function gauss(mean: number, std: number): number {
  const u = Math.random() || 1e-9;
  const v = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Synthesize one noisy sample per supported radio from the true distance.
function sampleRadios(trueD: number, caps: RangingTech[]): RangingSample[] {
  const out: RangingSample[] = [];
  for (const tech of caps) {
    if (tech === 'ble_rssi') {
      const txPower = -59;
      const n = 2.2;
      const rssi = txPower - 10 * n * Math.log10(Math.max(0.3, trueD)) + gauss(0, 4);
      out.push({ tech, rssi, txPower });
    } else if (tech === 'wifi_rtt') {
      out.push({ tech, distanceM: Math.max(0.2, gauss(trueD, 1.2)) });
    } else if (tech === 'uwb') {
      out.push({ tech, distanceM: Math.max(0.05, gauss(trueD, 0.08)) });
    } else if (tech === 'ble_cs') {
      out.push({ tech, distanceM: Math.max(0.1, gauss(trueD, 0.35)) });
    }
  }
  return out;
}

// Decide which radios a pretend phone supports. BLE RSSI is universal; the
// better techs appear only on some devices (mirrors real-world fragmentation).
function randomCaps(): RangingTech[] {
  const caps: RangingTech[] = ['ble_rssi'];
  if (Math.random() < 0.5) caps.push('wifi_rtt'); // Android-class WiFi RTT
  const r = Math.random();
  if (r < 0.3) caps.push('uwb');
  else if (r < 0.6) caps.push('ble_cs');
  return caps;
}

const ADJECTIVES = ['Sky', 'River', 'Maple', 'Amber', 'Quiet', 'Sunny', 'Velvet', 'Cosmic', 'Hazel', 'Lucky'];
const ANIMALS = ['Otter', 'Sparrow', 'Fox', 'Koala', 'Heron', 'Lynx', 'Finch', 'Panda', 'Wren', 'Seal'];
const EMOJIS = ['🦦', '🐦', '🦊', '🐨', '🪶', '🐱', '🐧', '🐼', '🦉', '🦭'];
const NAMES = ['Alex', 'Sam', 'Jordan', 'Riley', 'Casey', 'Taylor', 'Jamie', 'Morgan', 'Devon', 'Quinn'];

// Neutral, networking-friendly vibes — withinrange is for swapping socials, not
// dating, so the copy stays away from romance.
const BIOS = [
  'cs major, building a side project\nhappy to talk shop',
  'here for the talks — say hi\ninto climbing and indie games',
  'product designer, coffee enthusiast\nshow me what you’re working on',
  'startup founder, always down to network\nask me anything',
  'new in town, looking for collaborators\nmusic + film nerd',
  'just here for the snacks 😄\nlet’s connect on LinkedIn',
];

const PLATFORM_POOL: SocialPlatform[] = ['instagram', 'linkedin', 'x', 'discord', 'snapchat'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Give a demo person 2–3 socials. Values are obviously fake (".sim") and the
// match is `demo`-flagged, so the UI never opens a real account.
// Give a demo person 1–2 intents so the room is browsable/filterable.
function makeIntents(): IntentTag[] {
  const shuffled = [...INTENT_ORDER].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 1 + Math.floor(Math.random() * 2));
}

function makeHandles(name: string): SocialHandle[] {
  const lower = name.toLowerCase();
  const shuffled = [...PLATFORM_POOL].sort(() => Math.random() - 0.5);
  const count = 2 + Math.floor(Math.random() * 2);
  return shuffled.slice(0, count).map((platform) => ({
    platform,
    value: platform === 'discord' ? `${lower}.sim#${1000 + Math.floor(Math.random() * 9000)}` : `${lower}.sim`,
  }));
}

// Discovery range: people farther than this are out of range and not shown.
export const MAX_RANGE_M = 8;

// Distance bucket from rough metres — keeps the graph rings + copy soft.
function closenessFor(distanceM: number): NearbyPeer['closeness'] {
  if (distanceM <= 2.5) return 'right-here';
  if (distanceM <= 5) return 'a-few-steps';
  return 'nearby'; // 5–8 m
}

let counter = 0;
function makeSimPeer(): SimPeer {
  counter += 1;
  const i = Math.floor(Math.random() * ANIMALS.length);
  const alias = `${pick(ADJECTIVES)} ${ANIMALS[i]}`;
  const name = pick(NAMES);
  const trueDistanceM = Math.round((0.8 + Math.random() * (MAX_RANGE_M - 0.8)) * 10) / 10; // up to 8 m
  const caps = randomCaps();
  return {
    peer: {
      id: `sim-${counter}`,
      displayName: name, // now shown up front
      // Demo peers have no real photo, so their emoji avatar shows instead.
      photoUri: undefined,
      alias,
      avatar: { emoji: EMOJIS[i], color: pick(colors.avatarPalette) },
      bio: pick(BIOS),
      verified: Math.random() < 0.6, // ~60% of demo people are verified
      intents: makeIntents(),
      bearing: Math.floor(Math.random() * 360),
      distanceM: trueDistanceM,
      closeness: closenessFor(trueDistanceM),
      via: caps,
    },
    realName: name,
    // Obviously-fake handles. The `demo` flag on a connect stops the UI from
    // ever opening a real profile, so we can't send users to a real stranger.
    handles: makeHandles(name),
    likesMe: Math.random() < 0.5,
    trueDistanceM,
    caps,
    engine: new RangingEngine(),
  };
}

export class SimulatedProximity implements ProximityProvider {
  private handlers: ProximityHandlers | null = null;
  private peers: SimPeer[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];
  private interval: ReturnType<typeof setInterval> | null = null;
  private moveInterval: ReturnType<typeof setInterval> | null = null;

  start(_profile: MyProfile, handlers: ProximityHandlers) {
    this.handlers = handlers;
    this.peers = [];

    // People drift into range over the first few seconds — feels alive.
    const initial = 3 + Math.floor(Math.random() * 2);
    for (let n = 0; n < initial; n++) {
      this.after(600 * (n + 1), () => this.addPeer());
    }

    // The room keeps changing: occasionally someone arrives or leaves, and
    // occasionally someone open to you sends a hi first.
    this.interval = setInterval(() => {
      const roll = Math.random();
      if (roll < 0.35 && this.peers.length < 6) this.addPeer();
      else if (roll < 0.5 && this.peers.length > 2) this.removePeer();
      else this.maybeIncomingHello();
    }, 5000);

    // People shift around — nudge each one's bearing/distance so the finder
    // arrow and distance update live, the way a real person moving would.
    this.moveInterval = setInterval(() => this.driftPeers(), 1100);
  }

  stop() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    if (this.moveInterval) clearInterval(this.moveInterval);
    this.moveInterval = null;
    this.peers = [];
    this.handlers?.onPeersChanged([]);
    this.handlers = null;
  }

  sayHi(peerId: string) {
    const sp = this.peers.find((p) => p.peer.id === peerId);
    if (!sp) return;
    // If they're into you too, it becomes mutual after a natural beat.
    // If not, nothing happens — you're never told "no". Silence is kind.
    if (sp.likesMe) {
      this.after(1500 + Math.random() * 2500, () => this.match(sp));
    }
  }

  respondToHello(peerId: string, open: boolean) {
    if (!open) return; // dismissed silently; the other side never finds out
    const sp = this.peers.find((p) => p.peer.id === peerId);
    if (sp) this.match(sp); // they already said hi, so opening back = match
  }

  // --- internals ---

  private addPeer() {
    if (!this.handlers) return;
    const sp = makeSimPeer();
    this.peers.push(sp);
    this.emitPeers();
  }

  private removePeer() {
    if (this.peers.length === 0) return;
    this.peers.splice(Math.floor(Math.random() * this.peers.length), 1);
    this.emitPeers();
  }

  private maybeIncomingHello() {
    const candidates = this.peers.filter((p) => p.likesMe);
    if (candidates.length === 0) return;
    this.handlers?.onIncomingHello(pick(candidates).peer);
  }

  private match(sp: SimPeer) {
    if (!this.handlers) return;
    const reveal: MatchReveal = {
      peerId: sp.peer.id,
      alias: sp.peer.alias,
      avatar: sp.peer.avatar,
      displayName: sp.realName,
      handles: sp.handles,
      bio: sp.peer.bio,
      verified: sp.peer.verified,
      demo: true, // simulated handles — UI must not open a real profile with them
    };
    this.handlers.onMatch(reveal);
  }

  // Each tick: the person actually moves a little (hidden true distance random-
  // walks), we observe them through noisy radios, and the RangingEngine fuses +
  // smooths those into the distance the UI shows — with an uncertainty (±) too.
  private driftPeers() {
    if (this.peers.length === 0) return;
    for (const sp of this.peers) {
      sp.trueDistanceM = Math.max(0.6, Math.min(MAX_RANGE_M, sp.trueDistanceM + (Math.random() - 0.5)));
      const bearing = (sp.peer.bearing + (Math.random() * 24 - 12) + 360) % 360;

      const est = sp.engine.update(sampleRadios(sp.trueDistanceM, sp.caps));
      const distanceM = est ? Math.round(est.distanceM * 10) / 10 : sp.peer.distanceM;
      // 1-σ uncertainty in metres from the fused+filtered confidence.
      const accuracyM = est ? Math.round(Math.sqrt(Math.max(0, 1 / est.confidence - 1)) * 10) / 10 : undefined;

      sp.peer = { ...sp.peer, bearing, distanceM, accuracyM, closeness: closenessFor(distanceM) };
    }
    this.emitPeers();
  }

  private emitPeers() {
    this.handlers?.onPeersChanged(this.peers.map((p) => p.peer));
  }

  private after(ms: number, fn: () => void) {
    const t = setTimeout(fn, ms);
    this.timers.push(t);
  }
}
