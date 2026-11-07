import assert from 'node:assert/strict';

import { REMINDERS } from './copy.ts';
import { FOOD_STEPS } from './plan.ts';
import {
  DEFAULT_TIMES,
  LEGACY_IDS,
  PLAN_DAYS,
  REMINDER_PREFIX,
  WAIT_BODY,
  WAIT_ID,
  WAIT_TITLE,
  clockLabel,
  dayKey,
  foodNameFor,
  isManagedId,
  minuteChoices,
  normalizeTimes,
  planNotifications,
  plannedKey,
  shiftDay,
  slotFoods,
  toTime,
  type PlanInput,
  type PlannedNotification,
} from './reminder-plan.ts';

const at = (y: number, m: number, d: number, h = 0, min = 0, s = 0) => new Date(y, m - 1, d, h, min, s, 0);

function plan(partial: Partial<PlanInput> & { now: Date }): PlannedNotification[] {
  return planNotifications({
    enabled: true,
    times: DEFAULT_TIMES,
    order: [...FOOD_STEPS],
    foods: {},
    logs: [],
    teas: [],
    ...partial,
  });
}

const clockOf = (item: PlannedNotification) => {
  const date = new Date(item.fireAt);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
};
const reminders = (items: PlannedNotification[]) => items.filter((item) => item.channel === 'reminders');
const slotOf = (item: PlannedNotification) => Number(item.id.slice(REMINDER_PREFIX.length).split('-')[0]);

// The planner keeps its own copy of the normal times, order and words. They must not drift from the app copy.
assert.deepEqual(
  DEFAULT_TIMES,
  REMINDERS.map((item) => ({ hour: item.hour, minute: item.minute })),
);
assert.deepEqual(slotFoods([]), [...FOOD_STEPS]);
assert.deepEqual(LEGACY_IDS, REMINDERS.map((item) => item.id));
{
  const first = plan({ now: at(2026, 11, 7, 6, 0) });
  assert.equal(reminders(first)[0].body, REMINDERS[0].body);
  assert.equal(reminders(first)[1].body, REMINDERS[1].body);
  assert.equal(reminders(first)[2].body, REMINDERS[2].body);
}

// Normal day: 14 days, 3 a day, unique ids, sorted, normal times.
{
  const now = at(2026, 11, 7, 6, 0);
  const items = plan({ now });
  assert.equal(items.length, PLAN_DAYS * 3);
  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  assert.ok(items.every((item) => item.channel === 'reminders'));
  assert.ok(items.every((item, index) => index === 0 || items[index - 1].fireAt <= item.fireAt));
  assert.equal(items[0].id, 'uyvo-r-0-20261107');
  assert.equal(clockOf(items[0]), '7:30');
  assert.equal(clockOf(items[1]), '11:00');
  assert.equal(clockOf(items[2]), '13:30');
  assert.equal(items.length <= 64 - 1, true);
}

// 14 day window: exactly 14 different days starting today.
{
  const now = at(2026, 11, 7, 6, 0);
  const days = [...new Set(plan({ now }).map((item) => item.id.split('-')[3]))];
  assert.equal(days.length, 14);
  assert.equal(days[0], '20261107');
  assert.equal(days[13], '20261120');
  assert.equal(plan({ now, days: 3 }).length, 9);
  assert.equal(shiftDay('2026-12-30', 3), '2027-01-02');
  assert.equal(shiftDay('2028-02-28', 1), '2028-02-29');
  assert.equal(dayKey(at(2026, 1, 5, 23, 59)), '2026-01-05');
}

// Custom times: each slot uses its own time on every day.
{
  const now = at(2026, 11, 7, 5, 0);
  const items = plan({
    now,
    times: [
      { hour: 7, minute: 45 },
      { hour: 10, minute: 15 },
      { hour: 14, minute: 5 },
    ],
  });
  for (const item of items) {
    const expected = ['7:45', '10:15', '14:05'][slotOf(item)];
    assert.equal(clockOf(item), expected);
  }
  assert.equal(items.length, 42);
  const broken = plan({ now, times: [{ hour: 99, minute: 0 }, null, 'x'] as never });
  assert.deepEqual(
    [clockOf(broken[0]), clockOf(broken[1]), clockOf(broken[2])],
    ['7:30', '11:00', '13:30'],
  );
}

