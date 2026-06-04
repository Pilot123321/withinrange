import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from './store';

// Local, on-device persistence (AsyncStorage). We only persist the durable parts
// of state — who you are, who you matched, who you blocked, your preferences —
// never the ephemeral session stuff (the live room, pending hellos, etc.).
const KEY = 'withinrange.state.v1';

export type PersistedState = Pick<
  AppState,
  'profile' | 'matches' | 'blocked' | 'reports' | 'verifiedOnly'
>;

export async function loadPersisted(): Promise<PersistedState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null; // corrupt/unavailable storage → start fresh
  }
}

export async function savePersisted(data: PersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // best-effort; a failed write shouldn't crash the app
  }
}

export async function clearPersisted(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
