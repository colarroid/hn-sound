import type { AppRole } from "@/lib/database.types";
import { cn } from "@/lib/utils";

const STYLES: Record<AppRole, string> = {
  admin: "border-accent-line bg-accent-soft text-accent-text",
  senior_pastor: "border-line-strong bg-surface-3 text-ink",
  treasurer: "border-ok/30 bg-ok-soft text-ok",
  member: "border-line bg-surface-2 text-muted",
};

const LABELS: Record<AppRole, string> = {
  admin: "Admin",
  senior_pastor: "Senior Pastor",
  treasurer: "Treasurer",
  member: "Member",
};

export function RoleBadge({ role, className }: { role: AppRole; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-[3px] text-[10px] font-medium uppercase tracking-[0.11em]",
        STYLES[role],
        className,
      )}
    >
      {LABELS[role]}
    </span>
  );
}

export { LABELS as ROLE_LABELS };
