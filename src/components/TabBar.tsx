import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, space } from '../theme';

export type TabKey = 'nearby' | 'matches';

type TabDef = { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap };

const TABS: TabDef[] = [
  { key: 'nearby', label: 'Nearby', icon: 'compass-outline', activeIcon: 'compass' },
  { key: 'matches', label: 'Matches', icon: 'heart-outline', activeIcon: 'heart' },
];

// iOS-style bottom tab bar: hairline top separator, icon + caption, tinted when
// active, with a badge on Matches for new connections. Clears the home indicator.
export function TabBar({
  active,
  onChange,
  matchCount,
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
  matchCount: number;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      {TABS.map((t) => {
        const isActive = active === t.key;
        const tint = isActive ? colors.primary : colors.textSoft;
        return (
          <Pressable
            key={t.key}
            style={styles.tab}
            onPress={() => onChange(t.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${t.label}${t.key === 'matches' && matchCount ? `, ${matchCount} connections` : ''}`}
          >
            <View>
              <Ionicons name={isActive ? t.activeIcon : t.icon} size={26} color={tint} />
              {t.key === 'matches' && matchCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{matchCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, { color: tint }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: space.sm,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  label: { fontSize: 11, fontWeight: '600' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.primaryText, fontSize: 11, fontWeight: '700' },
});
