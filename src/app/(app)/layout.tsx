import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { requireMember } from "@/lib/auth/session";
import { navFor } from "@/lib/nav";
import { createClient } from "@/lib/supabase/server";
import { fullName, initials } from "@/lib/utils";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await requireMember();

  const supabase = await createClient();

  // The whole point of the approval gate is that somebody notices the queue, so
  // the count rides along in the sidebar for the people who can see it. Broken kit
  // is everybody's business, so that count goes to everyone.
  const canSeeQueue = profile.role === "admin" || profile.role === "senior_pastor";

  const [pendingResult, faultyResult] = await Promise.all([
    canSeeQueue
      ? supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("approval_status", "pending")
      : Promise.resolve({ count: 0 }),
    supabase
      .from("inventory_items")
      .select("id", { count: "exact", head: true })
      .eq("status", "faulty"),
  ]);

  return (
    <AppShell
      member={{
        name: fullName(profile) || (user.email ?? "Member"),
        email: profile.email,
        initials: initials(profile),
        role: profile.role,
        position: profile.position,
      }}
      navItems={navFor(profile.role)}
      badges={{
        "/approvals": pendingResult.count ?? 0,
        "/inventory": faultyResult.count ?? 0,
      }}
    >
      {children}
    </AppShell>
  );
}
