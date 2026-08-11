import type { EventRow } from "@/lib/database.types";
import type { UpcomingBirthday } from "@/lib/birthdays";
import { DAY_MS, formatDay, formatTime, localTodayUtc } from "@/lib/dates";

/** 0 is Sunday, matching Date#getUTCDay, so nothing needs translating. */
const NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Monday first, which is how a rota is read. */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export function weekdayName(day: number) {
  return NAMES[day] ?? "";
}

export function weekdayShort(day: number) {
  return weekdayName(day).slice(0, 3);
}

/** Monday is 0 here, purely for ordering and run detection. */
function mondayIndex(day: number) {
  return (day + 6) % 7;
}

/**
 * Turns a set of weekdays into something a person would say: "Mondays",
 * "Monday to Friday", "Weekends", "Mondays and Thursdays".
 */
export function formatWeekdays(weekdays: number[] | null): string {
  if (!weekdays || weekdays.length === 0) return "No days set";

  const unique = [...new Set(weekdays)].sort((a, b) => mondayIndex(a) - mondayIndex(b));

  if (unique.length === 7) return "Every day";

  const asSet = new Set(unique);
  const isWeekdays = [1, 2, 3, 4, 5].every((d) => asSet.has(d)) && unique.length === 5;
  if (isWeekdays) return "Monday to Friday";
  if (unique.length === 2 && asSet.has(0) && asSet.has(6)) return "Weekends";

  // A consecutive run reads better as a range than as a list.
  const indices = unique.map(mondayIndex);
  const consecutive = indices.every(
    (value, position) => position === 0 || value === indices[position - 1] + 1,
  );
  if (consecutive && unique.length > 2) {
    return `${weekdayName(unique[0])} to ${weekdayName(unique[unique.length - 1])}`;
  }

  const plural = unique.map((day) => `${weekdayName(day)}s`);
  if (plural.length === 1) return plural[0];
  return `${plural.slice(0, -1).join(", ")} and ${plural[plural.length - 1]}`;
}

export function formatEventTime(event: Pick<EventRow, "starts_at" | "ends_at">) {
  const start = formatTime(event.starts_at);
  if (!start) return null;
  const end = formatTime(event.ends_at);
  return end ? `${start} to ${end}` : start;
}

/** "Once, 4 October" or "Weekly, Monday to Friday". */
export function formatSchedule(event: EventRow) {
  if (event.recurrence === "once") {
    return event.starts_on ? formatDay(parseDate(event.starts_on) ?? 0) : "Date not set";
  }
  return formatWeekdays(event.weekdays);
}

function parseDate(value: string | null) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export type AgendaItem = {
  key: string;
  /** The event or member this came from, for de-duplicating across weeks. */
  sourceId: string;
  kind: "event" | "birthday";
  title: string;
  detail: string | null;
  timeLabel: string | null;
  /** "Monday to Friday" for a repeating event, null for a one-off. */
  repeatLabel: string | null;
  dayLabel: string;
  /** 0 is today. */
  daysAway: number;
};

/**
 * Monday on or before the given day, used to bucket occurrences into weeks so a
 * repeating event can be shown once per week instead of once per day.
 */
function weekStart(stamp: number) {
  const mondayOffset = (new Date(stamp).getUTCDay() + 6) % 7;
  return stamp - mondayOffset * DAY_MS;
}

/**
 * Expands events into dated occurrences and merges the birthdays in, because to
 * whoever is reading it a birthday is just another thing happening that week.
 *
 * Occurrences are worked out here rather than stored, so changing a weekly event
 * changes every future date at once and nothing can drift.
 */
export function buildAgenda({
  events,
  birthdays = [],
  days,
  now = new Date(),
}: {
  events: EventRow[];
  birthdays?: UpcomingBirthday[];
  days: number;
  now?: Date;
}): AgendaItem[] {
  const todayUtc = localTodayUtc(now);
  const out: AgendaItem[] = [];

  /*
    A repeating event appears once per week, not once per day. Monday to Friday as
    five near-identical rows buried everything else in the diary, and the weekday
    label already says which days it lands on. The date shown is its first
    occurrence in that week.
  */
  const seenWeeks = new Set<string>();

  for (let offset = 0; offset <= days; offset += 1) {
    const stamp = todayUtc + offset * DAY_MS;
    const weekday = new Date(stamp).getUTCDay();

    for (const event of events) {
      const from = parseDate(event.active_from);
      const until = parseDate(event.active_until);
      const repeating = event.recurrence === "weekly";

      if (!repeating) {
        if (parseDate(event.starts_on) !== stamp) continue;
      } else {
        if (!event.weekdays?.includes(weekday)) continue;
        if (from !== null && stamp < from) continue;
        if (until !== null && stamp > until) continue;

        const bucket = `${event.id}:${weekStart(stamp)}`;
        if (seenWeeks.has(bucket)) continue;
        seenWeeks.add(bucket);
      }

      out.push({
        key: `${event.id}-${stamp}`,
        sourceId: event.id,
        kind: "event",
        title: event.title,
        detail: event.location,
        timeLabel: formatEventTime(event),
        repeatLabel: repeating ? formatWeekdays(event.weekdays) : null,
        dayLabel: formatDay(stamp),
        daysAway: offset,
      });
    }
  }

  for (const birthday of birthdays) {
    if (birthday.daysAway > days) continue;
    out.push({
      key: `birthday-${birthday.id}`,
      sourceId: birthday.id,
      kind: "birthday",
      title: `${birthday.name}'s birthday`,
      detail: birthday.position,
      timeLabel: null,
      repeatLabel: null,
      dayLabel: birthday.dayLabel,
      daysAway: birthday.daysAway,
    });
  }

  return out.sort((a, b) => {
    if (a.daysAway !== b.daysAway) return a.daysAway - b.daysAway;
    // Timed things before all-day things on the same date.
    if (Boolean(a.timeLabel) !== Boolean(b.timeLabel)) return a.timeLabel ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}
