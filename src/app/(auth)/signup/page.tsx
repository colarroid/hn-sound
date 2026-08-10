import type { Metadata } from "next";

import { AuthPanel } from "@/components/auth-panel";
import { SignUpForm } from "./signup-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <AuthPanel
      eyebrow="New member"
      title="Create your account"
      description="Everyone joins as a member. An admin sets your department position and any extra access once you are in."
    >
      <SignUpForm />
    </AuthPanel>
  );
}
