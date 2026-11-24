import { countOccurrences, nextOccurrence, parisMonth, type CalendarSeries, type Recurrence } from '../src/occurrences';

// MAIR-563: the dashboard shows the next repetition of a recurring event, never an occurrence already over.
// Now is Wednesday 2026-10-14 at 12:00 in Paris (CEST, UTC+2); the dashboard window ends on 2026-11-13.
const NOW = new Date('2026-10-14T10:00:00Z');
const LAST_DAY = '2026-11-13';
// 09:00-10:00 in Paris (07:00Z-08:00Z in summer time) on `date`.
const series = (date: string, recurrence: CalendarSeries['recurrence'] = null, end = date): CalendarSeries => ({
  start: `${date}T07:00:00Z`, end: `${end}T08:00:00Z`, recurrence,
});
const next = (event: CalendarSeries) => nextOccurrence(event, LAST_DAY, NOW);

describe('nextOccurrence (MAIR-563)', () => {
  test('a weekly event started in the past appears at its next occurrence, not at its first day', () => {
    // Thursday 2026-10-01, every week: the next one is Thursday 2026-10-15.
    expect(next(series('2026-10-01', { frequency: 'weekly', interval: 1 }))).toEqual({ date: '2026-10-15', time: '09:00' });
  });

  test('an occurrence of today already over gives way to the next one', () => {
    // Wednesday 2026-09-30, every week: today's 09:00-10:00 is over at 12:00, the next one is 2026-10-21.
    expect(next(series('2026-09-30', { frequency: 'weekly', interval: 1 }))).toEqual({ date: '2026-10-21', time: '09:00' });
  });

  test('an occurrence of today still to come is kept', () => {
    const evening: CalendarSeries = { start: '2026-09-30T16:00:00Z', end: '2026-09-30T17:00:00Z', recurrence: { frequency: 'weekly', interval: 1 } };
    expect(next(evening)).toEqual({ date: '2026-10-14', time: '18:00' });
  });

  test('a running occurrence of a multi-day event is kept at its start day', () => {
    // Monday 09:00 to Thursday 10:00, every week: this week's started on 2026-10-12 and runs until tomorrow.
    expect(next(series('2026-09-28', { frequency: 'weekly', interval: 1 }, '2026-10-01'))).toEqual({ date: '2026-10-12', time: '09:00' });
  });

  test.each([
    ['every 2 weeks, counted from the first week', { frequency: 'weekly', interval: 2 }, '2026-10-22'],
    ['on the listed week days', { frequency: 'weekly', interval: 1, days_of_week: [1, 5] }, '2026-10-16'],
    ['every 3 days (today 09:00 is over)', { frequency: 'daily', interval: 3 }, '2026-10-17'],
    ['every month on the same day', { frequency: 'monthly', interval: 1 }, '2026-11-08'],
  ] as [string, Recurrence, string][])('follows the rule %s', (_label, recurrence, expected) => {
    // First occurrence: Thursday 2026-10-08.
    expect(next(series('2026-10-08', recurrence))?.date).toBe(expected);
  });

  test('a monthly event on the 31st skips the months without that day', () => {
    // 2026-08-31: no 2026-09-31; 2026-10-31 is the next one.
    expect(next(series('2026-08-31', { frequency: 'monthly', interval: 1 }))?.date).toBe('2026-10-31');
  });

  test('a series whose last day is past, or whose next occurrence is beyond the window, is left out', () => {
    expect(next(series('2026-10-01', { frequency: 'weekly', interval: 1, ends_on: '2026-10-13' }))).toBeNull();
    expect(next(series('2026-10-01', { frequency: 'monthly', interval: 3 }))).toBeNull();
  });

  test('the last day of a series is inclusive', () => {
    expect(next(series('2026-10-01', { frequency: 'weekly', interval: 1, ends_on: '2026-10-15' }))?.date).toBe('2026-10-15');
  });

  test('a one-off event is kept until it ends, then left out', () => {
    expect(next(series('2026-10-20'))).toEqual({ date: '2026-10-20', time: '09:00' });
    expect(next(series('2026-10-14'))).toBeNull();
    expect(next(series('2026-10-10'))).toBeNull();
    // Started yesterday, ends tomorrow: still running.
    expect(next(series('2026-10-13', null, '2026-10-15'))).toEqual({ date: '2026-10-13', time: '09:00' });
  });

  test('an unknown frequency repeats nothing', () => {
    expect(next(series('2026-10-01', { frequency: 'yearly', interval: 1 }))).toBeNull();
  });

  test('keeps the wall-clock time across a daylight saving change', () => {
    // 09:00 in Paris in summer (07:00Z); after 2026-10-25 the occurrence is still at 09:00 (08:00Z).
    const lateNow = new Date('2026-10-26T12:00:00Z');
    expect(nextOccurrence(series('2026-10-01', { frequency: 'weekly', interval: 1 }), '2026-11-25', lateNow))
      .toEqual({ date: '2026-10-29', time: '09:00' });
  });
});

