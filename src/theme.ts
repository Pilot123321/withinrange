// iOS-flavored design tokens. Mirrors Apple's Human Interface Guidelines:
// system grouped backgrounds, label grays, separators, and a single tint color.

export const colors = {
  // iOS "systemGroupedBackground" + white inset cards.
  bg: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceAlt: '#EFEFF4',
  // Label colors (iOS): primary / secondary / tertiary.
  text: '#1C1C1E',
  textSoft: '#8A8A8E',
  // Brand tint (the app's accent) — warm coral, used like iOS tintColor.
  primary: '#FF5A5F',
  primaryText: '#FFFFFF',
  accent: '#5E5CE6', // iOS systemIndigo for "mutual" moments
  success: '#34C759', // iOS systemGreen
  danger: '#FF3B30', // iOS systemRed
  // iOS hairline separator.
  border: '#D1D1D6',
  separator: 'rgba(60,60,67,0.18)',
  // Friendly palette for anonymous avatars (no faces ever).
  avatarPalette: ['#FF9F0A', '#34C759', '#0A84FF', '#FF6482', '#64D2FF', '#FFD60A'],
};

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 10,
  md: 14, // iOS continuous-corner buttons/cards
  lg: 20, // iOS sheet / large card corner
  pill: 999,
};

export const font = {
  // Tracks iOS type ramp: largeTitle / title / body / footnote.
  display: 34, // iOS largeTitle
  title: 22, // iOS title2/3
  body: 17, // iOS body (never below 16 for readability)
  small: 13, // iOS footnote
};

// iOS minimum 44pt hit target.
export const MIN_TOUCH = 44;
