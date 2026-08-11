"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { emptyFormState } from "@/lib/form-state";
import { addItemAction } from "@/lib/inventory/actions";
import { ItemFields, type CategoryOption } from "../item-fields";

export function AddItemForm({ categories }: { categories: CategoryOption[] }) {
  const [state, action] = useActionState(addItemAction, emptyFormState);

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <ItemFields
        categories={categories}
        errors={state.errors ?? {}}
        defaults={{
          name: state.values?.name,
          categoryId: state.values?.categoryId,
          quantity: state.values?.quantity,
          serialNumber: state.values?.serialNumber,
          location: state.values?.location,
          notes: state.values?.notes,
        }}
      />

      <SubmitButton
        label="Add to inventory"
        pendingLabel="Adding"
        className="w-full sm:w-auto sm:px-6"
      />
    </form>
  );
}
