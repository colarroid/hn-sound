import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { requireMember } from "@/lib/auth/session";
import { navFor } from "@/lib/nav";
import { fullName, initials } from "@/lib/utils";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await requireMember();

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
    >
      {children}
    </AppShell>
  );
}
