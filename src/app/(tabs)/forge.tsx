import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { foodArt } from '@/art';
import { Coach } from '@/components/coach';
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
  art,
  done,
  disabled,
  onPress,
}: {
  title: string;
  detail: string;
  reward: string;
  art: ImageSourcePropType;
  done: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={styles.row}>
      <Image source={art} style={styles.icon} />
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
  const [hint, setHint] = useState<string | null>(null);
  const [confirmTea, setConfirmTea] = useState(false);
  const [busy, setBusy] = useState(false);
  const [coachStep, setCoachStep] = useState(0);
  const today = localDate(new Date(now));
  const todayLogs = logsOn(game.snap.logs, today);
  const ratio = vesselRatio(todayLogs);
  const tea = teaForDate(game.snap.teas, today);
  const profile = game.snap.profile;
  const done = new Set(todayLogs.map((log) => log.questKey));
  const glasses = waterCount(game.snap.logs, today);
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
    if (refusal) {
      setHint(refusal);
      return;
    }
    setHint(null);
    setPending({ quest, step: quest === 'lunch_greens' ? 'food' : 'vitamin', food: null });
  };

  const showCoach = Boolean(profile?.onboardedAt) && !game.snap.coachSeen;
  return (
    <Screen
      overlay={
        showCoach ? (
          <Coach
            step={coachStep}
            onNext={() => {
              if (coachStep >= 3) void game.dismissCoach();
              else setCoachStep((step) => step + 1);
            }}
          />
        ) : null
      }>
      <Eyebrow>UYVO</Eyebrow>
      <Title>Today</Title>
      {game.snap.mode === 'cloud' && !game.online ? <Banner>No network.</Banner> : null}
      {game.notice ? <Banner tone="leaf">{game.notice}</Banner> : null}
      {hint ? <Banner tone="crimson">{hint}</Banner> : null}
      <HeroFigure state={heroState(ratio)} avatar={profile?.avatarId ?? 'woman'} name={profile?.displayName ?? 'Friend'} />
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
      <Text style={styles.detail}>{Math.round(ratio * 100)}% full. Iron is blood food. Flow is water, banana, and walking.</Text>
      <View style={[cardStyle(), styles.vesselRow]}>
        <Vessel ratio={ratio} />
        <View style={styles.totals}>
          <Text style={styles.totalLabel}>Today</Text>
          <Text style={styles.totalValue}>{todayIron} iron</Text>
          <Text style={styles.totalValue}>{todayFlow} flow</Text>
          <Text style={styles.totalLabel}>All days</Text>
          <Text style={styles.lifetime}>
            {game.snap.wallet.ironShards} iron · {game.snap.wallet.flowPoints} flow
          </Text>
        </View>
      </View>
      <View style={[cardStyle(), styles.next]}>
        <Text style={styles.monster}>Do this next</Text>
        {!done.has('morning_shot') ? (
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => openIron('morning_shot')} style={styles.nextRow}>
            <Image source={foodArt.morning_shot} style={styles.nextArt} />
            <Text style={styles.quest}>Drink the soaked dry fruit</Text>
          </Pressable>
        ) : !done.has('midmorning_juice') ? (
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => openIron('midmorning_juice')} style={styles.nextRow}>
            <Image source={foodArt.midmorning_juice} style={styles.nextArt} />
            <Text style={styles.quest}>Drink the red juice</Text>
          </Pressable>
        ) : !done.has('lunch_greens') ? (
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => openIron('lunch_greens')} style={styles.nextRow}>
            <Image source={foodArt.lunch_greens} style={styles.nextArt} />
            <Text style={styles.quest}>Eat green leaves</Text>
          </Pressable>
        ) : !tea ? (
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => setConfirmTea(true)} style={styles.nextRow}>
            <Image source={foodArt.tea} style={styles.nextArt} />
            <Text style={styles.quest}>Start the 60 minute wait. No tea.</Text>
          </Pressable>
        ) : tea.status === 'active' ? (
          <>
            <CountdownRing secondsLeft={teaSeconds} label={clockLabel(teaSeconds)} />
            <Body>Do not drink tea. Water, banana, and walking are still ok.</Body>
            <Button label="I drank tea" tone="crimson" disabled={busy} onPress={() => run(() => game.drinkTea())} />
          </>
        ) : tea.status === 'survived' ? (
          <Body>You waited. Good. +5 iron.</Body>
        ) : (
          <Body>You drank tea. No blood food until the clock ends.</Body>
        )}
      </View>
      <Text style={styles.totalLabel}>The rest of today</Text>
      {CORE_QUESTS.map((quest) => (
        <QuestRow
          key={quest}
          title={QUESTS[quest].label}
          detail={QUESTS[quest].detail}
          art={foodArt[quest]}
          reward={quest === 'morning_shot' ? '+10' : '+15'}
          done={done.has(quest)}
          disabled={busy || done.has(quest)}
          onPress={() => openIron(quest)}
        />
      ))}
      <QuestRow
        title="Water"
        detail={`${glasses} of 12 glasses`}
        art={foodArt.water}
        reward="+5"
        done={glasses >= 12}
        disabled={busy}
        onPress={() => run(() => game.logQuest({ questKey: 'water' }))}
      />
      <QuestRow
        title={QUESTS.banana.label}
        detail={QUESTS.banana.detail}
        art={foodArt.banana}
        reward="+5"
        done={done.has('banana')}
        disabled={busy || done.has('banana')}
        onPress={() => run(() => game.logQuest({ questKey: 'banana' }))}
      />
      <QuestRow
        title={QUESTS.walk.label}
        detail={QUESTS.walk.detail}
        art={foodArt.walk}
        reward="+10"
        done={done.has('walk')}
        disabled={busy || done.has('walk')}
        onPress={() => run(() => game.logQuest({ questKey: 'walk' }))}
      />

      <Sheet visible={pending !== null} title={pending?.step === 'food' ? 'What did you eat?' : 'Add lemon or guava?'} onClose={() => setPending(null)}>
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
            <Body>Lemon or guava makes the iron count double.</Body>
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
              label="Skip"
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
      <Sheet visible={confirmTea} title="Wait 60 minutes?" onClose={() => setConfirmTea(false)}>
        <Body>No tea or coffee for 60 minutes. Blood food stops. Water is still ok. If you drink tea, tap the red button.</Body>
        <Button
          label="Yes, start"
          disabled={busy}
          onPress={() => {
            setConfirmTea(false);
            run(() => game.startDigest());
          }}
        />
        <Button label="Not now" tone="quiet" onPress={() => setConfirmTea(false)} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, backgroundColor: palette.line, overflow: 'hidden' },
  trackFill: { height: 8, borderRadius: 4, backgroundColor: palette.crimson },
  vesselRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  totals: { flex: 1, gap: 4 },
  totalLabel: { color: palette.muted, fontSize: 14 },
  totalValue: { color: palette.ink, fontSize: 22, fontWeight: '600' },
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
  icon: { width: 48, height: 48, borderRadius: 12, backgroundColor: palette.bg },
  next: { borderColor: palette.line },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nextArt: { width: 72, height: 72, borderRadius: 16, backgroundColor: palette.bg },
  rowCopy: { flex: 1, gap: 2 },
  quest: { color: palette.ink, fontSize: 17, fontWeight: '600' },
  detail: { color: palette.muted },
  pill: { backgroundColor: '#F8E6E8', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { color: palette.crimson, fontWeight: '600' },
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
  checkMark: { color: '#FFFFFF', fontWeight: '700' },
  tea: { borderColor: palette.crimson },
  monster: { color: palette.muted, fontSize: 14, fontWeight: '600' },
});
