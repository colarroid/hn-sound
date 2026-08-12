import { Card, CardHeader } from "@/components/ui/card";

function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse bg-surface-2 ${className}`} />;
}

/**
 * Stands in for a page while the next one is being fetched.
 *
 * Rendered from the shell's own click state rather than from a loading.tsx, because
 * a Suspense fallback never resolved in this app and left every screen stuck on
 * placeholders. This one is plain markup with nothing to resolve.
 *
 * It fades in on a delay, so a navigation that finishes quickly never flashes it.
 */
export function PageSkeleton() {
  return (
    <div className="anim-fade d-3 space-y-7" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>

      <header className="space-y-3">
        <Bar className="h-2.5 w-28" />
        <Bar className="h-7 w-52" />
        <Bar className="h-4 w-full max-w-md" />
      </header>

      <Card>
        <CardHeader title="Loading" />
        <ul className="divide-y divide-line">
          {[0, 1, 2, 3, 4].map((row) => (
            <li key={row} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0 flex-1 space-y-2">
                {/* Uneven widths so it reads as content rather than a grid. */}
                <Bar className={row % 2 === 0 ? "h-3.5 w-40" : "h-3.5 w-52"} />
                <Bar className={row % 3 === 0 ? "h-3 w-24" : "h-3 w-32"} />
              </div>
              <Bar className="h-6 w-20 shrink-0" />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
