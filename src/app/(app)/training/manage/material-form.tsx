"use client";

import { useActionState, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { emptyFormState } from "@/lib/form-state";
import { createMaterialAction, updateMaterialAction } from "@/lib/training/actions";
import { ACCEPT_ATTRIBUTE, formatBytes } from "@/lib/training/constants";
import type { TrainingMaterialKind } from "@/lib/database.types";
import { cn } from "@/lib/utils";

type Existing = {
  id: string;
  title: string;
  summary: string | null;
  lesson_number: number | null;
  expectations: string | null;
  kind: TrainingMaterialKind;
  url: string | null;
  file_name: string | null;
  file_size: number | null;
};

function KindChoice({
  kind,
  onChange,
}: {
  kind: TrainingMaterialKind;
  onChange: (kind: TrainingMaterialKind) => void;
}) {
  const options: Array<{ value: TrainingMaterialKind; label: string; hint: string }> = [
    { value: "link", label: "Link", hint: "YouTube, Drive, anything with a URL" },
    { value: "file", label: "Upload", hint: "PDF or document, up to 10MB" },
  ];

  return (
    <div className="space-y-2">
      <span className="block text-[10.5px] font-medium uppercase tracking-[0.13em] text-muted">
        Where the material lives
      </span>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const active = option.value === kind;
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
      <input type="hidden" name="kind" value={kind} />
    </div>
  );
}

export function MaterialForm({ existing }: { existing?: Existing }) {
  const editing = Boolean(existing);
  const [state, action] = useActionState(
    editing ? updateMaterialAction : createMaterialAction,
    emptyFormState,
  );
  // On edit the kind is fixed: swapping a link for a file is a different record.
  const [kind, setKind] = useState<TrainingMaterialKind>(existing?.kind ?? "link");

  const errors = state.errors ?? {};
  const values = state.values ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message ? (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      ) : null}
      {existing ? <input type="hidden" name="materialId" value={existing.id} /> : null}

      <Field label="Title" htmlFor="title" error={errors.title}>
        <Input
          id="title"
          name="title"
          defaultValue={values.title ?? existing?.title ?? ""}
          placeholder="Front of house desk, gain staging"
          invalid={Boolean(errors.title)}
          required
        />
      </Field>

      <Field
        label="Week of the course"
        htmlFor="lessonNumber"
        error={errors.lessonNumber}
        hint="Leave blank for reference material that belongs to no particular week."
        className="sm:max-w-[12rem]"
      >
        <Input
          id="lessonNumber"
          name="lessonNumber"
          type="number"
          inputMode="numeric"
          min={1}
          max={999}
          step={1}
          placeholder="1"
          defaultValue={
            values.lessonNumber ?? (existing?.lesson_number?.toString() ?? "")
          }
          invalid={Boolean(errors.lessonNumber)}
        />
      </Field>

      <Field
        label="Summary"
        htmlFor="summary"
        error={errors.summary}
        hint="Optional. One or two lines on what this covers."
      >
        <Textarea
          id="summary"
          name="summary"
          rows={2}
          defaultValue={values.summary ?? existing?.summary ?? ""}
          invalid={Boolean(errors.summary)}
        />
      </Field>

      <Field
        label="What the trainee should learn"
        htmlFor="expectations"
        error={errors.expectations}
        hint="The trainee reads this alongside the material. Say what they should be able to do afterwards."
      >
        <Textarea
          id="expectations"
          name="expectations"
          rows={4}
          placeholder="By the end of this you should be able to set gain structure on the desk without clipping, and explain why."
          defaultValue={values.expectations ?? existing?.expectations ?? ""}
          invalid={Boolean(errors.expectations)}
        />
      </Field>

      {editing ? (
        <input type="hidden" name="kind" value={kind} />
      ) : (
        <KindChoice kind={kind} onChange={setKind} />
      )}

      {kind === "link" ? (
        <Field label="Link" htmlFor="url" error={errors.url}>
          <Input
            id="url"
            name="url"
            type="url"
            inputMode="url"
            defaultValue={values.url ?? existing?.url ?? ""}
            placeholder="https://"
            invalid={Boolean(errors.url)}
            required={!editing}
          />
        </Field>
      ) : (
        <Field
          label={editing ? "Replace the file" : "File"}
          htmlFor="file"
          error={errors.file}
          hint={
            editing
              ? existing?.file_name
                ? `Currently ${existing.file_name}${
                    existing.file_size ? `, ${formatBytes(existing.file_size)}` : ""
                  }. Leave empty to keep it.`
                : "Leave empty to keep the current file."
              : "PDF, image, Office document, or plain text. Up to 10MB."
          }
        >
          <input
            id="file"
            name="file"
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            className={cn(
              "w-full border bg-surface-2 px-3 py-2.5 text-[13px] text-ink",
              "transition-colors duration-200 hover:border-line-strong",
              "file:mr-3 file:border file:border-line-strong file:bg-surface-3 file:px-3 file:py-1",
              "file:text-[12px] file:font-medium file:text-ink",
              errors.file ? "border-danger/60" : "border-line",
            )}
          />
        </Field>
      )}

      <SubmitButton
        label={editing ? "Save changes" : "Add material"}
        pendingLabel={editing ? "Saving" : "Adding"}
        className="w-full sm:w-auto sm:px-6"
      />
    </form>
  );
}
