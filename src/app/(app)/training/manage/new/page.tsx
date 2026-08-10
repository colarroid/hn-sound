import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { MaterialForm } from "../material-form";

export const metadata: Metadata = { title: "New training material" };

export default async function NewMaterialPage() {
  await requireRole("admin");

  return (
    <div className="space-y-7">
      <header className="anim-rise">
        <Link
          href="/training/manage"
          className="text-[12px] text-muted transition-colors duration-200 hover:text-ink"
        >
          Back to manage training
        </Link>
        <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em]">
          New training material
        </h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
          Add it first, then choose who can see it on the next screen. Until you do,
          no member can see it.
        </p>
      </header>

      <div className="anim-rise d-1 max-w-2xl">
        <Card accentTop>
          <CardHeader title="Details" />
          <div className="p-5">
            <MaterialForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
