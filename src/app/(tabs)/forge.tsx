import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { foodArt, heroArt, treeArt } from '@/art';
import { Coach } from '@/components/coach';
import { Icon, Toggle } from '@/components/icons';
import { Banner, Button, Screen } from '@/components/ui';
import {
  FOODS,
  HERO_LABEL,
  heroState,
  localDate,
  logsOn,
  teaForDate,
  vesselRatio,
  waterCount,
  type FoodKey,
  type HeroState,
  type VitaminFood,
} from '@/domain/engine';
import { useGame } from '@/state/game';
import { font, palette } from '@/theme';

const FILL: Record<HeroState, number> = { pale: 1, tired: 2, armored: 3, glowing: 4 };

function secondsLeft(endsAt: string, now: number): number {
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - now) / 1000));
}

function clockLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function dateLabel(now: number): string {
  const date = new Date(now);
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase();
  const month = date.toLocaleDateString('en-GB', { month: 'short' }).replace('.', '').toUpperCase();
  return `${weekday} · ${date.getDate()} ${month}`;
}

function OrderRow({
  title,
  detail,
  art,
  state,
}: {
  title: string;
  detail: string;
  art: ImageSourcePropType;
  state: 'current' | 'locked' | 'done';
}) {
  return (
    <View style={[styles.order, state === 'locked' ? styles.locked : null]}>
      <Image source={art} style={styles.thumb} />
      <View style={styles.grow}>
        <Text style={[styles.orderTitle, state === 'locked' ? styles.faint : null]}>{title}</Text>
        <Text style={styles.orderDetail}>{detail}</Text>
      </View>
      {state === 'done' ? (
        <View style={styles.doneDot}>
          <Icon name="check" size={14} />
        </View>
      ) : state === 'locked' ? (
        <Icon name="lock" size={18} />
      ) : (
        <View style={styles.openDot} />
      )}
    </View>
  );
}

