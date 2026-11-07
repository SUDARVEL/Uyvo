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
    title: 'Your red juice is ready',
    body: 'Drink it before lunch. Lemon or guava doubles the iron.',
  },
  {
    id: 'uyvo-1330',
    hour: 13,
    minute: 30,
    title: 'Green leaves, then wait',
    body: 'Eat them now. Then wait 60 minutes with no tea.',
  },
] as const;

export const UPDATE_NOTICE = {
  title: 'Your notice looks new',
  body: 'Pull down any page. The words change with each update.',
};

export function noticeForNow(now: Date): (typeof REMINDERS)[number] {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < 11 * 60) return REMINDERS[0];
  if (minutes < 13 * 60 + 30) return REMINDERS[1];
  return REMINDERS[2];
}

export function reminderById(id: string | undefined): (typeof REMINDERS)[number] {
  return REMINDERS.find((reminder) => reminder.id === id) ?? REMINDERS[0];
}
