import type { Metadata } from "next";
import Link from "next/link";

import { AuthPanel } from "@/components/auth-panel";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthPanel
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your email address and we will send you a link to set a new password."
      footer={
        <p className="text-center text-[13px] text-muted">
          <Link
            href="/login"
            className="font-medium text-accent-text transition-colors hover:text-ink"
          >
            Back to log in
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthPanel>
  );
}
