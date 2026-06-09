// Material 3 dark theme — Google "Stitch"-style: near-black surfaces, a
// blue→violet primary, and light-tone on-colors. Color roles follow M3 dark
// (surface tones step *up* with elevation; primary/accent are light tones with
// dark on-colors), shapes follow the M3 shape scale, type the M3 ramp, and
// touch targets Google's 48dp minimum.

export const colors = {
  // M3 dark surfaces. The screen is the darkest tone; cards/sheets step up to a
  // lighter surface-container, so elevation reads as a lighter tonal layer.
  bg: '#0E0F13', // surface (darkest)
  surface: '#1A1C22', // surfaceContainer — cards / sheets
  surfaceAlt: '#272A33', // surfaceContainerHigh — tonal buttons, nav pill, chips
  // On-surface roles: primary text / secondary text.
  text: '#E4E6EB', // onSurface
  textSoft: '#A6ADBB', // onSurfaceVariant
  // Primary role — light blue-violet (M3 dark uses a light primary tone).
  primary: '#8AB4F8', // Google dark-mode blue
  primaryText: '#0B1B33', // onPrimary (dark, for the light primary)
  accent: '#C7A6FF', // M3 tertiary — light violet for the “mutual” moment
  success: '#7BD58E', // light green (dark scheme)
  danger: '#F2B8B5', // M3 dark error
  // M3 dark outline — hairlines, card edges, dividers.
  border: '#3A3D45',
  separator: 'rgba(255,255,255,0.10)',
  // Anonymous avatars — Google brand hues, lightened to read on dark. No faces.
  avatarPalette: ['#8AB4F8', '#F28B82', '#FDD663', '#81C995', '#C58AF9', '#78D9EC'],
};

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// M3 shape scale: small / medium / large / extra-large(sheets) / full(pill).
export const radius = {
  sm: 8,
  md: 12, // M3 medium — cards
  lg: 16, // M3 large
  xl: 28, // M3 extra-large — bottom sheets
  pill: 999, // M3 full — buttons, chips, FABs
};

// M3 elevation as RN shadow presets (tonal + soft key shadow).
export const elevation = {
  level1: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  level2: {
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
} as const;

// State-layer (ripple/hover) overlay color — M3 uses on-surface at low alpha.
export const ripple = 'rgba(32,26,25,0.12)';

export const font = {
  // M3 type ramp: displaySmall / titleLarge / bodyLarge / bodySmall.
  display: 36, // M3 displaySmall
  title: 22, // M3 titleLarge
  body: 16, // M3 bodyLarge (never below 16 for readability)
  small: 13, // M3 bodySmall-ish
};

// Material minimum 48dp touch target.
export const MIN_TOUCH = 48;
