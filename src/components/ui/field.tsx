import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
  Square controls. On focus the border takes the accent and the surface lifts a
  step. That is the whole treatment: one crimson outline, nothing inside it.
*/
const CONTROL = cn(
  "w-full border bg-surface-2 px-3 text-sm text-ink",
  "placeholder:text-muted/55",
  "transition-[border-color,background-color] duration-200 ease-out",
  "hover:border-line-strong",
  "focus:border-accent focus:bg-surface-3 focus:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-55",
);

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[10.5px] font-medium uppercase tracking-[0.13em] text-muted"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="anim-fade text-[12px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] leading-relaxed text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  invalid,
  ...props
}: ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${props.id}-error` : undefined}
      className={cn(
        CONTROL,
        "h-11",
        invalid ? "border-danger/60" : "border-line",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  invalid,
  ...props
}: ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL,
        "h-11 appearance-none pr-8",
        invalid ? "border-danger/60" : "border-line",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL,
        "min-h-24 py-2.5 leading-relaxed",
        invalid ? "border-danger/60" : "border-line",
        className,
      )}
      {...props}
    />
  );
}
