import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CountdownRing } from '@/components/countdown-ring';
import { HeroFigure } from '@/components/hero';
import { Banner, Body, Button, Eyebrow, Screen, Sheet, Title, cardStyle } from '@/components/ui';
import { Vessel } from '@/components/vessel';
import {
  CORE_QUESTS,
  FOODS,
  FOOD_LABEL,
  QUESTS,
  VITAMIN_FOODS,
  canLog,
  canStartDigest,
  heroState,
  localDate,
  logsOn,
  teaForDate,
  vesselRatio,
  waterCount,
  type FoodKey,
  type IronQuest,
  type VitaminFood,
} from '@/domain/engine';
import { useGame } from '@/state/game';
import { palette } from '@/theme';

type Pending = { quest: IronQuest; step: 'food' | 'vitamin'; food: FoodKey | null };

function secondsLeft(endsAt: string, now: number): number {
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - now) / 1000));
}

function clockLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function QuestRow({
  title,
  detail,
  reward,
  done,
  disabled,
  onPress,
}: {
  title: string;
  detail: string;
  reward: string;
  done: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={styles.row}>
      <View style={styles.rowCopy}>
        <Text style={styles.quest}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      <View style={styles.pill}>
        <Text style={styles.pillText}>{reward}</Text>
      </View>
      <View style={[styles.check, done ? styles.checkOn : null]}>
        <Text style={styles.checkMark}>{done ? '✓' : ''}</Text>
      </View>
    </Pressable>
  );
}

