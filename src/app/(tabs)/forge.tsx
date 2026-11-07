import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { foodArt, heroArt, treeArt } from '@/art';
import { Coach } from '@/components/coach';
import { Icon, Toggle } from '@/components/icons';
import { Banner, Button, Screen } from '@/components/ui';
import {
  HERO_LABEL,
  heroState,
  localDate,
  logsOn,
  teaForDate,
  vesselRatio,
  waterCount,
  type HeroState,
  type VitaminFood,
} from '@/domain/engine';
import { foodLabel, planStep, type FoodStepKey, type PlanKey } from '@/domain/plan';
import { appNow } from '@/lib/clock';
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

type Tone = 'brand' | 'neutral' | 'leaf';
type ChipSpec = { label: string; tone: Tone };

const FOOD_CARD: Record<FoodStepKey, { art: ImageSourcePropType; doubled: string; chips: (lemon: boolean) => ChipSpec[] }> = {
  morning_shot: {
    art: foodArt.morning_shot,
    doubled: 'Doubles the iron → 20',
    chips: (lemon) => [
      { label: lemon ? '+20 iron' : '+10 iron', tone: 'brand' },
      { label: 'Morning', tone: 'neutral' },
    ],
  },
  midmorning_juice: {
    art: foodArt.midmorning_juice,
    doubled: 'Doubles the iron → 30',
    chips: (lemon) => [
      { label: lemon ? '+30 iron' : '+15 iron', tone: 'brand' },
      { label: '+5 flow', tone: 'leaf' },
    ],
  },
  lunch_greens: {
    art: foodArt.lunch_greens,
    doubled: 'A squeeze doubles it → 30',
    chips: (lemon) => [
      { label: lemon ? '+30 iron' : '+15 iron', tone: 'brand' },
      { label: 'Keerai · Spinach · Beetroot', tone: 'neutral' },
    ],
  },
};

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
      <View style={styles.thumbBox}>
        <Image source={art} resizeMode="contain" style={styles.fill} />
      </View>
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
  const [, setTick] = useState(0);
  const now = appNow().getTime();
  const [lemon, setLemon] = useState(false);
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
    const id = setInterval(() => setTick((value) => value + 1), 1000);
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
  const order = game.order;
  const firstOpen = order.find((key) => !done.has(key)) ?? null;
  const waited = tea?.status === 'survived' || done.has('digest_survive');
  const drank = tea?.status === 'drank';
  const doneCount = order.filter((key) => done.has(key)).length + (waited || drank ? 1 : 0) + (waited ? 1 : 0);

  const showCoach = Boolean(profile?.onboardedAt) && !game.snap.coachSeen;
  const step = (key: PlanKey) => planStep(game.plan, key);
  const named = (key: PlanKey) => foodLabel(game.plan, game.foods, key);

  const logIron = (questKey: FoodStepKey) => {
    run(() =>
      game.logQuest({
        questKey,
        foodKey: questKey === 'lunch_greens' ? 'keerai' : null,
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
            onSkip={() => void game.dismissCoach()}
            onNext={() => {
              if (coachStep >= 1) void game.dismissCoach();
              else setCoachStep(1);
            }}
          />
        ) : null
      }>
      <View style={styles.dateRow}>
        <Text style={styles.date}>{dateLabel(now)}</Text>
        {game.dayOffset !== 0 ? (
          <View style={styles.testChip}>
            <Text style={styles.testChipText}>Test day</Text>
          </View>
        ) : null}
      </View>
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
          <Image source={heroArt[avatar][state]} style={styles.portrait} resizeMode="contain" />
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

      <View>
        {firstOpen ? (
          <NextCard
            index={order.indexOf(firstOpen) + 1}
            art={FOOD_CARD[firstOpen].art}
            title={named(firstOpen)}
            body={step(firstOpen).body}
            chips={FOOD_CARD[firstOpen].chips(lemon)}
            lemon={lemon}
            onLemon={setLemon}
            doubled={FOOD_CARD[firstOpen].doubled}
            action={step(firstOpen).action}
            busy={busy}
            onAction={() => logIron(firstOpen)}
          />
        ) : !tea ? (
          <NextCard
            index={4}
            art={foodArt.tea}
            title={step('wait').title}
            body={step('wait').body}
            chips={[
              { label: 'No tea', tone: 'neutral' },
              { label: '60 min', tone: 'neutral' },
            ]}
            action={step('wait').action}
            busy={busy}
            onAction={() => run(() => game.startDigest())}
          />
        ) : tea.status === 'active' ? (
          <WaitCard
            seconds={teaSeconds}
            endsAt={tea.endsAt}
            busy={busy}
            onTea={() => run(() => game.drinkTea())}
          />
        ) : drank ? (
          <NextCard
            index={4}
            art={foodArt.tea}
            title="You drank tea"
            body={teaSeconds > 0 ? `${clockLabel(teaSeconds)} left. No blood food until then.` : 'No blood food until the clock ends.'}
            chips={[{ label: 'Paused', tone: 'neutral' }]}
          />
        ) : (
          <NextCard
            index={5}
            art={treeArt.fruit}
            title={step('bonus').title}
            body={step('bonus').body}
            chips={[{ label: '+5 iron', tone: 'brand' }]}
          />
        )}
      </View>

      <View style={styles.sectionHead}>
        <View style={styles.grow}>
          <Text style={styles.section}>Today’s order</Text>
          <Text style={styles.sectionMeta}>{doneCount} of 5 done</Text>
        </View>
      </View>
      {order.map((key) => (
        <OrderRow
          key={key}
          title={named(key)}
          detail={step(key).detail}
          art={FOOD_CARD[key].art}
          state={done.has(key) ? 'done' : key === firstOpen ? 'current' : 'locked'}
        />
      ))}
      <OrderRow
        title={step('wait').title}
        detail={step('wait').detail}
        art={foodArt.tea}
        state={waited || drank ? 'done' : firstOpen === null ? 'current' : 'locked'}
      />
      <OrderRow
        title={step('bonus').title}
        detail={step('bonus').detail}
        art={treeArt.fruit}
        state={waited ? 'done' : 'locked'}
      />

      <View style={styles.sectionHead}>
        <Text style={styles.section}>Any time today</Text>
        <Text style={styles.sectionMeta}>Water, banana, walk</Text>
      </View>
      <View style={styles.order}>
        <View style={styles.thumbBox}>
          <Image source={foodArt.water} resizeMode="contain" style={styles.fill} />
        </View>
        <View style={styles.grow}>
          <Text style={styles.orderTitle}>{step('water').title}</Text>
          <Text style={styles.orderDetail}>{glasses} of 12 glasses · {step('water').detail}</Text>
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
      <TickRow
        title={named('banana')}
        detail={step('banana').detail}
        art={foodArt.banana}
        done={done.has('banana')}
        busy={busy}
        openLabel="I ate the banana"
        undoLabel="Undo banana"
        onToggle={() =>
          run(() => (done.has('banana') ? game.undoQuest('banana') : game.logQuest({ questKey: 'banana' })))
        }
      />
      <TickRow
        title={step('walk').title}
        detail={step('walk').detail}
        art={foodArt.walk}
        done={done.has('walk')}
        busy={busy}
        openLabel="I did the walk"
        undoLabel="Undo walk"
        onToggle={() => run(() => (done.has('walk') ? game.undoQuest('walk') : game.logQuest({ questKey: 'walk' })))}
      />
    </Screen>
  );
}

