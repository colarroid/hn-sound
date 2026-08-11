import { DAY_MS, formatDay, localToday } from "@/lib/dates";

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
    if (stamp >= todayUtc) return stamp;
  }
  return null;
}

export function upcomingBirthdays(
  people: BirthdayPerson[],
  now = new Date(),
): UpcomingBirthday[] {
  const [todayYear, todayMonth, todayDay] = localToday(now);
  const todayUtc = Date.UTC(todayYear, todayMonth - 1, todayDay);

  const out: UpcomingBirthday[] = [];

  for (const person of people) {
    if (!person.date_of_birth) continue;

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(person.date_of_birth);
    if (!match) continue;

    const stamp = nextOccurrence(Number(match[2]), Number(match[3]), todayUtc, todayYear);
    if (stamp === null) continue;

    out.push({
      id: person.id,
      name: [person.first_name, person.last_name].filter(Boolean).join(" ").trim(),
      position: person.position,
      dayLabel: formatDay(stamp),
      daysAway: Math.round((stamp - todayUtc) / DAY_MS),
    });
  }

  return out.sort((a, b) => a.daysAway - b.daysAway);
}
