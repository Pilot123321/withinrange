import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { makeAlias } from '../alias';
import { PLATFORM_ORDER, PLATFORMS } from '../platforms';
import { AvatarPicker } from './AvatarPicker';
import { PhotoPickerButton } from './PhotoPickerButton';
import { MyProfile, SocialPlatform } from '../types';
import { colors, font, radius, space } from '../theme';

export const BIO_MAX = 140;

// All the editable profile fields in one place, controlled by the parent.
// Shared between onboarding and the profile editor so they never drift apart.
export function ProfileForm({
  draft,
  onChange,
}: {
  draft: MyProfile;
  onChange: (patch: Partial<MyProfile>) => void;
}) {
  const getHandle = (platform: SocialPlatform) => draft.handles.find((h) => h.platform === platform)?.value ?? '';
  const setHandle = (platform: SocialPlatform, raw: string) => {
    const value = raw.replace(/^@+/, '');
    const others = draft.handles.filter((h) => h.platform !== platform);
    onChange({ handles: value.trim() ? [...others, { platform, value }] : others });
  };

  return (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <Text style={styles.label}>Profile photo</Text>
        <PhotoPickerButton
          photoUri={draft.photoUri}
          avatar={draft.avatar}
          onChange={(uri) => onChange({ photoUri: uri })}
        />
        <Text style={styles.hint}>Shown to people nearby. Optional — your emoji shows if you skip it.</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Your name</Text>
        <TextInput
          style={styles.input}
          value={draft.displayName}
          onChangeText={(t) => onChange({ displayName: t })}
          placeholder="e.g. Sam"
          placeholderTextColor={colors.textSoft}
          autoCapitalize="words"
          accessibilityLabel="Your name"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>About you</Text>
        <TextInput
          style={[styles.input, styles.bio]}
          value={draft.bio}
          onChangeText={(t) => onChange({ bio: t.slice(0, BIO_MAX) })}
          placeholder={'A line or two about you —\nwhat you’re into, why you’re here.'}
          placeholderTextColor={colors.textSoft}
          multiline
          numberOfLines={3}
          maxLength={BIO_MAX}
          accessibilityLabel="About you"
        />
        <Text style={styles.counter}>
          {draft.bio.length}/{BIO_MAX}
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Your socials</Text>
        <Text style={styles.hint}>Add any you like — shared only when you both connect. At least one.</Text>
        <View style={{ gap: space.sm, marginTop: space.xs }}>
        {PLATFORM_ORDER.map((platform) => {
          const p = PLATFORMS[platform];
          return (
            <View key={platform} style={styles.inputRow}>
              <Ionicons name={p.icon} size={20} color={p.color} />
              {!!p.prefix && <Text style={styles.at}>{p.prefix}</Text>}
              <TextInput
                style={[styles.input, styles.inputFlush]}
                value={getHandle(platform)}
                onChangeText={(t) => setHandle(platform, t)}
                placeholder={`${p.label}${platform === 'linkedin' ? ' (profile id)' : ''}`}
                placeholderTextColor={colors.textSoft}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={`Your ${p.label}`}
              />
            </View>
          );
        })}
        </View>
      </View>

      <View style={styles.field}>
        <View style={styles.aliasRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Nickname tag</Text>
            <Text style={styles.alias}>{draft.alias}</Text>
          </View>
          <Pressable
            onPress={() => onChange(makeAlias())}
            accessibilityRole="button"
            accessibilityLabel="Shuffle nickname"
            style={styles.shuffle}
          >
            <Text style={styles.shuffleText}>🎲 Shuffle</Text>
          </Pressable>
        </View>
        <AvatarPicker value={draft.avatar} onChange={(avatar) => onChange({ avatar })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs },
  label: { fontSize: font.small, fontWeight: '700', color: colors.text },
  hint: { fontSize: font.small, color: colors.textSoft },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: font.body,
    color: colors.text,
  },
  bio: { minHeight: 84, textAlignVertical: 'top' },
  counter: { fontSize: font.small, color: colors.textSoft, alignSelf: 'flex-end' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingLeft: space.md,
  },
  at: { fontSize: font.body, color: colors.textSoft, fontWeight: '700' },
  inputFlush: { flex: 1, borderWidth: 0, backgroundColor: 'transparent' },
  aliasRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  alias: { fontSize: font.body, fontWeight: '800', color: colors.text },
  shuffle: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  shuffleText: { fontSize: font.small, fontWeight: '700', color: colors.text },
});
