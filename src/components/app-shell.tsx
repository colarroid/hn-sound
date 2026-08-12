"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Wordmark } from "@/components/brand";
import { RoleBadge } from "@/components/role-badge";
import { Icon, NAV_TOGGLE_PATH } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { signOutAction } from "@/lib/auth/actions";
import type { AppRole } from "@/lib/database.types";
import type { NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

type ShellMember = {
  name: string;
  email: string;
  initials: string;
  role: AppRole;
  position: string | null;
};

export function AppShell({
  member,
  navItems,
  badges,
  children,
}: {
  member: ShellMember;
  navItems: NavItem[];
  /** Counts keyed by nav href. Zero or missing renders nothing. */
  badges?: Record<string, number>;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [clicked, setClicked] = useState<string | null>(null);
  const pathname = usePathname();

  /*
    Every section fetches on the server, so a tap sits there doing nothing visible
    for a moment and people tap again. The spinner is derived rather than cleared by
    an effect: it shows while the clicked href is not yet the current path, and stops
    on its own the moment the new page lands.
  */
  const isNavigatingTo = (href: string) => clicked === href && pathname !== href;

  const nav = (
    <nav className="space-y-px">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const badge = badges?.[item.href] ?? 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => {
              // A tap through the drawer leaves it closed behind you.
              setMenuOpen(false);
              setClicked(item.href);
            }}
            aria-current={active ? "page" : undefined}
            aria-busy={isNavigatingTo(item.href) || undefined}
            className={cn(
              "group relative flex items-center gap-3 px-4 py-2.5 text-[13px]",
              "transition-colors duration-200 ease-out",
              active
                ? "bg-surface-2 font-medium text-ink"
                : "text-muted hover:bg-surface-2/60 hover:text-ink",
            )}
          >
            {/* Crimson marker that grows in on the active item. */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-y-0 left-0 w-[2px] bg-accent",
                "origin-center transition-transform duration-300 ease-out",
                active ? "scale-y-100" : "scale-y-0 group-hover:scale-y-50",
              )}
            />
            {/* Swapped in place so the label does not shift while loading. */}
            {isNavigatingTo(item.href) ? (
              <Spinner className="size-[18px] text-accent-text" />
            ) : (
              <Icon
                name={item.icon}
                className={cn(
                  "transition-colors duration-200",
                  active ? "text-accent-text" : "text-muted group-hover:text-ink-dim",
                )}
              />
            )}
            {item.label}
            {badge > 0 ? (
              <span
                className="ml-auto min-w-5 border border-accent-line bg-accent-soft px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums text-accent-text"
                aria-label={`${badge} waiting`}
              >
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const userCard = (
    <div className="border-t border-line p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center border border-accent-line bg-accent-soft text-[11px] font-semibold tracking-wide text-accent-text">
          {member.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-ink">{member.name}</div>
          <div className="truncate text-[11px] text-muted">
            {member.position ?? "No position set"}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <RoleBadge role={member.role} />
        <form action={signOutAction} onSubmit={() => setSigningOut(true)}>
          <button
            type="submit"
            disabled={signingOut}
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 text-[12px] text-muted",
              "transition-colors duration-200 hover:bg-surface-2 hover:text-ink",
              "disabled:opacity-60",
            )}
          >
            {signingOut ? <Spinner className="size-3" /> : null}
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Mobile bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <Wordmark size="sm" showDepartment={false} priority />
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="app-nav"
          className="p-2 text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-ink"
        >
          <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
          <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
            <path
              d={menuOpen ? "M6 6l12 12M18 6 6 18" : NAV_TOGGLE_PATH}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </header>

      {/* Drawer on small screens, fixed rail on large. */}
      <aside
        id="app-nav"
        className={cn(
          "shrink-0 overflow-hidden border-line bg-surface",
          "transition-[max-height,opacity] duration-300 ease-out lg:transition-none",
          menuOpen ? "max-h-[70vh] border-b opacity-100" : "max-h-0 opacity-0",
          // On desktop the rail is exactly the viewport tall and stays put, so the
          // member card sits at the bottom of the screen rather than at the bottom
          // of a long page.
          "lg:sticky lg:top-0 lg:flex lg:h-screen lg:max-h-none lg:w-64",
          "lg:flex-col lg:overflow-y-auto lg:border-r lg:opacity-100",
        )}
      >
        <div className="hidden px-4 py-6 lg:block">
          <Wordmark priority />
        </div>
        <div className="flex-1 py-3 lg:min-h-0 lg:overflow-y-auto lg:py-0">{nav}</div>
        {userCard}
      </aside>

      <main className="min-w-0 flex-1">
        {/* Keyed on the path so each section fades in on arrival. */}
        <div
          key={pathname}
          className="anim-fade mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
