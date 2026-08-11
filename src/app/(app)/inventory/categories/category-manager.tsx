"use client";

import { useActionState, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { emptyFormState } from "@/lib/form-state";
import {
  addCategoryAction,
  deleteCategoryAction,
  renameCategoryAction,
} from "@/lib/inventory/actions";

export type CategoryRowView = {
  id: string;
  name: string;
  sortOrder: number;
  itemCount: number;
};

export function AddCategoryForm() {
  const [state, action] = useActionState(addCategoryAction, emptyFormState);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message ? (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <Field label="Category name" htmlFor="name" error={state.errors?.name}>
          <Input
            id="name"
            name="name"
            placeholder="In-ear Monitors"
            invalid={Boolean(state.errors?.name)}
            required
          />
        </Field>
        <Field
          label="Order"
          htmlFor="sortOrder"
          error={state.errors?.sortOrder}
          hint="Lower first."
        >
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            inputMode="numeric"
            min={0}
            step={10}
            placeholder="100"
            invalid={Boolean(state.errors?.sortOrder)}
          />
        </Field>
      </div>

      <SubmitButton
        label="Add category"
        pendingLabel="Adding"
        className="w-full sm:w-auto sm:px-6"
      />
    </form>
  );
}

export function CategoryRow({ category }: { category: CategoryRowView }) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState(renameCategoryAction, emptyFormState);

  return (
    <li className="px-5 py-4 transition-colors duration-200 hover:bg-surface-2/40">
      {state.message ? (
        <div className="mb-3">
          <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
        </div>
      ) : null}

      {editing ? (
        <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input type="hidden" name="categoryId" value={category.id} />
          <div className="min-w-0 flex-1 space-y-1.5">
            <label
              htmlFor={`name-${category.id}`}
              className="block text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted"
            >
              Name
            </label>
            <Input
              id={`name-${category.id}`}
              name="name"
              defaultValue={category.name}
              className="h-9 text-[13px]"
              invalid={Boolean(state.errors?.name)}
            />
          </div>
          <div className="space-y-1.5 sm:w-24">
            <label
              htmlFor={`order-${category.id}`}
              className="block text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted"
            >
              Order
            </label>
            <Input
              id={`order-${category.id}`}
              name="sortOrder"
              type="number"
              min={0}
              step={10}
              defaultValue={String(category.sortOrder)}
              className="h-9 text-[13px]"
              invalid={Boolean(state.errors?.sortOrder)}
            />
          </div>
          <div className="flex items-center gap-2">
            <SubmitButton label="Save" pendingLabel="Saving" size="sm" className="sm:px-5" />
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{category.name}</p>
            <p className="mt-0.5 text-[12px] text-muted">
              Order {category.sortOrder} ·{" "}
              {category.itemCount === 0
                ? "no items"
                : `${category.itemCount} ${category.itemCount === 1 ? "item" : "items"}`}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setEditing(true)}
            >
              Rename
            </Button>
            <form
              action={deleteCategoryAction}
              onSubmit={(event) => {
                const message =
                  category.itemCount === 0
                    ? `Delete "${category.name}"?`
                    : `Delete "${category.name}"? Its ${category.itemCount} item(s) stay in the inventory and become Uncategorised.`;
                if (!window.confirm(message)) event.preventDefault();
              }}
            >
              <input type="hidden" name="categoryId" value={category.id} />
              <Button type="submit" size="sm" variant="danger">
                Delete
              </Button>
            </form>
          </div>
        </div>
      )}
    </li>
  );
}
