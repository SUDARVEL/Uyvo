import type { AvatarId } from '@/domain/engine';

export const PERSON_LABEL: Record<AvatarId, string> = {
  woman: 'Woman',
  man: 'Man',
};

export const REMINDERS = [
  {
    id: 'uyvo-0730',
    hour: 7,
    minute: 30,
    title: 'Your soaked dry fruit is ready',
    body: 'Drink it first. Lemon or guava doubles the iron.',
  },
  {
    id: 'uyvo-1100',
    hour: 11,
    minute: 0,
    title: 'Red juice',
    body: 'Drink the red juice. That gives 15 iron points and 5 flow points. Lemon or guava doubles the iron.',
  },
  {
    id: 'uyvo-1330',
    hour: 13,
    minute: 30,
    title: 'Lunch, then wait',
    body: 'Eat green leaves. That gives 15 iron points. Then tap Start the wait. No tea for 60 minutes.',
  },
] as const;
