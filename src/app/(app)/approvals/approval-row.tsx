"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { approveMemberAction, declineMemberAction } from "@/lib/approvals/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export type PendingMember = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  dobLabel: string;
  joinedLabel: string;
  declineReason: string | null;
};

function ActionButton({
  label,
  pendingLabel,
  variant,
}: {
  label: string;
  pendingLabel: string;
  variant: "primary" | "secondary" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="sm"
      variant={variant}
      disabled={pending}
      pending={pending}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted">
        {label}
      </div>
      <div className="mt-0.5 truncate text-[13px] text-ink">{value}</div>
    </div>
  );
}

export function ApprovalRow({
  member,
  canAct,
  declined = false,
}: {
  member: PendingMember;
  canAct: boolean;
  declined?: boolean;
}) {
  const [showReason, setShowReason] = useState(false);

  return (
    <li className="px-5 py-4 transition-colors duration-200 hover:bg-surface-2/40">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{member.name}</p>
            <p className="truncate text-[12.5px] text-muted">{member.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            <Detail label="Phone" value={member.phone ?? "Not set"} />
            <Detail label="Born" value={member.dobLabel} />
            <Detail label="Signed up" value={member.joinedLabel} />
          </div>

          {declined && member.declineReason ? (
            <p className="border-l-2 border-danger/40 pl-3 text-[12.5px] leading-relaxed text-muted">
              <span className="text-danger">Declined:</span> {member.declineReason}
            </p>
          ) : null}
        </div>

        {canAct ? (
          <div className="flex shrink-0 items-center gap-2">
            <form action={approveMemberAction}>
              <input type="hidden" name="memberId" value={member.id} />
              <ActionButton
                label={declined ? "Approve anyway" : "Approve"}
                pendingLabel="Approving"
                variant="primary"
              />
            </form>

            {declined ? null : (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setShowReason((open) => !open)}
                aria-expanded={showReason}
              >
                Decline
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {canAct && showReason ? (
        <form
          action={declineMemberAction}
          className={cn("anim-rise mt-4 space-y-3 border-t border-line pt-4")}
        >
          <input type="hidden" name="memberId" value={member.id} />
          <label
            htmlFor={`reason-${member.id}`}
            className="block text-[10.5px] font-medium uppercase tracking-[0.13em] text-muted"
          >
            Reason, optional
          </label>
          <Textarea
            id={`reason-${member.id}`}
            name="reason"
            rows={2}
            placeholder="They will see this on their waiting screen."
            className="min-h-16"
          />
          <div className="flex items-center gap-2">
            <ActionButton label="Confirm decline" pendingLabel="Declining" variant="danger" />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowReason(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </li>
  );
}
