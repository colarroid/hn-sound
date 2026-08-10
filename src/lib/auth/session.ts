import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { AppRole, ProfileRow } from "@/lib/database.types";

export type CurrentMember = {
  user: User;
  profile: ProfileRow & { position: { id: string; name: string } | null };
};

/** Null when signed out or when the profile row has not appeared yet. */
export async function getCurrentMember(): Promise<CurrentMember | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, position:department_positions(id, name)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;
  return { user, profile: profile as CurrentMember["profile"] };
}

/**
 * Signed in with a confirmed email address. Says nothing about approval, so the
 * waiting screen can use it without bouncing itself in a loop.
 */
export async function requireVerifiedMember(): Promise<CurrentMember> {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  if (!member.user.email_confirmed_at) {
    redirect(`/verify-email?email=${encodeURIComponent(member.user.email ?? "")}`);
  }
  return member;
}

/**
 * The gate every signed-in page sits behind: confirmed email and an approved
 * account. Confirming an email address proves the address is real, not that the
 * department wants this person in, so both checks have to pass.
 */
export async function requireMember(): Promise<CurrentMember> {
  const member = await requireVerifiedMember();
  if (member.profile.approval_status !== "approved") redirect("/pending-approval");
  return member;
}

export async function requireRole(...roles: AppRole[]): Promise<CurrentMember> {
  const member = await requireMember();
  if (!roles.includes(member.profile.role)) redirect("/no-access");
  return member;
}

export const can = {
  /** Assign roles and positions, approve signups, and edit anything. */
  manageMembers: (role: AppRole) => role === "admin",
  approveSignups: (role: AppRole) => role === "admin",
  manageTraining: (role: AppRole) => role === "admin",
  manageInventoryCategories: (role: AppRole) => role === "admin",
  /** Post debits against the department balance. */
  postDebits: (role: AppRole) => role === "treasurer" || role === "admin",
  /** The senior pastor reads everything and writes nothing. */
  isViewOnly: (role: AppRole) => role === "senior_pastor",
};