// Past times are skipped, and so is anything less than two seconds away.
{
  const noon = plan({ now: at(2026, 11, 7, 12, 0) });
  assert.equal(noon.length, 41 - 1);
  assert.equal(noon[0].id, 'uyvo-r-2-20261107');
  assert.ok(!noon.some((item) => item.id === 'uyvo-r-0-20261107' || item.id === 'uyvo-r-1-20261107'));
  const evening = plan({ now: at(2026, 11, 7, 20, 0) });
  assert.equal(evening.length, 39);
  assert.equal(evening[0].id, 'uyvo-r-0-20261108');
  const soon = plan({ now: at(2026, 11, 7, 7, 29, 59) });
  assert.ok(!soon.some((item) => item.id === 'uyvo-r-0-20261107'));
  const later = plan({ now: at(2026, 11, 7, 7, 29, 50) });
  assert.ok(later.some((item) => item.id === 'uyvo-r-0-20261107'));
  const exactly = plan({ now: at(2026, 11, 7, 7, 30, 0) });
  assert.ok(!exactly.some((item) => item.id === 'uyvo-r-0-20261107'));
}

// Today's reminder is skipped once that step is logged today, but never tomorrow's.
{
  const now = at(2026, 11, 7, 6, 0);
  const logs = [
    { localDate: '2026-11-07', questKey: 'morning_shot' },
    { localDate: '2026-11-06', questKey: 'midmorning_juice' },
    { localDate: '2026-11-07', questKey: 'water' },
  ];
  const items = plan({ now, logs });
  assert.equal(items.length, 41);
  assert.ok(!items.some((item) => item.id === 'uyvo-r-0-20261107'));
  assert.ok(items.some((item) => item.id === 'uyvo-r-0-20261108'));
  assert.ok(items.some((item) => item.id === 'uyvo-r-1-20261107'));

  const all = plan({
    now,
    logs: ['morning_shot', 'midmorning_juice', 'lunch_greens'].map((questKey) => ({ localDate: '2026-11-07', questKey })),
  });
  assert.equal(all.length, 39);
  assert.ok(all.every((item) => !item.id.endsWith('20261107')));

  // The step is matched by its place in the user's order.
  const swapped = plan({
    now,
    order: ['midmorning_juice', 'morning_shot', 'lunch_greens'],
    logs: [{ localDate: '2026-11-07', questKey: 'morning_shot' }],
  });
  assert.ok(!swapped.some((item) => item.id === 'uyvo-r-1-20261107'));
  assert.ok(swapped.some((item) => item.id === 'uyvo-r-0-20261107'));

  // Admin test day: the app day is not the phone day, so nothing is skipped.
  const test = plan({ now, logs, dayOffset: 2 });
  assert.equal(test.length, 42);
  assert.ok(test.some((item) => item.id === 'uyvo-r-0-20261107'));
  assert.equal(plan({ now, logs, dayOffset: -1 }).length, 42);
}

// Order changes map the user's own names to the slots; times stay with the slots.
{
  const now = at(2026, 11, 7, 6, 0);
  const items = reminders(
    plan({
      now,
      order: ['lunch_greens', 'morning_shot', 'midmorning_juice'],
      foods: { lunch_greens: '  Papaya bowl ', morning_shot: '' },
    }),
  ).filter((item) => item.id.endsWith('20261107'));
  assert.equal(items[0].title, 'Papaya bowl is ready');
  assert.equal(clockOf(items[0]), '7:30');
  assert.equal(items[0].body, REMINDERS[0].body);
  assert.equal(items[1].title, 'Soaked dry fruit is ready');
  assert.equal(items[1].body, REMINDERS[1].body);
  assert.equal(items[2].title, 'Red juice is ready');
  assert.equal(items[2].body, REMINDERS[2].body);
  assert.equal(foodNameFor('lunch_greens', {}), 'Green lunch');
  assert.deepEqual(slotFoods(['lunch_greens', 'lunch_greens', 'bogus' as never]), [
    'lunch_greens',
    'morning_shot',
    'midmorning_juice',
  ]);
}

