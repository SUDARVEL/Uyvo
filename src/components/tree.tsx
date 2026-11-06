import { Image, StyleSheet, Text, View } from 'react-native';

import { treeArt } from '@/art';
import { palette } from '@/theme';

export function HealthTree({ fruitCount }: { fruitCount: number }) {
  const grown = fruitCount > 0;
  return (
    <View style={styles.wrap}>
      <Image source={grown ? treeArt.fruit : treeArt.sapling} style={styles.photo} />
      <Text style={styles.caption}>{grown ? `${fruitCount} red fruit` : 'Small plant'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  photo: { width: 200, height: 200, borderRadius: 24, backgroundColor: palette.bg },
  caption: { color: palette.cream, fontWeight: '700', fontSize: 16 },
});
