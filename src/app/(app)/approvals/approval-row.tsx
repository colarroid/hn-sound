"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import {
  approveMemberAction,
  declineMemberAction,
  removeDeclinedMemberAction,
} from "@/lib/approvals/actions";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { ASSIGNABLE_ROLES, POSITION_MAX_LENGTH } from "@/lib/positions";

export type PendingMember = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  dobLabel: string;
  joinedLabel: string;
  position: string | null;
  role: string;
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
    <Button type="submit" size="sm" variant={variant} disabled={pending} pending={pending}>
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

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted"
    >
      {children}
    </label>
  );
}

export function ApprovalRow({
  member,
  canAct,
  datalistId,
  declined = false,
}: {
  member: PendingMember;
  canAct: boolean;
  datalistId: string;
  declined?: boolean;
}) {
  const [showReason, setShowReason] = useState(false);

  return (
    <li className="px-5 py-5 transition-colors duration-200 hover:bg-surface-2/40">
      <div className="space-y-4">
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

        {canAct ? (
          <>
            {/* Approving is also when role and position get set, so the two
                inputs sit inside the approve form rather than beside it. */}
            <form
              action={approveMemberAction}
              className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-end"
            >
              <input type="hidden" name="memberId" value={member.id} />

              <div className="space-y-1.5 sm:w-44">
                <FieldLabel htmlFor={`role-${member.id}`}>Role</FieldLabel>
                <Select
                  id={`role-${member.id}`}
                  name="role"
                  defaultValue={member.role}
                  className="h-9 text-[13px]"
                >
                  {ASSIGNABLE_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <FieldLabel htmlFor={`position-${member.id}`}>
                  Department position
                </FieldLabel>
                <Input
                  id={`position-${member.id}`}
                  name="position"
                  list={datalistId}
                  defaultValue={member.position ?? ""}
                  maxLength={POSITION_MAX_LENGTH}
                  autoComplete="off"
                  placeholder="Asst. Head of Department"
                  className="h-9 text-[13px]"
                />
              </div>

              <div className="flex items-center gap-2 sm:pb-0">
                <ActionButton
                  label={declined ? "Approve anyway" : "Approve"}
                  pendingLabel="Approving"
                  variant="primary"
                />
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
            </form>

            {/* Separate form: a nested one is invalid, and removal must not be a
                stray click away from the approve button. */}
            {declined ? (
              <form
                action={removeDeclinedMemberAction}
                className="flex flex-wrap items-center gap-3 border-t border-line pt-4"
                onSubmit={(event) => {
                  if (
                    !window.confirm(
                      `Remove ${member.name} completely? Their account and this record are deleted for good. They could sign up again with ${member.email}.`,
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="memberId" value={member.id} />
                <ActionButton
                  label="Remove from the list"
                  pendingLabel="Removing"
                  variant="danger"
                />
                <span className="text-[12px] leading-relaxed text-muted">
                  Deletes the account for good. Leave them declined instead if you
                  might let them in later.
                </span>
              </form>
            ) : null}

            {showReason ? (
              <form
                action={declineMemberAction}
                className="anim-rise space-y-3 border-t border-line pt-4"
              >
                <input type="hidden" name="memberId" value={member.id} />
                <FieldLabel htmlFor={`reason-${member.id}`}>Reason, optional</FieldLabel>
                <Textarea
                  id={`reason-${member.id}`}
                  name="reason"
                  rows={2}
                  placeholder="They will see this on their waiting screen."
                  className="min-h-16"
                />
                <div className="flex items-center gap-2">
                  <ActionButton
                    label="Confirm decline"
                    pendingLabel="Declining"
                    variant="danger"
                  />
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
          </>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 border-t border-line pt-4 sm:grid-cols-3">
            <Detail label="Position" value={member.position ?? "Not set"} />
          </div>
        )}
      </div>
    </li>
  );
}
