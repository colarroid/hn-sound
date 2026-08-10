import type { Metadata } from "next";
import Link from "next/link";

import { AuthPanel } from "@/components/auth-panel";
import { Alert } from "@/components/ui/alert";
import { CodeForm } from "./code-form";
import { ResendForm } from "./resend-form";

export const metadata: Metadata = { title: "Confirm your email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; existing?: string }>;
}) {
  const { email, existing } = await searchParams;

  // Without an address there is nothing to verify against, so send them back
  // rather than showing six boxes that cannot work.
  if (!email) {
    return (
      <AuthPanel
        eyebrow="Verification"
        title="Confirm your email"
        description="We need to know which address to check. Start from the signup screen and we will send you a fresh code."
      >
        <Link
          href="/signup"
          className="text-[13px] font-medium text-accent-text transition-colors hover:text-ink"
        >
          Back to signup
        </Link>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      eyebrow="Step 2 of 2"
      title="Confirm your email address"
      description={
        <>
          We sent a six digit code to{" "}
          <span className="font-medium text-ink">{email}</span>. Enter it below to
          finish setting up your account.
        </>
      }
      footer={
        <div className="space-y-3">
          <ResendForm email={email} />
          <p className="text-[13px] text-muted">
            Wrong address?{" "}
            <Link
              href="/signup"
              className="font-medium text-accent-text transition-colors hover:text-ink"
            >
              Sign up again
            </Link>
          </p>
        </div>
      }
    >
      {existing ? (
        <Alert tone="info" className="mb-5">
          If you have signed up before, that address is already registered.{" "}
          <Link href="/login" className="font-medium text-accent-text hover:text-ink">
            Log in
          </Link>{" "}
          instead.
        </Alert>
      ) : null}

      <CodeForm email={email} />
    </AuthPanel>
  );
}
