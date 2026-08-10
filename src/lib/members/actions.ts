"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import type { FormState } from "@/lib/form-state";
import { POSITION_MAX_LENGTH } from "@/lib/positions";
import { createClient } from "@/lib/supabase/server";

const memberSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(["admin", "senior_pastor", "treasurer", "member"]),
  position: z
    .string()
    .trim()
    .max(POSITION_MAX_LENGTH)
    .transform((value) => value || null),
});

/**
 * How many admins would remain if this member stopped being one. Used to stop the
 * last admin from demoting or revoking themselves and leaving the department with
 * nobody who can administer anything.
 */
async function otherAdminCount(excludingId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("approval_status", "approved")
    .neq("id", excludingId);

  return count ?? 0;
}

export async function updateMemberAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole("admin");

  const parsed = memberSchema.safeParse({
    memberId: formData.get("memberId")?.toString() ?? "",
    role: formData.get("role")?.toString() ?? "member",
    position: formData.get("position")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { ok: false, message: "That change did not look right. Try again." };
  }

  const { memberId, role, position } = parsed.data;

  // Losing the last admin would leave nobody able to approve members, manage
  // training, or hand the role back.
  if (memberId === admin.user.id && role !== "admin") {
    const remaining = await otherAdminCount(memberId);
    if (remaining === 0) {
      return {
        ok: false,
        message:
          "You are the only admin. Make somebody else an admin first, then change your own role.",
      };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role, position })
    .eq("id", memberId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/members");
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}

/**
 * Revoking sends an approved member back to the declined state, so they keep
 * their account and their history but see the declined screen instead of the app.
 * Reversible from the approvals queue.
 */
export async function revokeMemberAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole("admin");

  const memberId = formData.get("memberId")?.toString();
  if (!memberId) return { ok: false, message: "Which member?" };

  if (memberId === admin.user.id) {
    return { ok: false, message: "You cannot revoke your own access." };
  }

  const reason = formData.get("reason")?.toString().trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      approval_status: "declined",
      approved_at: null,
      approved_by: admin.user.id,
      decline_reason: reason || "Access to the platform was withdrawn.",
    })
    .eq("id", memberId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/members");
  revalidatePath("/approvals");
  revalidatePath("/", "layout");
  return { ok: true, message: "Access revoked. They now see the declined screen." };
}
