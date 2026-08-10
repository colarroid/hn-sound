import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth-panel";
import { CenteredFrame } from "@/components/centered-frame";
import { Alert } from "@/components/ui/alert";
import { requireVerifiedMember } from "@/lib/auth/session";
import { fullName } from "@/lib/utils";
import { CheckApprovalForm } from "./check-button";
import { SignOutLink } from "./sign-out-link";

export const metadata: Metadata = { title: "Awaiting approval" };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted">
        {label}
      </span>
      <span className="min-w-0 truncate text-[13px] text-ink">{value}</span>
    </div>
  );
}

export default async function PendingApprovalPage() {
  const { profile } = await requireVerifiedMember();

  // Approved members have no business here.
  if (profile.approval_status === "approved") redirect("/dashboard");

  const declined = profile.approval_status === "declined";

  return (
    <CenteredFrame>
      <AuthPanel
        eyebrow={declined ? "Access declined" : "Awaiting approval"}
        title={declined ? "Your account was not approved" : "Signup complete"}
        description={
          declined ? (
            <>
              The head of department reviewed your signup and did not grant access.
              If you think that is a mistake, speak to them directly and they can
              approve you from their dashboard.
            </>
          ) : (
            <>
              Your email is confirmed and your account is created. One step is left,
              and it is not yours to do.
            </>
          )
        }
        footer={<SignOutLink />}
      >
        {declined ? (
          <div className="space-y-5">
            {profile.decline_reason ? (
              <Alert tone="error">
                <span className="font-medium">Reason given:</span>{" "}
                {profile.decline_reason}
              </Alert>
            ) : null}
            <CheckApprovalForm />
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-[13px] leading-relaxed text-ink-dim">
              The head of department approves every new member before anyone reaches
              the dashboard. That is deliberate: it keeps the platform shut to
              anyone who simply finds the address.
            </p>
            <p className="text-[13px] leading-relaxed text-ink-dim">
              You are in as soon as they approve you, which takes them one tap next
              time they log in. If you need it sooner, tell them you have signed up
              and they can do it on the spot.
            </p>

            <div className="divide-y divide-line border-y border-line">
              <Row label="Name" value={fullName(profile) || "Not set"} />
              <Row label="Email" value={profile.email} />
              <Row label="Phone" value={profile.phone ?? "Not set"} />
            </div>

            <p className="text-[12px] leading-relaxed text-muted">
              Nothing to do here but wait. This screen does not refresh on its own,
              so check back once you have heard from them.
            </p>

            <CheckApprovalForm />
          </div>
        )}
      </AuthPanel>
    </CenteredFrame>
  );
}
