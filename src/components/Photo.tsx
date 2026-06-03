import { Image, StyleSheet, Text, View } from 'react-native';
import { AvatarSpec } from '../types';

// Shows a real profile photo if the person set one; otherwise falls back to
// their friendly emoji avatar. Always a circle, so the two look consistent.
export function Photo({
  photoUri,
  avatar,
  size = 56,
}: {
  photoUri?: string;
  avatar: AvatarSpec;
  size?: number;
}) {
  const radius = size / 2;
  if (photoUri) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={{ width: size, height: size, borderRadius: radius }}
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <View
      style={[styles.fallback, { width: size, height: size, borderRadius: radius, backgroundColor: avatar.color }]}
    >
      <Text style={{ fontSize: size * 0.5 }}>{avatar.emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
