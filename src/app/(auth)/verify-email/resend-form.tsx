"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { resendVerificationAction } from "@/lib/auth/actions";
import { emptyFormState } from "@/lib/form-state";
import { Alert } from "@/components/ui/alert";

function ResendLink() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-medium text-accent-text underline-offset-2 transition-colors duration-200 hover:text-ink hover:underline disabled:opacity-60"
    >
      {pending ? "Sending" : "send a new code"}
    </button>
  );
}

export function ResendForm({ email }: { email: string }) {
  const [state, action] = useActionState(resendVerificationAction, emptyFormState);

  return (
    <div className="space-y-3">
      {state.message ? (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      ) : null}
      <form action={action} className="text-[13px] leading-relaxed text-muted">
        <input type="hidden" name="email" value={email} />
        No code in your inbox? Check your spam folder, then <ResendLink />.
      </form>
    </div>
  );
}
