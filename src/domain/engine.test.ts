import assert from 'node:assert/strict';

import {
  buildQuestLog,
  canLog,
  canStartDigest,
  celebration,
  digestEnd,
  evaluateProgress,
  heroState,
  teaBlocksIron,
  vesselRatio,
  type BadgeKey,
  type QuestLog,
  type Streak,
  type TeaWindow,
  type TreeState,
} from './engine.ts';

function log(partial: Pick<QuestLog, 'questKey' | 'localDate'> & Partial<QuestLog>): QuestLog {
  const built = buildQuestLog({
    id: partial.id ?? `${partial.localDate}-${partial.questKey}-${partial.loggedAt ?? 't'}`,
    userId: 'user',
    questKey: partial.questKey,
    today: partial.localDate,
    loggedAt: partial.loggedAt ?? `${partial.localDate}T08:00:00.000Z`,
    foodKey: partial.foodKey ?? (partial.questKey === 'lunch_greens' ? 'keerai' : null),
    vitaminCFood: partial.vitaminCFood ?? null,
  });
  return { ...built, ...partial, foodKey: built.foodKey, vitaminC: built.vitaminC };
}

const emptyStreak: Streak = { currentStreak: 0, longestStreak: 0, lastSuccessDate: null };
const emptyTree: TreeState = { weeksCompleted: 0, fruitCount: 0 };

function dayLogs(date: string, vitamin = false): QuestLog[] {
  return [
    log({ questKey: 'morning_shot', localDate: date, vitaminCFood: vitamin ? 'lemon' : null }),
    log({ questKey: 'midmorning_juice', localDate: date }),
    log({ questKey: 'lunch_greens', localDate: date, foodKey: 'spinach' }),
    log({ questKey: 'digest_survive', localDate: date }),
  ];
}

const tea = (status: TeaWindow['status'], startedAt: string, endsAt: string, localDate: string): TeaWindow => ({
  id: startedAt,
  userId: 'user',
  clientId: startedAt,
  localDate,
  startedAt,
  endsAt,
  status,
  drankAt: status === 'drank' ? startedAt : null,
});

const morning = log({ questKey: 'morning_shot', localDate: '2026-11-06' });
assert.equal(vesselRatio([]), 0);
assert.equal(heroState(0), 'pale');
assert.equal(vesselRatio([morning]), 0.7 * (10 / 40));
assert.equal(heroState(vesselRatio([morning])), 'tired');

const doubled = buildQuestLog({
  id: 'v',
  userId: 'user',
  questKey: 'morning_shot',
  today: '2026-11-06',
  loggedAt: '2026-11-06T08:00:00.000Z',
  vitaminCFood: 'guava',
});
assert.equal(doubled.ironShardsAwarded, 20);
assert.equal(doubled.vitaminC, true);

const waterIgnored = buildQuestLog({
  id: 'w',
  userId: 'user',
  questKey: 'water',
  today: '2026-11-06',
  loggedAt: '2026-11-06T09:00:00.000Z',
  vitaminCFood: 'lemon',
});
assert.equal(waterIgnored.vitaminC, false);
assert.equal(waterIgnored.flowPointsAwarded, 5);

const fullCore = dayLogs('2026-11-06').filter((entry) => entry.questKey !== 'digest_survive');
const ratio = vesselRatio(fullCore);
assert.ok(Math.abs(ratio - (0.7 + 0.3 * (5 / 25))) < 1e-9);
assert.equal(heroState(ratio), 'armored');
assert.equal(heroState(1), 'glowing');

const twelve = Array.from({ length: 12 }, (_, index) =>
  log({ questKey: 'water', localDate: '2026-11-06', id: `glass-${index}` }),
);
assert.equal(canLog({ questKey: 'water', logs: twelve, teas: [], now: new Date(), today: '2026-11-06' }), "Twelve glasses is the day's cap.");
assert.equal(canLog({ questKey: 'water', logs: twelve.slice(0, 11), teas: [], now: new Date(), today: '2026-11-06' }), null);

