"use client";

import { useActionState, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { EventRecurrence, EventRow } from "@/lib/database.types";
import { createEventAction, updateEventAction } from "@/lib/events/actions";
import { WEEKDAY_ORDER, weekdayName, weekdayShort } from "@/lib/events/schedule";
import { emptyFormState } from "@/lib/form-state";
import { cn } from "@/lib/utils";

const PRESETS: Array<{ label: string; days: number[] }> = [
  { label: "Monday to Friday", days: [1, 2, 3, 4, 5] },
  { label: "Every day", days: [1, 2, 3, 4, 5, 6, 0] },
  { label: "Weekends", days: [6, 0] },
];

function RecurrenceChoice({
  value,
  onChange,
}: {
  value: EventRecurrence;
  onChange: (value: EventRecurrence) => void;
}) {
  const options: Array<{ value: EventRecurrence; label: string; hint: string }> = [
    { value: "once", label: "One-off", hint: "Happens on a single date" },
    { value: "weekly", label: "Repeating", hint: "Same days every week" },
  ];

  return (
    <div className="space-y-2">
      <span className="block text-[10.5px] font-medium uppercase tracking-[0.13em] text-muted">
        How often
      </span>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              className={cn(
                "border p-3 text-left transition-colors duration-200",
                active
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-surface-2 hover:border-line-strong",
              )}
            >
              <span
                className={cn(
                  "block text-[13px] font-medium",
                  active ? "text-accent-text" : "text-ink",
                )}
              >
                {option.label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>
      <input type="hidden" name="recurrence" value={value} />
    </div>
  );
}

export function EventForm({ existing }: { existing?: EventRow }) {
  const editing = Boolean(existing);
  const [state, action] = useActionState(
    editing ? updateEventAction : createEventAction,
    emptyFormState,
  );

  const [recurrence, setRecurrence] = useState<EventRecurrence>(
    existing?.recurrence ?? "once",
  );
  const [days, setDays] = useState<Set<number>>(new Set(existing?.weekdays ?? []));

  const errors = state.errors ?? {};
  const values = state.values ?? {};

  function toggleDay(day: number) {
    setDays((current) => {
      const next = new Set(current);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message ? (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      ) : null}
      {existing ? <input type="hidden" name="eventId" value={existing.id} /> : null}

      <Field label="What is it" htmlFor="title" error={errors.title}>
        <Input
          id="title"
          name="title"
          defaultValue={values.title ?? existing?.title ?? ""}
          placeholder="Sunday service sound check"
          invalid={Boolean(errors.title)}
          required
        />
      </Field>

      <Field
        label="Where"
        htmlFor="location"
        error={errors.location}
        hint="Optional. Main hall, store room, online."
      >
        <Input
          id="location"
          name="location"
          defaultValue={values.location ?? existing?.location ?? ""}
          placeholder="Main hall"
          invalid={Boolean(errors.location)}
        />
      </Field>

      <RecurrenceChoice value={recurrence} onChange={setRecurrence} />

      {recurrence === "once" ? (
        <Field label="Date" htmlFor="startsOn" error={errors.startsOn}>
          <Input
            id="startsOn"
            name="startsOn"
            type="date"
            defaultValue={values.startsOn ?? existing?.starts_on ?? ""}
            invalid={Boolean(errors.startsOn)}
          />
        </Field>
      ) : (
        <div className="space-y-3">
          <Field label="Which days" htmlFor="weekday-1" error={errors.weekdays}>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_ORDER.map((day) => {
                const active = days.has(day);
                return (
                  <label
                    key={day}
                    htmlFor={`weekday-${day}`}
                    className={cn(
                      "cursor-pointer border px-3 py-2 text-[12.5px] transition-colors duration-200",
                      active
                        ? "border-accent bg-accent-soft text-accent-text"
                        : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-ink",
                    )}
                    title={weekdayName(day)}
                  >
                    <input
                      id={`weekday-${day}`}
                      type="checkbox"
                      name="weekdays"
                      value={day}
                      checked={active}
                      onChange={() => toggleDay(day)}
                      className="sr-only"
                    />
                    {weekdayShort(day)}
                  </label>
                );
              })}
            </div>
          </Field>

          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setDays(new Set(preset.days))}
              >
                {preset.label}
              </Button>
            ))}
            {days.size > 0 ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setDays(new Set())}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Starts"
          htmlFor="startsAt"
          error={errors.startsAt}
          hint="Optional if the time is not fixed."
        >
          <Input
            id="startsAt"
            name="startsAt"
            type="time"
            defaultValue={values.startsAt ?? existing?.starts_at?.slice(0, 5) ?? ""}
            invalid={Boolean(errors.startsAt)}
          />
        </Field>
        <Field label="Ends" htmlFor="endsAt" error={errors.endsAt}>
          <Input
            id="endsAt"
            name="endsAt"
            type="time"
            defaultValue={values.endsAt ?? existing?.ends_at?.slice(0, 5) ?? ""}
            invalid={Boolean(errors.endsAt)}
          />
        </Field>
      </div>

      {recurrence === "weekly" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="First date"
            htmlFor="activeFrom"
            error={errors.activeFrom}
            hint="Optional. Leave blank to start straight away."
          >
            <Input
              id="activeFrom"
              name="activeFrom"
              type="date"
              defaultValue={values.activeFrom ?? existing?.active_from ?? ""}
              invalid={Boolean(errors.activeFrom)}
            />
          </Field>
          <Field
            label="Last date"
            htmlFor="activeUntil"
            error={errors.activeUntil}
            hint="Optional. Leave blank to run indefinitely."
          >
            <Input
              id="activeUntil"
              name="activeUntil"
              type="date"
              defaultValue={values.activeUntil ?? existing?.active_until ?? ""}
              invalid={Boolean(errors.activeUntil)}
            />
          </Field>
        </div>
      ) : null}

      <Field
        label="Notes"
        htmlFor="description"
        error={errors.description}
        hint="Optional. Anything the team should know beforehand."
      >
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={values.description ?? existing?.description ?? ""}
          invalid={Boolean(errors.description)}
        />
      </Field>

      <SubmitButton
        label={editing ? "Save changes" : "Create event"}
        pendingLabel={editing ? "Saving" : "Creating"}
        className="w-full sm:w-auto sm:px-6"
      />
    </form>
  );
}
