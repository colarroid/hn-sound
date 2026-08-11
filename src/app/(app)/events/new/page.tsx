import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { EventForm } from "../event-form";

export const metadata: Metadata = { title: "New event" };

export default async function NewEventPage() {
  await requireRole("admin");

  return (
    <div className="space-y-7">
      <header className="anim-rise">
        <Link
          href="/events"
          className="text-[12px] text-muted transition-colors duration-200 hover:text-ink"
        >
          Back to events
        </Link>
        <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em]">New event</h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
          A one-off has a single date. A repeating event picks the weekdays it lands
          on, so Monday to Friday and just Mondays are the same kind of thing.
        </p>
      </header>

      <div className="anim-rise d-1 max-w-2xl">
        <Card accentTop>
          <CardHeader title="Details" />
          <div className="p-5">
            <EventForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
