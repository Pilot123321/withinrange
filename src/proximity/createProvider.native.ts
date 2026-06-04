import { ProximityProvider } from './ProximityProvider';
import { SimulatedProximity } from './SimulatedProximity';

// iOS/Android: use real Bluetooth when the native module is present (a dev build),
// otherwise fall back to the simulator (e.g. Expo Go, or BLE unavailable). The
// require is lazy + guarded so a missing native module can't crash startup.
export function createProvider(): ProximityProvider {
  try {
    const { BleProximity, isBleAvailable } = require('./BleProximity');
    if (isBleAvailable()) return new BleProximity();
  } catch {
    // BLE native module not bundled (Expo Go) → simulator.
  }
  return new SimulatedProximity();
}
