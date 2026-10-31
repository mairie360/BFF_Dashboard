import { nextOccurrence, type CalendarSeries, type Recurrence } from '../src/occurrences';

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
