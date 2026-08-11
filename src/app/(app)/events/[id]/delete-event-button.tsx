"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { deleteEventAction } from "@/lib/events/actions";

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="danger" disabled={pending} pending={pending}>
      {pending ? "Deleting" : "Delete event"}
    </Button>
  );
}

export function DeleteEventButton({
  eventId,
  title,
}: {
  eventId: string;
  title: string;
}) {
  return (
    <form
      action={deleteEventAction}
      onSubmit={(event) => {
        // A repeating event disappearing takes every future occurrence with it, so
        // it is worth one interruption.
        if (
          !window.confirm(
            `Delete "${title}"? Every future occurrence goes with it. This cannot be undone.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="eventId" value={eventId} />
      <DeleteButton />
    </form>
  );
}
