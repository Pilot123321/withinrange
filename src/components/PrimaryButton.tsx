import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, font, radius, space } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'subtle';
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
};

// One button to rule them all: large touch target, clear focus/press states,
// and proper accessibility roles so screen readers announce it correctly.
export function PrimaryButton({ label, onPress, variant = 'primary', disabled, busy, style }: Props) {
  const isSubtle = variant === 'subtle';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled || !!busy }}
      style={({ pressed }) => [
        styles.base,
        isSubtle ? styles.subtle : styles.primary,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={isSubtle ? colors.text : colors.primaryText} />
      ) : (
        <Text style={[styles.label, isSubtle ? styles.subtleLabel : styles.primaryLabel]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50, // iOS prominent button height
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  subtle: { backgroundColor: colors.surfaceAlt },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.4 },
  label: { fontSize: font.body, fontWeight: '600' },
  primaryLabel: { color: colors.primaryText },
  subtleLabel: { color: colors.text },
});
