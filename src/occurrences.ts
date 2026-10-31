import { addDays, parisDate, utcToWallClock, wallClockToUtc } from '@mairie360/bffs-lib';

/** Repetition rule of a Calendar API event (`EventView.recurrence`), as the dashboard reads it. */
export type Recurrence = {
  frequency: string;
  interval: number;
  days_of_week?: number[] | null;
  ends_on?: string | null;
};

/** An event of Calendar API `GET /api/v1/calendar`: `start` / `end` are the UTC instants of the series' first occurrence. */
export type CalendarSeries = { start: string; end: string; recurrence?: Recurrence | null };

/** Start of an occurrence on the Europe/Paris wall clock. */
export type Occurrence = { date: string; time: string };

const DAY_MS = 86_400_000;
const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / DAY_MS;
const dayDiff = (later: string, earlier: string) => dayNumber(later) - dayNumber(earlier);
/** 0 = Sunday … 6 = Saturday, like `days_of_week`. */
const weekDay = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();
const mondayOf = (date: string) => addDays(date, weekDay(date) === 0 ? -6 : 1 - weekDay(date));
const monthDiff = (later: string, earlier: string) =>
  (Number(later.slice(0, 4)) - Number(earlier.slice(0, 4))) * 12 + Number(later.slice(5, 7)) - Number(earlier.slice(5, 7));

/**
 * Whether a repetition of the series starts on `date` (a Paris day not before the first one), with the rule the
 * calendar front and Calendar API apply: every `interval` days; every `interval` weeks counted from the Monday of
 * the first week, on `days_of_week` (the first day's weekday when empty); every `interval` months on the same day of
 * the month (a month without that day has none). `ends_on` is the last day, inclusive.
 */
function startsOn(date: string, first: string, rule: Recurrence): boolean {
  if (rule.ends_on && date > rule.ends_on.slice(0, 10)) return false;
  const interval = Math.max(1, rule.interval);
  switch (rule.frequency) {
    case 'daily':
      return dayDiff(date, first) % interval === 0;
    case 'weekly': {
      const days = rule.days_of_week?.length ? rule.days_of_week : [weekDay(first)];
      return (dayDiff(mondayOf(date), mondayOf(first)) / 7) % interval === 0 && days.includes(weekDay(date));
    }
    case 'monthly':
      return monthDiff(date, first) % interval === 0 && date.slice(8) === first.slice(8);
    default:
      return false;
  }
}

/**
 * The first occurrence of `event` not finished at `now` and starting by `lastDay` (a Paris day), or null (MAIR-563).
 * Calendar API lists a recurring event once, with the start of its series, as soon as its rule overlaps the period:
 * the dashboard shows the next repetition instead, and leaves out the occurrences already over.
 */
export function nextOccurrence(event: CalendarSeries, lastDay: string, now = new Date()): Occurrence | null {
  const start = utcToWallClock(event.start);
  const end = utcToWallClock(event.end);
  const span = Math.max(0, dayDiff(end.date, start.date));
  const notOver = (date: string) => Date.parse(wallClockToUtc(addDays(date, span), end.time)) > now.getTime();

  if (notOver(start.date)) return start.date <= lastDay ? start : null;
  if (!event.recurrence) return null;
  // An occurrence still running started at most `span` days before today.
  const from = addDays(parisDate(now), -span);
  // Ordered YYYY-MM-DD strings: the loop runs over at most the dashboard window plus the event span.
  for (let date = from > start.date ? from : addDays(start.date, 1); date <= lastDay; date = addDays(date, 1)) {
    if (startsOn(date, start.date, event.recurrence) && notOver(date)) return { date, time: start.time };
  }
  return null;
}
