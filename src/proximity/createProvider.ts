import { ProximityProvider } from './ProximityProvider';
import { SimulatedProximity } from './SimulatedProximity';

// Web (and the default): always the simulator. This file is what Metro bundles
// for web, so the native-only BLE code is never pulled into the web bundle.
export function createProvider(): ProximityProvider {
  return new SimulatedProximity();
}
