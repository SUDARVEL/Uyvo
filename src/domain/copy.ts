import type { AvatarId } from '@/domain/engine';

export const RIBBON_LABEL: Record<AvatarId, string> = {
  ember: 'Orange',
  vein: 'Red',
  leaf: 'Green',
};

export const REMINDERS = [
  {
    id: 'uyvo-0730',
    hour: 7,
    minute: 30,
    title: 'Morning drink',
    body: 'Soak the dry fruit and drink it. That gives 10 iron points.',
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
