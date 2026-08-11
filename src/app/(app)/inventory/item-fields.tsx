"use client";

import { Field, Input, Select, Textarea } from "@/components/ui/field";

export type CategoryOption = { id: string; name: string };

type Defaults = {
  name?: string;
  label?: string | null;
  categoryId?: string | null;
  quantity?: number | string;
  serialNumber?: string | null;
  location?: string | null;
  notes?: string | null;
};

/**
 * The item fields, shared by the add page and the inline edit on a row, so the two
 * cannot drift apart.
 */
export function ItemFields({
  categories,
  errors = {},
  defaults = {},
  compact = false,
}: {
  categories: CategoryOption[];
  errors?: Record<string, string>;
  defaults?: Defaults;
  compact?: boolean;
}) {
  const height = compact ? "h-9 text-[13px]" : undefined;

  return (
    <>
      <div className={compact ? "grid gap-3 sm:grid-cols-2" : "space-y-5"}>
        <Field label="Item" htmlFor="name" error={errors.name}>
          <Input
            id="name"
            name="name"
            defaultValue={defaults.name ?? ""}
            placeholder="Shure SM58"
            invalid={Boolean(errors.name)}
            className={height}
            required
          />
        </Field>

        <Field
          label="Which one"
          htmlFor="label"
          error={errors.label}
          hint={
            compact
              ? undefined
              : "What tells this one apart from the others: Blue, Floor Tom, Stage Left."
          }
        >
          <Input
            id="label"
            name="label"
            defaultValue={defaults.label ?? ""}
            placeholder="Blue"
            maxLength={60}
            invalid={Boolean(errors.label)}
            className={height}
          />
        </Field>

        <Field label="Category" htmlFor="categoryId" error={errors.categoryId}>
          <Select
            id="categoryId"
            name="categoryId"
            defaultValue={defaults.categoryId ?? ""}
            invalid={Boolean(errors.categoryId)}
            className={height}
          >
            <option value="">Uncategorised</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Quantity"
          htmlFor="quantity"
          error={errors.quantity}
          hint={compact ? undefined : "How many of this exact item the department has."}
        >
          <Input
            id="quantity"
            name="quantity"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            defaultValue={String(defaults.quantity ?? 1)}
            invalid={Boolean(errors.quantity)}
            className={height}
          />
        </Field>

        <Field
          label="Where it lives"
          htmlFor="location"
          error={errors.location}
          hint={compact ? undefined : "Optional. Store room, stage left rack, and so on."}
        >
          <Input
            id="location"
            name="location"
            defaultValue={defaults.location ?? ""}
            placeholder="Store room shelf 2"
            invalid={Boolean(errors.location)}
            className={height}
          />
        </Field>

        <Field
          label="Serial number"
          htmlFor="serialNumber"
          error={errors.serialNumber}
          hint={compact ? undefined : "Optional. Useful for anything worth insuring."}
        >
          <Input
            id="serialNumber"
            name="serialNumber"
            defaultValue={defaults.serialNumber ?? ""}
            invalid={Boolean(errors.serialNumber)}
            className={height}
          />
        </Field>
      </div>

      <Field
        label="Notes"
        htmlFor="notes"
        error={errors.notes}
        hint="Optional. Anything the next person should know."
        className={compact ? "mt-3" : "mt-5"}
      >
        <Textarea
          id="notes"
          name="notes"
          rows={compact ? 2 : 3}
          defaultValue={defaults.notes ?? ""}
          invalid={Boolean(errors.notes)}
        />
      </Field>
    </>
  );
}