// Wait notification: only for an active wait, at the real moment it ends.
{
  const now = at(2026, 11, 7, 13, 40);
  const ends = new Date(now.getTime() + 25 * 60 * 1000);
  const active = [{ status: 'active', endsAt: ends.toISOString() }];
  const withWait = plan({ now, teas: active });
  const wait = withWait.find((item) => item.id === WAIT_ID);
  assert.ok(wait);
  assert.equal(wait.channel, 'wait');
  assert.equal(wait.fireAt, ends.getTime());
  assert.equal(wait.title, WAIT_TITLE);
  assert.equal(wait.body, WAIT_BODY);
  assert.equal(WAIT_TITLE, 'Your 60 minutes are over');
  assert.equal(WAIT_BODY, 'You can have tea now. Open Uyvo to collect +5 iron.');
  assert.equal(withWait.filter((item) => item.id === WAIT_ID).length, 1);
  assert.equal(withWait.length, plan({ now }).length + 1);
  assert.ok(withWait.length <= 63);

  assert.equal(plan({ now, teas: [] }).some((item) => item.id === WAIT_ID), false);
  assert.equal(plan({ now, teas: [{ status: 'survived', endsAt: ends.toISOString() }] }).some((item) => item.id === WAIT_ID), false);
  assert.equal(plan({ now, teas: [{ status: 'drank', endsAt: ends.toISOString() }] }).some((item) => item.id === WAIT_ID), false);
  const over = [{ status: 'active', endsAt: new Date(now.getTime() - 1000).toISOString() }];
  assert.equal(plan({ now, teas: over }).some((item) => item.id === WAIT_ID), false);

  // The wait does not depend on whether today's step is logged, and reminders off means no wait either.
  assert.equal(plan({ now, teas: active, enabled: false }).length, 0);

  // On a test day the app clock is moved, but the alarm is still at the real end time.
  const day = 24 * 60 * 60 * 1000;
  const shifted = [{ status: 'active', endsAt: new Date(ends.getTime() + 3 * day).toISOString() }];
  assert.equal(plan({ now, teas: shifted, dayOffset: 3 }).find((item) => item.id === WAIT_ID)?.fireAt, ends.getTime());
  assert.equal(plan({ now, teas: shifted, dayOffset: 0 }).find((item) => item.id === WAIT_ID)?.fireAt, ends.getTime() + 3 * day);
}

// Off means nothing is planned.
assert.deepEqual(plan({ now: at(2026, 11, 7, 6, 0), enabled: false }), []);

// Times and helpers.
assert.deepEqual(normalizeTimes(undefined), [...DEFAULT_TIMES]);
assert.deepEqual(normalizeTimes([{ hour: 6, minute: 5 }]), [{ hour: 6, minute: 5 }, DEFAULT_TIMES[1], DEFAULT_TIMES[2]]);
assert.deepEqual(normalizeTimes([{ hour: 24, minute: 0 }, { hour: 1.5, minute: 0 }, { hour: 1, minute: 60 }]), [...DEFAULT_TIMES]);
assert.equal(clockLabel({ hour: 7, minute: 45 }), '7:45 AM');
assert.equal(clockLabel({ hour: 0, minute: 5 }), '12:05 AM');
assert.equal(clockLabel({ hour: 12, minute: 0 }), '12:00 PM');
assert.equal(clockLabel({ hour: 13, minute: 30 }), '1:30 PM');
assert.deepEqual(toTime(12, 0, false), { hour: 0, minute: 0 });
assert.deepEqual(toTime(12, 30, true), { hour: 12, minute: 30 });
assert.deepEqual(toTime(7, 45, true), { hour: 19, minute: 45 });
assert.deepEqual(minuteChoices(30), [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
assert.deepEqual(minuteChoices(32), [0, 5, 10, 15, 20, 25, 30, 32, 35, 40, 45, 50, 55]);
assert.ok(isManagedId('uyvo-r-0-20261107') && isManagedId('uyvo-wait') && isManagedId('uyvo-1330'));
assert.ok(!isManagedId('uyvo-update') && !isManagedId('uyvo-test'));
{
  const [item] = plan({ now: at(2026, 11, 7, 6, 0) });
  assert.equal(plannedKey(item), plannedKey({ ...item }));
  assert.notEqual(plannedKey(item), plannedKey({ ...item, fireAt: item.fireAt + 60000 }));
}

// Daylight saving: America/New_York ends DST on 2026-11-01, so one day is 25 hours long.
// Every reminder must still be on the right calendar day at the right clock time.
for (const zone of ['America/New_York', 'Europe/London', 'Asia/Kolkata', 'Pacific/Auckland']) {
  const previous = process.env.TZ;
  process.env.TZ = zone;
  const now = at(2026, 10, 28, 6, 0);
  const items = plan({ now });
  assert.equal(items.length, 42, zone);
  const days = [...new Set(items.map((item) => item.id.split('-')[3]))];
  assert.deepEqual(
    days,
    Array.from({ length: 14 }, (_, index) => shiftDay('2026-10-28', index).replace(/-/g, '')),
    zone,
  );
  for (const item of items) {
    const stamp = item.id.split('-')[3];
    const date = new Date(item.fireAt);
    assert.equal(dayKey(date).replace(/-/g, ''), stamp, `${zone} ${item.id}`);
    assert.equal(clockOf(item), ['7:30', '11:00', '13:30'][slotOf(item)], `${zone} ${item.id}`);
  }
  if (previous === undefined) delete process.env.TZ;
  else process.env.TZ = previous;
}

console.log('reminder plan checks passed');
