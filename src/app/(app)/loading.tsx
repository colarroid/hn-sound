import { Card, CardHeader } from "@/components/ui/card";

/**
 * Shown while a section's data is being fetched on the server.
 *
 * Covers every route inside the app shell, so a tap on any nav item gets an
 * immediate response instead of a frozen screen that invites a second tap. Shaped
 * like the pages it stands in for, a heading and a list, so the layout does not jump
 * when the real content arrives.
 */
function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse bg-surface-2 ${className}`} />;
}

export default function AppLoading() {
  return (
    <div className="space-y-7" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>

      <header className="anim-fade space-y-3">
        <Bar className="h-2.5 w-28" />
        <Bar className="h-7 w-52" />
        <Bar className="h-4 w-full max-w-md" />
      </header>

      <div className="anim-fade d-1">
        <Card>
          <CardHeader title="Loading" />
          <ul className="divide-y divide-line">
            {[0, 1, 2, 3, 4].map((row) => (
              <li key={row} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex-1 space-y-2">
                  {/* Staggered widths so it reads as content rather than a grid. */}
                  <Bar className={row % 2 === 0 ? "h-3.5 w-40" : "h-3.5 w-52"} />
                  <Bar className={row % 3 === 0 ? "h-3 w-24" : "h-3 w-32"} />
                </div>
                <Bar className="h-6 w-20 shrink-0" />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
