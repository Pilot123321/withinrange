import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { makeAlias } from '../alias';
import { INTENT_ORDER, INTENTS, IntentTag } from '../intents';
import { MBTI_TYPES } from '../personal';
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
  const toggleIntent = (tag: IntentTag) => {
    const has = draft.intents.includes(tag);
    onChange({ intents: has ? draft.intents.filter((t) => t !== tag) : [...draft.intents, tag] });
  };
  const [hobbyDraft, setHobbyDraft] = useState('');
  const addHobby = () => {
    const h = hobbyDraft.trim();
    setHobbyDraft('');
    if (!h || draft.hobbies.length >= 10) return;
    if (draft.hobbies.some((x) => x.toLowerCase() === h.toLowerCase())) return; // no dupes
    onChange({ hobbies: [...draft.hobbies, h] });
  };
  const removeHobby = (h: string) => onChange({ hobbies: draft.hobbies.filter((x) => x !== h) });

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
        <Text style={styles.label}>What you're open to</Text>
        <Text style={styles.hint}>Lets people nearby find you by what you're here for. Optional.</Text>
        <View style={styles.chips}>
          {INTENT_ORDER.map((tag) => {
            const on = draft.intents.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => toggleIntent(tag)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.intentChip, on && styles.intentChipOn]}
              >
                <Text style={[styles.intentText, on && styles.intentTextOn]}>
                  {INTENTS[tag].emoji} {INTENTS[tag].label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Hobbies</Text>
        <Text style={styles.hint}>Type a hobby and add it. Helps people find common ground. Optional.</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.inputFlush]}
            value={hobbyDraft}
            onChangeText={setHobbyDraft}
            onSubmitEditing={addHobby}
            placeholder="e.g. rock climbing"
            placeholderTextColor={colors.textSoft}
            returnKeyType="done"
            maxLength={24}
            blurOnSubmit={false}
            accessibilityLabel="Add a hobby"
          />
          <Pressable
            onPress={addHobby}
            accessibilityRole="button"
            accessibilityLabel="Add hobby"
            style={styles.addBtn}
            disabled={!hobbyDraft.trim()}
          >
            <Ionicons name="add" size={24} color={hobbyDraft.trim() ? colors.primary : colors.textSoft} />
          </Pressable>
        </View>
        {draft.hobbies.length > 0 && (
          <View style={styles.chips}>
            {draft.hobbies.map((h) => (
              <Pressable
                key={h}
                onPress={() => removeHobby(h)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${h}`}
                style={[styles.intentChip, styles.intentChipOn]}
              >
                <Text style={[styles.intentText, styles.intentTextOn]}>{h}  ✕</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>MBTI</Text>
        <Text style={styles.hint}>Optional. Tap to set, tap again to clear.</Text>
        <View style={styles.chips}>
          {MBTI_TYPES.map((t) => {
            const on = draft.mbti === t;
            return (
              <Pressable
                key={t}
                onPress={() => onChange({ mbti: on ? undefined : t })}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.intentChip, on && styles.intentChipOn]}
              >
                <Text style={[styles.intentText, on && styles.intentTextOn]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>
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
  addBtn: { paddingHorizontal: space.md, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
  intentChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  intentChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  intentText: { fontSize: font.small, fontWeight: '600', color: colors.text },
  intentTextOn: { color: colors.primaryText },
});

