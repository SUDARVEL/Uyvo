import { Image, StyleSheet, Text, View } from 'react-native';

import { heroArt } from '@/art';
import { HERO_LABEL, type AvatarId, type HeroState } from '@/domain/engine';
import { RIBBON_LABEL } from '@/domain/copy';
import { palette, sashColor } from '@/theme';

export function HeroFigure({ state, avatar, name }: { state: HeroState; avatar: AvatarId; name: string }) {
  return (
    <View style={styles.wrap} accessibilityLabel={`${name}, ${HERO_LABEL[state]}`}>
      <Image source={heroArt[state]} style={styles.photo} />
      <View style={[styles.ribbon, { backgroundColor: sashColor[avatar] }]}>
        <Text style={styles.ribbonText}>{RIBBON_LABEL[avatar]}</Text>
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.state}>{HERO_LABEL[state]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  photo: { width: 220, height: 220, borderRadius: 28, backgroundColor: palette.bg },
  ribbon: { marginTop: -16, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  ribbonText: { color: palette.ink, fontWeight: '800' },
  name: { color: palette.cream, fontSize: 22, fontWeight: '800' },
  state: { color: palette.orange, fontSize: 16, fontWeight: '700' },
});
