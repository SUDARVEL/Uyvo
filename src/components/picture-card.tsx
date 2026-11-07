import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { openingArt } from '@/art';
import { font, palette } from '@/theme';

type Props = {
  label: string;
  sub: string;
  art: ImageSourcePropType;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
};

const FULL = { height: 236, top: 82, bottom: 24, art: 200, artTop: 44, tick: 36, tickBorder: 3, tickIcon: 20 };
const SMALL = { height: 156, top: 54, bottom: 16, art: 132, artTop: 29, tick: 30, tickBorder: 2.5, tickIcon: 16 };

export function PictureCard({ label, sub, art, selected, onPress, compact }: Props) {
  const size = compact ? SMALL : FULL;
  const radius = {
    borderTopLeftRadius: size.top,
    borderTopRightRadius: size.top,
    borderBottomLeftRadius: size.bottom,
    borderBottomRightRadius: size.bottom,
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.card, compact ? styles.cardSmall : null]}>
      <View style={[styles.media, { height: size.height }]}>
        <View style={[styles.shadow, radius, selected ? styles.shadowOn : null]}>
          <View
            style={[
              styles.arch,
              radius,
              selected ? styles.archOn : styles.archOff,
              selected ? { borderColor: palette.crimson } : null,
            ]}>
            {selected ? (
              <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
                <Defs>
                  <LinearGradient id="pictureCardGradient" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#FFF2ED" />
                    <Stop offset="1" stopColor="#F5CCCC" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#pictureCardGradient)" />
              </Svg>
            ) : null}
            <View style={[styles.artRow, { top: size.artTop }]}>
              <Image
                source={art}
                style={[{ width: size.art, height: size.art }, selected ? null : styles.dim]}
                contentFit="contain"
              />
            </View>
          </View>
        </View>
        {selected ? (
          <View
            style={[
              styles.tick,
              { width: size.tick, height: size.tick, borderRadius: size.tick / 2, borderWidth: size.tickBorder },
            ]}>
            <Image
              source={openingArt.checkWhite}
              style={{ width: size.tickIcon, height: size.tickIcon }}
              contentFit="contain"
            />
          </View>
        ) : null}
      </View>
      <View style={styles.copy}>
        <View style={styles.labelRow}>
          <Radio on={selected} />
          <Text style={[styles.label, compact ? styles.labelSmall : null]} numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Text style={[styles.sub, selected ? styles.subOn : null]} numberOfLines={1}>
          {sub}
        </Text>
      </View>
    </Pressable>
  );
}

export function Radio({ on }: { on: boolean }) {
  return (
    <View style={[styles.radio, on ? styles.radioOn : styles.radioOff]}>
      {on ? <View style={styles.radioDot} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, alignItems: 'center', gap: 12 },
  cardSmall: { gap: 8 },
  media: { width: '100%' },
  shadow: { flex: 1 },
  shadowOn: {
    shadowColor: '#B2243D',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
    backgroundColor: '#FFF2ED',
  },
  arch: { flex: 1, overflow: 'hidden' },
  archOn: { borderWidth: 3 },
  archOff: { backgroundColor: palette.raised, borderWidth: 1.5, borderColor: palette.line },
  artRow: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  dim: { opacity: 0.85 },
  tick: {
    position: 'absolute',
    right: 2,
    top: 8,
    backgroundColor: palette.crimson,
    borderColor: palette.raised,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#660D1A',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  copy: { alignItems: 'center', gap: 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { color: palette.ink, fontFamily: font.bold, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  labelSmall: { fontSize: 16, lineHeight: 22 },
  sub: { color: palette.tertiary, fontFamily: font.text, fontSize: 13, lineHeight: 18 },
  subOn: { color: palette.crimson },
  radio: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: palette.crimson },
  radioOff: { backgroundColor: palette.raised, borderWidth: 2, borderColor: palette.tertiary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.raised },
});
