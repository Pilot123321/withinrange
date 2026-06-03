import { WidgetState } from './widget';

// Writes the app's status into the shared App Group so the WidgetKit extension
// can render it, then asks iOS to refresh the widget timeline. Guarded so it's
// a harmless no-op in Expo Go (where the native module isn't present).
const APP_GROUP = 'group.com.withinrange.app';

export function publishWidgetState(state: WidgetState): void {
  try {
    // Only available in a native dev build that includes @bacons/apple-targets.
    const { ExtensionStorage } = require('@bacons/apple-targets');
    const storage = new ExtensionStorage(APP_GROUP);
    storage.set('open', state.open);
    storage.set('nearbyCount', state.nearbyCount);
    ExtensionStorage.reloadWidget();
  } catch {
    // Expo Go / missing native module — ignore.
  }
}
