import { cn } from "@/lib/utils";

/**
 * The supplied loading mark: a ring of dashes rather than a solid arc, spun with
 * the shared keyframe so it stops under prefers-reduced-motion like everything else.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      role="presentation"
      className={cn("anim-spin size-4 shrink-0", className)}
    >
      <path
        d="M10.1 2.18191C11.355 1.93904 12.645 1.93904 13.9 2.18191M13.9 21.8181C12.645 22.061 11.355 22.061 10.1 21.8181M17.609 3.72095C18.6705 4.44017 19.5837 5.35682 20.299 6.42095M2.18204 13.9001C1.93916 12.6451 1.93916 11.3551 2.18204 10.1001M20.279 17.6089C19.5598 18.6704 18.6431 19.5836 17.579 20.2989M21.818 10.1001C22.0609 11.3551 22.0609 12.6451 21.818 13.9001M3.72095 6.39093C4.44017 5.32946 5.35682 4.41621 6.42095 3.70093M6.39105 20.2791C5.32958 19.5599 4.41633 18.6432 3.70105 17.5791"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
