import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const TONES = {
  error: "border-danger/30 bg-danger-soft text-danger",
  success: "border-ok/30 bg-ok-soft text-ok",
  info: "border-line-strong bg-surface-2 text-ink-dim",
} as const;

export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "anim-rise border-l-2 border-y border-r px-3.5 py-3 text-[13px] leading-relaxed",
        TONES[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
