// Optional, consented personal context people can choose to share — the more
// human signals that make connecting feel natural (vs. a cold business card).
// Everything here is opt-in and shown only while you're visible.

export const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
] as const;

export type MbtiType = (typeof MBTI_TYPES)[number];

export const MBTI_SET = new Set<string>(MBTI_TYPES);

// A curated set of hobbies — keeps them tappable/filterable instead of free text.
export const HOBBIES = [
  '🧗 Climbing', '🎮 Gaming', '🎧 Music', '📷 Photography',
  '🏃 Running', '🍳 Cooking', '📚 Reading', '🎨 Art',
  '☕️ Coffee', '🥾 Hiking', '🎬 Film', '✈️ Travel',
  '🧘 Yoga', '💃 Dancing', '🚀 Startups', '🚴 Cycling',
] as const;

export type Hobby = (typeof HOBBIES)[number];

export const HOBBY_SET = new Set<string>(HOBBIES);
