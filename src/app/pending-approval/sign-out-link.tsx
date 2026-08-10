"use client";

import { useFormStatus } from "react-dom";

import { signOutAction } from "@/lib/auth/actions";

function Link() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-medium text-accent-text underline-offset-2 transition-colors duration-200 hover:text-ink hover:underline disabled:opacity-60"
    >
      {pending ? "Signing out" : "sign out"}
    </button>
  );
}

export function SignOutLink() {
  return (
    <form action={signOutAction} className="text-[13px] text-muted">
      Not you, or done for now? You can <Link /> and come back later.
    </form>
  );
}
