import type { Metadata } from "next";
import type { ReactNode } from "react";

import Link from "next/link";

import { RoleBadge } from "@/components/role-badge";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader } from "@/components/ui/card";
import { requireMember } from "@/lib/auth/session";
import {
  daysAwayLabel,
  upcomingBirthdays,
  type BirthdayPerson,
} from "@/lib/birthdays";
import { CHURCH_NAME } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { fullName } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="px-5 py-4 transition-colors duration-200 hover:bg-surface-2/50">
      <dt className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm text-ink">{value}</dd>
    </div>
  );
}

export default async function DashboardPage() {
  const { profile } = await requireMember();
  const greetingName = profile.first_name || fullName(profile) || "there";

  // A birthdays page nobody opens is a birthdays page nobody uses, so the next
  // few ride along on the landing screen.
  const supabase = await createClient();
  const { data: birthdayRows } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, position, date_of_birth")
    .eq("approval_status", "approved");

  const nextBirthdays = upcomingBirthdays(
    (birthdayRows ?? []) as BirthdayPerson[],
  ).slice(0, 3);

  return (
    <div className="space-y-7">
      <header className="anim-rise">
        <p className="text-[9.5px] font-medium uppercase tracking-[0.2em] text-accent-text">
          Sound &amp; Technical
        </p>
        <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em]">
          Welcome, {greetingName}
        </h1>
        <p className="mt-1.5 text-sm text-muted">{CHURCH_NAME}.</p>
      </header>

      {!profile.position ? (
        <div className="anim-rise d-1">
          <Alert tone="info">
            An admin has not set your department position yet. You still have full
            member access in the meantime.
          </Alert>
        </div>
      ) : null}

      {nextBirthdays.length > 0 ? (
        <div className="anim-rise d-2">
          <Card>
            <CardHeader
              title="Coming up"
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
              {nextBirthdays.map((person) => (
                <li
                  key={person.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-ink">{person.name}</p>
                    <p className="truncate text-[11px] text-muted">
                      {person.dayLabel} · turning {person.turningAge}
                    </p>
                  </div>
                  <span
                    className={
                      person.daysAway === 0
                        ? "text-[11px] uppercase tracking-[0.11em] text-accent-text"
                        : "text-[11px] uppercase tracking-[0.11em] text-muted"
                    }
                  >
                    {daysAwayLabel(person.daysAway)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}

      <div className="anim-rise d-3">
        <Card>
          <CardHeader
            title="Your account"
            description="Members can see your name, position, phone number, and email in the directory."
          />
          <dl className="divide-y divide-line">
            <Detail label="Name" value={fullName(profile) || "Not set"} />
            <Detail label="Email" value={profile.email} />
            <Detail label="Phone" value={profile.phone ?? "Not set"} />
            <Detail label="Date of birth" value={formatDate(profile.date_of_birth)} />
            <Detail
              label="Department position"
              value={profile.position ?? "Not assigned yet"}
            />
            <Detail label="Role" value={<RoleBadge role={profile.role} />} />
          </dl>
        </Card>
      </div>
    </div>
  );
}
