"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

const LENGTH = 6;
const EMPTY = () => Array<string>(LENGTH).fill("");

/**
 * Six boxes, one hidden field. Typing advances, backspace retreats, pasting the
 * whole code fills every box, and a complete code submits on its own so nobody
 * has to reach for the button.
 *
 * The parent remounts this on every rejected attempt by keying it on the attempt
 * count, which clears the boxes, refocuses the first one, and replays the shake,
 * all without an effect reaching in to reset state.
 */
export function CodeInput({ invalid }: { invalid?: boolean }) {
  const [digits, setDigits] = useState<string[]>(EMPTY);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const submitted = useRef(false);
  const { pending } = useFormStatus();

  const code = digits.join("");

  useEffect(() => {
    if (code.length === LENGTH && !submitted.current && !pending) {
      submitted.current = true;
      inputs.current[LENGTH - 1]?.form?.requestSubmit();
    }
  }, [code, pending]);

  function write(index: number, value: string) {
    const next = [...digits];
    next[index] = value;
    setDigits(next);
  }

  function handleChange(index: number, raw: string) {
    const digitsOnly = raw.replace(/\D/g, "");
    if (!digitsOnly) {
      write(index, "");
      return;
    }

    // Covers both a single keystroke and a paste that lands in one box.
    const next = [...digits];
    for (let offset = 0; offset < digitsOnly.length && index + offset < LENGTH; offset += 1) {
      next[index + offset] = digitsOnly[offset];
    }
    setDigits(next);

    const landed = Math.min(index + digitsOnly.length, LENGTH - 1);
    inputs.current[landed]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      write(index - 1, "");
      inputs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < LENGTH - 1) {
      event.preventDefault();
      inputs.current[index + 1]?.focus();
    }
  }

  return (
    <div>
      <input type="hidden" name="token" value={code} />
      <div
        role="group"
        aria-label="Six digit verification code"
        className={cn("flex justify-between gap-2", invalid && "anim-shake")}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              inputs.current[index] = node;
            }}
            value={digit}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onFocus={(event) => event.target.select()}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${index + 1} of ${LENGTH}`}
            maxLength={LENGTH}
            disabled={pending}
            autoFocus={index === 0}
            className={cn(
              "h-14 w-full min-w-0 border text-center font-mono text-xl text-ink",
              "transition-[border-color,background-color] duration-200 ease-out",
              "hover:border-line-strong",
              "focus:border-accent focus:outline-none",
              "disabled:opacity-55",
              digit ? "anim-pop border-accent-line bg-surface-3" : "border-line bg-surface-2",
              invalid && "border-danger/55",
            )}
          />
        ))}
      </div>
    </div>
  );
}
