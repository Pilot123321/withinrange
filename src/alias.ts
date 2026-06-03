import { colors } from './theme';
import { AvatarSpec } from './types';

// Generates the friendly, anonymous identity that others see instead of your
// real name or photo. Pairing the emoji to the animal keeps it coherent.
const ADJECTIVES = ['Sky', 'River', 'Maple', 'Amber', 'Quiet', 'Sunny', 'Velvet', 'Cosmic', 'Hazel', 'Lucky'];
const ANIMALS = ['Otter', 'Sparrow', 'Fox', 'Koala', 'Heron', 'Cat', 'Penguin', 'Panda', 'Owl', 'Seal'];
const EMOJIS = ['🦦', '🐦', '🦊', '🐨', '🪶', '🐱', '🐧', '🐼', '🦉', '🦭'];

export function makeAlias(): { alias: string; avatar: AvatarSpec } {
  const i = Math.floor(Math.random() * ANIMALS.length);
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  return {
    alias: `${adj} ${ANIMALS[i]}`,
    avatar: {
      emoji: EMOJIS[i],
      color: colors.avatarPalette[Math.floor(Math.random() * colors.avatarPalette.length)],
    },
  };
}
