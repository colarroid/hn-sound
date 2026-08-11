import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, EmptyState } from "@/components/ui/card";
import { RowScroller } from "@/components/ui/row-scroller";
import { requireMember } from "@/lib/auth/session";
import { loadInventory } from "@/lib/inventory/data";
import { toItemViews } from "@/lib/inventory/view";
import { ItemRow } from "../item-row";

export const metadata: Metadata = { title: "Needs fixing" };

export default async function NeedsFixingPage() {
  const { user, profile } = await requireMember();
  const isAdmin = profile.role === "admin";
  const canWrite = profile.role !== "senior_pastor";

  const { items, categories, profiles } = await loadInventory(["faulty"]);
  const views = toItemViews({
    items,
    categories,
    profiles,
    viewerId: user.id,
    isAdmin,
  });

  return (
    <div className="space-y-7">
      <header className="anim-rise flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9.5px] font-medium uppercase tracking-[0.2em] text-danger">
            Faults
          </p>
          <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em]">
            Needs fixing
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
            Everything flagged as faulty, with what was reported and who reported it.
            {canWrite
              ? " Clear an item once it genuinely works again."
              : " Read only for your role."}
          </p>
        </div>

        <Link href="/inventory">
          <Button variant="secondary" size="sm">
            Full inventory
          </Button>
        </Link>
      </header>

      <div className="anim-rise d-1">
        <Card accentTop={views.length > 0}>
          <CardHeader
            title="Flagged"
            description={
              views.length === 0
                ? undefined
                : `${views.length} ${views.length === 1 ? "item" : "items"} waiting on a repair.`
            }
          />
          {views.length === 0 ? (
            <EmptyState
              title="Nothing is broken"
              description="Anything a member flags as faulty lands here, along with a note on what went wrong."
            />
          ) : (
            <RowScroller minWidth="min-w-[40rem]">
              {views.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  canWrite={canWrite}
                  isAdmin={isAdmin}
                  showCategory
                  categories={categories.map((category) => ({
                    id: category.id,
                    name: category.name,
                  }))}
                />
              ))}
            </RowScroller>
          )}
        </Card>
      </div>
    </div>
  );
}
