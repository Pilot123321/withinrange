import * as ImagePicker from 'expo-image-picker';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Photo } from './Photo';
import { AvatarSpec } from '../types';
import { colors, font, radius, space } from '../theme';

// Tap to pick a real profile photo from the library. Falls back to showing the
// emoji avatar when no photo is set. Photo is optional — never required.
export function PhotoPickerButton({
  photoUri,
  avatar,
  onChange,
}: {
  photoUri?: string;
  avatar: AvatarSpec;
  onChange: (uri?: string) => void;
}) {
  async function pick() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) onChange(result.assets[0].uri);
  }

  return (
    <View style={styles.row}>
      <Pressable onPress={pick} accessibilityRole="button" accessibilityLabel="Choose a profile photo">
        <Photo photoUri={photoUri} avatar={avatar} size={72} />
      </Pressable>
      <View style={styles.actions}>
        <Pressable onPress={pick} accessibilityRole="button">
          <Text style={styles.action}>{photoUri ? 'Change photo' : 'Add a photo'}</Text>
        </Pressable>
        {photoUri && (
          <Pressable onPress={() => onChange(undefined)} accessibilityRole="button">
            <Text style={[styles.action, styles.remove]}>Remove</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  actions: { gap: space.xs },
  action: { fontSize: font.body, fontWeight: '700', color: colors.primary, paddingVertical: space.xs },
  remove: { color: colors.textSoft },
});
