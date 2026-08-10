"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { OTP_LENGTH } from "@/lib/auth/otp";
import { cn } from "@/lib/utils";

const EMPTY = () => Array<string>(OTP_LENGTH).fill("");

/**
 * One box per digit, one hidden field. Typing advances, backspace retreats,
 * pasting the whole code fills every box, and a complete code submits on its own
 * so nobody has to reach for the button.
 *
 * The box count comes from OTP_LENGTH rather than a hardcoded six, because
 * Supabase's Email OTP Length is configurable and a mismatch makes the code
 * physically impossible to enter.
 *
 * The parent remounts this on every rejected attempt by keying it on the attempt
 * count, which clears the boxes, refocuses the first, and replays the shake, all
 * without an effect reaching in to reset state.
 */
export function CodeInput({ invalid }: { invalid?: boolean }) {
  const [digits, setDigits] = useState<string[]>(EMPTY);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const submitted = useRef(false);
  const { pending } = useFormStatus();

  const code = digits.join("");
  const roomy = OTP_LENGTH <= 7;

  useEffect(() => {
    if (code.length === OTP_LENGTH && !submitted.current && !pending) {
      submitted.current = true;
      inputs.current[OTP_LENGTH - 1]?.form?.requestSubmit();
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
    for (
      let offset = 0;
      offset < digitsOnly.length && index + offset < OTP_LENGTH;
      offset += 1
    ) {
      next[index + offset] = digitsOnly[offset];
    }
    setDigits(next);

    const landed = Math.min(index + digitsOnly.length, OTP_LENGTH - 1);
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
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      inputs.current[index + 1]?.focus();
    }
  }

  return (
    <div>
      <input type="hidden" name="token" value={code} />
      <div
        role="group"
        aria-label={`${OTP_LENGTH} digit verification code`}
        className={cn(
          "flex justify-between",
          roomy ? "gap-2" : "gap-1.5",
          invalid && "anim-shake",
        )}
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
            aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
            maxLength={OTP_LENGTH}
            disabled={pending}
            autoFocus={index === 0}
            className={cn(
              "w-full min-w-0 border text-center font-mono text-ink",
              roomy ? "h-14 text-xl" : "h-12 text-base",
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
