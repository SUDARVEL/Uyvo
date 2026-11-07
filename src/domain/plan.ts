export const PLAN_KEYS = [
  'morning_shot',
  'midmorning_juice',
  'lunch_greens',
  'wait',
  'bonus',
  'water',
  'banana',
  'walk',
] as const;

export type PlanKey = (typeof PLAN_KEYS)[number];

export type PlanStep = {
  key: PlanKey;
  title: string;
  detail: string;
  body: string;
  action: string;
};

export const FOOD_KEYS: PlanKey[] = ['morning_shot', 'midmorning_juice', 'lunch_greens', 'banana'];

export const FOOD_STEPS = ['morning_shot', 'midmorning_juice', 'lunch_greens'] as const;

export type FoodStepKey = (typeof FOOD_STEPS)[number];

export function normalizeOrder(value: unknown): FoodStepKey[] {
  const incoming = Array.isArray(value) ? value : [];
  const seen = new Set<string>();
  const picked: FoodStepKey[] = [];
  for (const item of incoming) {
    if (typeof item !== 'string') continue;
    const key = FOOD_STEPS.find((step) => step === item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    picked.push(key);
  }
  for (const key of FOOD_STEPS) {
    if (!seen.has(key)) picked.push(key);
  }
  return picked;
}

export const DEFAULT_PLAN: PlanStep[] = [
  {
    key: 'morning_shot',
    title: 'Drink the soaked dry fruit',
    detail: '10 iron · ×2 with lemon or guava',
    body: 'Dates and raisins soaked overnight. Drink the water, eat the fruit.',
    action: 'I drank it',
  },
  {
    key: 'midmorning_juice',
    title: 'Drink the red juice',
    detail: '15 iron · 5 flow',
    body: 'One glass of beetroot, pomegranate and carrot.',
    action: 'I drank it',
  },
  {
    key: 'lunch_greens',
    title: 'Eat your green leaves',
    detail: '15 iron · keerai, spinach, beetroot',
    body: 'Keerai, spinach or beetroot leaves with lunch.',
    action: 'I ate it',
  },
  {
    key: 'wait',
    title: 'Wait 60 minutes',
    detail: 'No tea · water is fine',
    body: 'No tea or coffee. Water is still fine.',
    action: 'Start the wait',
  },
  {
    key: 'bonus',
    title: 'You waited',
    detail: '+5 iron bonus',
    body: 'Today’s blood food is done. Water, banana, and a walk are still open.',
    action: '',
  },
  {
    key: 'water',
    title: 'Water',
    detail: '5 flow each',
    body: '',
    action: '',
  },
  {
    key: 'banana',
    title: 'Banana',
    detail: '5 flow · once today',
    body: '',
    action: '',
  },
  {
    key: 'walk',
    title: 'A short walk',
    detail: '10 flow · once today',
    body: '',
    action: '',
  },
];

export function planStep(plan: PlanStep[], key: PlanKey): PlanStep {
  return plan.find((step) => step.key === key) ?? DEFAULT_PLAN.find((step) => step.key === key) ?? DEFAULT_PLAN[0];
}

export function foodLabel(plan: PlanStep[], foods: Record<string, string>, key: PlanKey): string {
  const mine = foods[key]?.trim();
  if (mine) return mine;
  return planStep(plan, key).title;
}
