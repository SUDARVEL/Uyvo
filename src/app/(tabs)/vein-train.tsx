import { Image, StyleSheet, Text, View } from 'react-native';

import { treeArt } from '@/art';
import { Icon } from '@/components/icons';
import { Screen } from '@/components/ui';
import { BADGE_AT, BADGE_LABEL, BADGE_ORDER, localDate } from '@/domain/engine';
import { useGame } from '@/state/game';
import { font, palette } from '@/theme';

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function mondayOf(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const shift = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + shift);
  copy.setHours(12, 0, 0, 0);
  return copy;
}

export default function VeinTrainScreen() {
  const { snap } = useGame();
  const earned = new Set(snap.badges.map((badge) => badge.badgeKey));
  const streak = snap.streak.currentStreak;
  const today = localDate(new Date());
  const monday = mondayOf(new Date());
  const success = new Set<string>();
  if (snap.streak.lastSuccessDate && streak > 0) {
    const end = new Date(`${snap.streak.lastSuccessDate}T12:00:00`);
    for (let index = 0; index < streak; index += 1) {
      const day = new Date(end);
      day.setDate(end.getDate() - index);
      success.add(localDate(day));
    }
  }
  const left = Math.max(0, 7 - streak);

  return (
    <Screen>
      <Text style={styles.title}>Your days</Text>
      <View style={styles.card}>
        <Text style={styles.number}>{streak}</Text>
        <Text style={styles.italic}>days in a row</Text>
        <View style={styles.week}>
          {WEEK.map((label, index) => {
            const day = new Date(monday);
            day.setDate(monday.getDate() + index);
            const key = localDate(day);
            const done = success.has(key);
            const isToday = key === today;
            return (
              <View key={`${label}-${index}`} style={styles.day}>
                <View style={[styles.bubble, done ? styles.bubbleOn : null, !done && isToday ? styles.bubbleToday : null]}>
                  {done ? <Icon name="check" size={14} /> : null}
                </View>
                <Text style={styles.dayLabel}>{label}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.meta}>{left === 0 ? 'Full week.' : `${left} more ${left === 1 ? 'day' : 'days'} to a full week`}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.medals}>
          {BADGE_ORDER.map((key) => {
            const got = earned.has(key);
            return (
              <View key={key} style={styles.medal}>
                <View style={[styles.disc, got ? styles.discOn : styles.discOff]}>
                  <Text style={[styles.discText, got ? styles.discTextOn : null]}>{BADGE_AT[key]}</Text>
                </View>
                <Text style={styles.medalLabel}>{BADGE_LABEL[key]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.plant}>
        <Image source={treeArt.sapling} style={styles.plantArt} />
        <View style={styles.grow}>
          <Text style={styles.plantTitle}>Your plant is growing</Text>
          <Text style={styles.plantBody}>After 7 full days it becomes a pomegranate.</Text>
          <View style={styles.ticks}>
            {Array.from({ length: 7 }, (_, index) => (
              <View key={index} style={[styles.tick, index < streak ? styles.tickOn : null]} />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.fruitRow}>
          <Image source={treeArt.fruit} style={styles.fruit} />
          <View style={styles.grow}>
            <Text style={styles.kicker}>RED FRUITS</Text>
            <Text style={styles.fruitCount}>{snap.tree.fruitCount} collected</Text>
          </View>
          <Text style={styles.times}>×{snap.tree.fruitCount}</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: palette.ink, fontFamily: font.display, fontSize: 36 },
  card: { backgroundColor: palette.raised, borderRadius: 24, padding: 18, gap: 12 },
  number: { color: palette.crimson, fontFamily: font.display, fontSize: 96, lineHeight: 100, textAlign: 'center' },
  italic: { color: palette.crimson, fontFamily: font.displayItalic, fontSize: 22, textAlign: 'center' },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 6 },
  bubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleOn: { backgroundColor: palette.crimson },
  bubbleToday: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: palette.crimson, backgroundColor: 'transparent' },
  dayLabel: { color: palette.tertiary, fontFamily: font.semibold, fontSize: 12 },
  meta: { color: palette.muted, fontFamily: font.text, fontSize: 14, textAlign: 'center' },
  medals: { flexDirection: 'row', justifyContent: 'space-around' },
  medal: { alignItems: 'center', gap: 8 },
  disc: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  discOn: { backgroundColor: palette.crimson },
  discOff: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: palette.crimson, backgroundColor: 'transparent' },
  discText: { color: palette.crimson, fontFamily: font.display, fontSize: 22 },
  discTextOn: { color: '#FFFFFF' },
  medalLabel: { color: palette.ink, fontFamily: font.semibold, fontSize: 13 },
  plant: { flexDirection: 'row', gap: 12, backgroundColor: palette.leafSoft, borderRadius: 24, padding: 14, alignItems: 'center' },
  plantArt: { width: 72, height: 72, borderRadius: 16 },
  grow: { flex: 1, gap: 4 },
  plantTitle: { color: palette.ink, fontFamily: font.semibold, fontSize: 16 },
  plantBody: { color: palette.muted, fontFamily: font.text, fontSize: 13, lineHeight: 18 },
  ticks: { flexDirection: 'row', gap: 4, marginTop: 6 },
  tick: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#D5E4C8' },
  tickOn: { backgroundColor: palette.leaf },
  fruitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fruit: { width: 56, height: 56, borderRadius: 14 },
  kicker: { color: palette.tertiary, fontFamily: font.bold, fontSize: 11, letterSpacing: 1.2 },
  fruitCount: { color: palette.ink, fontFamily: font.display, fontSize: 22 },
  times: { color: palette.crimson, fontFamily: font.display, fontSize: 28 },
});
