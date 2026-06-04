import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PLATFORMS } from '../platforms';
import { openHandle } from '../platforms';
import { colors, font, radius, space } from '../theme';
import { SocialHandle } from '../types';

// Renders shared socials as tappable chips (open the link, or copy if there's no
// URL). Used on the connect screen and the Connections list.
export function HandleList({ handles, demo, compact }: { handles: SocialHandle[]; demo?: boolean; compact?: boolean }) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {handles.map((h) => {
        const p = PLATFORMS[h.platform];
        return (
          <Pressable
            key={h.platform}
            style={styles.chip}
            onPress={() => openHandle(h, !!demo)}
            accessibilityRole="button"
            accessibilityLabel={`${p.label}: ${h.value}`}
          >
            <Ionicons name={p.icon} size={18} color={p.color} />
            <Text style={styles.value} numberOfLines={1}>
              {p.prefix}
              {h.value}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
  wrapCompact: { justifyContent: 'flex-start' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  value: { fontSize: font.small, fontWeight: '600', color: colors.text, maxWidth: 160 },
});
