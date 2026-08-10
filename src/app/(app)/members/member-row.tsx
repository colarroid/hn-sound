"use client";

import { useActionState, useState } from "react";

import { RoleBadge } from "@/components/role-badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { AppRole } from "@/lib/database.types";
import { emptyFormState } from "@/lib/form-state";
import { revokeMemberAction, updateMemberAction } from "@/lib/members/actions";
import { ASSIGNABLE_ROLES, POSITION_MAX_LENGTH } from "@/lib/positions";
import { cn } from "@/lib/utils";

export type DirectoryMember = {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string | null;
  position: string | null;
  role: AppRole;
  isSelf: boolean;
};

function ContactLink({
  href,
  children,
  label,
}: {
  href: string;
  children: string;
  label: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted">
        {label}
      </div>
      <a
        href={href}
        className="mt-0.5 block truncate text-[13px] text-ink transition-colors duration-200 hover:text-accent-text"
      >
        {children}
      </a>
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

export function MemberRow({
  member,
  canManage,
  datalistId,
}: {
  member: DirectoryMember;
  canManage: boolean;
  datalistId: string;
}) {
  const [open, setOpen] = useState(false);
  const [editState, editAction] = useActionState(updateMemberAction, emptyFormState);
  const [revokeState, revokeAction] = useActionState(revokeMemberAction, emptyFormState);

  return (
    <li className="px-5 py-4 transition-colors duration-200 hover:bg-surface-2/40">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center border border-line-strong bg-surface-2 text-[11px] font-semibold tracking-wide text-ink-dim">
            {member.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">
              {member.name}
              {member.isSelf ? (
                <span className="ml-2 text-[11px] font-normal text-muted">you</span>
              ) : null}
            </p>
            <p className="truncate text-[12.5px] text-muted">
              {member.position ?? "No position set"}
            </p>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 sm:max-w-md">
          <ContactLink label="Phone" href={`tel:${member.phone ?? ""}`}>
            {member.phone ?? "Not set"}
          </ContactLink>
          <ContactLink label="Email" href={`mailto:${member.email}`}>
            {member.email}
          </ContactLink>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <RoleBadge role={member.role} />
          {canManage ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
            >
              {open ? "Close" : "Edit"}
            </Button>
          ) : null}
        </div>
      </div>

      {canManage && open ? (
        <div className="anim-rise mt-4 space-y-4 border-t border-line pt-4">
          {editState.message ? (
            <Alert tone={editState.ok ? "success" : "error"}>{editState.message}</Alert>
          ) : null}
          {revokeState.message ? (
            <Alert tone={revokeState.ok ? "success" : "error"}>
              {revokeState.message}
            </Alert>
          ) : null}

          <form
            action={editAction}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
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
                placeholder="Stage Engineer"
                className="h-9 text-[13px]"
              />
            </div>

            <SubmitButton
              label="Save"
              pendingLabel="Saving"
              size="sm"
              className="sm:px-5"
            />
          </form>

          {member.isSelf ? (
            <p className="text-[12px] leading-relaxed text-muted">
              This is your own row. You cannot revoke your own access, and you cannot
              drop your admin role while you are the only admin.
            </p>
          ) : (
            <form action={revokeAction} className="space-y-2">
              <input type="hidden" name="memberId" value={member.id} />
              <FieldLabel htmlFor={`reason-${member.id}`}>
                Revoke access, reason optional
              </FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id={`reason-${member.id}`}
                  name="reason"
                  placeholder="Left the department"
                  className={cn("h-9 flex-1 text-[13px]")}
                />
                <SubmitButton
                  label="Revoke access"
                  pendingLabel="Revoking"
                  size="sm"
                  variant="danger"
                  className="sm:px-5"
                />
              </div>
              <p className="text-[12px] leading-relaxed text-muted">
                They keep their account but see the declined screen instead of the
                app, with the reason above. They drop off this list straight away,
                and it is reversible from Approvals.
              </p>
            </form>
          )}
        </div>
      ) : null}
    </li>
  );
}
