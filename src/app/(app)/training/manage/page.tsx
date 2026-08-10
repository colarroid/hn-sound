import type { Metadata } from "next";
import Link from "next/link";

import { lessonLabel } from "@/components/training/material-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, EmptyState } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import type { TrainingMaterialRow } from "@/lib/database.types";
import { fileTypeLabel, formatBytes } from "@/lib/training/constants";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { DeleteMaterialButton } from "./delete-material-button";

export const metadata: Metadata = { title: "Manage training" };

export default async function ManageTrainingPage() {
  await requireRole("admin");

  const supabase = await createClient();
  const [materialsResult, grantsResult] = await Promise.all([
    supabase
      .from("training_materials")
      .select("*")
      .order("lesson_number", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase.from("training_eligibility").select("material_id"),
  ]);

  const materials = (materialsResult.data ?? []) as TrainingMaterialRow[];

  // Tallied here rather than in SQL: the department is small enough that one
  // extra round trip beats a grouped view.
  const grantCounts = new Map<string, number>();
  for (const row of grantsResult.data ?? []) {
    grantCounts.set(row.material_id, (grantCounts.get(row.material_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-7">
      <header className="anim-rise flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9.5px] font-medium uppercase tracking-[0.2em] text-accent-text">
            Admin
          </p>
          <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em]">
            Manage training
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
            Nothing here is visible to a member until you put them on its list. A
            material with nobody on it is visible only to you and the senior pastor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/training">
            <Button variant="ghost" size="sm">
              View as library
            </Button>
          </Link>
          <Link href="/training/manage/new">
            <Button size="sm">New material</Button>
          </Link>
        </div>
      </header>

      <div className="anim-rise d-1">
        <Card>
          <CardHeader
            title="Material"
            description={
              materials.length === 0
                ? undefined
                : `${materials.length} ${materials.length === 1 ? "item" : "items"} in the library.`
            }
          />

          {materials.length === 0 ? (
            <EmptyState
              title="The library is empty"
              description="Add a manual, a video link, or a run sheet, then choose who can see it."
              action={
                <Link href="/training/manage/new">
                  <Button size="sm">Add the first material</Button>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {materials.map((material) => {
                const granted = grantCounts.get(material.id) ?? 0;
                return (
                  <li
                    key={material.id}
                    className="flex flex-wrap items-start justify-between gap-4 px-5 py-4 transition-colors duration-200 hover:bg-surface-2/40"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/training/manage/${material.id}`}
                        className="text-sm font-medium text-ink transition-colors hover:text-accent-text"
                      >
                        {material.title}
                      </Link>
                      {material.summary ? (
                        <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
                          {material.summary}
                        </p>
                      ) : null}
                      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                        <span
                          className={cn(
                            "uppercase tracking-[0.11em]",
                            material.lesson_number !== null && "text-accent-text",
                          )}
                        >
                          {lessonLabel(material.lesson_number)}
                        </span>
                        <span className="uppercase tracking-[0.11em]">
                          {material.kind === "link"
                            ? "Link"
                            : `${fileTypeLabel(material.mime_type)} ${formatBytes(material.file_size)}`}
                        </span>
                        <span
                          className={
                            granted === 0 ? "text-danger" : "text-muted"
                          }
                        >
                          {granted === 0
                            ? "Nobody can see this yet"
                            : `${granted} ${granted === 1 ? "member" : "members"} eligible`}
                        </span>
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Link href={`/training/manage/${material.id}`}>
                        <Button variant="secondary" size="sm">
                          Edit and access
                        </Button>
                      </Link>
                      <DeleteMaterialButton
                        materialId={material.id}
                        title={material.title}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
