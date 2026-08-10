import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  accentTop = false,
}: {
  children: ReactNode;
  className?: string;
  /** Adds the crimson hairline along the top edge. For lead panels only. */
  accentTop?: boolean;
}) {
  return (
    <div
      className={cn(
        "border border-line bg-surface",
        accentTop && "rule-accent",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-line px-5 py-4",
        className,
      )}
    >
      <div className="space-y-1">
        <h2 className="text-[10.5px] font-medium uppercase tracking-[0.13em] text-muted">
          {title}
        </h2>
        {description ? (
          <p className="text-[13px] leading-relaxed text-ink-dim">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="anim-fade px-5 py-14 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
