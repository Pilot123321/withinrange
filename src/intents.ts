// "Intents" are the thing that makes withinrange browsable in a way AirDrop or a
// digital business card can't be: you can see *why* people nearby are open to
// connect, and filter the room down to them. This is the core differentiator.
export type IntentTag = 'job' | 'mentor' | 'friends' | 'exploring';

export const INTENTS: Record<IntentTag, { label: string; emoji: string }> = {
  job: { label: 'Job hunting', emoji: '🔍' },
  mentor: { label: 'Mentoring', emoji: '🧭' },
  friends: { label: 'New friends', emoji: '👋' },
  exploring: { label: 'Just exploring', emoji: '✨' },
};

export const INTENT_ORDER: IntentTag[] = ['job', 'mentor', 'friends', 'exploring'];

// Known intent keys, for filtering out stale/removed tags from saved data.
export const INTENT_KEYS = new Set<string>(INTENT_ORDER);
