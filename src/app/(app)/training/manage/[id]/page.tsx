import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ROLE_LABELS } from "@/components/role-badge";
import { lessonLabel } from "@/components/training/material-card";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import type { ProfileRow, TrainingMaterialRow } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { fullName } from "@/lib/utils";
import { MaterialForm } from "../material-form";
import { EligibilityForm, type EligibilityCandidate } from "./eligibility-form";

export const metadata: Metadata = { title: "Edit training material" };

export default async function EditMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole("admin");

  const supabase = await createClient();
  const [materialResult, membersResult, grantsResult] = await Promise.all([
    supabase.from("training_materials").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("profiles")
      .select("*")
      .eq("approval_status", "approved")
      .order("first_name", { ascending: true }),
    supabase.from("training_eligibility").select("profile_id").eq("material_id", id),
  ]);

  const material = materialResult.data as TrainingMaterialRow | null;
  if (!material) notFound();

  const candidates: EligibilityCandidate[] = ((membersResult.data ?? []) as ProfileRow[]).map(
    (profile) => ({
      id: profile.id,
      name: fullName(profile) || profile.email,
      email: profile.email,
      position: profile.position,
      roleLabel: ROLE_LABELS[profile.role],
    }),
  );

  const grantedIds = (grantsResult.data ?? []).map((row) => row.profile_id);

  return (
    <div className="space-y-7">
      <header className="anim-rise">
        <Link
          href="/training/manage"
          className="text-[12px] text-muted transition-colors duration-200 hover:text-ink"
        >
          Back to manage training
        </Link>
        <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em]">
          {material.title}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {lessonLabel(material.lesson_number)} ·{" "}
          {material.kind === "link" ? "External link" : "Uploaded file"}
        </p>
      </header>

      <div className="anim-rise d-1 grid gap-6 lg:grid-cols-2">
        <Card accentTop>
          <CardHeader title="Details" />
          <div className="p-5">
            <MaterialForm
              existing={{
                id: material.id,
                title: material.title,
                summary: material.summary,
                lesson_number: material.lesson_number,
                expectations: material.expectations,
                kind: material.kind,
                url: material.url,
                file_name: material.file_name,
                file_size: material.file_size,
              }}
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Who can see this"
            description="Approved members only. Ticking someone here is the single thing that makes this material visible to them."
          />
          <div className="p-5">
            {candidates.length === 0 ? (
              <Alert tone="info">
                There are no approved members yet. Approve somebody first and they
                will appear here.
              </Alert>
            ) : (
              // Keyed on the saved set so a successful save remounts the form
              // from server truth, rather than leaving the ticks to local state.
              <EligibilityForm
                key={grantedIds.join(",")}
                materialId={material.id}
                candidates={candidates}
                grantedIds={grantedIds}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
