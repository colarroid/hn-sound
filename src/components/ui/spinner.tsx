import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="presentation"
      className={cn(
        "anim-spin inline-block size-3.5 shrink-0 border border-current border-t-transparent",
        className,
      )}
    />
  );
}
