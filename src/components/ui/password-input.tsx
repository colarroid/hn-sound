"use client";

import { useState, type ComponentProps } from "react";

import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/**
 * Password field with a reveal toggle. Typing a password blind on a phone
 * keyboard is where most failed logins come from.
 */
export function PasswordInput({
  className,
  ...props
}: Omit<ComponentProps<typeof Input>, "type">) {
  const [shown, setShown] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={shown ? "text" : "password"}
        className={cn("pr-11", className)}
      />
      <button
        type="button"
        onClick={() => setShown((value) => !value)}
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        // Not a tab stop: it would sit between the password field and the submit
        // button on every form. Reachable by pointer, and by screen readers.
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition-colors duration-200 hover:text-ink"
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-[18px]" aria-hidden="true">
          {shown ? (
            <>
              <path
                d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.8 2.8M6.5 6.6C4.6 7.9 3.2 9.8 2.5 12c1.3 3.9 5.2 6.5 9.5 6.5 1.6 0 3.1-.4 4.4-1M9.9 5.7A9.9 9.9 0 0 1 12 5.5c4.3 0 8.2 2.6 9.5 6.5-.5 1.5-1.4 2.9-2.6 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              <path
                d="M2.5 12C3.8 8.1 7.7 5.5 12 5.5s8.2 2.6 9.5 6.5c-1.3 3.9-5.2 6.5-9.5 6.5S3.8 15.9 2.5 12Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
