import type { ReactNode } from "react";

import { Wordmark } from "@/components/brand";
import { CHURCH_NAME } from "@/lib/brand";

/**
 * The standalone frame for screens that sit outside both the signed-out flow and
 * the app shell: the waiting room and the bad-link page.
 */
export function CenteredFrame({ children }: { children: ReactNode }) {
  return (
    <div className="backdrop-signed-out flex min-h-screen flex-col">
      <header className="anim-fade flex justify-center px-6 pb-9 pt-12">
        <Wordmark priority />
      </header>

      <main className="flex flex-1 justify-center px-5 pb-16">
        <div className="w-full max-w-[26rem]">{children}</div>
      </main>

      <footer className="px-6 pb-10 text-center text-[10.5px] uppercase tracking-[0.16em] text-muted">
        {CHURCH_NAME}
      </footer>
    </div>
  );
}
