import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A columned list that scrolls sideways instead of crushing itself.
 *
 * These lists are tables in all but markup. On a phone the columns were being
 * squeezed to twenty pixels each, so a name rendered as a couple of letters and an
 * ellipsis. The fix is a minimum width on the list and a scroll container around
 * it: the row keeps readable column widths and you swipe to reach the rest.
 *
 * The minimum has to be wide enough for the real content, so it is set per list
 * rather than shared, and it must not exceed what the desktop column can show or
 * the list would scroll on a large screen too.
 */
export function RowScroller({
  minWidth,
  className,
  children,
}: {
  /** A Tailwind min-w-[…] class sized to this list's widest column set. */
  minWidth: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <ul className={cn("divide-y divide-line", minWidth, className)}>{children}</ul>
    </div>
  );
}
