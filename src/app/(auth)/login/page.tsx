import type { Metadata } from "next";

import { AuthPanel } from "@/components/auth-panel";
import { Alert } from "@/components/ui/alert";
import { safeNextPath } from "@/lib/site";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; verified?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ? safeNextPath(params.next) : undefined;

  return (
    <AuthPanel
      eyebrow="Member access"
      title="Log in"
      description="Sound & Technical Department members only."
    >
      {params.verified ? (
        <Alert tone="success" className="mb-5">
          Email verified. Log in to continue.
        </Alert>
      ) : null}

      <LoginForm next={next} />
    </AuthPanel>
  );
}
