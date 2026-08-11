"use client";

import { useActionState } from "react";

import { updatePasswordAction } from "@/lib/auth/actions";
import { emptyFormState } from "@/lib/form-state";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, emptyFormState);
  const errors = state.errors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <Field
        label="New password"
        htmlFor="password"
        error={errors.password}
        hint="At least 8 characters, with a letter and a number."
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          invalid={Boolean(errors.password)}
          required
        />
      </Field>

      <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword}>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          invalid={Boolean(errors.confirmPassword)}
          required
        />
      </Field>

      <SubmitButton label="Save new password" pendingLabel="Saving" />
    </form>
  );
}
