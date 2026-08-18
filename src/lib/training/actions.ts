"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { sendEmail, summariseDelivery } from "@/lib/email/send";
import { trainingAssignedEmail } from "@/lib/email/training-assigned";
import { type FormState } from "@/lib/form-state";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_MIME_TYPES, MAX_FILE_BYTES } from "./constants";

const BUCKET = "training";

const titleSchema = z.string().trim().min(3, "At least 3 characters.").max(120);
const summarySchema = z
  .string()
  .trim()
  .max(500, "Keep it under 500 characters.")
  .transform((value) => value || null);

/** Blank means "no particular week", which is valid for reference material. */
const lessonNumberSchema = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : Number(value)))
  .refine(
    (value) => value === null || (Number.isInteger(value) && value >= 1 && value <= 999),
    "Use a whole number between 1 and 999, or leave it blank.",
  );

const expectationsSchema = z
  .string()
  .trim()
  .max(1000, "Keep it under 1000 characters.")
  .transform((value) => value || null);

const urlSchema = z
  .string()
  .trim()
  .min(1, "A link is required.")
  .refine((value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a full link starting with http:// or https://");

function readFile(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return null;
  return file;
}

function fileProblem(file: File) {
  if (file.size > MAX_FILE_BYTES) {
    return "That file is over 10MB. Host it elsewhere and add it as a link instead.";
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return "That file type is not accepted. Use a PDF, image, Office document, or plain text.";
  }
  return null;
}

/** Objects live under a random folder so two files of the same name cannot clash. */
async function uploadFile(file: File) {
  const admin = createAdminClient();
  const path = `${crypto.randomUUID()}/${file.name}`;

  const { error } = await admin.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { error: error.message, path: null };

  return { error: null, path };
}

async function removeFile(path: string | null) {
  if (!path) return;
  const admin = createAdminClient();
  await admin.storage.from(BUCKET).remove([path]);
}

export async function createMaterialAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole("admin");

  const kind = formData.get("kind") === "file" ? "file" : "link";
  const title = titleSchema.safeParse(formData.get("title"));
  const summary = summarySchema.safeParse(formData.get("summary") ?? "");
  const lessonNumber = lessonNumberSchema.safeParse(formData.get("lessonNumber") ?? "");
  const expectations = expectationsSchema.safeParse(formData.get("expectations") ?? "");

  const values = {
    title: formData.get("title")?.toString() ?? "",
    summary: formData.get("summary")?.toString() ?? "",
    lessonNumber: formData.get("lessonNumber")?.toString() ?? "",
    expectations: formData.get("expectations")?.toString() ?? "",
    url: formData.get("url")?.toString() ?? "",
    kind,
  };

  const errors: Record<string, string> = {};
  if (!title.success) errors.title = title.error.issues[0].message;
  if (!summary.success) errors.summary = summary.error.issues[0].message;
  if (!lessonNumber.success) errors.lessonNumber = lessonNumber.error.issues[0].message;
  if (!expectations.success) errors.expectations = expectations.error.issues[0].message;

  let url: string | null = null;
  let filePath: string | null = null;
  let fileName: string | null = null;
  let fileSize: number | null = null;
  let mimeType: string | null = null;

  if (kind === "link") {
    const parsed = urlSchema.safeParse(formData.get("url"));
    if (!parsed.success) errors.url = parsed.error.issues[0].message;
    else url = parsed.data;
  } else {
    const file = readFile(formData);
    if (!file) {
      errors.file = "Choose a file to upload.";
    } else {
      const problem = fileProblem(file);
      if (problem) {
        errors.file = problem;
      } else {
        const uploaded = await uploadFile(file);
        if (uploaded.error || !uploaded.path) {
          errors.file = uploaded.error ?? "That upload failed.";
        } else {
          filePath = uploaded.path;
          fileName = file.name;
          fileSize = file.size;
          mimeType = file.type;
        }
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    // A file that made it into storage before a later field failed would be
    // orphaned, so clean it up rather than leaving it paid for and unreachable.
    await removeFile(filePath);
    return { ok: false, errors, values };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("training_materials").insert({
    title: title.data!,
    summary: summary.data!,
    lesson_number: lessonNumber.data!,
    expectations: expectations.data!,
    kind,
    url,
    file_path: filePath,
    file_name: fileName,
    file_size: fileSize,
    mime_type: mimeType,
    created_by: admin.user.id,
  });

  if (error) {
    await removeFile(filePath);
    return { ok: false, message: error.message, values };
  }

  revalidatePath("/training");
  revalidatePath("/training/manage");
  redirect("/training/manage");
}

export async function updateMaterialAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");

  const id = formData.get("materialId")?.toString();
  if (!id) return { ok: false, message: "Which material?" };

  const title = titleSchema.safeParse(formData.get("title"));
  const summary = summarySchema.safeParse(formData.get("summary") ?? "");
  const lessonNumber = lessonNumberSchema.safeParse(formData.get("lessonNumber") ?? "");
  const expectations = expectationsSchema.safeParse(formData.get("expectations") ?? "");

  const errors: Record<string, string> = {};
  if (!title.success) errors.title = title.error.issues[0].message;
  if (!summary.success) errors.summary = summary.error.issues[0].message;
  if (!lessonNumber.success) errors.lessonNumber = lessonNumber.error.issues[0].message;
  if (!expectations.success) errors.expectations = expectations.error.issues[0].message;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("training_materials")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return { ok: false, message: "That material no longer exists." };

  const patch: Record<string, unknown> = {};

  if (existing.kind === "link") {
    const parsed = urlSchema.safeParse(formData.get("url"));
    if (!parsed.success) errors.url = parsed.error.issues[0].message;
    else patch.url = parsed.data;
  }

  // Replacing the file is optional on edit. Leaving it empty keeps the old one.
  let replacementPath: string | null = null;
  const file = readFile(formData);
  if (existing.kind === "file" && file) {
    const problem = fileProblem(file);
    if (problem) {
      errors.file = problem;
    } else {
      const uploaded = await uploadFile(file);
      if (uploaded.error || !uploaded.path) {
        errors.file = uploaded.error ?? "That upload failed.";
      } else {
        replacementPath = uploaded.path;
        patch.file_path = uploaded.path;
        patch.file_name = file.name;
        patch.file_size = file.size;
        patch.mime_type = file.type;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    await removeFile(replacementPath);
    return { ok: false, errors };
  }

  const { error } = await supabase
    .from("training_materials")
    .update({
      ...patch,
      title: title.data!,
      summary: summary.data!,
      lesson_number: lessonNumber.data!,
      expectations: expectations.data!,
    })
    .eq("id", id);

  if (error) {
    await removeFile(replacementPath);
    return { ok: false, message: error.message };
  }

  // Only bin the old object once the row points at the new one.
  if (replacementPath) await removeFile(existing.file_path);

  revalidatePath("/training");
  revalidatePath("/training/manage");
  revalidatePath(`/training/manage/${id}`);
  return { ok: true, message: "Saved." };
}

export async function deleteMaterialAction(formData: FormData) {
  await requireRole("admin");

  const id = formData.get("materialId")?.toString();
  if (!id) return;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("training_materials")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("training_materials").delete().eq("id", id);
  if (error) return;

  // Eligibility rows go with the row by cascade; the object does not.
  await removeFile(existing?.file_path ?? null);

  revalidatePath("/training");
  revalidatePath("/training/manage");
  redirect("/training/manage");
}

/**
 * Replaces the whole eligibility set for one material in a single submit, rather
 * than firing a write per checkbox.
 */
/**
 * Emails each member who has just been given a material. Returns the one line the
 * admin sees about delivery, or null when there was nobody to tell.
 */
async function notifyNewlyEligible(materialId: string, profileIds: string[]) {
  if (profileIds.length === 0) return null;

  const supabase = await createClient();
  const [{ data: material }, { data: people }] = await Promise.all([
    supabase
      .from("training_materials")
      .select("title, lesson_number, summary, expectations")
      .eq("id", materialId)
      .maybeSingle(),
    supabase.from("profiles").select("first_name, email").in("id", profileIds),
  ]);

  if (!material || !people?.length) return null;

  const results = await Promise.all(
    people.map((person) => {
      const { subject, html } = trainingAssignedEmail({
        firstName: person.first_name || "there",
        material: {
          title: material.title,
          lessonNumber: material.lesson_number,
          summary: material.summary,
          expectations: material.expectations,
        },
      });
      return sendEmail({ to: person.email, subject, html });
    }),
  );

  return summariseDelivery(results);
}

export async function setEligibilityAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole("admin");

  const materialId = formData.get("materialId")?.toString();
  if (!materialId) return { ok: false, message: "Which material?" };

  const wanted = new Set(
    formData
      .getAll("profileId")
      .map((value) => value.toString())
      .filter(Boolean),
  );

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("training_eligibility")
    .select("profile_id")
    .eq("material_id", materialId);

  const existing = new Set((current ?? []).map((row) => row.profile_id));

  const toAdd = [...wanted].filter((id) => !existing.has(id));
  const toRemove = [...existing].filter((id) => !wanted.has(id));

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("training_eligibility")
      .delete()
      .eq("material_id", materialId)
      .in("profile_id", toRemove);
    if (error) return { ok: false, message: error.message };
  }

  if (toAdd.length > 0) {
    const { error } = await supabase.from("training_eligibility").insert(
      toAdd.map((profileId) => ({
        material_id: materialId,
        profile_id: profileId,
        granted_by: admin.user.id,
      })),
    );
    if (error) return { ok: false, message: error.message };
  }

  // Notify only the people just added, and only after the grant is committed. A
  // failed email must not undo access that has already been given, so delivery is
  // reported separately rather than treated as an error.
  const delivery = await notifyNewlyEligible(materialId, toAdd);

  revalidatePath("/training");
  revalidatePath(`/training/manage/${materialId}`);

  const added = toAdd.length;
  const removed = toRemove.length;
  if (added === 0 && removed === 0) return { ok: true, message: "No changes." };

  const parts = [
    added ? `${added} added` : null,
    removed ? `${removed} removed` : null,
  ].filter(Boolean);

  return {
    ok: true,
    message: [`Eligibility saved. ${parts.join(", ")}.`, delivery].filter(Boolean).join(" "),
  };
}
