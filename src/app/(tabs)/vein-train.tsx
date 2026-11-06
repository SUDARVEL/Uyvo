import { StyleSheet, Text, View } from 'react-native';

import { HealthTree } from '@/components/tree';
import { Body, Eyebrow, Screen, Title } from '@/components/ui';
import { BADGE_AT, BADGE_LABEL, BADGE_ORDER } from '@/domain/engine';
import { useGame } from '@/state/game';
import { palette } from '@/theme';

export default function VeinTrainScreen() {
  const { snap } = useGame();
  const earned = new Map(snap.badges.map((badge) => [badge.badgeKey, badge.earnedOn]));
  const empty = snap.streak.currentStreak === 0 && snap.badges.length === 0 && snap.tree.fruitCount === 0;

  return (
    <Screen>
      <Eyebrow>UYVO</Eyebrow>
      <Title>Vein Train</Title>
      {empty ? <Body>Your vein train has not left the station. Survive a digest after the three meals.</Body> : null}
      <View style={styles.streakBlock}>
        <Text style={styles.number}>{snap.streak.currentStreak}</Text>
        <Text style={styles.streakLabel}>day streak</Text>
        <Text style={styles.meta}>
          Best {snap.streak.longestStreak}
          {snap.streak.lastSuccessDate ? ` · last success ${snap.streak.lastSuccessDate}` : ''}
        </Text>
      </View>
      <View style={styles.medals}>
        {BADGE_ORDER.map((key) => {
          const date = earned.get(key);
          return (
            <View key={key} style={[styles.medal, date ? styles.earned : styles.locked]}>
              <Text style={styles.medalMark}>{date ? '●' : '○'}</Text>
              <Text style={styles.badge}>{BADGE_LABEL[key]}</Text>
              <Text style={styles.meta}>{date ? date : `${BADGE_AT[key]} days`}</Text>
            </View>
          );
        })}
      </View>
      <HealthTree fruitCount={snap.tree.fruitCount} />
      <Body>Each finished week grows one red pomegranate. Week {snap.tree.weeksCompleted + 1} is on the rails.</Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  streakBlock: { alignItems: 'center', gap: 2, paddingVertical: 8 },
  number: { color: palette.cream, fontSize: 84, fontWeight: '800', lineHeight: 88 },
  streakLabel: { color: palette.orange, fontSize: 14, letterSpacing: 2, fontWeight: '800', textTransform: 'uppercase' },
  medals: { flexDirection: 'row', gap: 8 },
  medal: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.raised,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 10,
  },
  medalMark: { color: palette.orange, fontSize: 22 },
  badge: { color: palette.cream, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  meta: { color: palette.muted, fontSize: 11, textAlign: 'center' },
  earned: { borderColor: palette.leaf },
  locked: { opacity: 0.45 },
});
