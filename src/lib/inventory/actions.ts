"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireMember, requireRole } from "@/lib/auth/session";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

/** The senior pastor reads the inventory and writes nothing. */
async function requireInventoryWriter() {
  const member = await requireMember();
  if (member.profile.role === "senior_pastor") redirect("/no-access");
  return member;
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null);

const itemSchema = z.object({
  name: z.string().trim().min(2, "At least 2 characters.").max(120),
  categoryId: z
    .string()
    .trim()
    .transform((value) => value || null)
    .refine(
      (value) => value === null || z.string().uuid().safeParse(value).success,
      "Pick a category from the list.",
    ),
  quantity: z
    .string()
    .trim()
    .transform((value) => (value === "" ? 1 : Number(value)))
    .refine(
      (value) => Number.isInteger(value) && value >= 0 && value <= 100000,
      "Use a whole number, 0 or more.",
    ),
  serialNumber: optionalText(80),
  location: optionalText(120),
  notes: optionalText(500),
});

function readItem(formData: FormData) {
  return {
    name: formData.get("name")?.toString() ?? "",
    categoryId: formData.get("categoryId")?.toString() ?? "",
    quantity: formData.get("quantity")?.toString() ?? "",
    serialNumber: formData.get("serialNumber")?.toString() ?? "",
    location: formData.get("location")?.toString() ?? "",
    notes: formData.get("notes")?.toString() ?? "",
  };
}

function fieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export async function addItemAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireInventoryWriter();
  const raw = readItem(formData);
  const parsed = itemSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), values: raw };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("inventory_items").insert({
    name: parsed.data.name,
    category_id: parsed.data.categoryId,
    quantity: parsed.data.quantity,
    serial_number: parsed.data.serialNumber,
    location: parsed.data.location,
    notes: parsed.data.notes,
    added_by: member.user.id,
  });

  if (error) return { ok: false, message: error.message, values: raw };

  revalidatePath("/inventory");
  revalidatePath("/", "layout");
  redirect("/inventory");
}

/**
 * The database is the real boundary: guard_inventory_edits reverts detail changes
 * made by anybody who is neither an admin nor the person who added the item.
 */
export async function updateItemAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireInventoryWriter();

  const id = formData.get("itemId")?.toString();
  if (!id) return { ok: false, message: "Which item?" };

  const raw = readItem(formData);
  const parsed = itemSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory_items")
    .update({
      name: parsed.data.name,
      category_id: parsed.data.categoryId,
      quantity: parsed.data.quantity,
      serial_number: parsed.data.serialNumber,
      location: parsed.data.location,
      notes: parsed.data.notes,
    })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/inventory");
  return { ok: true, message: "Saved." };
}

export async function flagFaultyAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireInventoryWriter();

  const id = formData.get("itemId")?.toString();
  if (!id) return { ok: false, message: "Which item?" };

  const note = formData.get("faultNote")?.toString().trim();
  if (!note) {
    return { ok: false, errors: { faultNote: "Say what is wrong with it." } };
  }
  if (note.length > 500) {
    return { ok: false, errors: { faultNote: "Keep it under 500 characters." } };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory_items")
    .update({
      status: "faulty",
      fault_note: note,
      flagged_by: member.user.id,
      flagged_at: new Date().toISOString(),
      resolved_by: null,
      resolved_at: null,
    })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/inventory");
  revalidatePath("/inventory/needs-fixing");
  revalidatePath("/", "layout");
  return { ok: true, message: "Flagged. It is on the needs-fixing list." };
}

/** Whoever fixed it clears it, which is rarely the admin. */
export async function markFixedAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireInventoryWriter();

  const id = formData.get("itemId")?.toString();
  if (!id) return { ok: false, message: "Which item?" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory_items")
    .update({
      status: "ok",
      resolved_by: member.user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/inventory");
  revalidatePath("/inventory/needs-fixing");
  revalidatePath("/", "layout");
  return { ok: true, message: "Marked as working again." };
}

/**
 * Obsolescence is a judgement about replacing kit rather than repairing it, so it
 * is the admin's call. The guard trigger enforces the same rule in the database.
 */
export async function markObsoleteAction(formData: FormData) {
  await requireRole("admin");

  const id = formData.get("itemId")?.toString();
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("inventory_items")
    .update({ status: "obsolete", fault_note: null, flagged_by: null, flagged_at: null })
    .eq("id", id);

  revalidatePath("/inventory");
  revalidatePath("/inventory/needs-fixing");
  revalidatePath("/", "layout");
}

/** Brings an obsolete or retired item back into normal service. */
export async function markCurrentAction(formData: FormData) {
  await requireRole("admin");

  const id = formData.get("itemId")?.toString();
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("inventory_items").update({ status: "ok" }).eq("id", id);

  revalidatePath("/inventory");
  revalidatePath("/inventory/needs-fixing");
  revalidatePath("/", "layout");
}

export async function retireItemAction(formData: FormData) {
  await requireRole("admin");

  const id = formData.get("itemId")?.toString();
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("inventory_items").update({ status: "retired" }).eq("id", id);

  revalidatePath("/inventory");
  revalidatePath("/inventory/needs-fixing");
  revalidatePath("/", "layout");
}

export async function deleteItemAction(formData: FormData) {
  await requireRole("admin");

  const id = formData.get("itemId")?.toString();
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("inventory_items").delete().eq("id", id);

  revalidatePath("/inventory");
  revalidatePath("/inventory/needs-fixing");
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Categories, admin only
// ---------------------------------------------------------------------------

const categorySchema = z.object({
  name: z.string().trim().min(2, "At least 2 characters.").max(60),
  sortOrder: z
    .string()
    .trim()
    .transform((value) => (value === "" ? 100 : Number(value)))
    .refine(
      (value) => Number.isInteger(value) && value >= 0 && value <= 9999,
      "Use a whole number.",
    ),
});

export async function addCategoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");

  const parsed = categorySchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    sortOrder: formData.get("sortOrder")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory_categories")
    .insert({ name: parsed.data.name, sort_order: parsed.data.sortOrder });

  if (error) {
    return {
      ok: false,
      message: error.code === "23505" ? "That category already exists." : error.message,
    };
  }

  revalidatePath("/inventory");
  revalidatePath("/inventory/categories");
  return { ok: true, message: `Added ${parsed.data.name}.` };
}

export async function renameCategoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");

  const id = formData.get("categoryId")?.toString();
  if (!id) return { ok: false, message: "Which category?" };

  const parsed = categorySchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    sortOrder: formData.get("sortOrder")?.toString() ?? "",
  });

  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory_categories")
    .update({ name: parsed.data.name, sort_order: parsed.data.sortOrder })
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      message: error.code === "23505" ? "Another category has that name." : error.message,
    };
  }

  revalidatePath("/inventory");
  revalidatePath("/inventory/categories");
  return { ok: true, message: "Saved." };
}

/**
 * Items are not deleted with the category. The foreign key is ON DELETE SET NULL,
 * so they fall back to Uncategorised and can be refiled.
 */
export async function deleteCategoryAction(formData: FormData) {
  await requireRole("admin");

  const id = formData.get("categoryId")?.toString();
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("inventory_categories").delete().eq("id", id);

  revalidatePath("/inventory");
  revalidatePath("/inventory/categories");
}
