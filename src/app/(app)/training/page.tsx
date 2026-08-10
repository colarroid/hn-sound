import type { Metadata } from "next";
import Link from "next/link";

import { MaterialCard } from "@/components/training/material-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireMember } from "@/lib/auth/session";
import type { TrainingMaterialRow } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Training" };

/**
 * The brief calls for an access denied message rather than an empty list, so an
 * ineligible member is told what is happening and who can fix it.
 */
function AccessDenied() {
  return (
    <Card accentTop className="anim-rise max-w-xl p-7 sm:p-9">
      <div className="flex size-11 items-center justify-center border border-danger/30 bg-danger-soft text-danger">
        <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
          <path
            d="M6 11V8a6 6 0 0 1 12 0v3M5 11h14v9H5v-9Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <p className="mt-6 text-[9.5px] font-medium uppercase tracking-[0.2em] text-danger">
        Access denied
      </p>
      <h1 className="mt-3.5 text-[22px] font-semibold tracking-[-0.015em]">
        No training assigned to you yet
      </h1>
      <p className="mt-2.5 max-w-md text-[13px] leading-relaxed text-ink-dim">
        Training material is granted person by person rather than shared with the
        whole department, and nothing has been assigned to you so far.
      </p>
      <p className="mt-3 max-w-md text-[13px] leading-relaxed text-muted">
        Ask the head of department to put you on the list for what you are learning
        next. It appears here the moment they do.
      </p>

      <Link
        href="/dashboard"
        className="mt-6 inline-block text-[13px] font-medium text-accent-text transition-colors hover:text-ink"
      >
        Back to the dashboard
      </Link>
    </Card>
  );
}

export default async function TrainingPage() {
  const { profile } = await requireMember();
  const canOversee = profile.role === "admin" || profile.role === "senior_pastor";

  const supabase = await createClient();
  // Row level security does the filtering: a member gets only what they have
  // been granted, an admin or the senior pastor gets the whole library.
  const { data } = await supabase
    .from("training_materials")
    .select("*")
    .order("created_at", { ascending: false });

  const materials = (data ?? []) as TrainingMaterialRow[];

  if (!canOversee && materials.length === 0) return <AccessDenied />;

  return (
    <div className="space-y-7">
      <header className="anim-rise flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9.5px] font-medium uppercase tracking-[0.2em] text-accent-text">
            {canOversee ? "Whole library" : "Assigned to you"}
          </p>
          <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em]">Training</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
            {profile.role === "admin"
              ? "Every material in the department, and who can see each one."
              : canOversee
                ? "Every material in the department. Read only for your role."
                : "Material the head of department has put you on. Work through it in your own time."}
          </p>
        </div>

        {profile.role === "admin" ? (
          <Link href="/training/manage">
            <Button variant="secondary" size="sm">
              Manage material
            </Button>
          </Link>
        ) : null}
      </header>

      {materials.length === 0 ? (
        <Card className="anim-rise d-1 px-5 py-14 text-center">
          <p className="text-sm font-medium text-ink">No training material yet</p>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
            {profile.role === "admin"
              ? "Add the first manual, video, or run sheet and choose who can see it."
              : "Nothing has been added to the library yet."}
          </p>
          {profile.role === "admin" ? (
            <div className="mt-5 flex justify-center">
              <Link href="/training/manage/new">
                <Button size="sm">Add a material</Button>
              </Link>
            </div>
          ) : null}
        </Card>
      ) : (
        <div className="anim-rise d-1 grid gap-4 sm:grid-cols-2">
          {materials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              href={
                material.kind === "link"
                  ? (material.url ?? "#")
                  : `/training/${material.id}/download`
              }
              actionLabel={material.kind === "link" ? "Open link" : "Download"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
