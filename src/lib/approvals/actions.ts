"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole, requireVerifiedMember } from "@/lib/auth/session";
import { POSITION_MAX_LENGTH } from "@/lib/positions";
import { createClient } from "@/lib/supabase/server";

const approveSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(["admin", "senior_pastor", "treasurer", "member"]),
  // Free text. Blank is allowed: the admin may not know the title yet, and the
  // dashboard nudges the member that it is unset.
  position: z
    .string()
    .trim()
    .max(POSITION_MAX_LENGTH)
    .transform((value) => value || null),
});

function readForm(formData: FormData) {
  return {
    memberId: formData.get("memberId")?.toString() ?? "",
    role: formData.get("role")?.toString() ?? "member",
    position: formData.get("position")?.toString() ?? "",
  };
}

/**
 * Approving is also when the admin assigns the role and the department position,
 * so the three happen in one write rather than leaving a new member sitting
 * inside with no role decision made.
 *
 * The database is the real boundary: the guard trigger from 0004 reverts any
 * change a non-admin makes to role, position, or the approval columns. Checking
 * the role here means a member never reaches the write at all.
 */
export async function approveMemberAction(formData: FormData) {
  const parsed = approveSchema.safeParse(readForm(formData));
  if (!parsed.success) return;

  const admin = await requireRole("admin");
  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({
      approval_status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: admin.user.id,
      decline_reason: null,
      role: parsed.data.role,
      position: parsed.data.position,
    })
    .eq("id", parsed.data.memberId);

  revalidatePath("/approvals");
  revalidatePath("/", "layout");
}

export async function declineMemberAction(formData: FormData) {
  const memberId = formData.get("memberId")?.toString();
  if (!memberId) return;

  const reason = formData.get("reason")?.toString().trim();
  const admin = await requireRole("admin");
  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({
      approval_status: "declined",
      approved_at: null,
      approved_by: admin.user.id,
      decline_reason: reason || null,
    })
    .eq("id", memberId);

  revalidatePath("/approvals");
  revalidatePath("/", "layout");
}

/**
 * The waiting screen's own refresh. Re-reads the profile and sends the member
 * wherever they now belong, so an approval that landed a minute ago is picked up
 * without them having to guess at reloading.
 */
export async function checkApprovalAction() {
  const member = await requireVerifiedMember();
  revalidatePath("/", "layout");

  if (member.profile.approval_status === "approved") redirect("/dashboard");
  redirect("/pending-approval");
}
