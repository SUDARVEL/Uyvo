import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

import { HERO_LABEL, type AvatarId, type HeroState } from '@/domain/engine';
import { palette, sashColor } from '@/theme';

export function HeroFigure({ state, avatar, name }: { state: HeroState; avatar: AvatarId; name: string }) {
  const armored = state === 'armored' || state === 'glowing';
  const tired = state === 'tired';
  const face = state === 'pale' ? '#D7B8B8' : '#F0C7B4';
  const body = armored ? '#7A1020' : state === 'pale' ? '#8C7078' : '#6E4450';
  const shift = tired ? 10 : 0;
  return (
    <View style={styles.wrap} accessibilityLabel={`${name}, ${HERO_LABEL[state]}`}>
      <Svg width={180} height={210} viewBox="0 0 180 210">
        {state === 'glowing' ? <Circle cx="90" cy="108" r="78" fill={palette.orange} opacity={0.28} /> : null}
        <Circle cx="90" cy={72 + shift} r="36" fill={face} />
        <Circle cx="76" cy={68 + shift} r={tired ? 3 : 5} fill={palette.ink} />
        <Circle cx="104" cy={68 + shift} r={tired ? 3 : 5} fill={palette.ink} />
        <Rect x="58" y={118 + shift} width="64" height="70" rx="22" fill={body} />
        <Rect x="72" y={128 + shift} width="36" height="10" rx="5" fill={sashColor[avatar]} />
        {armored ? (
          <Rect x="48" y={112 + shift} width="84" height="30" rx="10" fill={palette.crimson} stroke={palette.orange} strokeWidth="3" />
        ) : null}
        {state === 'glowing' ? <Circle cx="90" cy="156" r="6" fill={palette.leaf} /> : null}
      </Svg>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.state}>{HERO_LABEL[state]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  name: { color: palette.cream, fontSize: 22, fontWeight: '800' },
  state: { color: palette.orange, fontSize: 13, letterSpacing: 1.4, fontWeight: '700' },
});
