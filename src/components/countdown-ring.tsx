import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { palette } from '@/theme';

export function CountdownRing({
  secondsLeft,
  total = 3600,
  label,
}: {
  secondsLeft: number;
  total?: number;
  label: string;
}) {
  const size = 168;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total <= 0 ? 0 : Math.max(0, Math.min(1, secondsLeft / total));
  const center = size / 2;
  return (
    <View style={styles.wrap} accessibilityLabel={`${label} remaining`}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke={palette.line} strokeWidth={stroke} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={palette.crimson}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference * ratio} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.label}>
        <Text style={styles.time}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 168, height: 168, alignSelf: 'center' },
  label: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  time: { color: palette.ink, fontSize: 32, fontWeight: '600' },
});
