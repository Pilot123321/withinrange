// Fusion ranging engine.
//
// No single radio gives accurate, cross-platform distance, so we fuse whatever a
// device pair supports. Each technology contributes a distance estimate plus a
// known uncertainty (variance); we combine them by inverse-variance weighting
// (the standard optimal linear estimator) and then smooth over time with a 1-D
// Kalman filter. Drop in real samples from BLE/UWB/WiFi and the math is the same.
//
// References this models after:
//  - BLE RSSI log-distance path loss + TxPower calibration (Apple/Google
//    Exposure Notification, 2020–21): RSSI is noisy → calibrate + smooth.
//  - UWB time-of-flight (IEEE 802.15.4z; Apple NearbyInteraction): ~10 cm.
//  - BLE Channel Sounding (Bluetooth SIG, 2024): phase-based ranging, sub-metre.
//  - WiFi RTT/FTM (IEEE 802.11mc/az; Android WifiRttManager): ~1–2 m.

export type RangingTech = 'uwb' | 'ble_cs' | 'wifi_rtt' | 'ble_rssi';

// One measurement from one radio. Time/phase techs report metres directly;
// BLE RSSI reports signal strength + the peer's calibrated 1 m TxPower.
export type RangingSample = {
  tech: RangingTech;
  distanceM?: number; // uwb / ble_cs / wifi_rtt
  rssi?: number; // ble_rssi
  txPower?: number; // ble_rssi: calibrated RSSI at 1 m for that device model
};

// Per-technology measurement std-dev (metres) — how much to trust each source.
// Smaller = tighter = weighted more heavily in the fusion.
const TECH_STD: Record<RangingTech, number> = {
  uwb: 0.1,
  ble_cs: 0.4,
  wifi_rtt: 1.5,
  ble_rssi: 2.5,
};

// Log-distance path-loss model: d = 10^((TxPower - RSSI) / (10 * n)).
// `n` is the environment path-loss exponent (~2 free space, 3–4 indoors/crowds).
export function distanceFromRssi(rssi: number, txPower = -59, n = 2.2): number {
  return Math.pow(10, (txPower - rssi) / (10 * n));
}

function sampleToDistance(s: RangingSample): { d: number; variance: number } | null {
  if (s.tech === 'ble_rssi') {
    if (s.rssi == null) return null;
    return { d: distanceFromRssi(s.rssi, s.txPower), variance: TECH_STD.ble_rssi ** 2 };
  }
  if (s.distanceM == null) return null;
  return { d: s.distanceM, variance: TECH_STD[s.tech] ** 2 };
}

// Inverse-variance weighted fusion of simultaneous samples from different radios.
export function fuseSamples(samples: RangingSample[]): { distanceM: number; variance: number } | null {
  let num = 0;
  let den = 0;
  for (const s of samples) {
    const conv = sampleToDistance(s);
    if (!conv) continue;
    num += conv.d / conv.variance;
    den += 1 / conv.variance;
  }
  if (den === 0) return null;
  return { distanceM: num / den, variance: 1 / den };
}

// 1-D Kalman filter (constant-position model) for temporal smoothing. Process
// noise allows the person to actually move; measurement variance comes from fusion.
class Kalman1D {
  value: number;
  variance: number;
  private readonly processNoise = 0.08;

  constructor(value: number, variance: number) {
    this.value = value;
    this.variance = variance;
  }

  update(measurement: number, measurementVariance: number): number {
    this.variance += this.processNoise; // predict
    const k = this.variance / (this.variance + measurementVariance); // gain
    this.value += k * (measurement - this.value); // correct
    this.variance *= 1 - k;
    return this.value;
  }
}

export type RangingEstimate = {
  distanceM: number;
  confidence: number; // 0–1, higher = tighter fused + filtered estimate
};

// One per tracked peer: fuses each batch of samples, then Kalman-smooths.
export class RangingEngine {
  private kf: Kalman1D | null = null;

  update(samples: RangingSample[]): RangingEstimate | null {
    const fused = fuseSamples(samples);
    if (!fused) return this.kf ? { distanceM: this.kf.value, confidence: 0 } : null;
    if (!this.kf) this.kf = new Kalman1D(fused.distanceM, fused.variance);
    const distanceM = this.kf.update(fused.distanceM, fused.variance);
    // Map filtered variance to a 0–1 confidence (1 m² variance ≈ 0.5).
    const confidence = 1 / (1 + this.kf.variance);
    return { distanceM: Math.max(0, distanceM), confidence };
  }
}
