import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { requireMember } from "@/lib/auth/session";
import { navFor } from "@/lib/nav";
import { createClient } from "@/lib/supabase/server";
import { fullName, initials } from "@/lib/utils";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await requireMember();

  // The whole point of the approval gate is that somebody notices the queue, so
  // the count rides along in the sidebar for the people who can see it.
  let pendingCount = 0;
  if (profile.role === "admin" || profile.role === "senior_pastor") {
    const supabase = await createClient();
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "pending");
    pendingCount = count ?? 0;
  }

  return (
    <AppShell
      member={{
        name: fullName(profile) || (user.email ?? "Member"),
        email: profile.email,
        initials: initials(profile),
        role: profile.role,
        position: profile.position?.name ?? null,
      }}
      navItems={navFor(profile.role)}
      badges={{ "/approvals": pendingCount }}
    >
      {children}
    </AppShell>
  );
}
