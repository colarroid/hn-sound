"use client";

import { useActionState } from "react";

import { verifyEmailCodeAction } from "@/lib/auth/actions";
import { emptyFormState } from "@/lib/form-state";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { CodeInput } from "./code-input";

export function CodeForm({ email }: { email: string }) {
  const [state, action] = useActionState(verifyEmailCodeAction, emptyFormState);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="email" value={email} />
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}
      <CodeInput key={state.attempt ?? 0} invalid={Boolean(state.message)} />
      <SubmitButton label="Confirm email address" pendingLabel="Checking your code" />
    </form>
  );
}
