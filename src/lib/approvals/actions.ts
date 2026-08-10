"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole, requireVerifiedMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * The database is the real boundary here: the guard trigger from 0003 reverts any
 * approval change made by a non-admin. Checking the role again in the action
 * means a member never even reaches the write.
 */
export async function approveMemberAction(formData: FormData) {
  const memberId = formData.get("memberId")?.toString();
  if (!memberId) return;

  const admin = await requireRole("admin");
  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({
      approval_status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: admin.user.id,
      decline_reason: null,
    })
    .eq("id", memberId);

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
