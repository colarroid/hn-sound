"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

/**
 * Every form in the app submits through this, so the pending treatment is
 * identical everywhere: spinner in, label swaps, button locked.
 */
export function SubmitButton({
  label,
  pendingLabel,
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, "children" | "pending"> & {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className={className ?? "w-full"}
      disabled={pending}
      pending={pending}
      {...props}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
