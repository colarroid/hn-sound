import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import type { EventRow } from "@/lib/database.types";
import { AGENDA_DAYS, daysAwayLabel } from "@/lib/dates";
import { buildAgenda, formatEventTime, formatSchedule } from "@/lib/events/schedule";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "../event-form";
import { DeleteEventButton } from "./delete-event-button";

export const metadata: Metadata = { title: "Edit event" };

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole("admin");

  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();

  const event = data as EventRow | null;
  if (!event) notFound();

  // Shows the admin exactly which dates the rule produces, so a weekday mistake is
  // obvious before anyone turns up on the wrong evening.
  const next = buildAgenda({ events: [event], days: AGENDA_DAYS }).slice(0, 6);

  return (
    <div className="space-y-7">
      <header className="anim-rise">
        <Link
          href="/events"
          className="text-[12px] text-muted transition-colors duration-200 hover:text-ink"
        >
          Back to events
        </Link>
        <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em]">{event.title}</h1>
        <p className="mt-1.5 text-sm text-muted">
          {[
            event.recurrence === "weekly" ? "Repeating" : "One-off",
            formatSchedule(event),
            formatEventTime(event),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      <div className="anim-rise d-1 grid gap-6 lg:grid-cols-2">
        <Card accentTop>
          <CardHeader title="Details" />
          <div className="p-5">
            <EventForm existing={event} />
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Next dates"
              description={`What this rule works out to over the next ${AGENDA_DAYS} days.`}
            />
            {next.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-muted">
                Nothing falls inside the next {AGENDA_DAYS} days.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {next.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-center justify-between gap-4 px-5 py-3"
                  >
                    <span className="text-[13px] text-ink">{item.dayLabel}</span>
                    <span className="text-[11px] uppercase tracking-[0.11em] text-muted">
                      {daysAwayLabel(item.daysAway)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Remove" description="Deleting cannot be undone." />
            <div className="p-5">
              <DeleteEventButton eventId={event.id} title={event.title} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
