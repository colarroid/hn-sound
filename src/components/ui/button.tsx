import type { ComponentProps } from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: cn(
    "bg-accent text-white font-medium",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]",
    "hover:bg-accent-hover",
    "disabled:hover:bg-accent",
  ),
  secondary: cn(
    "border border-line-strong bg-surface-2 text-ink",
    "hover:border-muted/60 hover:bg-surface-3",
  ),
  ghost: "text-muted hover:bg-surface-2 hover:text-ink",
  danger: "border border-danger/35 bg-danger-soft text-danger hover:bg-[#341513]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[12.5px] gap-1.5",
  md: "h-10 px-4 text-[13.5px] gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  pending = false,
  className,
  children,
  ...props
}: ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  pending?: boolean;
}) {
  return (
    <button
      className={cn(
        // Square, always. Nothing in this app is rounded.
        "inline-flex items-center justify-center whitespace-nowrap tracking-[0.005em]",
        "transition-[background-color,border-color,color,transform,opacity] duration-200 ease-out",
        "active:translate-y-px",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0",
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {pending ? <Spinner /> : null}
      {children}
    </button>
  );
}
