import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

import { palette } from '@/theme';

const spots = [
  { x: 90, y: 48 },
  { x: 62, y: 72 },
  { x: 118, y: 74 },
  { x: 84, y: 90 },
  { x: 46, y: 98 },
  { x: 132, y: 102 },
  { x: 100, y: 112 },
  { x: 70, y: 118 },
];

export function HealthTree({ fruitCount }: { fruitCount: number }) {
  const shown = Math.min(fruitCount, spots.length);
  return (
    <View style={styles.wrap}>
      <Svg width={180} height={190} viewBox="0 0 180 190">
        <Rect x="82" y="90" width="16" height="78" rx="8" fill={palette.crimsonDeep} />
        <Circle cx="90" cy="78" r="48" fill="#1C4A34" />
        <Circle cx="58" cy="96" r="28" fill={palette.leaf} opacity={0.85} />
        <Circle cx="122" cy="98" r="30" fill="#2E8B57" />
        {spots.slice(0, shown).map((spot) => (
          <Circle key={`${spot.x}-${spot.y}`} cx={spot.x} cy={spot.y} r="8" fill={palette.crimson} stroke={palette.orange} strokeWidth="2" />
        ))}
      </Svg>
      <Text style={styles.caption}>
        {fruitCount === 0 ? 'Sapling' : `${fruitCount} pomegranate${fruitCount === 1 ? '' : 's'}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  caption: { color: palette.cream, fontWeight: '700' },
});
