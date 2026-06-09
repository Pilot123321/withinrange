import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, space } from '../theme';

export type TabKey = 'nearby' | 'matches';

type TabDef = { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap };

const TABS: TabDef[] = [
  { key: 'nearby', label: 'Nearby', icon: 'compass-outline', activeIcon: 'compass' },
  { key: 'matches', label: 'Connections', icon: 'people-outline', activeIcon: 'people' },
];

// Material 3 navigation bar: a pill-shaped active indicator slides behind the
// active icon, with icon + label below, and a badge on Connections for new
// matches. Clears the system navigation/home inset.
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
            <View style={[styles.indicator, isActive && styles.indicatorActive]}>
              <Ionicons name={isActive ? t.activeIcon : t.icon} size={24} color={tint} />
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
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  // M3 active-indicator pill that sits behind the icon.
  indicator: {
    minWidth: 64,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  indicatorActive: { backgroundColor: colors.surfaceAlt },
  label: { fontSize: 12, fontWeight: '600' },
  badge: {
    position: 'absolute',
    top: -2,
    right: 8,
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
