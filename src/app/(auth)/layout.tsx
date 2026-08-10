import type { ReactNode } from "react";
import Link from "next/link";

import { Wordmark } from "@/components/brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="backdrop-signed-out flex min-h-screen flex-col">
      <header className="anim-fade flex justify-center px-6 pb-9 pt-12">
        <Link href="/login" className="transition-opacity duration-200 hover:opacity-80">
          <Wordmark priority />
        </Link>
      </header>

      <main className="relative flex flex-1 justify-center px-5 pb-16">
        <div className="w-full max-w-[26rem]">{children}</div>
      </main>

      <footer className="px-6 pb-10 text-center text-[10.5px] uppercase tracking-[0.16em] text-muted">
        Hope Nation Church
      </footer>
    </div>
  );
}
