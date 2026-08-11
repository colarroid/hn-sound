"use client";

import { useActionState, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { InventoryStatus } from "@/lib/database.types";
import { emptyFormState } from "@/lib/form-state";
import {
  deleteItemAction,
  flagFaultyAction,
  markFixedAction,
  retireItemAction,
  updateItemAction,
} from "@/lib/inventory/actions";
import { cn } from "@/lib/utils";
import { ItemFields, type CategoryOption } from "./item-fields";

export type InventoryItemView = {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName: string;
  quantity: number;
  serialNumber: string | null;
  location: string | null;
  notes: string | null;
  status: InventoryStatus;
  faultNote: string | null;
  flaggedByName: string | null;
  flaggedAtLabel: string | null;
  addedByName: string | null;
  /** Admin, or the member who added it. */
  canEditDetails: boolean;
};

const STATUS_STYLES: Record<InventoryStatus, string> = {
  ok: "border-line bg-surface-2 text-muted",
  faulty: "border-danger/35 bg-danger-soft text-danger",
  retired: "border-line bg-surface text-muted/60",
};

const STATUS_LABELS: Record<InventoryStatus, string> = {
  ok: "Working",
  faulty: "Needs fixing",
  retired: "Retired",
};

export function StatusBadge({
  status,
  className,
}: {
  status: InventoryStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center border px-2 py-[3px] text-[10px] font-medium uppercase tracking-[0.11em]",
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function ItemRow({
  item,
  canWrite,
  isAdmin,
  categories,
  showCategory = false,
}: {
  item: InventoryItemView;
  canWrite: boolean;
  isAdmin: boolean;
  categories: CategoryOption[];
  showCategory?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [flagState, flagAction] = useActionState(flagFaultyAction, emptyFormState);
  const [fixState, fixAction] = useActionState(markFixedAction, emptyFormState);
  const [editState, editAction] = useActionState(updateItemAction, emptyFormState);

  const meta = [
    item.quantity !== 1 ? `Qty ${item.quantity}` : null,
    showCategory ? item.categoryName : null,
    item.location,
    item.serialNumber ? `SN ${item.serialNumber}` : null,
  ].filter(Boolean);

  return (
    <li
      className={cn(
        "px-5 py-4 transition-colors duration-200",
        item.status === "retired" ? "opacity-60" : "hover:bg-surface-2/40",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{item.name}</p>
          {meta.length > 0 ? (
            <p className="mt-1 truncate text-[12.5px] text-muted">{meta.join(" · ")}</p>
          ) : null}
          {item.status === "faulty" && item.faultNote ? (
            <p className="mt-2 border-l-2 border-danger/40 pl-3 text-[12.5px] leading-relaxed text-muted">
              <span className="text-danger">Fault:</span> {item.faultNote}
              {item.flaggedByName ? (
                <span className="text-muted/70">
                  {" "}
                  &mdash; {item.flaggedByName}
                  {item.flaggedAtLabel ? `, ${item.flaggedAtLabel}` : ""}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={item.status} />
          {canWrite ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
            >
              {open ? "Close" : "Update"}
            </Button>
          ) : null}
        </div>
      </div>

      {canWrite && open ? (
        <div className="anim-rise mt-4 space-y-4 border-t border-line pt-4">
          {flagState.message ? (
            <Alert tone={flagState.ok ? "success" : "error"}>{flagState.message}</Alert>
          ) : null}
          {fixState.message ? (
            <Alert tone={fixState.ok ? "success" : "error"}>{fixState.message}</Alert>
          ) : null}
          {editState.message ? (
            <Alert tone={editState.ok ? "success" : "error"}>{editState.message}</Alert>
          ) : null}

          {item.status === "faulty" ? (
            <form action={fixAction} className="space-y-2">
              <input type="hidden" name="itemId" value={item.id} />
              <p className="text-[12.5px] leading-relaxed text-muted">
                Clear this once it actually works again. Anyone can do it, not just
                the admin.
              </p>
              <SubmitButton
                label="Mark as working"
                pendingLabel="Updating"
                size="sm"
                className="sm:px-5"
              />
            </form>
          ) : item.status === "ok" ? (
            <form action={flagAction} className="space-y-2">
              <input type="hidden" name="itemId" value={item.id} />
              <label
                htmlFor={`faultNote-${item.id}`}
                className="block text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted"
              >
                What is wrong with it
              </label>
              <Textarea
                id={`faultNote-${item.id}`}
                name="faultNote"
                rows={2}
                placeholder="Right channel cuts out when the cable moves."
                invalid={Boolean(flagState.errors?.faultNote)}
                className="min-h-16"
              />
              {flagState.errors?.faultNote ? (
                <p className="text-[12px] text-danger">{flagState.errors.faultNote}</p>
              ) : null}
              <SubmitButton
                label="Flag as faulty"
                pendingLabel="Flagging"
                size="sm"
                variant="danger"
                className="sm:px-5"
              />
            </form>
          ) : (
            <p className="text-[12.5px] text-muted">
              This item is retired. An admin can bring it back by editing it.
            </p>
          )}

          {item.canEditDetails ? (
            <div className="border-t border-line pt-4">
              {editing ? (
                <form action={editAction}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <ItemFields
                    categories={categories}
                    errors={editState.errors ?? {}}
                    compact
                    defaults={{
                      name: item.name,
                      categoryId: item.categoryId,
                      quantity: item.quantity,
                      serialNumber: item.serialNumber,
                      location: item.location,
                      notes: item.notes,
                    }}
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <SubmitButton
                      label="Save details"
                      pendingLabel="Saving"
                      size="sm"
                      className="sm:px-5"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditing(true)}
                >
                  Edit details
                </Button>
              )}
            </div>
          ) : (
            <p className="border-t border-line pt-4 text-[12px] leading-relaxed text-muted">
              Only an admin, or whoever added this item, can change its details.
              {item.addedByName ? ` Added by ${item.addedByName}.` : ""}
            </p>
          )}

          {isAdmin ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
              {item.status !== "retired" ? (
                <form action={retireItemAction}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <Button type="submit" size="sm" variant="secondary">
                    Retire
                  </Button>
                </form>
              ) : null}
              <form
                action={deleteItemAction}
                onSubmit={(event) => {
                  if (
                    !window.confirm(
                      `Delete "${item.name}" for good? Retiring keeps the record instead.`,
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="itemId" value={item.id} />
                <Button type="submit" size="sm" variant="danger">
                  Delete
                </Button>
              </form>
              <span className="text-[12px] text-muted">
                Retiring keeps the history. Deleting does not.
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
