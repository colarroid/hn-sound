import type {
  InventoryCategoryRow,
  InventoryItemRow,
  ProfileRow,
} from "@/lib/database.types";
import { fullName } from "@/lib/utils";
import type { InventoryItemView } from "@/app/(app)/inventory/item-row";

const UNCATEGORISED = "Uncategorised";

function shortDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Africa/Lagos",
  });
}

/**
 * Turns rows into what the list needs. Names are resolved from a profiles map
 * rather than an embedded select, because the department is small and one extra
 * query beats another set of hand written relationship types.
 */
export function toItemViews({
  items,
  categories,
  profiles,
  viewerId,
  isAdmin,
}: {
  items: InventoryItemRow[];
  categories: InventoryCategoryRow[];
  profiles: ProfileRow[];
  viewerId: string;
  isAdmin: boolean;
}): InventoryItemView[] {
  const categoryNames = new Map(categories.map((row) => [row.id, row.name]));
  const names = new Map(profiles.map((row) => [row.id, fullName(row) || row.email]));

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    label: item.label,
    categoryId: item.category_id,
    categoryName:
      (item.category_id ? categoryNames.get(item.category_id) : null) ?? UNCATEGORISED,
    quantity: item.quantity,
    serialNumber: item.serial_number,
    location: item.location,
    notes: item.notes,
    status: item.status,
    faultNote: item.fault_note,
    flaggedByName: item.flagged_by ? (names.get(item.flagged_by) ?? null) : null,
    flaggedAtLabel: shortDate(item.flagged_at),
    addedByName: item.added_by ? (names.get(item.added_by) ?? null) : null,
    canEditDetails: isAdmin || item.added_by === viewerId,
  }));
}
