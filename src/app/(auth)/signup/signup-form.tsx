"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signUpAction } from "@/lib/auth/actions";
import { emptyFormState } from "@/lib/form-state";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, emptyFormState);
  const errors = state.errors ?? {};
  const values = state.values ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" htmlFor="firstName" error={errors.firstName}>
          <Input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            defaultValue={values.firstName}
            invalid={Boolean(errors.firstName)}
            required
          />
        </Field>
        <Field label="Last name" htmlFor="lastName" error={errors.lastName}>
          <Input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            defaultValue={values.lastName}
            invalid={Boolean(errors.lastName)}
            required
          />
        </Field>
      </div>

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

      <Field
        label="Phone number"
        htmlFor="phone"
        error={errors.phone}
        hint="Shown to other members in the directory."
      >
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0803 000 0000"
          defaultValue={values.phone}
          invalid={Boolean(errors.phone)}
          required
        />
      </Field>

      <Field
        label="Date of birth"
        htmlFor="dateOfBirth"
        error={errors.dateOfBirth}
        hint="Used for the upcoming birthdays list."
      >
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          autoComplete="bday"
          max={new Date().toISOString().slice(0, 10)}
          defaultValue={values.dateOfBirth}
          invalid={Boolean(errors.dateOfBirth)}
          required
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        error={errors.password}
        hint="At least 8 characters, with a letter and a number."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          invalid={Boolean(errors.password)}
          required
        />
      </Field>

      <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword}>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          invalid={Boolean(errors.confirmPassword)}
          required
        />
      </Field>

      <SubmitButton label="Create account" pendingLabel="Creating your account" />

      <p className="text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-accent-text transition-colors hover:text-ink"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
