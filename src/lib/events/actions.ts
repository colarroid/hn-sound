"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null);

const dateField = z
  .string()
  .trim()
  .transform((value) => value || null)
  .refine(
    (value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value),
    "Use the date picker.",
  );

const timeField = z
  .string()
  .trim()
  .transform((value) => value || null)
  .refine(
    (value) => value === null || /^\d{2}:\d{2}$/.test(value),
    "Use the time picker.",
  );

const baseSchema = z.object({
  title: z.string().trim().min(3, "At least 3 characters.").max(120),
  description: optionalText(500),
  location: optionalText(120),
  recurrence: z.enum(["once", "weekly"]),
  startsOn: dateField,
  startsAt: timeField,
  endsAt: timeField,
  activeFrom: dateField,
  activeUntil: dateField,
});

function fieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

function readForm(formData: FormData) {
  return {
    title: formData.get("title")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    location: formData.get("location")?.toString() ?? "",
    recurrence: formData.get("recurrence") === "weekly" ? "weekly" : "once",
    startsOn: formData.get("startsOn")?.toString() ?? "",
    startsAt: formData.get("startsAt")?.toString() ?? "",
    endsAt: formData.get("endsAt")?.toString() ?? "",
    activeFrom: formData.get("activeFrom")?.toString() ?? "",
    activeUntil: formData.get("activeUntil")?.toString() ?? "",
  };
}

function readWeekdays(formData: FormData) {
  const days = formData
    .getAll("weekdays")
    .map((value) => Number(value.toString()))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
  return [...new Set(days)].sort((a, b) => a - b);
}

/**
 * Validates the two shapes an event can take. The same rules exist as check
 * constraints in 0012, so a malformed row cannot be written by any route.
 */
function shapeErrors(
  data: z.infer<typeof baseSchema>,
  weekdays: number[],
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (data.recurrence === "once" && !data.startsOn) {
    errors.startsOn = "A one-off event needs a date.";
  }
  if (data.recurrence === "weekly" && weekdays.length === 0) {
    errors.weekdays = "Pick at least one day.";
  }
  if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
    errors.endsAt = "The end time has to be after the start.";
  }
  if (data.activeFrom && data.activeUntil && data.activeUntil < data.activeFrom) {
    errors.activeUntil = "The last date has to be on or after the first.";
  }

  return errors;
}

function toRow(data: z.infer<typeof baseSchema>, weekdays: number[]) {
  const weekly = data.recurrence === "weekly";
  return {
    title: data.title,
    description: data.description,
    location: data.location,
    recurrence: data.recurrence,
    // Only the fields belonging to the chosen shape are kept, so switching a
    // weekly event to a one-off cannot leave stale weekdays behind.
    starts_on: weekly ? null : data.startsOn,
    weekdays: weekly ? weekdays : null,
    starts_at: data.startsAt,
    ends_at: data.endsAt,
    active_from: weekly ? data.activeFrom : null,
    active_until: weekly ? data.activeUntil : null,
  };
}

export async function createEventAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole("admin");

  const raw = readForm(formData);
  const weekdays = readWeekdays(formData);
  const parsed = baseSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), values: raw };
  }

  const errors = shapeErrors(parsed.data, weekdays);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, values: raw };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .insert({ ...toRow(parsed.data, weekdays), created_by: admin.user.id });

  if (error) return { ok: false, message: error.message, values: raw };

  revalidatePath("/events");
  revalidatePath("/", "layout");
  redirect("/events");
}

export async function updateEventAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");

  const id = formData.get("eventId")?.toString();
  if (!id) return { ok: false, message: "Which event?" };

  const raw = readForm(formData);
  const weekdays = readWeekdays(formData);
  const parsed = baseSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), values: raw };
  }

  const errors = shapeErrors(parsed.data, weekdays);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, values: raw };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update(toRow(parsed.data, weekdays))
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}

export async function deleteEventAction(formData: FormData) {
  await requireRole("admin");

  const id = formData.get("eventId")?.toString();
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id);

  revalidatePath("/events");
  revalidatePath("/", "layout");
  redirect("/events");
}
