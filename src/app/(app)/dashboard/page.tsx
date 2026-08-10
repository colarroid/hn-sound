import type { Metadata } from "next";
import type { ReactNode } from "react";

import { RoleBadge } from "@/components/role-badge";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader } from "@/components/ui/card";
import { requireMember } from "@/lib/auth/session";
import { CHURCH_NAME } from "@/lib/brand";
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

      <div className="anim-rise d-2">
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
