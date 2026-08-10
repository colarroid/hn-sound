import type { Metadata } from "next";

import { AuthPanel } from "@/components/auth-panel";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Set a new password" };

export default function ResetPasswordPage() {
  return (
    <AuthPanel
      eyebrow="Account recovery"
      title="Set a new password"
      description="Choose something you have not used here before."
    >
      <ResetPasswordForm />
    </AuthPanel>
  );
}
