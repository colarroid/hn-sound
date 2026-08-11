/**
 * Date helpers anchored to the church's own timezone.
 *
 * The server may sit anywhere, so "today" is resolved in Africa/Lagos rather than
 * in UTC. Otherwise for an hour either side of midnight the app would disagree
 * with the people reading it.
 */
export const TIMEZONE = "Africa/Lagos";

export const DAY_MS = 86_400_000;

/** Anything inside this many days counts as "coming up" on the dashboard. */
export const COMING_UP_DAYS = 14;

/** How far ahead the events page looks. */
export const AGENDA_DAYS = 60;

/** Today's calendar date where the church is, as [year, month, day]. */
export function localToday(now = new Date()): [number, number, number] {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const [year, month, day] = parts.split("-").map(Number);
  return [year, month, day];
}

/** Midnight today, as a UTC timestamp, for whole-day arithmetic. */
export function localTodayUtc(now = new Date()) {
  const [year, month, day] = localToday(now);
  return Date.UTC(year, month - 1, day);
}

/**
 * Midnight on the last day of the current local month, as a UTC timestamp.
 *
 * Used to answer "is this in the current month" by date rather than by month name.
 * A 5 August birthday seen on 11 August next occurs in August of NEXT year, so
 * matching on the month name alone would wrongly call it this month's.
 */
export function endOfLocalMonthUtc(now = new Date()) {
  const [year, month] = localToday(now);
  // Day 0 of the following month is the last day of this one.
  return Date.UTC(year, month, 0);
}

/** "August", in the church's timezone. */
export function currentMonthLabel(now = new Date()) {
  return new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: TIMEZONE }).format(
    now,
  );
}

export function formatDay(stamp: number) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(stamp));
}

export function daysAwayLabel(daysAway: number) {
  if (daysAway === 0) return "Today";
  if (daysAway === 1) return "Tomorrow";
  // Deliberately no "next week" bucket. Ten days away is not next week, and a
  // label that is sometimes wrong is worse than a plain count.
  return `In ${daysAway} days`;
}

/** "18:30" or "18:30:00" to "6:30 pm". */
export function formatTime(value: string | null) {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour < 12 ? "am" : "pm";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return minute === "00" ? `${display} ${suffix}` : `${display}:${minute} ${suffix}`;
}