export default function ForgeScreen() {
  const game = useGame();
  const [now, setNow] = useState(() => Date.now());
  const [pending, setPending] = useState<Pending | null>(null);
  const [confirmTea, setConfirmTea] = useState(false);
  const [busy, setBusy] = useState(false);
  const today = localDate(new Date(now));
  const todayLogs = logsOn(game.snap.logs, today);
  const ratio = vesselRatio(todayLogs);
  const tea = teaForDate(game.snap.teas, today);
  const profile = game.snap.profile;
  const done = new Set(todayLogs.map((log) => log.questKey));
  const glasses = waterCount(game.snap.logs, today);
  const cold = CORE_QUESTS.every((quest) => !done.has(quest));
  const todayIron = todayLogs.reduce((sum, log) => sum + log.ironShardsAwarded, 0);
  const todayFlow = todayLogs.reduce((sum, log) => sum + log.flowPointsAwarded, 0);
  const teaSeconds = tea?.status === 'active' ? Math.min(3600, secondsLeft(tea.endsAt, now)) : 0;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const run = (task: () => Promise<string | null>) => {
    setBusy(true);
    void task().finally(() => setBusy(false));
  };

  const openIron = (quest: IronQuest) => {
    const refusal = canLog({
      questKey: quest,
      logs: game.snap.logs,
      teas: game.snap.teas,
      now: new Date(now),
      today,
    });
    if (refusal) return;
    setPending({ quest, step: quest === 'lunch_greens' ? 'food' : 'vitamin', food: null });
  };

  return (
    <Screen>
      <Eyebrow>UYVO</Eyebrow>
      <Title>Daily Blood Forge</Title>
      {game.snap.mode === 'device' ? (
        <Banner>On this device only. Uyvo is not connected, so nothing syncs.</Banner>
      ) : null}
      {game.snap.mode === 'cloud' && !game.online ? (
        <Banner>Offline — today's forge is saved on this device.</Banner>
      ) : null}
      {game.notice ? <Banner tone="leaf">{game.notice}</Banner> : null}
      {cold ? <Body>The forge is cold. The morning shot lights it.</Body> : null}
      <HeroFigure state={heroState(ratio)} avatar={profile?.avatarId ?? 'ember'} name={profile?.displayName ?? 'Hero'} />
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
      <Text style={styles.detail}>{Math.round(ratio * 100)}% of today's forge · three meals, then survive the digest</Text>
      <View style={[cardStyle(), styles.vesselRow]}>
        <Vessel ratio={ratio} />
        <View style={styles.totals}>
          <Text style={styles.totalLabel}>Today</Text>
          <Text style={styles.totalValue}>{todayIron} Iron Shards</Text>
          <Text style={styles.totalValue}>{todayFlow} Flow Points</Text>
          <Text style={styles.totalLabel}>Lifetime</Text>
          <Text style={styles.lifetime}>
            {game.snap.wallet.ironShards} shards · {game.snap.wallet.flowPoints} flow
          </Text>
        </View>
      </View>
      {CORE_QUESTS.map((quest) => (
        <QuestRow
          key={quest}
          title={QUESTS[quest].label}
          detail={QUESTS[quest].detail}
          reward={quest === 'morning_shot' ? '+10' : '+15'}
          done={done.has(quest)}
          disabled={busy || done.has(quest)}
          onPress={() => openIron(quest)}
        />
      ))}
      <QuestRow
        title="Water"
        detail={`${glasses}/12 glasses · 500 ml`}
        reward="+5"
        done={glasses >= 12}
        disabled={busy}
        onPress={() => run(() => game.logQuest({ questKey: 'water' }))}
      />
      <QuestRow
        title={QUESTS.banana.label}
        detail={QUESTS.banana.detail}
        reward="+5"
        done={done.has('banana')}
        disabled={busy || done.has('banana')}
        onPress={() => run(() => game.logQuest({ questKey: 'banana' }))}
      />
      <QuestRow
        title={QUESTS.walk.label}
        detail={QUESTS.walk.detail}
        reward="+10"
        done={done.has('walk')}
        disabled={busy || done.has('walk')}
        onPress={() => run(() => game.logQuest({ questKey: 'walk' }))}
      />
      <View style={[cardStyle(), styles.tea]}>
        <Text style={styles.monster}>Next monster</Text>
        <Text style={styles.quest}>Tea / Coffee</Text>
        {!done.has('lunch_greens') ? <Body>Eat greens, then wake the monster.</Body> : null}
        {done.has('lunch_greens') && !tea ? (
          <Button label="Start Digesting" disabled={busy || canStartDigest(game.snap.logs, game.snap.teas, today) !== null} onPress={() => setConfirmTea(true)} />
        ) : null}
        {tea?.status === 'active' ? (
          <>
            <CountdownRing secondsLeft={teaSeconds} label={clockLabel(teaSeconds)} />
            <Body>Iron meals are locked. Water, bananas, and walking still count.</Body>
            <Button label="I drank tea" tone="crimson" disabled={busy} onPress={() => run(() => game.drinkTea())} />
          </>
        ) : null}
        {tea?.status === 'survived' ? <Body>The monster left. +5 Iron Shards.</Body> : null}
        {tea?.status === 'drank' ? <Body>Tea won this window. Iron stays locked until the clock ends.</Body> : null}
      </View>

      <Sheet visible={pending !== null} title={pending?.step === 'food' ? 'Which green?' : 'Double this iron?'} onClose={() => setPending(null)}>
        {pending?.step === 'food' ? (
          FOODS.map((food) => (
            <Button
              key={food}
              label={FOOD_LABEL[food]}
              tone="leaf"
              onPress={() => setPending({ ...pending, step: 'vitamin', food })}
            />
          ))
        ) : (
          <>
            <Body>Lemon or guava doubles this meal's Iron Shards.</Body>
            {VITAMIN_FOODS.map((vitamin) => (
              <Button
                key={vitamin}
                label={vitamin === 'lemon' ? 'Lemon' : 'Guava'}
                disabled={busy}
                onPress={() => {
                  if (!pending) return;
                  setPending(null);
                  run(() =>
                    game.logQuest({
                      questKey: pending.quest,
                      foodKey: pending.food,
                      vitaminCFood: vitamin as VitaminFood,
                    }),
                  );
                }}
              />
            ))}
            <Button
              label="No thanks"
              tone="quiet"
              disabled={busy}
              onPress={() => {
                if (!pending) return;
                setPending(null);
                run(() => game.logQuest({ questKey: pending.quest, foodKey: pending.food, vitaminCFood: null }));
              }}
            />
          </>
        )}
      </Sheet>
      <Sheet visible={confirmTea} title="Wake the Tea Monster?" onClose={() => setConfirmTea(false)}>
        <Body>The lock lasts 60 minutes. Iron meals stop. Flow still counts. If you drink tea, say so — the streak bonus is lost.</Body>
        <Button
          label="Wake the monster"
          disabled={busy}
          onPress={() => {
            setConfirmTea(false);
            run(() => game.startDigest());
          }}
        />
        <Button label="Not yet" tone="quiet" onPress={() => setConfirmTea(false)} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, backgroundColor: palette.line, overflow: 'hidden' },
  trackFill: { height: 8, borderRadius: 4, backgroundColor: palette.orange },
  vesselRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  totals: { flex: 1, gap: 4 },
  totalLabel: { color: palette.muted, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  totalValue: { color: palette.cream, fontSize: 18, fontWeight: '800' },
  lifetime: { color: palette.leaf, fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.raised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 14,
  },
  rowCopy: { flex: 1, gap: 2 },
  quest: { color: palette.cream, fontSize: 17, fontWeight: '800' },
  detail: { color: palette.muted },
  pill: { backgroundColor: '#3A2014', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { color: palette.orange, fontWeight: '800' },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: palette.leaf, borderColor: palette.leaf },
  checkMark: { color: palette.ink, fontWeight: '800' },
  tea: { borderColor: palette.crimson },
  monster: { color: palette.orange, fontSize: 12, letterSpacing: 1.4, fontWeight: '700', textTransform: 'uppercase' },
});
