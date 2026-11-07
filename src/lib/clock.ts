const DAY_MS = 24 * 60 * 60 * 1000;

let offsetDays = 0;

export function appNow(): Date {
  return new Date(Date.now() + offsetDays * DAY_MS);
}

export function getDayOffset(): number {
  return offsetDays;
}

export function setDayOffset(days: number): number {
  offsetDays = Number.isFinite(days) ? Math.trunc(days) : 0;
  return offsetDays;
}
