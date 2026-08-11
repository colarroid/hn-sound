import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, EmptyState } from "@/components/ui/card";
import { requireMember } from "@/lib/auth/session";
import {
  upcomingBirthdays,
  type BirthdayPerson,
  type UpcomingBirthday,
} from "@/lib/birthdays";
import { daysAwayLabel } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Upcoming birthdays" };

function Row({ person }: { person: UpcomingBirthday }) {
  const today = person.daysAway === 0;

  return (
    <li
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors duration-200",
        today ? "bg-accent-soft/40" : "hover:bg-surface-2/40",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{person.name}</p>
        <p className="truncate text-[12.5px] text-muted">
          {person.position ?? "No position set"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-6">
        <p className={cn("text-right text-[13px]", today ? "text-accent-text" : "text-ink")}>
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
}

function Section({
  title,
  description,
  people,
  accentTop = false,
}: {
  title: string;
  description?: string;
  people: UpcomingBirthday[];
  accentTop?: boolean;
}) {
  if (people.length === 0) return null;

  return (
    <Card accentTop={accentTop}>
      <CardHeader title={title} description={description} />
      <ul className="divide-y divide-line">
        {people.map((person) => (
          <Row key={person.id} person={person} />
        ))}
      </ul>
    </Card>
  );
}

export default async function BirthdaysPage() {
  await requireMember();

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, position, date_of_birth")
    .eq("approval_status", "approved");

  const people = upcomingBirthdays((data ?? []) as BirthdayPerson[]);

  const todays = people.filter((person) => person.daysAway === 0);
  const soon = people.filter((person) => person.daysAway > 0 && person.daysAway <= 30);
  const later = people.filter((person) => person.daysAway > 30);

  return (
    <div className="space-y-7">
      <header className="anim-rise flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9.5px] font-medium uppercase tracking-[0.2em] text-accent-text">
            The year ahead
          </p>
          <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em]">
            Upcoming birthdays
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
              Everyone in date order, starting with whoever is next. Driven by the date
            of birth each member gave at signup.
          </p>
        </div>

        <Link href="/members">
          <Button variant="secondary" size="sm">
            Members directory
          </Button>
        </Link>
      </header>

      {people.length === 0 ? (
        <div className="anim-rise d-1">
          <Card>
            <EmptyState
              title="No birthdays to show"
              description="Nobody has a date of birth recorded yet. It is collected at signup, so this fills in as members join."
            />
          </Card>
        </div>
      ) : (
        <div className="anim-rise d-1 space-y-6">
          <Section
            title="Today"
            description="Say something before the day runs out."
            people={todays}
            accentTop
          />
          <Section
            title="Next 30 days"
            people={soon}
            description={soon.length === 0 ? undefined : "Coming up soon."}
          />
          <Section title="Later in the year" people={later} />
        </div>
      )}
    </div>
  );
}
