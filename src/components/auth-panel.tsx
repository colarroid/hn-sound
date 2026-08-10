import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** The one panel shape every signed-out screen uses. */
export function AuthPanel({
  eyebrow,
  title,
  description,
  children,
  footer,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Card accentTop className={cn("anim-rise", className)}>
      <div className="px-6 pt-7 sm:px-8">
        <p className="text-[9.5px] font-medium uppercase tracking-[0.2em] text-accent-text">
          {eyebrow}
        </p>
        <h1 className="mt-3.5 text-[22px] font-semibold leading-tight tracking-[-0.015em]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2.5 text-[13px] leading-relaxed text-ink-dim">{description}</p>
        ) : null}
      </div>

      <div className="px-6 pb-7 pt-7 sm:px-8">{children}</div>

      {footer ? (
        <div className="border-t border-line px-6 py-4 sm:px-8">{footer}</div>
      ) : null}
    </Card>
  );
}
