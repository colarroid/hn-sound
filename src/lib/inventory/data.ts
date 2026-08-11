import type {
  InventoryCategoryRow,
  InventoryItemRow,
  InventoryStatus,
  ProfileRow,
} from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

/**
 * Items, categories, and the names needed to say who flagged what. Row level
 * security handles who is allowed to see any of it; this only shapes the request.
 */
export async function loadInventory(statuses?: InventoryStatus[]) {
  const supabase = await createClient();

  const base = supabase.from("inventory_items").select("*");
  const itemsQuery = statuses ? base.in("status", statuses) : base;

  const [itemsResult, categoriesResult, profilesResult] = await Promise.all([
    itemsQuery.order("name", { ascending: true }),
    supabase
      .from("inventory_categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase.from("profiles").select("*").eq("approval_status", "approved"),
  ]);

  return {
    items: (itemsResult.data ?? []) as InventoryItemRow[],
    categories: (categoriesResult.data ?? []) as InventoryCategoryRow[],
    profiles: (profilesResult.data ?? []) as ProfileRow[],
  };
}
