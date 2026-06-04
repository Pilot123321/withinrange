import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Alert, Linking } from 'react-native';
import { SocialHandle, SocialPlatform } from './types';

// Everything platform-specific in one place: label, icon, input prefix, and how
// to turn a handle into something openable. Add a platform here and it shows up
// across the whole app.
export const PLATFORMS: Record<
  SocialPlatform,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    prefix: string; // shown before the input (e.g. "@")
    url?: (value: string) => string; // omitted → no web link, so we copy instead
  }
> = {
  instagram: { label: 'Instagram', icon: 'logo-instagram', color: '#E1306C', prefix: '@', url: (v) => `https://instagram.com/${v}` },
  linkedin: { label: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2', prefix: '', url: (v) => `https://www.linkedin.com/in/${v}` },
  discord: { label: 'Discord', icon: 'logo-discord', color: '#5865F2', prefix: '', /* no public URL → copy */ },
  x: { label: 'X', icon: 'logo-twitter', color: '#111111', prefix: '@', url: (v) => `https://x.com/${v}` },
  snapchat: { label: 'Snapchat', icon: 'logo-snapchat', color: '#FFC400', prefix: '', url: (v) => `https://www.snapchat.com/add/${v}` },
};

// Order platforms appear in the editor + reveal lists.
export const PLATFORM_ORDER: SocialPlatform[] = ['instagram', 'linkedin', 'x', 'discord', 'snapchat'];

export function handleUrl(h: SocialHandle): string | null {
  const p = PLATFORMS[h.platform];
  return p.url ? p.url(h.value) : null;
}

// Open a handle: real link → launch it; otherwise (e.g. Discord) copy it. For
// simulated demo people we never open a real URL (it could hit a real stranger).
export async function openHandle(h: SocialHandle, demo: boolean) {
  const p = PLATFORMS[h.platform];
  if (demo) {
    Alert.alert('Simulated profile', `This is a demo person — “${h.value}” isn’t a real ${p.label} account.`);
    return;
  }
  const url = handleUrl(h);
  if (url) {
    Linking.openURL(url);
  } else {
    await Clipboard.setStringAsync(h.value);
    Alert.alert(`${p.label} copied`, `“${h.value}” is on your clipboard.`);
  }
}
