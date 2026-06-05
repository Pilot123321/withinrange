import { PermissionsAndroid, Platform } from 'react-native';
import { BleError, BleManager, Device, State } from 'react-native-ble-plx';
import { RangingEngine } from '../ranging';
import { MyProfile, NearbyPeer } from '../types';
import { ProximityHandlers, ProximityProvider } from './ProximityProvider';

// Real Bluetooth-LE proximity.
//
// STATUS — partial, and only runnable in a native dev build (not Expo Go / web):
//   ✅ Discovery + ranging are real: we advertise a withinrange service UUID,
//      scan for other phones doing the same, and turn each sighting's RSSI into a
//      smoothed distance via the SAME RangingEngine the simulator uses.
//   🚧 Rich identity (name/photo/intents) and the hi/connect CONSENT handshake
//      need a data channel BLE can't provide in ~31 advertising bytes — that's a
//      small backend (resolve ephemeral id → public profile; broker hi/match) or
//      a GATT exchange. Those spots are marked TODO(backend) below.
//
// This needs TWO physical phones + Bluetooth permissions to validate; signal in a
// crowded/metal room is noisy, and iOS restricts background advertising.

// A fixed UUID that identifies "this is a withinrange device".
const SERVICE_UUID = '7758b100-1d7a-4c4e-9a5e-0f1a2b3c4d5e';

// How others resolve an ephemeral id to a public profile. In production this is a
// backend lookup; here it's a placeholder so discovery still renders on hardware.
type PeerResolver = (ephemeralId: string) => NearbyPeer | null;

export function isBleAvailable(): boolean {
  try {
    // Constructing the manager throws if the native module isn't present (Expo Go).
    const m = new BleManager();
    m.destroy();
    return true;
  } catch {
    return false;
  }
}

export class BleProximity implements ProximityProvider {
  private manager: BleManager | null = null;
  private handlers: ProximityHandlers | null = null;
  private engines = new Map<string, RangingEngine>();
  private peers = new Map<string, NearbyPeer>();
  private emitTimer: ReturnType<typeof setInterval> | null = null;
  private resolve: PeerResolver;

  constructor(resolve?: PeerResolver) {
    this.resolve = resolve ?? placeholderResolver;
  }

  async start(_profile: MyProfile, handlers: ProximityHandlers) {
    this.handlers = handlers;
    this.manager = new BleManager();

    const ok = await this.ensurePermissions();
    if (!ok) return;

    // Wait until the radio is actually powered on before scanning.
    const sub = this.manager.onStateChange((state) => {
      if (state === State.PoweredOn) {
        sub.remove();
        this.beginAdvertising(_profile);
        this.beginScanning();
      }
    }, true);

    // Push the freshest peer list a few times a second.
    this.emitTimer = setInterval(() => this.emit(), 700);
  }

  stop() {
    this.manager?.stopDeviceScan();
    stopAdvertising();
    if (this.emitTimer) clearInterval(this.emitTimer);
    this.emitTimer = null;
    this.engines.clear();
    this.peers.clear();
    this.handlers?.onPeersChanged([]);
    this.manager?.destroy();
    this.manager = null;
    this.handlers = null;
  }

  // TODO(backend): a "hi" needs to reach the other person. Route the consent
  // handshake (and the eventual onMatch reveal) through a small signaling server
  // keyed by the rotating ephemeral ids, or over a GATT connection.
  sayHi(_peerId: string) {
    console.warn('[BleProximity] sayHi needs the consent backend (not yet wired).');
  }

  respondToHello(_peerId: string, _open: boolean) {
    console.warn('[BleProximity] respondToHello needs the consent backend (not yet wired).');
  }

  // --- internals ---

  private beginScanning() {
    this.manager?.startDeviceScan([SERVICE_UUID], { allowDuplicates: true }, (error, device) => {
      if (error) {
        this.handleScanError(error);
        return;
      }
      if (device && device.rssi != null) this.onSighting(device);
    });
  }

  // Each sighting → feed RSSI into that peer's RangingEngine → update its distance.
  private onSighting(device: Device) {
    const key = ephemeralIdOf(device);
    let engine = this.engines.get(key);
    if (!engine) {
      engine = new RangingEngine();
      this.engines.set(key, engine);
    }
    const est = engine.update([{ tech: 'ble_rssi', rssi: device.rssi as number, txPower: -59 }]);
    if (!est) return;

    const base = this.peers.get(key) ?? this.resolve(key);
    if (!base) return;
    const distanceM = Math.round(est.distanceM * 10) / 10;
    const accuracyM = Math.round(Math.sqrt(Math.max(0, 1 / est.confidence - 1)) * 10) / 10;
    this.peers.set(key, {
      ...base,
      distanceM,
      accuracyM,
      closeness: closenessFor(distanceM),
      via: ['ble_rssi'],
    });
  }

  private emit() {
    if (!this.handlers) return;
    // Drop peers we haven't seen recently (they walked out of range) — handled by
    // allowDuplicates re-sightings keeping fresh ones; a TTL map would refine this.
    this.handlers.onPeersChanged([...this.peers.values()]);
  }

  private beginAdvertising(profile: MyProfile) {
    // TODO(backend): advertise a *rotating* ephemeral id (privacy) under
    // SERVICE_UUID, and register ephemeralId→profile with the backend so peers
    // can resolve it. react-native-ble-plx is central-only, so advertising needs
    // a peripheral library (Android) / CoreBluetooth (iOS).
    startAdvertising(SERVICE_UUID, profile);
  }

  private handleScanError(error: BleError) {
    console.warn('[BleProximity] scan error:', error.message);
  }

  private async ensurePermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true; // iOS prompts via Info.plist strings
    try {
      const perms = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ].filter(Boolean) as string[];
      const res = await PermissionsAndroid.requestMultiple(perms as never);
      return Object.values(res).every((v) => v === PermissionsAndroid.RESULTS.GRANTED);
    } catch {
      return false;
    }
  }
}

function ephemeralIdOf(device: Device): string {
  // Prefer an id embedded in the advert; fall back to the OS peripheral id.
  return device.id;
}

function closenessFor(distanceM: number): NearbyPeer['closeness'] {
  if (distanceM <= 2.5) return 'right-here';
  if (distanceM <= 5) return 'a-few-steps';
  return 'nearby';
}

// Until the backend resolves real profiles, show a minimal anonymous placeholder
// so a discovered device still appears on the radar during hardware testing.
function placeholderResolver(ephemeralId: string): NearbyPeer {
  const short = ephemeralId.slice(-4);
  return {
    id: ephemeralId,
    displayName: `Nearby ${short}`,
    verified: false,
    intents: [],
    hobbies: [],
    alias: `Nearby ${short}`,
    avatar: { emoji: '📡', color: '#0A84FF' },
    bio: '',
    closeness: 'nearby',
    bearing: 0, // RSSI gives no direction; needs UWB/AoA for a real arrow
    distanceM: 8,
  };
}

// Advertising is optional/native — load it lazily so a missing lib doesn't crash.
function startAdvertising(serviceUuid: string, _profile: MyProfile) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Advertiser = require('react-native-ble-advertiser').default;
    Advertiser.setCompanyId(0x00e0);
    Advertiser.broadcast(serviceUuid, [], {}).catch(() => {});
  } catch {
    console.warn('[BleProximity] advertising lib not installed — phones won\'t discover each other yet.');
  }
}

function stopAdvertising() {
  try {
    require('react-native-ble-advertiser').default.stopBroadcast().catch(() => {});
  } catch {
    /* not installed */
  }
}
