import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLOR_OPTIONS, EMOJI_OPTIONS } from '../avatarOptions';
import { AvatarSpec } from '../types';
import { colors, font, MIN_TOUCH, radius, space } from '../theme';

// Lets a user customize their anonymous emoji avatar: pick an emoji and a color.
// Used in both onboarding and the profile editor.
export function AvatarPicker({
  value,
  onChange,
}: {
  value: AvatarSpec;
  onChange: (spec: AvatarSpec) => void;
}) {
  return (
    <View style={{ gap: space.sm }}>
      <Text style={styles.label}>Emoji</Text>
      <View style={styles.grid}>
        {EMOJI_OPTIONS.map((emoji) => {
          const selected = emoji === value.emoji;
          return (
            <Pressable
              key={emoji}
              onPress={() => onChange({ ...value, emoji })}
              accessibilityRole="button"
              accessibilityLabel={`Emoji ${emoji}`}
              accessibilityState={{ selected }}
              style={[styles.cell, selected && styles.cellSelected]}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Color</Text>
      <View style={styles.grid}>
        {COLOR_OPTIONS.map((color) => {
          const selected = color === value.color;
          return (
            <Pressable
              key={color}
              onPress={() => onChange({ ...value, color })}
              accessibilityRole="button"
              accessibilityLabel={`Color ${color}`}
              accessibilityState={{ selected }}
              style={[styles.swatch, { backgroundColor: color }, selected && styles.swatchSelected]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: font.small, fontWeight: '700', color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cell: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cellSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.surfaceAlt },
  emoji: { fontSize: 24 },
  swatch: { width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: radius.pill, borderWidth: 3, borderColor: 'transparent' },
  swatchSelected: { borderColor: colors.text },
});
