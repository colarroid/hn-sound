"use client";

import { useMemo, useState } from "react";

import { Card, CardHeader, EmptyState } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { MemberRow, type DirectoryMember } from "./member-row";

const DATALIST_ID = "member-positions";

export function Directory({
  members,
  canManage,
  positionSuggestions,
}: {
  members: DirectoryMember[];
  canManage: boolean;
  positionSuggestions: string[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((member) =>
      [member.name, member.position ?? "", member.email, member.phone ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [members, query]);

  return (
    <>
      <datalist id={DATALIST_ID}>
        {positionSuggestions.map((title) => (
          <option key={title} value={title} />
        ))}
      </datalist>

      <Card>
        <CardHeader
          title="Members"
          description={`${members.length} ${members.length === 1 ? "person" : "people"} in the department.`}
          action={
            <div className="w-full max-w-56">
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name or position"
                aria-label="Search members"
                className="h-9 text-[13px]"
              />
            </div>
          }
        />

        {filtered.length === 0 ? (
          <EmptyState
            title={query ? "Nobody matches that" : "No members yet"}
            description={
              query
                ? "Try a different name, position, or email."
                : "Approved members appear here as soon as they are let in."
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                canManage={canManage}
                datalistId={DATALIST_ID}
              />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
