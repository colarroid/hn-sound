"use client";

import { useFormStatus } from "react-dom";

import { checkApprovalAction } from "@/lib/approvals/actions";
import { Button } from "@/components/ui/button";

function CheckButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="lg" className="w-full" pending={pending} disabled={pending}>
      {pending ? "Checking" : "Check again"}
    </Button>
  );
}

export function CheckApprovalForm() {
  return (
    <form action={checkApprovalAction}>
      <CheckButton />
    </form>
  );
}
