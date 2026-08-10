"use client";

import { useActionState, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { emptyFormState } from "@/lib/form-state";
import { setEligibilityAction } from "@/lib/training/actions";
import { cn } from "@/lib/utils";

export type EligibilityCandidate = {
  id: string;
  name: string;
  email: string;
  position: string | null;
  roleLabel: string;
};

export function EligibilityForm({
  materialId,
  candidates,
  grantedIds,
}: {
  materialId: string;
  candidates: EligibilityCandidate[];
  grantedIds: string[];
}) {
  const [state, action] = useActionState(setEligibilityAction, emptyFormState);
  const [selected, setSelected] = useState<Set<string>>(new Set(grantedIds));

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected = candidates.length > 0 && selected.size === candidates.length;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="materialId" value={materialId} />

      {state.message ? (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-muted">
          {selected.size === 0
            ? "Nobody selected. No member will see this."
            : `${selected.size} of ${candidates.length} selected.`}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            setSelected(allSelected ? new Set() : new Set(candidates.map((c) => c.id)))
          }
        >
          {allSelected ? "Clear all" : "Select everyone"}
        </Button>
      </div>

      <ul className="divide-y divide-line border-y border-line">
        {candidates.map((candidate) => {
          const checked = selected.has(candidate.id);
          return (
            <li key={candidate.id}>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 px-1 py-3 transition-colors duration-200",
                  checked ? "bg-accent-soft/40" : "hover:bg-surface-2/60",
                )}
              >
                <input
                  type="checkbox"
                  name="profileId"
                  value={candidate.id}
                  checked={checked}
                  onChange={() => toggle(candidate.id)}
                  className={cn(
                    "size-4 shrink-0 appearance-none border transition-colors duration-200",
                    checked
                      ? "border-accent bg-accent"
                      : "border-line-strong bg-surface-2",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-ink">
                    {candidate.name}
                  </span>
                  <span className="block truncate text-[11px] text-muted">
                    {candidate.position ?? "No position set"} · {candidate.roleLabel}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <SubmitButton
        label="Save who can see this"
        pendingLabel="Saving"
        className="w-full sm:w-auto sm:px-6"
      />
    </form>
  );
}
