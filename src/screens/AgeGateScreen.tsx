import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { useStore } from '../store';
import { colors, font, radius, space } from '../theme';

// Hard 18+ gate. A dating app handling minors is a legal and moral non-starter,
// so this is the very first screen. (A production app would verify age more
// robustly — ID/credit-card/third-party — this is the honest minimum.)
function ageFrom(y: number, m: number, d: number): number | null {
  const dob = new Date(y, m - 1, d);
  if (dob.getFullYear() !== y || dob.getMonth() !== m - 1 || dob.getDate() !== d) return null; // invalid date
  const now = new Date();
  let age = now.getFullYear() - y;
  const hadBirthday = now.getMonth() > m - 1 || (now.getMonth() === m - 1 && now.getDate() >= d);
  if (!hadBirthday) age -= 1;
  return age;
}

export function AgeGateScreen() {
  const { dispatch } = useStore();
  const [mm, setMm] = useState('');
  const [dd, setDd] = useState('');
  const [yyyy, setYyyy] = useState('');
  const [tooYoung, setTooYoung] = useState(false);

  const age = mm && dd && yyyy.length === 4 ? ageFrom(+yyyy, +mm, +dd) : null;
  const canContinue = age != null && age >= 0 && age <= 120;

  function onContinue() {
    if (age == null) return;
    if (age < 18) {
      setTooYoung(true);
      return;
    }
    dispatch({ type: 'COMPLETE_AGEGATE' });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>withinrange</Text>
      <Text style={styles.title}>How old are you?</Text>
      <Text style={styles.subtitle}>You must be 18 or older to use withinrange.</Text>

      <View style={styles.dobRow}>
        <Field label="MM" value={mm} onChange={(t) => { setTooYoung(false); setMm(t.slice(0, 2)); }} max={2} />
        <Field label="DD" value={dd} onChange={(t) => { setTooYoung(false); setDd(t.slice(0, 2)); }} max={2} />
        <Field label="YYYY" value={yyyy} onChange={(t) => { setTooYoung(false); setYyyy(t.slice(0, 4)); }} max={4} wide />
      </View>

      {tooYoung && (
        <Text style={styles.blocked}>
          Sorry — withinrange is only for adults 18+. Come back when you're older. 💛
        </Text>
      )}

      <PrimaryButton label="Continue" onPress={onContinue} disabled={!canContinue} style={styles.btn} />
      <Text style={styles.privacy}>Your birth date is used only to check your age — it isn't shown to anyone.</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  max,
  wide,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  max: number;
  wide?: boolean;
}) {
  return (
    <View style={[styles.field, wide && styles.fieldWide]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ''))}
        placeholder={label}
        placeholderTextColor={colors.textSoft}
        keyboardType="number-pad"
        maxLength={max}
        accessibilityLabel={`Birth ${label}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space.lg, paddingTop: space.xxl, gap: space.md },
  brand: { fontSize: font.title, fontWeight: '800', color: colors.primary },
  title: { fontSize: font.display, fontWeight: '800', color: colors.text, marginTop: space.lg },
  subtitle: { fontSize: font.body, color: colors.textSoft },
  dobRow: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  field: { flex: 1, gap: space.xs },
  fieldWide: { flex: 1.6 },
  fieldLabel: { fontSize: font.small, fontWeight: '700', color: colors.textSoft },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: font.title,
    color: colors.text,
    textAlign: 'center',
  },
  blocked: { fontSize: font.body, color: colors.danger, fontWeight: '600', lineHeight: 24 },
  btn: { marginTop: space.md },
  privacy: { fontSize: font.small, color: colors.textSoft, textAlign: 'center' },
});