const active = tea('active', '2026-11-06T08:00:00.000Z', '2026-11-06T09:00:00.000Z', '2026-11-06');
const during = new Date('2026-11-06T08:30:00.000Z');
assert.equal(teaBlocksIron([active], during), true);
assert.match(
  canLog({ questKey: 'morning_shot', logs: [], teas: [active], now: during, today: '2026-11-06' }) ?? '',
  /Tea Monster/,
);
assert.equal(canLog({ questKey: 'water', logs: [], teas: [active], now: during, today: '2026-11-06' }), null);
assert.equal(canLog({ questKey: 'morning_shot', logs: [], teas: [active], now: new Date('2026-11-06T09:00:00.000Z'), today: '2026-11-06' }), null);

const drank = tea('drank', '2026-11-06T08:00:00.000Z', '2026-11-06T09:00:00.000Z', '2026-11-06');
assert.equal(teaBlocksIron([drank], during), true);
const survived = tea('survived', '2026-11-06T08:00:00.000Z', '2026-11-06T09:00:00.000Z', '2026-11-06');
assert.equal(teaBlocksIron([survived], during), false);

const overnight = tea('active', '2026-11-06T23:40:00.000Z', '2026-11-07T00:40:00.000Z', '2026-11-06');
assert.equal(teaBlocksIron([overnight], new Date('2026-11-07T00:10:00.000Z')), true);

assert.match(canStartDigest([], [], '2026-11-06') ?? '', /lunch/i);
assert.equal(
  canStartDigest([log({ questKey: 'lunch_greens', localDate: '2026-11-06', foodKey: 'beetroot' })], [], '2026-11-06'),
  null,
);
assert.equal(digestEnd(new Date('2026-11-06T08:00:00.000Z')).toISOString(), '2026-11-06T09:00:00.000Z');

let streak = emptyStreak;
let tree = emptyTree;
let badges: BadgeKey[] = [];
const dates = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07'];
const earned: string[] = [];
for (const date of dates) {
  const result = evaluateProgress({
    logs: dayLogs(date),
    streak,
    badges,
    tree,
    today: date,
  });
  streak = result.streak;
  tree = result.tree;
  badges = [...badges, ...result.newBadges.map((badge) => badge.badgeKey)];
  earned.push(...result.newBadges.map((badge) => badge.badgeKey));
}
assert.deepEqual(earned, ['capillary_creator', 'oxygen_optimizer', 'hemoglobin_master']);
assert.equal(streak.currentStreak, 0);
assert.equal(streak.longestStreak, 7);
assert.equal(tree.fruitCount, 1);
assert.equal(tree.weeksCompleted, 1);
assert.match(celebration([{ badgeKey: 'hemoglobin_master', earnedOn: '2026-11-07' }], true) ?? '', /pomegranate/);

const missed = evaluateProgress({
  logs: [],
  streak: { currentStreak: 4, longestStreak: 4, lastSuccessDate: '2026-11-01' },
  badges: ['capillary_creator'],
  tree: emptyTree,
  today: '2026-11-03',
});
assert.equal(missed.streak.currentStreak, 0);
assert.equal(missed.streak.longestStreak, 4);

const held = evaluateProgress({
  logs: [],
  streak: { currentStreak: 2, longestStreak: 2, lastSuccessDate: '2026-11-02' },
  badges: ['capillary_creator'],
  tree: emptyTree,
  today: '2026-11-03',
});
assert.equal(held.streak.currentStreak, 2);

assert.throws(() =>
  buildQuestLog({
    id: 'lunch',
    userId: 'user',
    questKey: 'lunch_greens',
    today: '2026-11-06',
    loggedAt: '2026-11-06T08:00:00.000Z',
  }),
);

console.log('domain checks passed');
