import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ProfileForm } from '../components/ProfileForm';
import { PrimaryButton } from '../components/PrimaryButton';
import { useStore } from '../store';
import { MyProfile } from '../types';
import { colors, font, space } from '../theme';

// Edit your profile any time. Opens from the header avatar in the network view.
export function ProfileEditor({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [draft, setDraft] = useState<MyProfile | null>(state.profile);

  // Reset the draft to the live profile each time the editor opens.
  useEffect(() => {
    if (visible) setDraft(state.profile);
  }, [visible, state.profile]);

  if (!draft) return null;
  const canSave = draft.displayName.trim().length > 0 && draft.instagram.trim().length > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel">
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Your profile</Text>
          <View style={{ width: 56 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ProfileForm draft={draft} onChange={(patch) => setDraft((d) => (d ? { ...d, ...patch } : d))} />
          <PrimaryButton
            label="Save"
            disabled={!canSave}
            onPress={() => {
              dispatch({
                type: 'UPDATE_PROFILE',
                profile: {
                  ...draft,
                  displayName: draft.displayName.trim(),
                  instagram: draft.instagram.trim(),
                  bio: draft.bio.trim(),
                },
              });
              onClose();
            }}
            style={{ marginTop: space.md, marginBottom: space.xl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancel: { fontSize: font.body, color: colors.textSoft, fontWeight: '600' },
  title: { fontSize: font.body, fontWeight: '800', color: colors.text },
  content: { padding: space.lg, gap: space.md },
});
