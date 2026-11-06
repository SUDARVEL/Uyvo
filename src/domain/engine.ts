export const AVATARS = ['woman', 'man'] as const;
export type AvatarId = (typeof AVATARS)[number];

export const QUEST_KEYS = [
  'morning_shot',
  'midmorning_juice',
  'lunch_greens',
  'water',
  'banana',
  'walk',
  'digest_survive',
] as const;
export type QuestKey = (typeof QUEST_KEYS)[number];

export const IRON_QUESTS = ['morning_shot', 'midmorning_juice', 'lunch_greens'] as const;
export type IronQuest = (typeof IRON_QUESTS)[number];

export const FOODS = ['keerai', 'spinach', 'beetroot'] as const;
export type FoodKey = (typeof FOODS)[number];

export const VITAMIN_FOODS = ['lemon', 'guava'] as const;
export type VitaminFood = (typeof VITAMIN_FOODS)[number];

export type TeaStatus = 'active' | 'survived' | 'drank';
export type BadgeKey = 'capillary_creator' | 'oxygen_optimizer' | 'hemoglobin_master';
export type HeroState = 'pale' | 'tired' | 'armored' | 'glowing';

export type QuestLog = {
  id: string;
  userId: string;
  clientId: string;
  localDate: string;
  questKey: QuestKey;
  foodKey: FoodKey | null;
  vitaminCFood: VitaminFood | null;
  vitaminC: boolean;
  baseIron: number;
  baseFlow: number;
  ironShardsAwarded: number;
  flowPointsAwarded: number;
  loggedAt: string;
};

export type TeaWindow = {
  id: string;
  userId: string;
  clientId: string;
  localDate: string;
  startedAt: string;
  endsAt: string;
  status: TeaStatus;
  drankAt: string | null;
};

export type Streak = {
  currentStreak: number;
  longestStreak: number;
  lastSuccessDate: string | null;
};

export type Badge = {
  badgeKey: BadgeKey;
  earnedOn: string;
};

export type TreeState = {
  weeksCompleted: number;
  fruitCount: number;
};

type QuestDef = {
  label: string;
  detail: string;
  baseIron: number;
  baseFlow: number;
  vitamin: boolean;
};

export const QUESTS: Record<QuestKey, QuestDef> = {
  morning_shot: {
    label: 'Morning drink',
    detail: 'Soaked dry fruit. +10 iron',
    baseIron: 10,
    baseFlow: 0,
    vitamin: true,
  },
  midmorning_juice: {
    label: 'Red juice',
    detail: 'Red drink. +15 iron and +5 flow',
    baseIron: 15,
    baseFlow: 5,
    vitamin: true,
  },
  lunch_greens: {
    label: 'Green lunch',
    detail: 'Keerai, spinach, or beetroot. +15 iron',
    baseIron: 15,
    baseFlow: 0,
    vitamin: true,
  },
  water: {
    label: 'Water',
    detail: 'One glass. +5 flow',
    baseIron: 0,
    baseFlow: 5,
    vitamin: false,
  },
  banana: {
    label: 'Banana',
    detail: '+5 flow, once today',
    baseIron: 0,
    baseFlow: 5,
    vitamin: false,
  },
  walk: {
    label: 'A short walk',
    detail: '+10 flow, once today',
    baseIron: 0,
    baseFlow: 10,
    vitamin: false,
  },
  digest_survive: {
    label: 'You waited',
    detail: '+5 iron',
    baseIron: 5,
    baseFlow: 0,
    vitamin: false,
  },
};

export const CORE_QUESTS: IronQuest[] = ['morning_shot', 'midmorning_juice', 'lunch_greens'];

export const BADGE_AT: Record<BadgeKey, number> = {
  capillary_creator: 2,
  oxygen_optimizer: 5,
  hemoglobin_master: 7,
};

export const BADGE_ORDER: BadgeKey[] = [
  'capillary_creator',
  'oxygen_optimizer',
  'hemoglobin_master',
];

export const BADGE_LABEL: Record<BadgeKey, string> = {
  capillary_creator: 'Start',
  oxygen_optimizer: 'Stronger',
  hemoglobin_master: 'Full week',
};

export const HERO_LABEL: Record<HeroState, string> = {
  pale: 'Low',
  tired: 'Tired',
  armored: 'Strong',
  glowing: 'Full of energy',
};

export const FOOD_LABEL: Record<FoodKey, string> = {
  keerai: 'Keerai',
  spinach: 'Spinach',
  beetroot: 'Beetroot',
};

export function emptyStreak(): Streak {
  return { currentStreak: 0, longestStreak: 0, lastSuccessDate: null };
}

export function emptyTree(): TreeState {
  return { weeksCompleted: 0, fruitCount: 0 };
}

export function localDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function validateName(raw: string): string | null {
  const name = raw.trim();
  if (name.length < 2 || name.length > 24) return 'Use 2 to 24 letters.';
  return null;
}

export function isQuestKey(value: string): value is QuestKey {
  return (QUEST_KEYS as readonly string[]).includes(value);
}

export function isIronQuest(questKey: QuestKey): questKey is IronQuest {
  return (IRON_QUESTS as readonly string[]).includes(questKey);
}

export function logsOn(logs: QuestLog[], date: string): QuestLog[] {
  return logs.filter((log) => log.localDate === date);
}

export function vesselRatio(logs: Pick<QuestLog, 'ironShardsAwarded' | 'flowPointsAwarded'>[]): number {
  const iron = logs.reduce((sum, log) => sum + log.ironShardsAwarded, 0);
  const flow = logs.reduce((sum, log) => sum + log.flowPointsAwarded, 0);
  const score = 0.7 * Math.min(1, iron / 40) + 0.3 * Math.min(1, flow / 25);
  return Math.max(0, Math.min(1, score));
}

