import type { Metadata } from "next";

import { Card, CardHeader, EmptyState } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/database.types";
import { fullName } from "@/lib/utils";
import { ApprovalRow, type PendingMember } from "./approval-row";

export const metadata: Metadata = { title: "Approvals" };

function formatDay(value: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function toPendingMember(profile: ProfileRow): PendingMember {
  return {
    id: profile.id,
    name: fullName(profile) || "Name not given",
    email: profile.email,
    phone: profile.phone,
    dobLabel: formatDay(profile.date_of_birth),
    joinedLabel: formatDay(profile.created_at),
    declineReason: profile.decline_reason,
  };
}

export default async function ApprovalsPage() {
  const { profile } = await requireRole("admin", "senior_pastor");
  const canAct = profile.role === "admin";

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .in("approval_status", ["pending", "declined"])
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as ProfileRow[];
  const pending = rows.filter((row) => row.approval_status === "pending");
  const declined = rows.filter((row) => row.approval_status === "declined");

  return (
    <div className="space-y-7">
      <header className="anim-rise">
        <p className="text-[9.5px] font-medium uppercase tracking-[0.2em] text-accent-text">
          Access control
        </p>
        <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em]">Approvals</h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
          {canAct
            ? "New signups wait here until you let them in. Nobody reaches the dashboard, the directory, or anything else until you approve them."
            : "New signups wait here until an admin lets them in. This list is read only for your role."}
        </p>
      </header>

      <div className="anim-rise d-1">
        <Card accentTop={pending.length > 0}>
          <CardHeader
            title="Waiting"
            description={
              pending.length === 0
                ? undefined
                : `${pending.length} ${pending.length === 1 ? "person" : "people"} waiting for access.`
            }
          />
          {pending.length === 0 ? (
            <EmptyState
              title="Nobody is waiting"
              description="New signups will appear here as soon as they confirm their email address."
            />
          ) : (
            <ul className="divide-y divide-line">
              {pending.map((row) => (
                <ApprovalRow
                  key={row.id}
                  member={toPendingMember(row)}
                  canAct={canAct}
                />
              ))}
            </ul>
          )}
        </Card>
      </div>

      {declined.length > 0 ? (
        <div className="anim-rise d-2">
          <Card>
            <CardHeader
              title="Declined"
              description="They can still sign in, but they only ever see the declined screen. Approving reverses it."
            />
            <ul className="divide-y divide-line">
              {declined.map((row) => (
                <ApprovalRow
                  key={row.id}
                  member={toPendingMember(row)}
                  canAct={canAct}
                  declined
                />
              ))}
            </ul>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
