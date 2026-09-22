import { upcomingBirthdays, type UpcomingBirthday } from "@/lib/birthdays";
import type { ProfileRow } from "@/lib/database.types";
import type { DigestRecipient } from "@/lib/inventory/faulty-digest";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Whose birthday falls today, and the admins who should hear about it.
 *
 * "Today" comes from `upcomingBirthdays`, which resolves the date in
 * Africa/Lagos rather than UTC and marks a 29 February birthday on the 28th in
 * common years. Reused rather than reimplemented, so the email and the
 * /birthdays page can never disagree about whose day it is.
 *
 * Runs on the service role client because a cron request carries no session for
 * row level security to evaluate. Reads only, and the only thing that leaves is
 * an email to the admins selected here.
 */
export async function loadBirthdayDigest(now = new Date()) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("approval_status", "approved");

  if (error) throw new Error(`Could not read the members: ${error.message}`);

  const profiles = (data ?? []) as ProfileRow[];

  const people: UpcomingBirthday[] = upcomingBirthdays(profiles, now).filter(
    (person) => person.daysAway === 0,
  );

  const recipients: DigestRecipient[] = profiles
    .filter((profile) => profile.role === "admin" && Boolean(profile.email))
    .map((profile) => ({ email: profile.email, firstName: profile.first_name }));

  return { people, recipients };
}
