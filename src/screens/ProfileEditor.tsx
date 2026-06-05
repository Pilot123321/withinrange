import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { ProfileForm } from '../components/ProfileForm';
import { PrimaryButton } from '../components/PrimaryButton';
import { useStore } from '../store';
import { MyProfile } from '../types';
import { colors, font, radius, space } from '../theme';

// Edit your profile any time. Opens from the header avatar in the network view.
export function ProfileEditor({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [draft, setDraft] = useState<MyProfile | null>(state.profile);

  // Reset the draft to the live profile each time the editor opens.
  useEffect(() => {
    if (visible) setDraft(state.profile);
  }, [visible, state.profile]);

  // While the editor is open, hold incoming invitations / match pop-ups so they
  // don't interrupt you mid-edit — they reappear once you close it.
  useEffect(() => {
    dispatch({ type: 'SET_EDITING', value: visible });
  }, [visible, dispatch]);

  if (!draft) return null;
  const canSave = draft.displayName.trim().length > 0 && draft.handles.some((h) => h.value.trim().length > 0);

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
          <VerificationSection />
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
                  bio: draft.bio.trim(),
                  handles: draft.handles.filter((h) => h.value.trim()).map((h) => ({ ...h, value: h.value.trim() })),
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

// Verification + the "verified-only" preference. Verification is simulated for
// the prototype: in production the selfie is checked for liveness and matched to
// your profile photo by a backend before the badge is granted.
function VerificationSection() {
  const { state, dispatch } = useStore();
  const verified = !!state.profile?.verified;

  async function verify() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled) dispatch({ type: 'VERIFY_ME' }); // real flow: send selfie to backend
  }

  return (
    <View style={styles.vCard}>
      {verified ? (
        <View style={styles.vRow}>
          <Ionicons name="checkmark-circle" size={26} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.vTitle}>You're verified</Text>
            <Text style={styles.vSub}>People can trust your photo is really you.</Text>
          </View>
        </View>
      ) : (
        <Pressable style={styles.vRow} onPress={verify} accessibilityRole="button" accessibilityLabel="Get verified">
          <Ionicons name="shield-checkmark-outline" size={26} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.vTitle}>Get verified</Text>
            <Text style={styles.vSub}>Take a quick selfie to earn a verified badge (simulated here).</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSoft} />
        </Pressable>
      )}

      <View style={styles.divider} />

      <View style={styles.vRow}>
        <Ionicons name="lock-closed-outline" size={22} color={colors.textSoft} />
        <View style={{ flex: 1 }}>
          <Text style={styles.vTitle}>Only verified people can say hi</Text>
          <Text style={styles.vSub}>Hellos from unverified people are quietly hidden.</Text>
        </View>
        <Switch
          value={state.verifiedOnly}
          onValueChange={(v) => dispatch({ type: 'SET_VERIFIED_ONLY', value: v })}
          trackColor={{ true: colors.accent, false: colors.border }}
          accessibilityLabel="Only verified people can say hi"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  vCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: space.md, gap: space.sm },
  vRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  vTitle: { fontSize: font.body, fontWeight: '600', color: colors.text },
  vSub: { fontSize: font.small, color: colors.textSoft, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: space.xs },
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
