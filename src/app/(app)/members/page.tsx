import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireMember } from "@/lib/auth/session";
import type { ProfileRow } from "@/lib/database.types";
import { positionOptions } from "@/lib/positions";
import { createClient } from "@/lib/supabase/server";
import { fullName, initials } from "@/lib/utils";
import { Directory } from "./directory";
import type { DirectoryMember } from "./member-row";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage() {
  const { user, profile } = await requireMember();
  const canManage = profile.role === "admin";

  const supabase = await createClient();
  // Approved only. Pending and revoked accounts belong in Approvals, not here.
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("approval_status", "approved")
    .order("first_name", { ascending: true })
    .order("last_name", { ascending: true });

  const rows = (data ?? []) as ProfileRow[];

  const members: DirectoryMember[] = rows.map((row) => ({
    id: row.id,
    name: fullName(row) || row.email,
    initials: initials(row),
    email: row.email,
    phone: row.phone,
    position: row.position,
    role: row.role,
    isSelf: row.id === user.id,
  }));

  const positionSuggestions = positionOptions(rows.map((row) => row.position));

  return (
    <div className="space-y-7">
      <header className="anim-rise flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9.5px] font-medium uppercase tracking-[0.2em] text-accent-text">
            Directory
          </p>
          <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em]">Members</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
            {canManage
              ? "Everyone in the department. Edit anyone's role or department position here, without touching the database."
              : "Everyone in the department, with what they do and how to reach them."}
          </p>
        </div>

        <Link href="/birthdays">
          <Button variant="secondary" size="sm">
            Upcoming birthdays
          </Button>
        </Link>
      </header>

      <div className="anim-rise d-1">
        <Directory
          members={members}
          canManage={canManage}
          positionSuggestions={positionSuggestions}
        />
      </div>
    </div>
  );
}
