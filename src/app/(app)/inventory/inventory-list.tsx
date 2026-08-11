"use client";

import { useMemo, useState } from "react";

import { Card, CardHeader, EmptyState } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { RowScroller } from "@/components/ui/row-scroller";
import type { CategoryOption } from "./item-fields";
import { ItemRow, type InventoryItemView } from "./item-row";

const UNCATEGORISED = "Uncategorised";

export function InventoryList({
  items,
  categories,
  canWrite,
  isAdmin,
}: {
  items: InventoryItemView[];
  categories: CategoryOption[];
  canWrite: boolean;
  isAdmin: boolean;
}) {
  const [query, setQuery] = useState("");
  const [showRetired, setShowRetired] = useState(false);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (!showRetired && item.status === "retired") return false;
      if (!needle) return true;
      return [
        item.name,
        item.label ?? "",
        item.categoryName,
        item.location ?? "",
        item.serialNumber ?? "",
        item.notes ?? "",
        item.faultNote ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [items, query, showRetired]);

  /** Category order comes from the admin's sort order, Uncategorised last. */
  const groups = useMemo(() => {
    const order = [...categories.map((category) => category.name), UNCATEGORISED];
    const buckets = new Map<string, InventoryItemView[]>();

    for (const item of visible) {
      const key = item.categoryName || UNCATEGORISED;
      const bucket = buckets.get(key);
      if (bucket) bucket.push(item);
      else buckets.set(key, [item]);
    }

    return order
      .filter((name) => buckets.has(name))
      .map((name) => ({ name, items: buckets.get(name)! }));
  }, [visible, categories]);

  const retiredCount = items.filter((item) => item.status === "retired").length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Inventory"
          description={`${visible.length} of ${items.length} ${items.length === 1 ? "item" : "items"} shown.`}
          action={
            <div className="w-full max-w-56">
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, Blue, place, serial"
                aria-label="Search inventory"
                className="h-9 text-[13px]"
              />
            </div>
          }
        />

        {retiredCount > 0 ? (
          <div className="border-b border-line px-5 py-3">
            <label className="inline-flex cursor-pointer items-center gap-2.5 text-[12.5px] text-muted transition-colors hover:text-ink">
              <input
                type="checkbox"
                checked={showRetired}
                onChange={(event) => setShowRetired(event.target.checked)}
                className={
                  showRetired
                    ? "size-4 shrink-0 appearance-none border border-accent bg-accent transition-colors duration-200"
                    : "size-4 shrink-0 appearance-none border border-line-strong bg-surface-2 transition-colors duration-200"
                }
              />
              Include {retiredCount} retired {retiredCount === 1 ? "item" : "items"}
            </label>
          </div>
        ) : null}

        {groups.length === 0 ? (
          <EmptyState
            title={query ? "Nothing matches that" : "The inventory is empty"}
            description={
              query
                ? "Try a different name, place, or serial number."
                : "Add the first item and it will appear here, grouped by category."
            }
          />
        ) : null}
      </Card>

      {groups.map((group) => (
        <Card key={group.name}>
          <CardHeader
            title={group.name}
            description={`${group.items.length} ${group.items.length === 1 ? "item" : "items"}`}
          />
          <RowScroller minWidth="min-w-[40rem]">
            {group.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                canWrite={canWrite}
                isAdmin={isAdmin}
                categories={categories}
              />
            ))}
          </RowScroller>
        </Card>
      ))}
    </div>
  );
}