function TickRow({
  title,
  detail,
  art,
  done,
  busy,
  openLabel,
  undoLabel,
  onToggle,
}: {
  title: string;
  detail: string;
  art: ImageSourcePropType;
  done: boolean;
  busy: boolean;
  openLabel: string;
  undoLabel: string;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={done ? undoLabel : openLabel}
      accessibilityState={{ checked: done }}
      disabled={busy}
      onPress={onToggle}
      style={styles.order}>
      <View style={styles.thumbBox}>
        <Image source={art} resizeMode="contain" style={styles.fill} />
      </View>
      <View style={styles.grow}>
        <Text style={styles.orderTitle}>{title}</Text>
        <Text style={styles.orderDetail}>{detail}</Text>
      </View>
      {done ? (
        <View style={styles.doneDot}>
          <Icon name="check" size={14} />
        </View>
      ) : (
        <View style={styles.openDot} />
      )}
    </Pressable>
  );
}

function WaitCard({
  seconds,
  endsAt,
  busy,
  onTea,
}: {
  seconds: number;
  endsAt: string;
  busy?: boolean;
  onTea: () => void;
}) {
  const size = 232;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const elapsed = 1 - seconds / 3600;
  const ends = new Date(endsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return (
    <View style={styles.wait}>
      <View style={styles.waitTag}>
        <Text style={styles.stepTagText}>NOW · 4 OF 5</Text>
      </View>
      <View style={styles.ring}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#F3E6D8" strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={palette.crimson}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${Math.max(0.02, elapsed) * circumference} ${circumference}`}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={styles.ringTime}>{clockLabel(seconds)}</Text>
          <Text style={styles.ringCaption}>left · ends {ends}</Text>
        </View>
      </View>
      <Text style={styles.waitTitle}>Let the iron sink in</Text>
      <Text style={styles.waitBody}>Tea stops iron from working. Wait 60 minutes and earn +5 iron.</Text>
      <View style={styles.chips}>
        {['✓ Water', '✓ Banana', '✓ Walk'].map((label) => (
          <View key={label} style={styles.leafChip}>
            <Text style={styles.leafChipText}>{label}</Text>
          </View>
        ))}
        <View style={styles.teaChip}>
          <Text style={styles.teaChipText}>✕ Tea</Text>
        </View>
      </View>
      <Pressable accessibilityRole="button" disabled={busy} onPress={onTea} style={styles.teaButton}>
        <Text style={styles.teaButtonText}>I drank tea</Text>
      </Pressable>
    </View>
  );
}

function NextCard({
  index,
  art,
  title,
  body,
  chips,
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
  chips: ChipSpec[];
  lemon?: boolean;
  onLemon?: (value: boolean) => void;
  doubled?: string;
  action?: string;
  busy?: boolean;
  onAction?: () => void;
}) {
  return (
    <View style={styles.nextShadow}>
      <View style={styles.next}>
        <View style={styles.heroFoodBox}>
          <Image source={art} resizeMode="contain" style={styles.heroFood} />
          <View style={styles.stepTag}>
            <Text style={styles.stepTagText}>NEXT · {index} OF 5</Text>
          </View>
        </View>
        <View style={styles.nextBodyWrap}>
          <Text style={styles.nextTitle}>{title}</Text>
          <Text style={styles.nextBody}>{body}</Text>
          <View style={styles.chips}>
            {chips.map((chip) => (
              <View key={chip.label} style={[styles.chip, chipTone[chip.tone].box]}>
                <Text style={[styles.chipText, chipTone[chip.tone].text]}>{chip.label}</Text>
              </View>
            ))}
          </View>
          {onLemon ? (
            <View style={styles.lemon}>
              <Icon name="zap" size={20} />
              <View style={styles.lemonCopy}>
                <Text style={styles.lemonTitle}>Add lemon or guava</Text>
                <Text style={styles.lemonSub}>{doubled}</Text>
              </View>
              <Toggle value={Boolean(lemon)} onValueChange={onLemon} />
            </View>
          ) : null}
          {action && onAction ? <Button label={action} disabled={busy} onPress={onAction} /> : null}
        </View>
      </View>
    </View>
  );
}

const chipTone = {
  brand: { box: { backgroundColor: palette.blush }, text: { color: palette.crimson } },
  neutral: { box: { backgroundColor: palette.sunken }, text: { color: palette.muted } },
  leaf: { box: { backgroundColor: palette.leafSoft }, text: { color: palette.leaf } },
} as const;

const styles = StyleSheet.create({
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  testChip: { backgroundColor: palette.amberSoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  testChipText: { color: palette.orange, fontFamily: font.bold, fontSize: 11 },
  date: { color: palette.tertiary, fontFamily: font.bold, fontSize: 12, letterSpacing: 1.4 },
  helloRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  hello: { color: palette.ink, fontFamily: font.display, fontSize: 32, flexShrink: 1 },
  streakChip: { backgroundColor: palette.leafSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  streakText: { color: palette.leaf, fontFamily: font.bold, fontSize: 12 },
  card: { backgroundColor: palette.raised, borderRadius: 24, padding: 14, gap: 12 },
  portraitWrap: { borderRadius: 20, overflow: 'hidden', backgroundColor: palette.bg, height: 236, alignItems: 'center', justifyContent: 'flex-end' },
  portrait: { width: 228, height: 228 },
  badge: {
    position: 'absolute',
    left: 14,
    top: 14,
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
  wait: {
    backgroundColor: palette.raised,
    borderRadius: 28,
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 22,
    paddingHorizontal: 22,
    gap: 16,
  },
  waitTag: { backgroundColor: palette.blush, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  ring: { width: 232, height: 232, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringTime: { color: palette.ink, fontFamily: font.display, fontSize: 44, lineHeight: 48, letterSpacing: -0.6 },
  ringCaption: { color: palette.muted, fontFamily: font.text, fontSize: 13 },
  waitTitle: { color: palette.ink, fontFamily: font.display, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  waitBody: { color: palette.muted, fontFamily: font.text, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  leafChip: { backgroundColor: palette.leafSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  leafChipText: { color: palette.leaf, fontFamily: font.semibold, fontSize: 12 },
  teaChip: { backgroundColor: '#F2E4D6', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  teaChipText: { color: '#7A4B25', fontFamily: font.semibold, fontSize: 12 },
  teaButton: {
    alignSelf: 'stretch',
    height: 56,
    borderRadius: 999,
    backgroundColor: '#F2E4D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teaButtonText: { color: '#7A4B25', fontFamily: font.bold, fontSize: 16 },
  nextShadow: {
    borderRadius: 28,
    backgroundColor: palette.raised,
    shadowColor: '#5C331F',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  next: { borderRadius: 28, overflow: 'hidden', backgroundColor: palette.raised },
  heroFoodBox: {
    height: 184,
    backgroundColor: palette.blush,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFood: {
    width: 160,
    height: 160,
    shadowColor: '#5C331F',
    shadowOpacity: 0.14,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 6 },
  },
  stepTag: {
    position: 'absolute',
    left: 16,
    top: 16,
    backgroundColor: palette.raised,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stepTagText: { color: palette.crimson, fontFamily: font.extra, fontSize: 11, lineHeight: 14, letterSpacing: 1.2 },
  nextBodyWrap: { padding: 20, gap: 14 },
  fill: { width: '100%', height: '100%' },
  nextTitle: { color: palette.ink, fontFamily: font.display, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  nextBody: { color: palette.muted, fontFamily: font.text, fontSize: 15, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16 },
  lemon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.amberSoft,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  lemonCopy: { flex: 1, minWidth: 1 },
  lemonTitle: { color: palette.ink, fontFamily: font.bold, fontSize: 16, lineHeight: 22, letterSpacing: -0.1 },
  lemonSub: { color: palette.orange, fontFamily: font.text, fontSize: 13, lineHeight: 18 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
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
  thumbBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: palette.bg,
  },
  grow: { flex: 1 },
  orderTitle: { color: palette.ink, fontFamily: font.semibold, fontSize: 16 },
  moveColumn: { gap: 6 },
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
