import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Access denied" };

export default function NoAccessPage() {
  return (
    <Card accentTop className="anim-rise max-w-xl p-7 sm:p-9">
      <div className="flex size-11 items-center justify-center border border-danger/30 bg-danger-soft text-danger">
        <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
          <path
            d="M6 11V8a6 6 0 0 1 12 0v3M5 11h14v9H5v-9Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <p className="mt-6 text-[9.5px] font-medium uppercase tracking-[0.2em] text-danger">
        Restricted
      </p>
      <h1 className="mt-3.5 text-[22px] font-semibold tracking-[-0.015em]">Access denied</h1>
      <p className="mt-2.5 max-w-md text-[13px] leading-relaxed text-ink-dim">
        This section is limited to certain roles, and yours is not one of them. If
        you think that is wrong, ask an admin to check your access.
      </p>

      <Link
        href="/dashboard"
        className="mt-6 inline-block text-[13px] font-medium text-accent-text transition-colors hover:text-ink"
      >
        Back to the dashboard
      </Link>
    </Card>
  );
}
