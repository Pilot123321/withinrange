import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, font, radius, ripple, space } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'subtle';
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
};

// Material 3 button: `primary` is a filled button, `subtle` is a tonal button.
// Pill (full) shape, a ripple/press state layer, and proper accessibility roles
// so screen readers announce it correctly.
export function PrimaryButton({ label, onPress, variant = 'primary', disabled, busy, style }: Props) {
  const isSubtle = variant === 'subtle';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled || !!busy }}
      android_ripple={{ color: ripple }}
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
    minHeight: 48, // Material 48dp touch target
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill, // M3 full shape
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // clip the Android ripple to the pill
  },
  primary: { backgroundColor: colors.primary },
  subtle: { backgroundColor: colors.surfaceAlt },
  pressed: { opacity: 0.85 }, // iOS state-layer stand-in (Android uses ripple)
  disabled: { opacity: 0.4 },
  label: { fontSize: font.body, fontWeight: '600', letterSpacing: 0.1 },
  primaryLabel: { color: colors.primaryText },
  subtleLabel: { color: colors.text },
});
