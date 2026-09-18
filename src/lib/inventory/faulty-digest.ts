import type {
  InventoryCategoryRow,
  InventoryItemRow,
  ProfileRow,
} from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { fullName } from "@/lib/utils";

const UNCATEGORISED = "Uncategorised";

export type FaultyDigestItem = {
  name: string;
  /** Tells two otherwise identical items apart, so "Blue" matters in a list. */
  label: string | null;
  category: string;
  location: string | null;
  faultNote: string | null;
  flaggedBy: string | null;
  flaggedOn: string | null;
  /** Whole days since the flag. The nag is the age, not the count. */
  daysWaiting: number | null;
};

export type DigestRecipient = {
  email: string;
  firstName: string;
};

/**
 * Formats in Africa/Lagos rather than UTC, matching the rest of the app, so a
 * date in an email agrees with the one on the screen it came from.
 */
function lagosDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}

function daysSince(value: string, now: Date) {
  const elapsed = now.getTime() - new Date(value).getTime();
  if (Number.isNaN(elapsed) || elapsed < 0) return null;
  return Math.floor(elapsed / 86_400_000);
}

/**
 * Everything flagged faulty, oldest first, plus the admins who should hear
 * about it.
 *
 * Runs on the service role client because a cron request carries no session,
 * so there is no signed-in member for row level security to evaluate. Nothing
 * here is written and nothing leaves except to the admins selected below, which
 * is the whole reason it is safe to bypass RLS for it.
 */
export async function loadFaultyDigest() {
  const supabase = createAdminClient();

  const [itemsResult, categoriesResult, adminsResult] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("*")
      .eq("status", "faulty")
      .order("flagged_at", { ascending: true }),
    supabase.from("inventory_categories").select("*"),
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "admin")
      .eq("approval_status", "approved"),
  ]);

  const error = itemsResult.error ?? categoriesResult.error ?? adminsResult.error;
  if (error) throw new Error(`Could not read the inventory: ${error.message}`);

  const items = (itemsResult.data ?? []) as InventoryItemRow[];
  const categories = (categoriesResult.data ?? []) as InventoryCategoryRow[];
  const admins = (adminsResult.data ?? []) as ProfileRow[];

  const categoryNames = new Map(categories.map((row) => [row.id, row.name]));

  // Whoever flagged an item may since have been declined or removed, so the
  // name is resolved from a separate lookup and left null when it is gone.
  const flaggerIds = [...new Set(items.map((item) => item.flagged_by).filter(Boolean))];
  const flaggers = new Map<string, string>();

  if (flaggerIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("id", flaggerIds as string[]);

    for (const profile of (data ?? []) as ProfileRow[]) {
      flaggers.set(profile.id, fullName(profile));
    }
  }

  const now = new Date();

  const digest: FaultyDigestItem[] = items.map((item) => ({
    name: item.name,
    label: item.label,
    category: item.category_id
      ? (categoryNames.get(item.category_id) ?? UNCATEGORISED)
      : UNCATEGORISED,
    location: item.location,
    faultNote: item.fault_note,
    flaggedBy: item.flagged_by ? (flaggers.get(item.flagged_by) ?? null) : null,
    flaggedOn: item.flagged_at ? lagosDate(item.flagged_at) : null,
    daysWaiting: item.flagged_at ? daysSince(item.flagged_at, now) : null,
  }));

  const recipients: DigestRecipient[] = admins
    .filter((profile) => Boolean(profile.email))
    .map((profile) => ({ email: profile.email, firstName: profile.first_name }));

  return { items: digest, recipients };
}