export function heroState(ratio: number): HeroState {
  if (ratio < 0.15) return 'pale';
  if (ratio < 0.45) return 'tired';
  if (ratio < 0.85) return 'armored';
  return 'glowing';
}

export function teaForDate(teas: TeaWindow[], date: string): TeaWindow | null {
  const active = teas.find((tea) => tea.status === 'active');
  if (active) return active;
  const todays = teas.filter((tea) => tea.localDate === date);
  if (todays.length === 0) return null;
  return todays.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null;
}

export function teaBlocksIron(teas: TeaWindow[], loggedAt: Date): boolean {
  const instant = loggedAt.getTime();
  return teas.some((tea) => {
    if (tea.status !== 'active' && tea.status !== 'drank') return false;
    const start = new Date(tea.startedAt).getTime();
    const end = new Date(tea.endsAt).getTime();
    return instant >= start && instant < end;
  });
}

export function canLog(input: {
  questKey: QuestKey;
  logs: QuestLog[];
  teas: TeaWindow[];
  now: Date;
  today: string;
}): string | null {
  const todayLogs = logsOn(input.logs, input.today);
  if (input.questKey === 'digest_survive') return 'The wait bonus comes from the clock.';
  if (input.questKey === 'water') {
    const glasses = todayLogs.filter((log) => log.questKey === 'water').length;
    if (glasses >= 12) return '12 glasses is enough for today.';
  } else if (todayLogs.some((log) => log.questKey === input.questKey)) {
    return 'You already did this today.';
  }
  if (isIronQuest(input.questKey) && teaBlocksIron(input.teas, input.now)) {
    return 'No blood food while you wait. Water is still ok.';
  }
  return null;
}

export function canStartDigest(logs: QuestLog[], teas: TeaWindow[], today: string): string | null {
  if (!logsOn(logs, today).some((log) => log.questKey === 'lunch_greens')) {
    return 'Eat greens first. Then start the wait.';
  }
  if (teas.some((tea) => tea.localDate === today)) return 'The wait already started today.';
  return null;
}

export function digestEnd(started: Date): Date {
  return new Date(started.getTime() + 60 * 60 * 1000);
}

export function buildQuestLog(input: {
  id: string;
  userId: string;
  questKey: QuestKey;
  today: string;
  loggedAt: string;
  foodKey?: FoodKey | null;
  vitaminCFood?: VitaminFood | null;
}): QuestLog {
  const definition = QUESTS[input.questKey];
  const foodKey = input.questKey === 'lunch_greens' ? (input.foodKey ?? null) : null;
  if (input.questKey === 'lunch_greens' && !foodKey) throw new Error('Lunch needs a green.');
  const vitaminCFood = definition.vitamin ? (input.vitaminCFood ?? null) : null;
  const vitaminC = vitaminCFood !== null;
  return {
    id: input.id,
    userId: input.userId,
    clientId: input.id,
    localDate: input.today,
    questKey: input.questKey,
    foodKey,
    vitaminCFood,
    vitaminC,
    baseIron: definition.baseIron,
    baseFlow: definition.baseFlow,
    ironShardsAwarded: definition.baseIron * (vitaminC ? 2 : 1),
    flowPointsAwarded: definition.baseFlow,
    loggedAt: input.loggedAt,
  };
}

export function isSuccessDate(logs: QuestLog[], date: string): boolean {
  const keys = new Set(logsOn(logs, date).map((log) => log.questKey));
  return CORE_QUESTS.every((key) => keys.has(key)) && keys.has('digest_survive');
}

export function evaluateProgress(input: {
  logs: QuestLog[];
  streak: Streak;
  badges: BadgeKey[];
  tree: TreeState;
  today: string;
}): { streak: Streak; tree: TreeState; newBadges: Badge[]; fruitGrew: boolean } {
  let current = input.streak.currentStreak;
  let longest = input.streak.longestStreak;
  let last = input.streak.lastSuccessDate;
  const earned = new Set(input.badges);
  const newBadges: Badge[] = [];
  let weeks = input.tree.weeksCompleted;
  let fruit = input.tree.fruitCount;
  let fruitGrew = false;
  const yesterday = addDays(input.today, -1);

  if (last && last < yesterday) current = 0;

  if (isSuccessDate(input.logs, input.today) && last !== input.today) {
    current = last === yesterday ? current + 1 : 1;
    last = input.today;
    if (current > longest) longest = current;
    for (const badgeKey of BADGE_ORDER) {
      if (current >= BADGE_AT[badgeKey] && !earned.has(badgeKey)) {
        earned.add(badgeKey);
        newBadges.push({ badgeKey, earnedOn: input.today });
      }
    }
    if (current >= 7) {
      weeks += 1;
      fruit += 1;
      fruitGrew = true;
      current = 0;
    }
  }

  return {
    streak: { currentStreak: current, longestStreak: longest, lastSuccessDate: last },
    tree: { weeksCompleted: weeks, fruitCount: fruit },
    newBadges,
    fruitGrew,
  };
}

export function celebration(newBadges: Badge[], fruitGrew: boolean): string | null {
  if (fruitGrew) return 'Full week. A red fruit grew. The count starts again at zero.';
  if (newBadges.length === 0) return null;
  const names = newBadges.map((badge) => BADGE_LABEL[badge.badgeKey]).join(' and ');
  return `${names} earned.`;
}

export function waterCount(logs: QuestLog[], today: string): number {
  return logsOn(logs, today).filter((log) => log.questKey === 'water').length;
}
