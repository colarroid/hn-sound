"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { deleteMaterialAction } from "@/lib/training/actions";

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="danger" disabled={pending} pending={pending}>
      {pending ? "Deleting" : "Delete"}
    </Button>
  );
}

export function DeleteMaterialButton({
  materialId,
  title,
}: {
  materialId: string;
  title: string;
}) {
  return (
    <form
      action={deleteMaterialAction}
      onSubmit={(event) => {
        // Deleting takes the uploaded file and every eligibility grant with it,
        // so it is worth one interruption.
        const confirmed = window.confirm(
          `Delete "${title}"? This also removes the file and everyone's access to it. It cannot be undone.`,
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="materialId" value={materialId} />
      <DeleteButton />
    </form>
  );
}
