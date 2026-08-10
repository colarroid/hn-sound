import type { AppRole } from "@/lib/database.types";

/**
 * Department position is free text. These are only offered as autocomplete, so
 * the admin can pick a familiar title or type something new without anyone
 * having to touch a migration. They started life as the seeded lookup table that
 * 0004 dropped.
 */
export const POSITION_SUGGESTIONS = [
  "Head of Department",
  "Asst. Head of Department",
  "Senior Engineer",
  "Front of House Engineer",
  "Monitor Engineer",
  "Stage Engineer",
  "Lighting Operator",
  "Camera Operator",
  "Stream Operator",
  "Presentation Operator",
  "Trainee",
] as const;

export const POSITION_MAX_LENGTH = 60;

/** Suggestions plus whatever titles are already in use, de-duplicated. */
export function positionOptions(inUse: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of [...POSITION_SUGGESTIONS, ...inUse]) {
    const title = value?.trim();
    if (!title) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(title);
  }

  return out;
}

/**
 * Roles the admin can assign. Treasurer is here because the contributions and
 * treasury section is built around it, even though it was left out of the
 * shorthand list when free text positions were requested.
 */
export const ASSIGNABLE_ROLES: Array<{ value: AppRole; label: string; hint: string }> = [
  { value: "member", label: "Member", hint: "Default. Full member access, no admin powers." },
  { value: "admin", label: "Admin", hint: "Everything, including approving members and assigning roles." },
  { value: "senior_pastor", label: "Senior Pastor", hint: "Sees every overview and report. Changes nothing." },
  { value: "treasurer", label: "Treasurer", hint: "Posts credits and debits against the department balance." },
];
