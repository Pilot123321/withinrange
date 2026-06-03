import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { makeAlias } from '../alias';
import { ProfileForm } from '../components/ProfileForm';
import { PrimaryButton } from '../components/PrimaryButton';
import { useStore } from '../store';
import { MyProfile } from '../types';
import { colors, font, space } from '../theme';

function emptyProfile(): MyProfile {
  const { alias, avatar } = makeAlias();
  return { displayName: '', instagram: '', bio: '', alias, avatar, photoUri: undefined, verified: false };
}

export function OnboardingScreen() {
  const { dispatch } = useStore();
  const [draft, setDraft] = useState<MyProfile>(emptyProfile);

  const canStart = draft.displayName.trim().length > 0 && draft.instagram.trim().length > 0;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>withinrange</Text>
        <Text style={styles.tagline}>Meet the people around you — only if you both want to.</Text>

        <ProfileForm draft={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />

        <PrimaryButton
          label="Start"
          onPress={() =>
            dispatch({
              type: 'COMPLETE_ONBOARDING',
              profile: {
                ...draft,
                displayName: draft.displayName.trim(),
                instagram: draft.instagram.trim(),
                bio: draft.bio.trim(),
              },
            })
          }
          disabled={!canStart}
          style={{ marginTop: space.md }}
        />
        <Text style={styles.footer}>You control when you're visible. Turn it off anytime.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.lg, paddingTop: space.xl, gap: space.md },
  brand: { fontSize: font.display, fontWeight: '800', color: colors.text },
  tagline: { fontSize: font.body, color: colors.textSoft, marginBottom: space.sm },
  footer: { fontSize: font.small, color: colors.textSoft, textAlign: 'center', marginTop: space.sm, marginBottom: space.xl },
});
