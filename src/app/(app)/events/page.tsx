import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, EmptyState } from "@/components/ui/card";
import { requireMember } from "@/lib/auth/session";
import { upcomingBirthdays, type BirthdayPerson } from "@/lib/birthdays";
import type { EventRow } from "@/lib/database.types";
import { AGENDA_DAYS, daysAwayLabel } from "@/lib/dates";
import { buildAgenda, formatEventTime, formatSchedule, type AgendaItem } from "@/lib/events/schedule";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Events" };

function AgendaRow({ item }: { item: AgendaItem }) {
  const today = item.daysAway === 0;

  return (
    <li
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors duration-200",
        today ? "bg-accent-soft/40" : "hover:bg-surface-2/40",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-ink">{item.title}</p>
          {item.repeatLabel ? (
            <span className="shrink-0 border border-line bg-surface-2 px-1.5 py-[2px] text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
              {item.repeatLabel}
            </span>
          ) : null}
        </div>
        <p className="mt-1 truncate text-[12.5px] text-muted">
          {[item.timeLabel, item.detail].filter(Boolean).join(" · ") || "All day"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-6">
        <p className={cn("text-right text-[13px]", today ? "text-accent-text" : "text-ink")}>
          {item.dayLabel}
        </p>
        <span
          className={cn(
            "min-w-24 border px-2 py-[3px] text-center text-[10px] font-medium uppercase tracking-[0.11em]",
            today
              ? "border-accent-line bg-accent-soft text-accent-text"
              : "border-line bg-surface-2 text-muted",
          )}
        >
          {daysAwayLabel(item.daysAway)}
        </span>
      </div>
    </li>
  );
}

export default async function EventsPage() {
  const { profile } = await requireMember();
  const isAdmin = profile.role === "admin";

  const supabase = await createClient();
  const [eventsResult, peopleResult] = await Promise.all([
    supabase.from("events").select("*").order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, position, date_of_birth")
      .eq("approval_status", "approved"),
  ]);

  const events = (eventsResult.data ?? []) as EventRow[];
  const birthdays = upcomingBirthdays((peopleResult.data ?? []) as BirthdayPerson[]);

  // Birthdays get their own card below rather than inline rows, so they are not
  // listed twice on one screen.
  const agenda = buildAgenda({ events, days: AGENDA_DAYS });
  const soon = agenda.filter((item) => item.daysAway <= 7);
  const later = agenda.filter((item) => item.daysAway > 7);
  const nextBirthdays = birthdays.slice(0, 6);

  const repeating = events.filter((event) => event.recurrence === "weekly");

  return (
    <div className="space-y-7">
      <header className="anim-rise flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9.5px] font-medium uppercase tracking-[0.2em] text-accent-text">
            The department diary
          </p>
          <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em]">Events</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
            Services, rehearsals, and anything else in the calendar, looking{" "}
            {AGENDA_DAYS} days ahead. A repeating event is listed once a week rather
            than once a day.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/birthdays">
            <Button variant="ghost" size="sm">
              All birthdays
            </Button>
          </Link>
          {isAdmin ? (
            <Link href="/events/new">
              <Button size="sm">New event</Button>
            </Link>
          ) : null}
        </div>
      </header>

      <div className="anim-rise d-1 space-y-6">
        <Card accentTop={soon.length > 0}>
          <CardHeader
            title="This week"
            description={
              soon.length === 0 ? undefined : "Today and the next seven days."
            }
          />
          {soon.length === 0 ? (
            <EmptyState
              title="Nothing this week"
              description={
                isAdmin
                  ? "Create an event and it appears here, along with anyone's birthday."
                  : "Nothing in the diary for the next seven days."
              }
              action={
                isAdmin ? (
                  <Link href="/events/new">
                    <Button size="sm">New event</Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {soon.map((item) => (
                <AgendaRow key={item.key} item={item} />
              ))}
            </ul>
          )}
        </Card>

        {later.length > 0 ? (
          <Card>
            <CardHeader title="Coming up" description={`The rest of the next ${AGENDA_DAYS} days.`} />
            <ul className="divide-y divide-line">
              {later.map((item) => (
                <AgendaRow key={item.key} item={item} />
              ))}
            </ul>
          </Card>
        ) : null}

        {nextBirthdays.length > 0 ? (
          <Card>
            <CardHeader
              title="Upcoming birthdays"
              description="Whoever is next, in date order."
              action={
                <Link
                  href="/birthdays"
                  className="text-[12px] text-muted transition-colors duration-200 hover:text-ink"
                >
                  See all
                </Link>
              }
            />
            <ul className="divide-y divide-line">
              {nextBirthdays.map((person) => {
                const today = person.daysAway === 0;
                return (
                  <li
                    key={person.id}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors duration-200",
                      today ? "bg-accent-soft/40" : "hover:bg-surface-2/40",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {person.name}
                      </p>
                      <p className="mt-1 truncate text-[12.5px] text-muted">
                        {person.position ?? "No position set"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-6">
                      <p
                        className={cn(
                          "text-right text-[13px]",
                          today ? "text-accent-text" : "text-ink",
                        )}
                      >
                        {person.dayLabel}
                      </p>
                      <span
                        className={cn(
                          "min-w-24 border px-2 py-[3px] text-center text-[10px] font-medium uppercase tracking-[0.11em]",
                          today
                            ? "border-accent-line bg-accent-soft text-accent-text"
                            : "border-line bg-surface-2 text-muted",
                        )}
                      >
                        {daysAwayLabel(person.daysAway)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : null}

        {repeating.length > 0 ? (
          <Card>
            <CardHeader
              title="Weekly schedule"
              description="The standing commitments, whatever the date."
            />
            <ul className="divide-y divide-line">
              {repeating.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors duration-200 hover:bg-surface-2/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{event.title}</p>
                    <p className="mt-1 truncate text-[12.5px] text-muted">
                      {[formatSchedule(event), formatEventTime(event), event.location]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {isAdmin ? (
                    <Link href={`/events/${event.id}`}>
                      <Button variant="secondary" size="sm">
                        Edit
                      </Button>
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {isAdmin && events.length > 0 ? (
          <Card>
            <CardHeader
              title="Every event"
              description="Including one-offs that have already passed."
            />
            <ul className="divide-y divide-line">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 transition-colors duration-200 hover:bg-surface-2/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-ink">{event.title}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {event.recurrence === "weekly" ? "Repeating" : "One-off"} ·{" "}
                      {formatSchedule(event)}
                    </p>
                  </div>
                  <Link href={`/events/${event.id}`}>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
