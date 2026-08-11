/**
 * Birthday maths, done in the church's own timezone.
 *
 * The server may sit anywhere, so "today" is resolved in Africa/Lagos rather
 * than in UTC. Otherwise for an hour either side of midnight the list would
 * disagree with the people reading it.
 */
const TIMEZONE = "Africa/Lagos";

const DAY_MS = 86_400_000;

export type BirthdayPerson = {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  date_of_birth: string | null;
};

export type UpcomingBirthday = {
  id: string;
  name: string;
  position: string | null;
  /** "13 June" */
  dayLabel: string;
  /** 0 is today. */
  daysAway: number;
};

/** Anything inside this many days counts as "coming up" on the dashboard. */
export const COMING_UP_DAYS = 14;

/** Today's calendar date where the church is, as [year, month, day]. */
function localToday(now: Date): [number, number, number] {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const [year, month, day] = parts.split("-").map(Number);
  return [year, month, day];
}

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * The next time this birthday comes round, as a UTC timestamp at midnight.
 * A 29 February birthday is marked on the 28th in common years rather than
 * rolling silently into March.
 */
function nextOccurrence(month: number, day: number, todayUtc: number, todayYear: number) {
  for (const year of [todayYear, todayYear + 1]) {
    const safeDay = month === 2 && day === 29 && !isLeapYear(year) ? 28 : day;
    const stamp = Date.UTC(year, month - 1, safeDay);
    if (stamp >= todayUtc) return { stamp, year };
  }
  return null;
}

export function upcomingBirthdays(
  people: BirthdayPerson[],
  now = new Date(),
): UpcomingBirthday[] {
  const [todayYear, todayMonth, todayDay] = localToday(now);
  const todayUtc = Date.UTC(todayYear, todayMonth - 1, todayDay);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  const out: UpcomingBirthday[] = [];

  for (const person of people) {
    if (!person.date_of_birth) continue;

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(person.date_of_birth);
    if (!match) continue;

    const month = Number(match[2]);
    const day = Number(match[3]);

    const next = nextOccurrence(month, day, todayUtc, todayYear);
    if (!next) continue;

    out.push({
      id: person.id,
      name: [person.first_name, person.last_name].filter(Boolean).join(" ").trim(),
      position: person.position,
      dayLabel: formatter.format(new Date(next.stamp)),
      daysAway: Math.round((next.stamp - todayUtc) / DAY_MS),
    });
  }

  return out.sort((a, b) => a.daysAway - b.daysAway);
}

export function daysAwayLabel(daysAway: number) {
  if (daysAway === 0) return "Today";
  if (daysAway === 1) return "Tomorrow";
  // Deliberately no "next week" bucket. Ten days away is not next week, and a
  // label that is sometimes wrong is worse than a plain count.
  return `In ${daysAway} days`;
}
