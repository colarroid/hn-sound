import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardHeader } from "@/components/ui/card";
import { requireMember } from "@/lib/auth/session";
import { loadInventory } from "@/lib/inventory/data";
import { AddItemForm } from "./add-item-form";

export const metadata: Metadata = { title: "Add an inventory item" };

export default async function NewInventoryItemPage() {
  const { profile } = await requireMember();
  if (profile.role === "senior_pastor") redirect("/no-access");

  const { categories } = await loadInventory();

  return (
    <div className="space-y-7">
      <header className="anim-rise">
        <Link
          href="/inventory"
          className="text-[12px] text-muted transition-colors duration-200 hover:text-ink"
        >
          Back to inventory
        </Link>
        <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em]">Add an item</h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
          Any member can add to the inventory. If the right category does not exist
          yet, leave it as Uncategorised and an admin can file it later.
        </p>
      </header>

      <div className="anim-rise d-1 max-w-2xl">
        <Card accentTop>
          <CardHeader title="Item details" />
          <div className="p-5">
            <AddItemForm
              categories={categories.map((category) => ({
                id: category.id,
                name: category.name,
              }))}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
