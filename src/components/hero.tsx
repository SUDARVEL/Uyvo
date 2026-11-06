import { Image, StyleSheet, Text, View } from 'react-native';

import { heroArt } from '@/art';
import { HERO_LABEL, type AvatarId, type HeroState } from '@/domain/engine';
import { palette } from '@/theme';

export function HeroFigure({ state, avatar, name }: { state: HeroState; avatar: AvatarId; name: string }) {
  return (
    <View style={styles.wrap} accessibilityLabel={`${name}, ${HERO_LABEL[state]}`}>
      <Image source={heroArt[avatar][state]} style={styles.photo} />
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.state}>{HERO_LABEL[state]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  photo: { width: 220, height: 220, borderRadius: 24, backgroundColor: palette.cream },
  name: { color: palette.ink, fontSize: 28, fontWeight: '600' },
  state: { color: palette.muted, fontSize: 16 },
});
