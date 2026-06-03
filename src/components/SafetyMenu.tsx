import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sheet } from './Sheet';
import { colors, font, radius, space } from '../theme';

const REASONS = ['Harassment', 'Inappropriate photos', 'Fake profile', 'Underage', 'Spam', 'Something else'];

// Block / report sheet, reused from the peer sheet, finder, and match screen.
// Reporting also blocks — you should never have to keep seeing someone you
// just reported. Block is mutual: they vanish from your room and you from theirs.
export function SafetyMenu({
  visible,
  name,
  onBlock,
  onReport,
  onClose,
}: {
  visible: boolean;
  name: string;
  onBlock: () => void;
  onReport: (reason: string) => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.body}>
        <Text style={styles.title}>Keep yourself safe</Text>

        <Pressable
          style={styles.blockBtn}
          onPress={onBlock}
          accessibilityRole="button"
          accessibilityLabel={`Block ${name}`}
        >
          <Ionicons name="ban-outline" size={22} color={colors.danger} />
          <View style={styles.blockText}>
            <Text style={styles.blockTitle}>Block {name}</Text>
            <Text style={styles.blockSub}>They disappear from your map, and you from theirs.</Text>
          </View>
        </Pressable>

        <Text style={styles.reportLabel}>Report a problem (also blocks them)</Text>
        <View style={styles.reasons}>
          {REASONS.map((reason) => (
            <Pressable
              key={reason}
              style={styles.chip}
              onPress={() => onReport(reason)}
              accessibilityRole="button"
              accessibilityLabel={`Report for ${reason}`}
            >
              <Text style={styles.chipText}>{reason}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.cancel} onPress={onClose} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { alignSelf: 'stretch', gap: space.md },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  blockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: space.md,
  },
  blockText: { flex: 1, gap: 2 },
  blockTitle: { fontSize: font.body, fontWeight: '600', color: colors.danger },
  blockSub: { fontSize: font.small, color: colors.textSoft },
  reportLabel: { fontSize: font.small, fontWeight: '600', color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 0.4 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  chipText: { fontSize: font.small, fontWeight: '500', color: colors.text },
  cancel: { alignItems: 'center', paddingVertical: space.sm },
  cancelText: { fontSize: font.body, fontWeight: '600', color: colors.primary },
});
