import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// The blue check shown next to a verified person's name. A trust signal that
// they passed selfie verification (anti-catfish). Renders nothing if unverified.
export function VerifiedBadge({ verified, size = 15 }: { verified: boolean; size?: number }) {
  if (!verified) return null;
  return (
    <Ionicons
      name="checkmark-circle"
      size={size}
      color={colors.accent}
      accessibilityLabel="Verified"
      style={{ marginLeft: 3 }}
    />
  );
}
