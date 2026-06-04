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
    if (!raw) return null;
    return migrate(JSON.parse(raw) as PersistedState);
  } catch {
    return null; // corrupt/unavailable storage → start fresh
  }
}

// Forward-migrate older saves: the app used to store a single `instagram` string;
// it now stores a `handles` array. Convert so old data doesn't crash the UI.
function withHandles<T extends { handles?: unknown; instagram?: string }>(obj: T): T {
  if (Array.isArray(obj.handles)) return obj;
  const handles = obj.instagram ? [{ platform: 'instagram', value: obj.instagram }] : [];
  return { ...obj, handles };
}

function migrate(data: PersistedState): PersistedState {
  return {
    ...data,
    profile: data.profile ? (withHandles(data.profile as never) as PersistedState['profile']) : data.profile,
    matches: Array.isArray(data.matches) ? data.matches.map((m) => withHandles(m as never) as never) : data.matches,
  };
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