export default function ForgeScreen() {
  const game = useGame();
  const [now, setNow] = useState(() => Date.now());
  const [lemon, setLemon] = useState(false);
  const [food, setFood] = useState<FoodKey>('keerai');
  const [hint, setHint] = useState<string | null>(null);
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
  const state = heroState(ratio);
  const avatar = profile?.avatarId ?? 'woman';
  const name = profile?.displayName ?? 'there';
  const streak = game.snap.streak.currentStreak;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const run = (task: () => Promise<string | null>) => {
    setBusy(true);
    setHint(null);
    void task()
      .then((error) => {
        if (error) setHint(error);
      })
      .finally(() => setBusy(false));
  };

  const vitamin: VitaminFood | null = lemon ? 'lemon' : null;
  const morningDone = done.has('morning_shot');
  const juiceDone = done.has('midmorning_juice');
  const greensDone = done.has('lunch_greens');
  const waitStarted = Boolean(tea);
  const waited = tea?.status === 'survived' || done.has('digest_survive');
  const drank = tea?.status === 'drank';
  const steps = [morningDone, juiceDone, greensDone, waited || drank, waited];
  const doneCount = steps.filter(Boolean).length;
  const current = steps.findIndex((step) => !step);

  const showCoach = Boolean(profile?.onboardedAt) && !game.snap.coachSeen;

  const logIron = (questKey: 'morning_shot' | 'midmorning_juice' | 'lunch_greens') => {
    run(() =>
      game.logQuest({
        questKey,
        foodKey: questKey === 'lunch_greens' ? food : null,
        vitaminCFood: vitamin,
      }),
    );
  };

  return (
    <Screen
      overlay={
        showCoach ? (
          <Coach
            step={coachStep}
            onNext={() => {
              if (coachStep >= 1) void game.dismissCoach();
              else setCoachStep(1);
            }}
          />
        ) : null
      }>
      <Text style={styles.date}>{dateLabel(now)}</Text>
      <View style={styles.helloRow}>
        <Text style={styles.hello}>Hi, {name}</Text>
        <View style={styles.streakChip}>
          <Text style={styles.streakText}>{streak} {streak === 1 ? 'day' : 'days'} in a row</Text>
        </View>
      </View>
      {game.snap.mode === 'cloud' && !game.online ? <Banner>No network.</Banner> : null}
      {hint ? <Banner tone="crimson">{hint}</Banner> : null}

      <View style={styles.card}>
        <View style={styles.portraitWrap}>
          <Image source={heroArt[avatar][state]} style={styles.portrait} resizeMode="cover" />
          <View style={styles.badge}>
            <Icon name="sun" size={14} />
            <Text style={styles.badgeText}>Starts empty each morning</Text>
          </View>
        </View>
        <View style={styles.meterHead}>
          <Text style={styles.meterLabel}>{HERO_LABEL[state]}</Text>
          <Text style={styles.meterCount}>{FILL[state]} of 4</Text>
        </View>
        <View style={styles.bars}>
          {[0, 1, 2, 3].map((index) => (
            <View key={index} style={[styles.bar, index < FILL[state] ? styles.barOn : null]} />
          ))}
        </View>
        <View style={styles.pills}>
          <View style={[styles.stat, styles.ironPill]}>
            <Icon name="heart" size={16} />
            <Text style={styles.ironText}>{todayIron} iron</Text>
          </View>
          <View style={[styles.stat, styles.flowPill]}>
            <Icon name="droplet" size={16} />
            <Text style={styles.flowText}>{todayFlow} flow</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        {current === 0 ? (
          <NextCard
            index={1}
            art={foodArt.morning_shot}
            title="Drink the soaked dry fruit"
            body="Dates and raisins, soaked overnight. Drink it first."
            chips={lemon ? ['+20 iron', 'Morning'] : ['+10 iron', 'Morning']}
            lemon={lemon}
            onLemon={setLemon}
            doubled="Doubles the iron → 20"
            action="I drank it"
            busy={busy}
            onAction={() => logIron('morning_shot')}
          />
        ) : current === 1 ? (
          <NextCard
            index={2}
            art={foodArt.midmorning_juice}
            title="Drink the red juice"
            body="Beetroot or pomegranate juice. Drink it before lunch."
            chips={lemon ? ['+30 iron', '+5 flow'] : ['+15 iron', '+5 flow']}
            lemon={lemon}
            onLemon={setLemon}
            doubled="Doubles the iron → 30"
            action="I drank it"
            busy={busy}
            onAction={() => logIron('midmorning_juice')}
          />
        ) : current === 2 ? (
          <NextCard
            index={3}
            art={foodArt.lunch_greens}
            title="Eat green leaves"
            body="Keerai, spinach, or beetroot. Then the 60 minute wait."
            chips={lemon ? ['+30 iron', 'Lunch'] : ['+15 iron', 'Lunch']}
            foods={food}
            onFood={setFood}
            lemon={lemon}
            onLemon={setLemon}
            doubled="Doubles the iron → 30"
            action="I ate it"
            busy={busy}
            onAction={() => logIron('lunch_greens')}
          />
        ) : current === 3 && !tea ? (
          <NextCard
            index={4}
            art={foodArt.tea}
            title="Wait 60 minutes"
            body="No tea or coffee. Water is still fine."
            chips={['No tea', '60 min']}
            action="Start the wait"
            busy={busy}
            onAction={() => run(() => game.startDigest())}
          />
        ) : tea?.status === 'active' ? (
          <NextCard
            index={4}
            art={foodArt.tea}
            title="Don't drink tea"
            body={`${clockLabel(teaSeconds)} left. Water, banana, and a walk are fine.`}
            chips={['60 min', 'Water is fine']}
            action="I drank tea"
            busy={busy}
            onAction={() => run(() => game.drinkTea())}
          />
        ) : drank ? (
          <NextCard
            index={4}
            art={foodArt.tea}
            title="You drank tea"
            body={teaSeconds > 0 ? `${clockLabel(teaSeconds)} left. No blood food until then.` : 'No blood food until the clock ends.'}
            chips={['Paused']}
          />
        ) : (
          <NextCard
            index={5}
            art={treeArt.fruit}
            title="You waited"
            body="Today’s blood food is done. Water, banana, and a walk are still open."
            chips={['+5 iron']}
          />
        )}
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.section}>Today’s order</Text>
        <Text style={styles.sectionMeta}>{doneCount} of 5 done</Text>
      </View>
      <OrderRow
        title="Soaked dry fruit"
        detail="10 iron · ×2 with lemon or guava"
        art={foodArt.morning_shot}
        state={morningDone ? 'done' : 'current'}
      />
      <OrderRow
        title="Red juice"
        detail="15 iron · 5 flow"
        art={foodArt.midmorning_juice}
        state={juiceDone ? 'done' : morningDone ? 'current' : 'locked'}
      />
      <OrderRow
        title="Green leaves"
        detail="15 iron · keerai, spinach, beetroot"
        art={foodArt.lunch_greens}
        state={greensDone ? 'done' : juiceDone ? 'current' : 'locked'}
      />
      <OrderRow
        title="Wait 60 minutes"
        detail="No tea · water is fine"
        art={foodArt.tea}
        state={waited || drank ? 'done' : greensDone ? 'current' : 'locked'}
      />
      <OrderRow
        title="You waited"
        detail="+5 iron bonus"
        art={treeArt.fruit}
        state={waited ? 'done' : 'locked'}
      />

      <View style={styles.sectionHead}>
        <Text style={styles.section}>Any time today</Text>
        <Text style={styles.sectionMeta}>Water, banana, walk</Text>
      </View>
      <View style={styles.order}>
        <Image source={foodArt.water} style={styles.thumb} />
        <View style={styles.grow}>
          <Text style={styles.orderTitle}>Water</Text>
          <Text style={styles.orderDetail}>{glasses} of 12 glasses · 5 flow each</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="One less glass"
          disabled={busy || glasses === 0}
          onPress={() => run(() => game.removeWater())}
          style={[styles.round, glasses === 0 ? styles.roundOff : null]}>
          <Icon name="minus" size={16} />
        </Pressable>
        <Text style={styles.glassCount}>{glasses}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="One more glass"
          disabled={busy || glasses >= 12}
          onPress={() => run(() => game.logQuest({ questKey: 'water' }))}
          style={[styles.round, styles.roundOn, glasses >= 12 ? styles.roundOff : null]}>
          <Icon name="plus" size={16} />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={busy || done.has('banana')}
        onPress={() => run(() => game.logQuest({ questKey: 'banana' }))}
        style={styles.order}>
        <Image source={foodArt.banana} style={styles.thumb} />
        <View style={styles.grow}>
          <Text style={styles.orderTitle}>Banana</Text>
          <Text style={styles.orderDetail}>5 flow · once today</Text>
        </View>
        {done.has('banana') ? (
          <View style={styles.doneDot}>
            <Icon name="check" size={14} />
          </View>
        ) : (
          <View style={styles.openDot} />
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={busy || done.has('walk')}
        onPress={() => run(() => game.logQuest({ questKey: 'walk' }))}
        style={styles.order}>
        <Image source={foodArt.walk} style={styles.thumb} />
        <View style={styles.grow}>
          <Text style={styles.orderTitle}>A short walk</Text>
          <Text style={styles.orderDetail}>10 flow · once today</Text>
        </View>
        {done.has('walk') ? (
          <View style={styles.doneDot}>
            <Icon name="check" size={14} />
          </View>
        ) : (
          <View style={styles.openDot} />
        )}
      </Pressable>
    </Screen>
  );
}

function NextCard({
  index,
  art,
  title,
  body,
  chips,
  foods,
  onFood,
  lemon,
  onLemon,
  doubled,
  action,
  busy,
  onAction,
}: {
  index: number;
  art: ImageSourcePropType;
  title: string;
  body: string;
  chips: string[];
  foods?: FoodKey;
  onFood?: (food: FoodKey) => void;
  lemon?: boolean;
  onLemon?: (value: boolean) => void;
  doubled?: string;
  action?: string;
  busy?: boolean;
  onAction?: () => void;
}) {
  return (
    <View style={styles.next}>
      <Image source={art} style={styles.heroFood} />
      <Text style={styles.nextKicker}>NEXT · {index} OF 5</Text>
      <Text style={styles.nextTitle}>{title}</Text>
      <Text style={styles.nextBody}>{body}</Text>
      <View style={styles.chips}>
        {chips.map((chip) => (
          <View key={chip} style={styles.chip}>
            <Text style={styles.chipText}>{chip}</Text>
          </View>
        ))}
      </View>
      {onFood && foods ? (
        <View style={styles.chips}>
          {FOODS.map((choice) => (
            <Pressable key={choice} accessibilityRole="button" onPress={() => onFood(choice)} style={[styles.chip, foods === choice ? styles.chipOn : null]}>
              <Text style={[styles.chipText, foods === choice ? styles.chipTextOn : null]}>
                {choice === 'keerai' ? 'Keerai' : choice === 'spinach' ? 'Spinach' : 'Beetroot'}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {onLemon ? (
        <View style={styles.lemon}>
          <Icon name="zap" size={18} />
          <View style={styles.grow}>
            <Text style={styles.lemonTitle}>Add lemon or guava</Text>
            <Text style={styles.lemonSub}>{doubled}</Text>
          </View>
          <Toggle value={Boolean(lemon)} onValueChange={onLemon} />
        </View>
      ) : null}
      {action && onAction ? <Button label={action} disabled={busy} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  date: { color: palette.tertiary, fontFamily: font.bold, fontSize: 12, letterSpacing: 1.4 },
  helloRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  hello: { color: palette.ink, fontFamily: font.display, fontSize: 32, flexShrink: 1 },
  streakChip: { backgroundColor: palette.leafSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  streakText: { color: palette.leaf, fontFamily: font.bold, fontSize: 12 },
  card: { backgroundColor: palette.raised, borderRadius: 24, padding: 14, gap: 12 },
  portraitWrap: { borderRadius: 20, overflow: 'hidden', backgroundColor: palette.sunken, height: 280 },
  portrait: { width: '100%', height: 280 },
  badge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.raised,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: { color: palette.ink, fontFamily: font.semibold, fontSize: 12 },
  meterHead: { flexDirection: 'row', justifyContent: 'space-between' },
  meterLabel: { color: palette.ink, fontFamily: font.bold, fontSize: 16 },
  meterCount: { color: palette.muted, fontFamily: font.semibold, fontSize: 14 },
  bars: { flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: palette.sunken },
  barOn: { backgroundColor: palette.crimson },
  pills: { flexDirection: 'row', gap: 8 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  ironPill: { backgroundColor: palette.blush },
  flowPill: { backgroundColor: palette.leafSoft },
  ironText: { color: palette.crimson, fontFamily: font.bold, fontSize: 14 },
  flowText: { color: palette.leaf, fontFamily: font.bold, fontSize: 14 },
  next: { gap: 10 },
  heroFood: { width: '100%', height: 160, borderRadius: 18, backgroundColor: palette.blush },
  nextKicker: { color: palette.crimson, fontFamily: font.bold, fontSize: 12, letterSpacing: 1.2 },
  nextTitle: { color: palette.ink, fontFamily: font.display, fontSize: 26, lineHeight: 32 },
  nextBody: { color: palette.muted, fontFamily: font.text, fontSize: 15, lineHeight: 21 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: palette.sunken, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipOn: { backgroundColor: palette.blush },
  chipText: { color: palette.ink, fontFamily: font.semibold, fontSize: 13 },
  chipTextOn: { color: palette.crimson },
  lemon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.amberSoft,
    borderRadius: 16,
    padding: 12,
  },
  lemonTitle: { color: palette.ink, fontFamily: font.semibold, fontSize: 14 },
  lemonSub: { color: palette.orange, fontFamily: font.text, fontSize: 13 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  section: { color: palette.ink, fontFamily: font.bold, fontSize: 16 },
  sectionMeta: { color: palette.tertiary, fontFamily: font.semibold, fontSize: 13 },
  order: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.raised,
    borderRadius: 20,
    padding: 12,
  },
  locked: { opacity: 0.55 },
  thumb: { width: 52, height: 52, borderRadius: 14, backgroundColor: palette.sunken },
  grow: { flex: 1 },
  orderTitle: { color: palette.ink, fontFamily: font.semibold, fontSize: 16 },
  faint: { color: palette.tertiary },
  orderDetail: { color: palette.muted, fontFamily: font.text, fontSize: 13, marginTop: 2 },
  doneDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.crimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: palette.line },
  round: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundOn: { backgroundColor: palette.crimson },
  roundOff: { opacity: 0.4 },
  glassCount: { color: palette.ink, fontFamily: font.bold, fontSize: 16, minWidth: 16, textAlign: 'center' },
});
