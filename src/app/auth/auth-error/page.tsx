import type { Metadata } from "next";
import Link from "next/link";

import { AuthPanel } from "@/components/auth-panel";
import { Wordmark } from "@/components/brand";

export const metadata: Metadata = { title: "Link problem" };

const REASONS: Record<string, string> = {
  otp_expired: "That link has expired. Links are only good for a short while.",
  access_denied: "That link is no longer valid. It may have been used already.",
  missing_token: "That link is missing the part that proves it came from us.",
  validation_failed: "That link could not be read.",
  exchange_failed: "We could not complete the sign in from that link.",
  verify_failed: "We could not verify that link.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; detail?: string }>;
}) {
  const { reason, detail } = await searchParams;
  const explanation =
    (reason && REASONS[reason]) ?? "Something about that link did not work.";

  return (
    <div className="backdrop-signed-out flex min-h-screen flex-col">
      <header className="anim-fade flex justify-center px-6 pb-9 pt-12">
        <Wordmark priority />
      </header>

      <main className="flex flex-1 justify-center px-5 pb-16">
        <div className="w-full max-w-[26rem]">
          <AuthPanel
            eyebrow="Link problem"
            title="This link did not work"
            description={explanation}
            footer={
              detail ? (
                <p className="font-mono text-[11px] leading-relaxed break-words text-muted/70">
                  {detail}
                </p>
              ) : undefined
            }
          >
            <div className="space-y-3 text-[13px] leading-relaxed text-ink-dim">
              <p className="text-muted">Two ways forward:</p>
              <p>
                Signing up?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-accent-text transition-colors hover:text-ink"
                >
                  Start again
                </Link>{" "}
                and we will send a fresh code.
              </p>
              <p>
                Resetting a password?{" "}
                <Link
                  href="/forgot-password"
                  className="font-medium text-accent-text transition-colors hover:text-ink"
                >
                  Request a new link
                </Link>
                .
              </p>
            </div>
          </AuthPanel>
        </div>
      </main>
    </div>
  );
}
