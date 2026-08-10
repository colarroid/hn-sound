import type { ZodError, ZodType } from "zod";

export type FormState = {
  ok: boolean;
  /** Shown above the form. Used for anything that is not a single field problem. */
  message?: string;
  /** Keyed by form field name. */
  errors?: Record<string, string>;
  /** Echoed back so a failed submit does not wipe what the member typed. */
  values?: Record<string, string>;
  /**
   * Counts rejected submissions. A form can key a child on this to remount it,
   * which resets the child and replays its entrance animation without anyone
   * having to reach for an effect.
   */
  attempt?: number;
};

export const emptyFormState: FormState = { ok: false };

/**
 * First issue per field, keyed by the field name. Built from issues directly so
 * it does not depend on zod's flatten helpers, which have moved between majors.
 */
export function fieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string" || errors[key]) continue;
    errors[key] = issue.message;
  }
  return errors;
}

type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; state: FormState };

/** Validate a FormData payload, keeping the submitted values for redisplay. */
export function parseForm<T>(
  schema: ZodType<T>,
  formData: FormData,
  options: { keep?: string[] } = {},
): ParseResult<T> {
  const raw: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") raw[key] = value;
  }

  const result = schema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };

  const values: Record<string, string> = {};
  for (const key of options.keep ?? Object.keys(raw)) {
    if (raw[key] !== undefined) values[key] = raw[key];
  }

  return {
    ok: false,
    state: { ok: false, errors: fieldErrors(result.error), values },
  };
}