describe('parisMonth (MAIR-1177)', () => {
  test.each([
    ['the middle of a 30-day month', '2026-09-17T10:00:00Z', { from: '2026-09-01', to: '2026-09-30' }],
    // 00:30 on 1 April in Paris is still 31 March in UTC.
    ['the first minutes of a month in Paris', '2026-03-31T22:30:00Z', { from: '2026-04-01', to: '2026-04-30' }],
    // 23:30 on 31 January in Paris (CET).
    ['the last minutes of a month in Paris', '2027-01-31T22:30:00Z', { from: '2027-01-01', to: '2027-01-31' }],
    ['February of a leap year', '2028-02-10T12:00:00Z', { from: '2028-02-01', to: '2028-02-29' }],
    ['February of a common year', '2026-02-10T12:00:00Z', { from: '2026-02-01', to: '2026-02-28' }],
  ])('MAIR-1177 gives the Europe/Paris calendar month at %s', (_label, now, month) => {
    expect(parisMonth(new Date(now))).toEqual(month);
  });
});

describe('countOccurrences (MAIR-1177)', () => {
  const OCTOBER = { from: '2026-10-01', to: '2026-10-31' };
  const count = (event: CalendarSeries) => countOccurrences(event, OCTOBER);

  test('MAIR-1177 counts a one-off event of the month once, past or not, and none outside it', () => {
    expect(count(series('2026-10-01'))).toBe(1);
    expect(count(series('2026-10-31'))).toBe(1);
    expect(count(series('2026-09-30'))).toBe(0);
    expect(count(series('2026-11-01'))).toBe(0);
  });

  test('MAIR-1177 counts by the Paris day of the start, not the UTC one', () => {
    // 00:30 on 1 October in Paris is 22:30Z on 30 September; 00:30 on 1 November (CET) is 23:30Z on 31 October.
    expect(count({ start: '2026-09-30T22:30:00Z', end: '2026-09-30T23:00:00Z' })).toBe(1);
    expect(count({ start: '2026-10-31T23:30:00Z', end: '2026-10-31T23:45:00Z' })).toBe(0);
  });

  test('MAIR-1177 does not count a multi-day event started before the month', () => {
    expect(count(series('2026-09-29', null, '2026-10-02'))).toBe(0);
  });

  test.each<[string, string, Recurrence, number]>([
    ['daily, started before the month', '2026-09-15', { frequency: 'daily', interval: 1 }, 31],
    ['every 2 days from 1 October', '2026-10-01', { frequency: 'daily', interval: 2 }, 16],
    // Thursdays of October: 1, 8, 15, 22, 29.
    ['weekly on its first weekday', '2026-09-03', { frequency: 'weekly', interval: 1 }, 5],
    // Mondays and Wednesdays every other week from the week of 28 September: 28/09+30/09 (out), 12, 14, 26, 28 October.
    ['every other week on several days', '2026-09-28', { frequency: 'weekly', interval: 2, days_of_week: [1, 3] }, 4],
    ['monthly on the same day', '2026-08-31', { frequency: 'monthly', interval: 1 }, 1],
    ['every other month, October left out', '2026-07-31', { frequency: 'monthly', interval: 2 }, 0],
    ['ending in the month (ends_on inclusive)', '2026-10-01', { frequency: 'daily', interval: 1, ends_on: '2026-10-10' }, 10],
    ['ended before the month', '2026-09-01', { frequency: 'daily', interval: 1, ends_on: '2026-09-30' }, 0],
    ['an unknown frequency (first occurrence only)', '2026-10-05', { frequency: 'yearly', interval: 1 }, 1],
  ])('MAIR-1177 expands a recurring event: %s', (_label, first, recurrence, expected) => {
    expect(count(series(first, recurrence))).toBe(expected);
  });
});
