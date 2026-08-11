import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardHeader, EmptyState } from "@/components/ui/card";
import { RowScroller } from "@/components/ui/row-scroller";
import { requireRole } from "@/lib/auth/session";
import { loadInventory } from "@/lib/inventory/data";
import {
  AddCategoryForm,
  CategoryRow,
  type CategoryRowView,
} from "./category-manager";

export const metadata: Metadata = { title: "Inventory categories" };

export default async function InventoryCategoriesPage() {
  await requireRole("admin");

  const { items, categories } = await loadInventory();

  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item.category_id) continue;
    counts.set(item.category_id, (counts.get(item.category_id) ?? 0) + 1);
  }

  const rows: CategoryRowView[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    sortOrder: category.sort_order,
    itemCount: counts.get(category.id) ?? 0,
  }));

  const uncategorised = items.filter((item) => !item.category_id).length;

  return (
    <div className="space-y-7">
      <header className="anim-rise">
        <Link
          href="/inventory"
          className="text-[12px] text-muted transition-colors duration-200 hover:text-ink"
        >
          Back to inventory
        </Link>
        <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em]">
          Inventory categories
        </h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
          Categories control how the inventory is grouped. Members pick from this
          list when adding an item.
          {uncategorised > 0
            ? ` ${uncategorised} ${uncategorised === 1 ? "item is" : "items are"} currently uncategorised.`
            : ""}
        </p>
      </header>

      <div className="anim-rise d-1 grid gap-6 lg:grid-cols-2">
        <Card accentTop>
          <CardHeader title="Add a category" />
          <div className="p-5">
            <AddCategoryForm />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Existing"
            description="Deleting a category never deletes its items. They become Uncategorised."
          />
          {rows.length === 0 ? (
            <EmptyState
              title="No categories"
              description="Add the first one and members will be able to file items under it."
            />
          ) : (
            <RowScroller minWidth="min-w-[34rem]">
              {rows.map((category) => (
                <CategoryRow key={category.id} category={category} />
              ))}
            </RowScroller>
          )}
        </Card>
      </div>
    </div>
  );
}
