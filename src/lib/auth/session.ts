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
 * The gate every signed-in page sits behind. Middleware already redirects the
 * signed-out and the unverified, so this is the second line rather than the
 * first, and it is what gives pages a typed profile to work with.
 */
export async function requireMember(): Promise<CurrentMember> {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  if (!member.user.email_confirmed_at) {
    redirect(`/verify-email?email=${encodeURIComponent(member.user.email ?? "")}`);
  }
  return member;
}

export async function requireRole(...roles: AppRole[]): Promise<CurrentMember> {
  const member = await requireMember();
  if (!roles.includes(member.profile.role)) redirect("/no-access");
  return member;
}

export const can = {
  /** Assign roles and positions, and edit anything on the platform. */
  manageMembers: (role: AppRole) => role === "admin",
  manageTraining: (role: AppRole) => role === "admin",
  manageInventoryCategories: (role: AppRole) => role === "admin",
  /** Post debits against the department balance. */
  postDebits: (role: AppRole) => role === "treasurer" || role === "admin",
  /** The senior pastor reads everything and writes nothing. */
  isViewOnly: (role: AppRole) => role === "senior_pastor",
};
