import type { Metadata } from "next";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireMember } from "@/lib/auth/session";
import { loadInventory } from "@/lib/inventory/data";
import { toItemViews } from "@/lib/inventory/view";
import { InventoryList } from "./inventory-list";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const { user, profile } = await requireMember();
  const isAdmin = profile.role === "admin";
  // The senior pastor reads the inventory and writes nothing, same as everywhere.
  const canWrite = profile.role !== "senior_pastor";

  const { items, categories, profiles } = await loadInventory();
  const views = toItemViews({
    items,
    categories,
    profiles,
    viewerId: user.id,
    isAdmin,
  });

  const faultyCount = views.filter((item) => item.status === "faulty").length;

  return (
    <div className="space-y-7">
      <header className="anim-rise flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9.5px] font-medium uppercase tracking-[0.2em] text-accent-text">
            Department kit
          </p>
          <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em]">Inventory</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
            {canWrite
              ? "Everything the department owns, grouped by category. Anyone can add an item, and anyone can flag one as faulty."
              : "Everything the department owns, grouped by category. Read only for your role."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Link href="/inventory/categories">
              <Button variant="ghost" size="sm">
                Categories
              </Button>
            </Link>
          ) : null}
          {canWrite ? (
            <Link href="/inventory/new">
              <Button size="sm">Add an item</Button>
            </Link>
          ) : null}
        </div>
      </header>

      {faultyCount > 0 ? (
        <div className="anim-rise d-1">
          <Alert tone="error">
            {faultyCount} {faultyCount === 1 ? "item needs" : "items need"} fixing.{" "}
            <Link href="/inventory/needs-fixing" className="font-medium underline">
              See the list
            </Link>
          </Alert>
        </div>
      ) : null}

      <div className="anim-rise d-2">
        <InventoryList
          items={views}
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
          }))}
          canWrite={canWrite}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
