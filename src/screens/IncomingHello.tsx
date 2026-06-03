import { StyleSheet, Text, View } from 'react-native';
import { Photo } from '../components/Photo';
import { PrimaryButton } from '../components/PrimaryButton';
import { Sheet } from '../components/Sheet';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { colors, font, space } from '../theme';
import { NearbyPeer } from '../types';

// Someone nearby is open to you. Warm and low-stakes: opening back connects you
// both; "not now" closes it and they're never told. No rejection, ever.
export function IncomingHello({
  peer,
  onOpen,
  onDismiss,
}: {
  peer: NearbyPeer | null;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  return (
    <Sheet visible={!!peer} onClose={onDismiss}>
      <View style={styles.body}>
        {peer && <Photo photoUri={peer.photoUri} avatar={peer.avatar} size={72} />}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{peer?.displayName} said hi 👋</Text>
          <VerifiedBadge verified={!!peer?.verified} size={18} />
        </View>
        {!!peer?.bio && <Text style={styles.bio}>{peer.bio}</Text>}
        <Text style={styles.copy}>
          If you're open to it, you'll both get each other's Instagram. If not, just tap “Not now” — they'll
          never know.
        </Text>
        <PrimaryButton label="I'm open 💫" onPress={onOpen} style={styles.btn} />
        <PrimaryButton label="Not now" variant="subtle" onPress={onDismiss} style={styles.btn} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', gap: space.md, alignSelf: 'stretch' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text, textAlign: 'center' },
  bio: { fontSize: font.body, color: colors.textSoft, textAlign: 'center', lineHeight: 24 },
  copy: { fontSize: font.body, color: colors.textSoft, textAlign: 'center', lineHeight: 24 },
  btn: { alignSelf: 'stretch' },
});
