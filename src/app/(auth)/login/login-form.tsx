"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInAction } from "@/lib/auth/actions";
import { emptyFormState } from "@/lib/form-state";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signInAction, emptyFormState);
  const errors = state.errors ?? {};
  const values = state.values ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <Field label="Email address" htmlFor="email" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={values.email}
          invalid={Boolean(errors.email)}
          required
        />
      </Field>

      <Field label="Password" htmlFor="password" error={errors.password}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          invalid={Boolean(errors.password)}
          required
        />
      </Field>

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-[12.5px] text-muted transition-colors duration-200 hover:text-ink"
        >
          Forgot your password?
        </Link>
      </div>

      <SubmitButton label="Log in" pendingLabel="Logging you in" />

      <p className="text-center text-[13px] text-muted">
        New to the department?{" "}
        <Link
          href="/signup"
          className="font-medium text-accent-text transition-colors hover:text-ink"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
